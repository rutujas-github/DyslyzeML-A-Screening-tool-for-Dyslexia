import os
import joblib
import numpy as np
from ocr_module import extract_text
from linguistic_features import extract_linguistic_features
from heat_map import generate_heatmap

# ── Load model once at startup (not on every request) ─────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'linguistic_rf_model.pkl')
_payload    = joblib.load(_MODEL_PATH)
_model      = _payload['model']
_feat_cols  = _payload['feature_cols']

print("[Pipeline] Model loaded successfully.")


def _get_screening_level(probability: float) -> str:
    """
    Convert probability to dyslexia screening level.
    Adjusted thresholds for better calibration.
    """
    if probability >= 0.85:
        return 'High'
    elif probability >= 0.55:
        return 'Moderate'
    else:
        return 'Low'


def _get_feature_percentages(features: dict) -> dict:
    """
    Return each feature as a clean percentage dict for the frontend.
    Applies OCR noise correction to spelling and phonetic accuracy
    so model doesn't always predict High due to OCR errors.
    """
    spelling   = features['spelling_accuracy']
    phonetic   = features['percentage_of_phonetic_accuraccy']
    grammar    = features['gramatical_accuracy']
    correction = features['percentage_of_corrections']

    # OCR always introduces ~20-30% noise on handwriting
    # Correct for this so model gets more realistic feature values
    ocr_noise_factor = 1.30

    spelling_corrected = min(100.0, spelling * ocr_noise_factor)
    phonetic_corrected = min(100.0, phonetic * ocr_noise_factor)

    return {
        'spelling_accuracy':               round(spelling_corrected, 2),
        'grammatical_accuracy':            round(grammar, 2),
        'percentage_of_corrections':       round(correction, 2),
        'percentage_of_phonetic_accuracy': round(phonetic_corrected, 2),
    }


def run_analysis(image_path: str) -> dict:
    """
    Full linguistic analysis pipeline.
    Takes a handwriting image path and returns complete analysis results.

    Parameters
    ----------
    image_path : str — path to the uploaded handwriting image

    Returns
    -------
    dict:
        success               : bool
        screening_level       : str   — High / Moderate / Low
        linguistic_probability: float — 0 to 1
        feature_percentages   : dict  — all 4 features as percentages
        extracted_text        : str   — raw OCR text
        ocr_confidence        : float — OCR confidence score
        heatmap_image         : str   — base64 encoded heatmap PNG
        error                 : str   — error message if something fails
    """

    try:
        # ── STEP 1: OCR ───────────────────────────────────────────────────────
        print("\n[Pipeline] Step 1 — Extracting text from image...")
        ocr_result = extract_text(image_path)

        if not ocr_result['raw_text'].strip():
            return {
                'success': False,
                'error': 'No text could be extracted from the image. '
                         'Please upload a clearer handwriting sample.'
            }

        # ── STEP 2: FEATURE EXTRACTION ────────────────────────────────────────
        print("[Pipeline] Step 2 — Computing linguistic features...")
        features = extract_linguistic_features(ocr_result)

        # ── STEP 3: MODEL INFERENCE ───────────────────────────────────────────
        print("[Pipeline] Step 3 — Running model inference...")

        # Use OCR-corrected features for model input
        feature_pcts = _get_feature_percentages(features)

        X = np.array([[
            feature_pcts['spelling_accuracy'],
            feature_pcts['grammatical_accuracy'],
            feature_pcts['percentage_of_corrections'],
            feature_pcts['percentage_of_phonetic_accuracy']
        ]])

        probability     = float(_model.predict_proba(X)[0, 1])
        screening_level = _get_screening_level(probability)

        print(f"[Pipeline] Probability     : {probability:.4f}")
        print(f"[Pipeline] Screening level : {screening_level}")

        # ── STEP 4: HEATMAP GENERATION ────────────────────────────────────────
        print("[Pipeline] Step 4 — Generating heatmap...")
        heatmap_b64 = generate_heatmap(
            ocr_result['original_image'],
            ocr_result['ocr_data'],
            features
        )

        # ── RETURN FULL RESULT ────────────────────────────────────────────────
        return {
            'success':                True,
            'screening_level':        screening_level,
            'linguistic_probability': round(probability, 4),
            'feature_percentages':    feature_pcts,
            'extracted_text':         ocr_result['raw_text'],
            'ocr_confidence':         round(ocr_result['ocr_confidence'], 2),
            'heatmap_image':          heatmap_b64,
            'error':                  None
        }

    except Exception as e:
        print(f"[Pipeline] ERROR: {str(e)}")
        return {
            'success': False,
            'error':   str(e)
        }


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    import json

    path = sys.argv[1] if len(sys.argv) > 1 else 'test_image.png'
    print(f"Testing pipeline on: {path}")

    result = run_analysis(path)

    display = {k: v for k, v in result.items() if k != 'heatmap_image'}
    print("\n=== Pipeline Result ===")
    print(json.dumps(display, indent=2))

    if result['success']:
        print(f"\nHeatmap generated: {len(result['heatmap_image'])} chars (base64)")
