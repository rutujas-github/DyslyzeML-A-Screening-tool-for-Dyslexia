import { useEffect, useRef, useState, useCallback } from 'react';
import { useGazeTracker } from '../hooks/useGazeTracker'; // ← CHANGED
import { useEyeTracking } from '../contexts/EyeTrackingContext';

interface CalibrationScreenProps {
  screenieId: string;
  screenieName: string;
  onCancel: () => void;
  onComplete: () => void;
}

interface Dot {
  x: number;
  y: number;
}

const DOT_POSITIONS: Dot[] = [
  { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },
  { x: 10, y: 50 }, { x: 50, y: 50 }, { x: 90, y: 50 },
  { x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 },
];

const CLICKS_PER_DOT = 3;

type CalibrationStatus = 'initializing' | 'ready' | 'calibrating' | 'done' | 'error';

export default function CalibrationScreen({
  screenieId,
  screenieName,
  onCancel,
  onComplete,
}: CalibrationScreenProps) {
  const { start, stop, recordCalibrationPoint } = useGazeTracker(); // ← CHANGED
  const { addCalibrationPoint, setIsCalibrated, resetSession } = useEyeTracking();

  const [status, setStatus] = useState<CalibrationStatus>('initializing');
  const [currentDot, setCurrentDot] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [completedDots, setCompletedDots] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      setErrorMessage('Camera access was denied. Please allow camera access and try again.');
      setStatus('error');
    }
  }, []);

  const stopCameraPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      resetSession();
      await startCameraPreview();
      // ← CHANGED: pass videoRef.current to start()
      if (!videoRef.current) {
        setErrorMessage('Failed to initialize camera. Please refresh and try again.');
        setStatus('error');
        return;
      }
      const trackerStarted = await start(videoRef.current);
      if (trackerStarted) {
        setStatus('ready');
      } else {
        setErrorMessage('Failed to initialize eye tracking. Please refresh and try again.');
        setStatus('error');
      }
    };
    init();

    return () => {
      stop();
      stopCameraPreview();
    };
  }, []);

  const handleDotClick = useCallback(async () => {
    if (status !== 'calibrating' && status !== 'ready') return;
    setStatus('calibrating');

    const dot = DOT_POSITIONS[currentDot];
    const x = (dot.x / 100) * window.innerWidth;
    const y = (dot.y / 100) * window.innerHeight;

    const gazeEstimate = await recordCalibrationPoint(x, y);

    addCalibrationPoint({
      dotIndex: currentDot,
      dotPosition: { x, y },
      gazeEstimate,
      timestamp: Date.now(),
    });

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    if (newClickCount >= CLICKS_PER_DOT) {
      setCompletedDots(prev => [...prev, currentDot]);
      setClickCount(0);

      if (currentDot + 1 >= DOT_POSITIONS.length) {
        setIsCalibrated(true);
        setStatus('done');
      } else {
        setCurrentDot(prev => prev + 1);
      }
    }
  }, [status, currentDot, clickCount, recordCalibrationPoint, addCalibrationPoint, setIsCalibrated]);

  const remainingClicks = CLICKS_PER_DOT - clickCount;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        zIndex: 50,
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 2px' }}>
            Reading test — step 1 of 3 · {screenieName}
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#111827', margin: 0 }}>
            Eye-gaze calibration
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', background: '#f9fafb', border: '0.5px solid #e5e7eb', padding: '5px 12px', borderRadius: '99px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: status === 'error' ? '#ef4444' : '#1D9E75' }} />
          {status === 'error' ? 'Camera error' : 'Camera on'}
        </div>
      </div>

      {/* Error State */}
      {status === 'error' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <p style={{ fontSize: '16px', color: '#ef4444', textAlign: 'center' }}>{errorMessage}</p>
          <button
            onClick={onCancel}
            style={{ padding: '10px 24px', background: '#f3f4f6', border: '0.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#374151' }}
          >
            Go back
          </button>
        </div>
      )}

      {/* Main Content */}
      {status !== 'error' && (
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '20px', flex: 1 }}>

          {/* Camera Preview */}
          <div style={{ border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ position: 'relative', background: '#111', aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: '70px', height: '90px',
                  borderRadius: '50%',
                  border: '2px solid #4ade80',
                }} />
              </div>
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11px', color: '#9ca3af', textAlign: 'center', lineHeight: 1.4 }}>
              Keep face inside the oval.<br />Sit 50–70 cm away.
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Look at each red dot and click it {CLICKS_PER_DOT} times. Keep your head still.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '12px', color: '#9ca3af' }}>
              {completedDots.length} / {DOT_POSITIONS.length} dots done
            </div>

            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '99px' }}>
              <div style={{
                height: '4px',
                background: '#E24B4A',
                borderRadius: '99px',
                width: `${(completedDots.length / DOT_POSITIONS.length) * 100}%`,
                transition: 'width 0.4s',
              }} />
            </div>

            {/* Dot Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                background: '#ffffff',
                border: '0.5px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.75rem',
                alignItems: 'center',
                justifyItems: 'center',
                flex: 1,
              }}
            >
              {DOT_POSITIONS.map((_, i) => {
                const isDone = completedDots.includes(i);
                const isActive = i === currentDot && status !== 'done';
                return (
                  <div
                    key={i}
                    onClick={isActive ? handleDotClick : undefined}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      cursor: isActive ? 'pointer' : 'default',
                      background: isDone ? '#1D9E75' : isActive ? '#E24B4A' : '#e5e7eb',
                      boxShadow: isActive ? '0 0 0 6px rgba(226,75,74,0.15)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                );
              })}
            </div>

            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              {status === 'done'
                ? 'All dots calibrated — you can continue!'
                : status === 'initializing'
                ? 'Starting camera and eye tracking...'
                : `Look at the red dot and click it — ${remainingClicks} click${remainingClicks > 1 ? 's' : ''} remaining`}
            </p>
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      {status !== 'error' && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
          <button
            onClick={() => { stop(); stopCameraPreview(); onCancel(); }}
            style={{ padding: '10px 20px', background: '#ffffff', color: '#6b7280', border: '0.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onComplete}
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
            Continue to accuracy check →
          </button>
        </div>
      )}
    </div>
  );
}