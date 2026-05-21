import { useState } from 'react';
import { Upload, X, CheckCircle, FileText, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

type HandwritingTestProps = {
  screenieId: string;
  screenieName: string;
  onClose: () => void;
  onComplete: () => void;
};

type AnalysisResult = {
  screening_level: 'High' | 'Moderate' | 'Low';
  linguistic_probability: number;
  feature_percentages: {
    spelling_accuracy: number;
    grammatical_accuracy: number;
    percentage_of_corrections: number;
    percentage_of_phonetic_accuracy: number;
  };
  extracted_text: string;
  ocr_confidence: number;
  heatmap_image: string;
};

export default function HandwritingTest({ screenieId, screenieName, onClose, onComplete }: HandwritingTestProps) {
  const [step, setStep] = useState<'instructions' | 'upload' | 'analyzing' | 'results' | 'complete'>('instructions');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const testText = `The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! The five boxing wizards jump quickly.`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setStep('analyzing');

    try {
      // ── STEP 1: Send image to Flask API for analysis ──────────────────────
      const formData = new FormData();
      formData.append('image', selectedFile);

      const apiResponse = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error('Analysis API failed. Make sure the backend is running.');
      }

      const apiResult = await apiResponse.json();

      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Analysis failed');
      }

      setAnalysisResult(apiResult);

      // ── STEP 2: Upload image to Supabase storage ──────────────────────────
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${screenieId}_${Date.now()}.${fileExt}`;
      const filePath = `handwriting/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assessments')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // ── STEP 3: Save results to Supabase database ─────────────────────────
      const { error: updateError } = await supabase
        .from('screenies')
        .update({
          handwriting_test_completed: true,
          handwriting_image_path: filePath,
          linguistic_probability: apiResult.linguistic_probability,
          screening_level: apiResult.screening_level,
          spelling_accuracy: apiResult.feature_percentages.spelling_accuracy,
          grammatical_accuracy: apiResult.feature_percentages.grammatical_accuracy,
          percentage_of_corrections: apiResult.feature_percentages.percentage_of_corrections,
          phonetic_accuracy: apiResult.feature_percentages.percentage_of_phonetic_accuracy,
        })
        .eq('id', screenieId);

      if (updateError) throw updateError;

      // ── Show results ──────────────────────────────────────────────────────
      setStep('results');

    } catch (err: any) {
      setError(err.message || 'Failed to analyse image');
      setStep('upload');
    } finally {
      setUploading(false);
    }
  };

  // ── Screening level styles ─────────────────────────────────────────────────
  const getScreeningStyle = (level: string) => {
    switch (level) {
      case 'High':     return { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300'    };
      case 'Moderate': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
      case 'Low':      return { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300'  };
      default:         return { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300'   };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Handwriting Assessment</h2>
            <p className="text-gray-600 mt-1">Student: {screenieName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-8">

          {/* ── STEP: Instructions ─────────────────────────────────────────── */}
          {step === 'instructions' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Test Instructions</h3>
                    <ol className="space-y-2 text-gray-700">
                      <li className="flex gap-2"><span className="font-semibold">1.</span><span>Have the student write the following text on a clean sheet of paper</span></li>
                      <li className="flex gap-2"><span className="font-semibold">2.</span><span>Ensure good lighting when taking the photo</span></li>
                      <li className="flex gap-2"><span className="font-semibold">3.</span><span>Capture the entire handwriting sample clearly</span></li>
                      <li className="flex gap-2"><span className="font-semibold">4.</span><span>Upload the image using the button below</span></li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Text to Write:</h3>
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xl leading-relaxed text-gray-800 font-serif">{testText}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button onClick={() => setStep('upload')} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Continue to Upload</button>
              </div>
            </div>
          )}

          {/* ── STEP: Upload ───────────────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Handwriting Sample</h3>
                <p className="text-gray-600">Please upload a clear photo of the handwritten text</p>
              </div>

              {!previewUrl ? (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Click to upload image</p>
                    <p className="text-sm text-gray-500">PNG, JPG or JPEG (Max 5MB)</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative border-2 border-gray-300 rounded-xl overflow-hidden">
                    <img src={previewUrl} alt="Handwriting preview" className="w-full h-auto" />
                    <button
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {selectedFile && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600"><span className="font-medium">File:</span> {selectedFile.name}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Size:</span> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setStep('instructions')} disabled={uploading} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Back</button>
                <button onClick={handleUpload} disabled={!selectedFile || uploading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? 'Analysing...' : 'Submit Assessment'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Analyzing ────────────────────────────────────────────── */}
          {step === 'analyzing' && (
            <div className="text-center py-16 space-y-6">
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900">Analysing Handwriting...</h3>
              <div className="space-y-2 text-gray-500 text-sm">
                <p>⟳ Extracting text from image</p>
                <p>⟳ Computing linguistic features</p>
                <p>⟳ Running dyslexia screening model</p>
                <p>⟳ Generating explainability heatmap</p>
              </div>
            </div>
          )}

          {/* ── STEP: Results ──────────────────────────────────────────────── */}
          {step === 'results' && analysisResult && (() => {
            const style = getScreeningStyle(analysisResult.screening_level);
            return (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Analysis Complete</h3>
                  <p className="text-gray-500 text-sm">Student: {screenieName}</p>
                </div>

                {/* Screening Level */}
                <div className={`${style.bg} ${style.border} border-2 rounded-xl p-6 text-center`}>
                  <AlertTriangle className={`w-10 h-10 mx-auto mb-2 ${style.text}`} />
                  <p className="text-sm font-medium text-gray-600 mb-1">Dyslexia Screening Level</p>
                  <p className={`text-4xl font-bold ${style.text}`}>{analysisResult.screening_level}</p>
                  <p className={`text-sm mt-2 ${style.text}`}>
                    Confidence: {(analysisResult.linguistic_probability * 100).toFixed(1)}%
                  </p>
                </div>

                {/* Feature Percentages */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-900">Linguistic Feature Breakdown</h4>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Spelling Accuracy',       value: analysisResult.feature_percentages.spelling_accuracy,            color: 'bg-blue-500'   },
                      { label: 'Grammatical Accuracy',    value: analysisResult.feature_percentages.grammatical_accuracy,          color: 'bg-purple-500' },
                      { label: 'Percentage of Corrections', value: analysisResult.feature_percentages.percentage_of_corrections,  color: 'bg-orange-500' },
                      { label: 'Phonetic Accuracy',       value: analysisResult.feature_percentages.percentage_of_phonetic_accuracy, color: 'bg-green-500' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 font-medium">{label}</span>
                          <span className="font-bold text-gray-900">{value.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmap */}
                <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-900">Explainability Heatmap</h4>
                    <p className="text-xs text-gray-500">🟢 Normal &nbsp; 🟠 Moderate anomaly &nbsp; 🔴 High anomaly</p>
                  </div>
                  <img
                    src={`data:image/png;base64,${analysisResult.heatmap_image}`}
                    alt="Handwriting heatmap"
                    className="w-full h-auto"
                  />
                </div>

                {/* Extracted Text */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">Extracted Text (OCR)</h4>
                  <p className="text-sm text-gray-600 italic">"{analysisResult.extracted_text}"</p>
                  <p className="text-xs text-gray-400 mt-1">OCR Confidence: {analysisResult.ocr_confidence}%</p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Close</button>
                  <button
                    onClick={() => { setStep('complete'); setTimeout(onComplete, 2000); }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save & Continue
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── STEP: Complete ─────────────────────────────────────────────── */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h3>
              <p className="text-gray-600 mb-6">The handwriting sample has been analysed and saved successfully.</p>
              <p className="text-sm text-gray-500">Redirecting back to student profile...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}