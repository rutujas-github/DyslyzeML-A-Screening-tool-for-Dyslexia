import { useEffect, useRef, useState, useCallback } from 'react';
import { useGazeTracker } from '../hooks/useGazeTracker';
import { useEyeTracking } from '../contexts/EyeTrackingContext';

interface AccuracyCheckProps {
  screenieId: string;
  screenieName: string;
  onCancel: () => void;
  onRecalibrate: () => void;
  onComplete: (accuracy: number) => void;
}

interface TestDot {
  x: number;
  y: number;
}

const TEST_DOT_POSITIONS: TestDot[] = [
  { x: 20, y: 20 },
  { x: 80, y: 20 },
  { x: 50, y: 50 },
  { x: 20, y: 80 },
  { x: 80, y: 80 },
];

const GAZE_DURATION_MS = 2500;

type CheckStatus = 'running' | 'done';

export default function AccuracyCheck({
  screenieId,
  screenieName,
  onCancel,
  onRecalibrate,
  onComplete,
}: AccuracyCheckProps) {
  const { startGazeListener, stopGazeListener } = useGazeTracker();
  const { setCalibrationAccuracy } = useEyeTracking();

  const [status, setStatus] = useState<CheckStatus>('running');
  const [currentDot, setCurrentDot] = useState(0);
  const [dotScores, setDotScores] = useState<number[]>([]);
  const [averageAccuracy, setAverageAccuracy] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gazePointsRef = useRef<{ x: number; y: number }[]>([]);

  const startCameraPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access failed:', err);
    }
  }, []);

  const stopCameraPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const calculateDotAccuracy = useCallback((
    gazePoints: { x: number; y: number }[]
  ): number => {
    if (gazePoints.length < 2) return 70;

    const avgX = gazePoints.reduce((s, p) => s + p.x, 0) / gazePoints.length;
    const avgY = gazePoints.reduce((s, p) => s + p.y, 0) / gazePoints.length;

    const variance = gazePoints.reduce((s, p) =>
      s + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2), 0
    ) / gazePoints.length;

    const stdDev = Math.sqrt(variance);
    const accuracy = Math.max(0, Math.round(100 - (stdDev / 30) * 100));
    return Math.min(100, accuracy);
  }, []);

  useEffect(() => {
    startCameraPreview();
    return () => {
      stopGazeListener();
      stopCameraPreview();
    };
  }, []);

  useEffect(() => {
    if (currentDot >= TEST_DOT_POSITIONS.length) return;

    gazePointsRef.current = [];

    startGazeListener((gaze) => {
      gazePointsRef.current.push({ x: gaze.x, y: gaze.y });
    });

    const timer = setTimeout(() => {
      stopGazeListener();

      const score = calculateDotAccuracy(gazePointsRef.current);

      setDotScores(prev => {
        const updated = [...prev, score];

        if (currentDot + 1 >= TEST_DOT_POSITIONS.length) {
          const avg = Math.round(updated.reduce((a, b) => a + b, 0) / updated.length);
          setAverageAccuracy(avg);
          setCalibrationAccuracy(avg);
          setStatus('done');
        } else {
          setCurrentDot(prev => prev + 1);
        }

        return updated;
      });
    }, GAZE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentDot]);

  const currentDotPos = TEST_DOT_POSITIONS[Math.min(currentDot, TEST_DOT_POSITIONS.length - 1)];
  const progressPercent = Math.round((dotScores.length / TEST_DOT_POSITIONS.length) * 100);
  const liveAccuracy = dotScores.length
    ? Math.round(dotScores.reduce((a, b) => a + b, 0) / dotScores.length)
    : null;

  const getGrade = (score: number) => {
    if (score >= 80) return { label: 'Good', color: '#0F6E56', bg: '#E1F5EE' };
    if (score >= 60) return { label: 'Fair', color: '#854F0B', bg: '#FAEEDA' };
    return { label: 'Poor', color: '#A32D2D', bg: '#FCEBEB' };
  };

  const grade = averageAccuracy !== null ? getGrade(averageAccuracy) : null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#ffffff',
      zIndex: 50,
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 2px' }}>
            Reading test — step 2 of 3 · {screenieName}
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#111827', margin: 0 }}>
            Accuracy check
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', background: '#f9fafb', border: '0.5px solid #e5e7eb', padding: '5px 12px', borderRadius: '99px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1D9E75' }} />
          Camera on
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px', flex: 1 }}>

        {/* Dot Area */}
        <div style={{ background: '#ffffff', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            Look at the red dot without clicking. Hold your gaze steady.
          </p>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#E24B4A',
              boxShadow: '0 0 0 6px rgba(226,75,74,0.15)',
              position: 'absolute',
              left: `${currentDotPos.x}%`,
              top: `${currentDotPos.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.4s, top 0.4s',
            }} />
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
            {status === 'done'
              ? 'Accuracy check complete!'
              : `Dot ${dotScores.length + 1} of ${TEST_DOT_POSITIONS.length} — hold your gaze steady`}
          </p>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Score Card */}
          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Accuracy score</div>
            <div style={{ fontSize: '28px', fontWeight: 500, color: '#111827' }}>
              {liveAccuracy !== null ? `${liveAccuracy}%` : '—'}
            </div>
            {grade && (
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: '99px',
                display: 'inline-block',
                marginTop: '4px',
                background: grade.bg,
                color: grade.color,
              }}>
                {grade.label}
              </div>
            )}
          </div>

          {/* Progress */}
          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
              Progress — {dotScores.length} / {TEST_DOT_POSITIONS.length} dots
            </div>
            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '99px' }}>
              <div style={{
                height: '4px',
                background: '#E24B4A',
                borderRadius: '99px',
                width: `${progressPercent}%`,
                transition: 'width 0.4s',
              }} />
            </div>
          </div>

          {/* Tip */}
          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
            Keep your head still and follow the dot with your eyes only.
          </div>

          {/* Camera Preview */}
          <div style={{ border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ position: 'relative', background: '#111', aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
        <button
          onClick={() => { stopCameraPreview(); onCancel(); }}
          style={{ padding: '10px 20px', background: '#ffffff', color: '#6b7280', border: '0.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
        >
          Cancel
        </button>

        {status === 'done' && averageAccuracy !== null && averageAccuracy < 80 && (
          <button
            onClick={() => { stopCameraPreview(); onRecalibrate(); }}
            style={{ padding: '10px 20px', background: '#ffffff', color: '#E24B4A', border: '0.5px solid #E24B4A', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            Recalibrate
          </button>
        )}

        <button
          onClick={() => { stopCameraPreview(); onComplete(averageAccuracy ?? 0); }}
          disabled={status !== 'done'}
          style={{
            flex: 1,
            padding: '10px',
            background: '#E24B4A',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            opacity: status === 'done' ? 1 : 0.4,
            cursor: status === 'done' ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.3s',
          }}
        >
          Start task 1 — syllable matrix → {/* ← CHANGED */}
        </button>
      </div>
    </div>
  );
}