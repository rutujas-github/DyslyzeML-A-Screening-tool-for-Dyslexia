import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import base64
from io import BytesIO


def _get_anomaly_scores(ocr_data: dict, features: dict) -> list:
    """
    Assign an anomaly score to each detected word bounding box
    based on the linguistic features computed.
    Higher score = more likely anomalous.
    """
    word_scores = []

    spelling_acc  = features['spelling_accuracy']
    phonetic_acc  = features['percentage_of_phonetic_accuraccy']
    correction_pc = features['percentage_of_corrections']

    # Base anomaly level from features
    base_anomaly = (
        (100 - spelling_acc)  * 0.50 +
        (100 - phonetic_acc)  * 0.30 +
        correction_pc         * 0.20
    ) / 100.0

    n = len(ocr_data['text'])
    for i in range(n):
        word = ocr_data['text'][i].strip()
        conf = int(ocr_data['conf'][i])

        if not word or conf < 30:
            continue

        x = ocr_data['left'][i]
        y = ocr_data['top'][i]
        w = ocr_data['width'][i]
        h = ocr_data['height'][i]

        # Low OCR confidence = likely misspelled or malformed
        conf_score = 1.0 - (conf / 100.0)

        # Short fragments are often correction artifacts
        fragment_score = 1.0 if len(word) <= 2 else 0.0

        # Final anomaly score for this word
        score = (
            base_anomaly   * 0.50 +
            conf_score     * 0.35 +
            fragment_score * 0.15
        )
        score = min(max(score, 0.0), 1.0)

        word_scores.append({
            'word': word,
            'x': x, 'y': y, 'w': w, 'h': h,
            'score': score
        })

    return word_scores


def generate_heatmap(original_image: np.ndarray,
                     ocr_data: dict,
                     features: dict) -> str:
    """
    Generate a heatmap overlay on the original handwriting image
    highlighting anomalous regions based on linguistic features.

    Parameters
    ----------
    original_image : np.ndarray — original BGR image from ocr_module
    ocr_data       : dict       — tesseract bounding box data from ocr_module
    features       : dict       — linguistic features from linguistic_features.py

    Returns
    -------
    str — base64 encoded PNG image string (sent directly to frontend)
    """
    img = original_image.copy()
    h_img, w_img = img.shape[:2]

    # Create blank heatmap canvas
    heat_canvas = np.zeros((h_img, w_img), dtype=np.float32)

    # Get anomaly scores per word
    word_scores = _get_anomaly_scores(ocr_data, features)

    # Paint each word region onto the canvas with its anomaly score
    for ws in word_scores:
        x, y, w, h = ws['x'], ws['y'], ws['w'], ws['h']
        score = ws['score']

        pad = 5
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w_img, x + w + pad)
        y2 = min(h_img, y + h + pad)

        heat_canvas[y1:y2, x1:x2] = np.maximum(
            heat_canvas[y1:y2, x1:x2], score
        )

    # Smooth the heatmap
    heat_canvas = cv2.GaussianBlur(heat_canvas, (25, 25), 0)

    # Normalise to 0-255
    if heat_canvas.max() > 0:
        heat_canvas = (heat_canvas / heat_canvas.max() * 255).astype(np.uint8)
    else:
        heat_canvas = heat_canvas.astype(np.uint8)

    # Apply colormap — blue (normal) → green → red (anomalous)
    heatmap_colored = cv2.applyColorMap(heat_canvas, cv2.COLORMAP_JET)

    # Blend heatmap with original image
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    heatmap_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    blended = cv2.addWeighted(img_rgb, 0.55, heatmap_rgb, 0.45, 0)

    # ── Draw word bounding boxes with colour coded borders ────────────────────
    for ws in word_scores:
        score = ws['score']
        x, y, w, h = ws['x'], ws['y'], ws['w'], ws['h']

        if score < 0.3:
            color = (0, 200, 0)      # green — normal
        elif score < 0.6:
            color = (255, 165, 0)    # orange — moderate
        else:
            color = (220, 0, 0)      # red — high anomaly

        cv2.rectangle(blended, (x, y), (x + w, y + h), color, 2)

    # ── Add legend ────────────────────────────────────────────────────────────
    legend_items = [
        ((0, 200, 0),   'Normal'),
        ((255, 165, 0), 'Moderate anomaly'),
        ((220, 0, 0),   'High anomaly'),
    ]
    lx, ly = 10, h_img - 80
    for color, label in legend_items:
        cv2.rectangle(blended, (lx, ly), (lx + 16, ly + 16), color, -1)
        cv2.putText(blended, label, (lx + 22, ly + 13),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        ly += 24

    # ── Convert to base64 string for API response ─────────────────
    blended_bgr = cv2.cvtColor(blended, cv2.COLOR_RGB2BGR)
    _, buffer = cv2.imencode('.png', blended_bgr)
    encoded = base64.b64encode(buffer).decode('utf-8')

    print("[Heatmap] Generated successfully.")
    return encoded


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    from ocr_module import extract_text
    from linguistic_features import extract_linguistic_features

    path = sys.argv[1] if len(sys.argv) > 1 else 'test_image.png'

    ocr_result  = extract_text(path)
    features    = extract_linguistic_features(ocr_result)
    heatmap_b64 = generate_heatmap(
        ocr_result['original_image'],
        ocr_result['ocr_data'],
        features
    )
    print(f"Heatmap base64 length: {len(heatmap_b64)} chars")
    print("Done!")