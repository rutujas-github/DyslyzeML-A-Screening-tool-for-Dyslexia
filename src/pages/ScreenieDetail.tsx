import { useState, useEffect } from 'react';
import { supabase, Screenie } from '../lib/supabase';
import { ArrowLeft, BookOpen, PenTool, FileText, CheckCircle, Clock } from 'lucide-react';
import HandwritingTest from '../components/HandwritingTest';
import CalibrationScreen from '../components/CalibrationScreen';
import AccuracyCheck from '../components/AccuracyCheck';
import SyllableMatrixTest from '../components/SyllableMatrixTest';
import PassageReadingTest from '../components/PassageReadingTest';
import PseudoTextReadingTest from '../components/PseudoTextReadingTest'; // ← NEW

type ScreenieDetailProps = {
  id: string;
  onBack: () => void;
};

export default function ScreenieDetail({ id, onBack }: ScreenieDetailProps) {
  const [screenie, setScreenie] = useState<Screenie | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHandwritingTest, setShowHandwritingTest] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showAccuracyCheck, setShowAccuracyCheck] = useState(false);
  const [showSyllableMatrix, setShowSyllableMatrix] = useState(false);
  const [showPassageReading, setShowPassageReading] = useState(false);
  const [showPseudoTextReading, setShowPseudoTextReading] = useState(false); // ← NEW

  useEffect(() => {
    fetchScreenie();
  }, [id]);

  const fetchScreenie = async () => {
    const { data, error } = await supabase
      .from('screenies')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setScreenie(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!screenie) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Student not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-4xl">{screenie.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{screenie.name}</h1>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Age:</span>
                  <p className="font-semibold text-gray-900">{screenie.age} years</p>
                </div>
                <div>
                  <span className="text-gray-600">Grade:</span>
                  <p className="font-semibold text-gray-900">{screenie.grade}</p>
                </div>
                <div>
                  <span className="text-gray-600">Parent/Guardian:</span>
                  <p className="font-semibold text-gray-900">{screenie.parent_guardian}</p>
                </div>
                <div>
                  <span className="text-gray-600">Contact:</span>
                  <p className="font-semibold text-gray-900">{screenie.contact_number}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reading Test</h2>
                <div className="flex items-center gap-2">
                  {screenie.reading_test_completed ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">Completed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-600 font-medium">Not Started</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Assess reading patterns through eye movement tracking. This test evaluates fixation, saccades, and reading fluency.
            </p>
            <button
              onClick={() => setShowCalibration(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {screenie.reading_test_completed ? 'Retake Reading Test' : 'Start Reading Test'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <PenTool className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Handwriting Test</h2>
                <div className="flex items-center gap-2">
                  {screenie.handwriting_test_completed ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">Completed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-600 font-medium">Not Started</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Analyze handwriting patterns using AI-powered assessment. This test examines letter formation, spacing, and writing fluency.
            </p>
            <button
              onClick={() => setShowHandwritingTest(true)}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {screenie.handwriting_test_completed ? 'Retake Handwriting Test' : 'Start Handwriting Test'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Reports</h2>
              <p className="text-gray-600">View and download comprehensive assessment reports</p>
            </div>
          </div>

          {!screenie.reading_test_completed && !screenie.handwriting_test_completed ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No reports available yet. Complete the tests to generate reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {screenie.reading_test_completed && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Reading Test Report</span>
                  </div>
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium">
                    View Report
                  </button>
                </div>
              )}
              {screenie.handwriting_test_completed && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <PenTool className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Handwriting Test Report</span>
                  </div>
                  <button className="px-4 py-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors font-medium">
                    View Report
                  </button>
                </div>
              )}
              {screenie.reading_test_completed && screenie.handwriting_test_completed && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Comprehensive Assessment Report</span>
                  </div>
                  <button className="px-4 py-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors font-medium">
                    View Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Handwriting Test Overlay */}
      {showHandwritingTest && (
        <HandwritingTest
          screenieId={screenie.id}
          screenieName={screenie.name}
          onClose={() => setShowHandwritingTest(false)}
          onComplete={() => {
            setShowHandwritingTest(false);
            fetchScreenie();
          }}
        />
      )}

      {/* Calibration Overlay */}
      {showCalibration && (
        <CalibrationScreen
          screenieId={screenie.id}
          screenieName={screenie.name}
          onCancel={() => setShowCalibration(false)}
          onComplete={() => {
            setShowCalibration(false);
            setShowAccuracyCheck(true);
          }}
        />
      )}

      {/* Accuracy Check Overlay */}
      {showAccuracyCheck && (
        <AccuracyCheck
          screenieId={screenie.id}
          screenieName={screenie.name}
          onCancel={() => setShowAccuracyCheck(false)}
          onRecalibrate={() => {
            setShowAccuracyCheck(false);
            setShowCalibration(true);
          }}
          onComplete={(accuracy) => {
            setShowAccuracyCheck(false);
            setShowSyllableMatrix(true);
          }}
        />
      )}

      {/* Syllable Matrix Overlay */}
      {showSyllableMatrix && screenie && (
        <SyllableMatrixTest
          screenieId={screenie.id}
          screenieName={screenie.name}
          onCancel={() => setShowSyllableMatrix(false)}
          onComplete={() => {
            setShowSyllableMatrix(false);
            setShowPassageReading(true);
          }}
        />
      )}

      {/* Passage Reading Overlay */}
      {showPassageReading && screenie && (
        <PassageReadingTest
          screenieId={screenie.id}
          screenieName={screenie.name}
          onCancel={() => setShowPassageReading(false)}
          onComplete={() => {
            setShowPassageReading(false);
            setShowPseudoTextReading(true); // ← go to task 3
          }}
        />
      )}

      {/* Pseudo Text Reading Overlay ← NEW */}
      {showPseudoTextReading && screenie && (
        <PseudoTextReadingTest
          screenieId={screenie.id}
          screenieName={screenie.name}
          onCancel={() => setShowPseudoTextReading(false)}
          onComplete={() => {
            setShowPseudoTextReading(false);
            fetchScreenie(); // ← mark reading test as complete
          }}
        />
      )}
    </div>
  );
}