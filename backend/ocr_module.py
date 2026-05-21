import cv2
import numpy as np
from PIL import Image
import torch
import pytesseract
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

# ── Windows users ──────────────────────────────────────────────────────────────
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ── Load TrOCR model once at module level (not on every call) ─────────────────
print("[OCR] Loading TrOCR handwriting model...")
_processor = TrOCRProcessor.from_pretrained('microsoft/trocr-large-handwritten')
_model     = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-large-handwritten')
_device    = 'cuda' if torch.cuda.is_available() else 'cpu'
_model     = _model.to(_device)
_model.eval()
print(f"[OCR] TrOCR loaded on {_device}")


def _deskew(image: np.ndarray) -> np.ndarray:
    """
    Detect and correct skew angle in handwriting image.
    """
    coords = np.column_stack(np.where(image < 128))
    if len(coords) == 0:
        return image

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) < 0.5:
        return image

    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    deskewed = cv2.warpAffine(
        image, M, (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )
    print(f"[OCR] Deskew applied: {angle:.2f}°")
    return deskewed


def _apply_clahe(image: np.ndarray) -> np.ndarray:
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(image)


def _preprocess_image(image_path: str) -> np.ndarray:
    """
    Preprocessing pipeline — cleans image before feeding to TrOCR.
    """
    img = cv2.imread(image_path)

    # ── 1. Upscale if too small ───────────────────────────────────────────────
    h, w = img.shape[:2]
    if w < 1000:
        scale = 1000 / w
        img = cv2.resize(img, None, fx=scale, fy=scale,
                         interpolation=cv2.INTER_CUBIC)
        print(f"[OCR] Image upscaled: {w}px → {int(w*scale)}px")

    # ── 2. Grayscale ──────────────────────────────────────────────────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ── 3. Deskew ─────────────────────────────────────────────────────────────
    deskewed = _deskew(gray)

    # ── 4. Light denoise ──────────────────────────────────────────────────────
    denoised = cv2.bilateralFilter(deskewed, d=5, sigmaColor=50, sigmaSpace=50)

    # ── 5. CLAHE if low contrast ──────────────────────────────────────────────
    std_dev = np.std(denoised)
    if std_dev < 60:
        enhanced = _apply_clahe(denoised)
        print(f"[OCR] CLAHE applied (std_dev={std_dev:.1f})")
    else:
        enhanced = denoised
        print(f"[OCR] CLAHE skipped (std_dev={std_dev:.1f})")

    return enhanced


def _split_into_lines(image: np.ndarray) -> list:
    """
    Split handwriting image into individual lines for better TrOCR accuracy.
    TrOCR works best on single lines rather than full paragraphs.
    """
    _, binary = cv2.threshold(image, 0, 255,
                               cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    h_proj    = np.sum(binary, axis=1)
    threshold = np.max(h_proj) * 0.05
    in_line   = False
    lines     = []
    start     = 0
    padding   = 8

    for i, val in enumerate(h_proj):
        if not in_line and val > threshold:
            in_line = True
            start   = max(0, i - padding)
        elif in_line and val <= threshold:
            in_line = False
            end = min(image.shape[0], i + padding)
            if end - start > 10:
                lines.append(image[start:end, :])

    if in_line:
        lines.append(image[start:, :])

    print(f"[OCR] Lines detected: {len(lines)}")
    return lines


def _run_trocr_on_line(line_image: np.ndarray) -> str:
    """
    Run TrOCR inference on a single line image.
    """
    pil_image = Image.fromarray(line_image).convert('RGB')

    pixel_values = _processor(
        images=pil_image,
        return_tensors='pt'
    ).pixel_values.to(_device)

    with torch.no_grad():
        generated_ids = _model.generate(
            pixel_values,
            max_new_tokens=128
        )

    text = _processor.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0].strip()

    return text


def _get_word_bounding_boxes(processed: np.ndarray,
                              word_list: list) -> dict:
    """
    Use Tesseract ONLY for spatial bounding boxes.
    TrOCR gave us accurate text — we just need word positions for heatmap.
    """
    tess_data = pytesseract.image_to_data(
        processed,
        config=r'--oem 1 --psm 6',
        output_type=pytesseract.Output.DICT
    )

    valid_boxes = {
        'text':   [],
        'conf':   [],
        'left':   [],
        'top':    [],
        'width':  [],
        'height': [],
    }

    trocr_idx = 0

    for i, tess_word in enumerate(tess_data['text']):
        tess_word = tess_word.strip()
        conf      = int(tess_data['conf'][i])

        if not tess_word or conf < 0:
            continue

        # Use TrOCR word if available else fall back to Tesseract word
        display_word = word_list[trocr_idx] if trocr_idx < len(word_list) else tess_word
        trocr_idx += 1

        valid_boxes['text'].append(display_word)
        valid_boxes['conf'].append(90)
        valid_boxes['left'].append(tess_data['left'][i])
        valid_boxes['top'].append(tess_data['top'][i])
        valid_boxes['width'].append(tess_data['width'][i])
        valid_boxes['height'].append(tess_data['height'][i])

    print(f"[OCR] Bounding boxes mapped: {len(valid_boxes['text'])} words")
    return valid_boxes


def extract_text(image_path: str) -> dict:
    """
    Extract text from a handwriting image using TrOCR.
    Uses Tesseract only for word bounding boxes (heatmap positions).

    Parameters
    ----------
    image_path : str — path to the uploaded handwriting image

    Returns
    -------
    dict:
        raw_text       : full extracted text as a string
        word_list      : list of individual words
        word_count     : total number of words detected
        ocr_confidence : estimated confidence (0-100)
        ocr_data       : bounding box data for heatmap
        original_image : original BGR image array for heatmap
    """
    # Keep original BGR image for heatmap
    original_image = cv2.imread(image_path)

    # Preprocess
    processed = _preprocess_image(image_path)

    # Split into lines and run TrOCR
    lines = _split_into_lines(processed)
    if not lines:
        lines = [processed]

    all_text_lines = []
    for i, line in enumerate(lines):
        line_text = _run_trocr_on_line(line)
        if line_text:
            all_text_lines.append(line_text)
            print(f"[OCR] Line {i+1}: {line_text}")

    raw_text  = ' '.join(all_text_lines)
    word_list = [w.strip() for w in raw_text.split() if w.strip()]

    # Estimate confidence from real English word ratio
    from nltk.corpus import words as nltk_words
    english_words = set(w.lower() for w in nltk_words.words())
    if word_list:
        real_words     = sum(1 for w in word_list if w.lower() in english_words)
        est_confidence = (real_words / len(word_list)) * 100
    else:
        est_confidence = 0.0

    # Get proper word bounding boxes from Tesseract for heatmap
    ocr_data = _get_word_bounding_boxes(processed, word_list)

    print(f"[OCR] Words extracted : {len(word_list)}")
    print(f"[OCR] Est. confidence : {est_confidence:.1f}%")
    print(f"[OCR] Text preview    : {raw_text[:150]}{'...' if len(raw_text) > 150 else ''}")

    return {
        'raw_text':       raw_text,
        'word_list':      word_list,
        'word_count':     len(word_list),
        'ocr_confidence': round(est_confidence, 2),
        'ocr_data':       ocr_data,
        'original_image': original_image
    }


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else 'test_image.png'
    result = extract_text(path)
    print("\nFull extracted text:")
    print(result['raw_text'])