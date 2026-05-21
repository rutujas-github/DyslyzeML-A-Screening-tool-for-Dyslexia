import os
import uuid
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from analysis_pipeline import run_analysis

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # allows your React frontend to call this API

# Temp folder for uploaded images
UPLOAD_FOLDER = tempfile.gettempdir()


@app.route('/health', methods=['GET'])
def health():
    """Quick check to confirm API is running."""
    return jsonify({'status': 'ok', 'message': 'Dyslexia analysis API is running.'})


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Main endpoint — receives handwriting image from frontend,
    runs full linguistic analysis pipeline, returns results.

    Expects:
        multipart/form-data with field 'image'

    Returns:
        JSON with screening_level, probability, feature_percentages, heatmap
    """

    # ── Validate request ──────────────────────────────────────────────────────
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image provided. Send image as multipart/form-data with key "image".'
        }), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'Empty filename. Please upload a valid image.'
        }), 400

    # ── Check file type ───────────────────────────────────────────────────────
    allowed_extensions = {'png', 'jpg', 'jpeg', 'bmp', 'tiff'}
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in allowed_extensions:
        return jsonify({
            'success': False,
            'error': f'File type .{ext} not supported. Use PNG, JPG, JPEG, BMP or TIFF.'
        }), 400

    # ── Save uploaded image temporarily ──────────────────────────────────────
    temp_filename = f"{uuid.uuid4().hex}.{ext}"
    temp_path     = os.path.join(UPLOAD_FOLDER, temp_filename)

    try:
        file.save(temp_path)
        print(f"[API] Image saved temporarily: {temp_path}")

        # ── Run full analysis pipeline ────────────────────────────────────────
        print("[API] Running analysis pipeline...")
        result = run_analysis(temp_path)

        if not result['success']:
            return jsonify(result), 422

        # ── Return result to frontend ─────────────────────────────────────────
        return jsonify({
            'success':                True,
            'screening_level':        result['screening_level'],
            'linguistic_probability': result['linguistic_probability'],
            'feature_percentages':    result['feature_percentages'],
            'extracted_text':         result['extracted_text'],
            'ocr_confidence':         result['ocr_confidence'],
            'heatmap_image':          result['heatmap_image'],
            'error':                  None
        }), 200

    except Exception as e:
        print(f"[API] Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'error':   str(e)
        }), 500

    finally:
        # ── Always clean up temp file ─────────────────────────────────────────
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"[API] Temp file cleaned up.")


if __name__ == '__main__':
    print("Starting Dyslexia Analysis API...")
    print("API running at: http://localhost:5000")
    print("Endpoints:")
    print("  GET  /health  — check API status")
    print("  POST /analyze — analyze handwriting image")
    app.run(debug=True, host='0.0.0.0', port=5000)