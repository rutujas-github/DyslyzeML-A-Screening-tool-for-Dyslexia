import { useEffect, useRef, useState, useCallback } from 'react';
import { useGazeTracker } from '../hooks/useGazeTracker';

interface PseudoTextReadingTestProps {
  screenieId: string;
  screenieName: string;
  onComplete: () => void;
  onCancel: () => void;
}

const PSEUDO_PASSAGE = `One snuny nafternoon, Tomym sat by his drowbem windoo watcning the wrlod oustide. He noticde a smarl gery sqirrel jupming from barnch to barnch on the big oak tere. The sqirrel hled an acron in its tny paws and lookde vrey buys. Tomym smidle as he watchde the sqirrel scamper up the tere tunk. The lttile animla seemde to be searchnig for the prefect palce to hdei its tresaure. Tomym wondeerd if the sqirrel wuold rememebr whree it brued the acron.`;

const FIXATION_THRESHOLD_MS = 100;
const END_TASK_FIXATION_MS = 2000;

interface FixationPoint {
  x: number;
  y: number;
  duration: number;
  timestamp: number;
  roiType: 'word' | 'line' | 'none';
  roiIndex: number;
  wordText?: string;
  lineIndex?: number;
}

interface SaccadePoint {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isRegression: boolean;
  amplitude: number;
  timestamp: number;
}

interface WordROI {
  wordIndex: number;
  lineIndex: number;
  text: string;
  avgFixationDurationMs: number;
  fixationCount: number;
  revisitCount: number;
  firstFixationLandingPosition: { x: number; y: number } | null;
  totalFixationDurationMs: number;
  fixationDurations: number[];
}

interface LineROI {
  lineIndex: number;
  text: string;
  avgFixationDurationMs: number;
  fixationCount: number;
  revisitCount: number;
  firstFixationLandingPosition: { x: number; y: number } | null;
  totalFixationDurationMs: number;
  fixationDurations: number[];
}

export default function PseudoTextReadingTest({
  screenieId,
  screenieName,
  onComplete,
  onCancel,
}: PseudoTextReadingTestProps) {
  const { startGazeListener, stopGazeListener } = useGazeTracker();

  const [isTracking, setIsTracking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [endTaskProgress, setEndTaskProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const endBtnRef = useRef<HTMLDivElement>(null);

  const fixationsRef = useRef<FixationPoint[]>([]);
  const saccadesRef = useRef<SaccadePoint[]>([]);
  const rawGazeRef = useRef<{ x: number; y: number; timestamp: number }[]>([]);
  const currentGazeStartRef = useRef<number | null>(null);
  const currentGazePosRef = useRef<{ x: number; y: number } | null>(null);
  const lastFixationPosRef = useRef<{ x: number; y: number } | null>(null);
  const endTaskGazeStartRef = useRef<number | null>(null);
  const trackingStartRef = useRef<number | null>(null);
  const wordROIsRef = useRef<Map<string, WordROI>>(new Map());
  const lineROIsRef = useRef<Map<number, LineROI>>(new Map());

  const startCameraPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error:', err);
    }
  }, []);

  const stopCameraPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    startCameraPreview();
    return () => { stopGazeListener(); stopCameraPreview(); };
  }, []);

  const getROIAtGaze = useCallback((gazeX: number, gazeY: number): {
    wordKey: string | null;
    wordEl: Element | null;
    lineIndex: number | null;
    lineEl: Element | null;
    wordText: string | null;
  } => {
    if (!passageRef.current) return { wordKey: null, wordEl: null, lineIndex: null, lineEl: null, wordText: null };

    const words = passageRef.current.querySelectorAll('[data-word]');
    const lines = passageRef.current.querySelectorAll('[data-line]');

    let foundWord: Element | null = null;
    let foundWordKey: string | null = null;
    let foundWordText: string | null = null;
    let foundLine: Element | null = null;
    let foundLineIndex: number | null = null;

    words.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (gazeX >= rect.left && gazeX <= rect.right && gazeY >= rect.top && gazeY <= rect.bottom) {
        foundWord = el;
        foundWordKey = el.getAttribute('data-word');
        foundWordText = el.textContent || null;
      }
    });

    lines.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (gazeX >= rect.left && gazeX <= rect.right && gazeY >= rect.top && gazeY <= rect.bottom) {
        foundLine = el;
        foundLineIndex = parseInt(el.getAttribute('data-line') || '0');
      }
    });

    return { wordKey: foundWordKey, wordEl: foundWord, lineIndex: foundLineIndex, lineEl: foundLine, wordText: foundWordText };
  }, []);

  const recordWordFixation = useCallback((
    wordKey: string, wordText: string, lineIndex: number,
    gazeX: number, gazeY: number, duration: number
  ) => {
    if (!wordROIsRef.current.has(wordKey)) {
      const [li, wi] = wordKey.split('-').map(Number);
      wordROIsRef.current.set(wordKey, {
        wordIndex: wi, lineIndex: li, text: wordText,
        avgFixationDurationMs: 0, fixationCount: 0, revisitCount: 0,
        firstFixationLandingPosition: null, totalFixationDurationMs: 0, fixationDurations: [],
      });
    }
    const roi = wordROIsRef.current.get(wordKey)!;
    const isRevisit = roi.fixationCount > 0;
    roi.fixationDurations.push(duration);
    roi.totalFixationDurationMs += duration;
    roi.fixationCount += 1;
    roi.avgFixationDurationMs = roi.totalFixationDurationMs / roi.fixationCount;
    if (roi.firstFixationLandingPosition === null) {
      roi.firstFixationLandingPosition = { x: Math.round(gazeX), y: Math.round(gazeY) };
    }
    if (isRevisit) roi.revisitCount += 1;
  }, []);

  const recordLineFixation = useCallback((
    lineIndex: number, lineText: string,
    gazeX: number, gazeY: number, duration: number
  ) => {
    if (!lineROIsRef.current.has(lineIndex)) {
      lineROIsRef.current.set(lineIndex, {
        lineIndex, text: lineText,
        avgFixationDurationMs: 0, fixationCount: 0, revisitCount: 0,
        firstFixationLandingPosition: null, totalFixationDurationMs: 0, fixationDurations: [],
      });
    }
    const roi = lineROIsRef.current.get(lineIndex)!;
    const isRevisit = roi.fixationCount > 0;
    roi.fixationDurations.push(duration);
    roi.totalFixationDurationMs += duration;
    roi.fixationCount += 1;
    roi.avgFixationDurationMs = roi.totalFixationDurationMs / roi.fixationCount;
    if (roi.firstFixationLandingPosition === null) {
      roi.firstFixationLandingPosition = { x: Math.round(gazeX), y: Math.round(gazeY) };
    }
    if (isRevisit) roi.revisitCount += 1;
  }, []);

  const isGazeOnEndButton = useCallback((x: number, y: number): boolean => {
    if (!endBtnRef.current) return false;
    const rect = endBtnRef.current.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }, []);

  const finishTask = useCallback(() => {
    if (!isTracking) return;
    stopGazeListener();
    setIsTracking(false);
    setIsComplete(true);

    const endTime = Date.now();
    const totalDuration = trackingStartRef.current ? endTime - trackingStartRef.current : 0;

    const fixations = fixationsRef.current;
    const saccades = saccadesRef.current;
    const regressions = saccades.filter(s => s.isRegression);
    const progressiveSaccades = saccades.filter(s => !s.isRegression);
    const avgSaccadicAmplitude = saccades.length
      ? Math.round(saccades.reduce((s, a) => s + a.amplitude, 0) / saccades.length) : 0;
    const avgFixationDuration = fixations.length
      ? Math.round(fixations.reduce((s, f) => s + f.duration, 0) / fixations.length) : 0;

    const results = {
      screenieId,
      screenieName,
      testName: 'Pseudo Text Reading',
      taskNumber: 3,
      timestamp: new Date().toISOString(),
      passage: PSEUDO_PASSAGE,

      wholeTaskFeatures: {
        totalReadingDurationMs: totalDuration,
        totalFixationCount: fixations.length,
        avgFixationDurationMs: avgFixationDuration,
        numberOfRegressions: regressions.length,
        numberOfProgressiveSaccades: progressiveSaccades.length,
        progressiveToRegressiveRatio: regressions.length > 0
          ? parseFloat((progressiveSaccades.length / regressions.length).toFixed(2))
          : null,
        avgSaccadicAmplitudePx: avgSaccadicAmplitude,
        totalSaccadeCount: saccades.length,
      },

      wordROIFeatures: Array.from(wordROIsRef.current.entries()).map(([key, roi]) => ({
        wordKey: key,
        wordIndex: roi.wordIndex,
        lineIndex: roi.lineIndex,
        text: roi.text,
        avgFixationDurationMs: Math.round(roi.avgFixationDurationMs),
        totalFixationDurationMs: roi.totalFixationDurationMs,
        fixationCount: roi.fixationCount,
        revisitCount: roi.revisitCount,
        firstFixationLandingPosition: roi.firstFixationLandingPosition,
        fixationDurationsMs: roi.fixationDurations,
        wasVisited: roi.fixationCount > 0,
      })),

      lineROIFeatures: Array.from(lineROIsRef.current.entries()).map(([idx, roi]) => ({
        lineIndex: roi.lineIndex,
        text: roi.text,
        avgFixationDurationMs: Math.round(roi.avgFixationDurationMs),
        totalFixationDurationMs: roi.totalFixationDurationMs,
        fixationCount: roi.fixationCount,
        revisitCount: roi.revisitCount,
        firstFixationLandingPosition: roi.firstFixationLandingPosition,
        fixationDurationsMs: roi.fixationDurations,
        wasVisited: roi.fixationCount > 0,
      })),

      allFixations: fixations.map(f => ({
        x: f.x, y: f.y,
        durationMs: f.duration,
        timestamp: f.timestamp,
        roiType: f.roiType,
        word: f.wordText ?? null,
        lineIndex: f.lineIndex ?? null,
      })),

      allSaccades: saccades.map(s => ({
        fromX: s.fromX, fromY: s.fromY,
        toX: s.toX, toY: s.toY,
        isRegression: s.isRegression,
        amplitudePx: s.amplitude,
        timestamp: s.timestamp,
      })),

      rawGazePoints: rawGazeRef.current,
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pseudo_text_reading_${screenieId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    sessionStorage.setItem('pseudoTextReadingResults', JSON.stringify(results));
    setTimeout(() => onComplete(), 1500);
  }, [isTracking, screenieId, screenieName, stopGazeListener, onComplete]);

  const processGaze = useCallback((gaze: { x: number; y: number; timestamp: number }) => {
    const { x, y, timestamp } = gaze;
    rawGazeRef.current.push({ x, y, timestamp });

    if (isGazeOnEndButton(x, y)) {
      if (!endTaskGazeStartRef.current) endTaskGazeStartRef.current = timestamp;
      const elapsed = timestamp - endTaskGazeStartRef.current;
      const progress = Math.min(100, Math.round((elapsed / END_TASK_FIXATION_MS) * 100));
      setEndTaskProgress(progress);
      if (elapsed >= END_TASK_FIXATION_MS) { finishTask(); return; }
    } else {
      endTaskGazeStartRef.current = null;
      setEndTaskProgress(0);
    }

    if (!currentGazePosRef.current) {
      currentGazePosRef.current = { x, y };
      currentGazeStartRef.current = timestamp;
      return;
    }

    const dist = Math.sqrt(
      Math.pow(x - currentGazePosRef.current.x, 2) +
      Math.pow(y - currentGazePosRef.current.y, 2)
    );

    if (dist >= 50) {
      const duration = timestamp - (currentGazeStartRef.current ?? timestamp);

      if (duration >= FIXATION_THRESHOLD_MS) {
        const fx = currentGazePosRef.current.x;
        const fy = currentGazePosRef.current.y;

        if (lastFixationPosRef.current) {
          const amplitude = Math.sqrt(
            Math.pow(fx - lastFixationPosRef.current.x, 2) +
            Math.pow(fy - lastFixationPosRef.current.y, 2)
          );
          saccadesRef.current.push({
            fromX: lastFixationPosRef.current.x, fromY: lastFixationPosRef.current.y,
            toX: fx, toY: fy,
            isRegression: fx < lastFixationPosRef.current.x,
            amplitude: Math.round(amplitude),
            timestamp,
          });
        }

        const { wordKey, wordText, lineIndex, lineEl } = getROIAtGaze(fx, fy);

        fixationsRef.current.push({
          x: Math.round(fx), y: Math.round(fy),
          duration, timestamp: currentGazeStartRef.current ?? timestamp,
          roiType: wordKey ? 'word' : lineIndex !== null ? 'line' : 'none',
          roiIndex: lineIndex ?? -1,
          wordText: wordText ?? undefined,
          lineIndex: lineIndex ?? undefined,
        });

        if (wordKey && wordText && lineIndex !== null) {
          recordWordFixation(wordKey, wordText, lineIndex, fx, fy, duration);
        }
        if (lineIndex !== null && lineEl) {
          recordLineFixation(lineIndex, lineEl.textContent || '', fx, fy, duration);
        }

        lastFixationPosRef.current = { x: fx, y: fy };
      }

      currentGazePosRef.current = { x, y };
      currentGazeStartRef.current = timestamp;
    }
  }, [getROIAtGaze, isGazeOnEndButton, recordWordFixation, recordLineFixation, finishTask]);

  const handleStart = useCallback(() => {
    setIsTracking(true);
    trackingStartRef.current = Date.now();
    fixationsRef.current = [];
    saccadesRef.current = [];
    rawGazeRef.current = [];
    currentGazePosRef.current = null;
    currentGazeStartRef.current = null;
    lastFixationPosRef.current = null;
    endTaskGazeStartRef.current = null;
    wordROIsRef.current = new Map();
    lineROIsRef.current = new Map();
    startGazeListener(processGaze);
  }, [startGazeListener, processGaze]);

  const lines = PSEUDO_PASSAGE.split('. ').map((sentence, i, arr) =>
    i < arr.length - 1 ? sentence + '.' : sentence
  );

  const ringPerimeter = 2 * (160 + 44);
  const strokeDash = (endTaskProgress / 100) * ringPerimeter;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#f0f4ff', zIndex: 50,
      fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '2rem',
    }}>
      {/* Camera Preview */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', width: '130px', borderRadius: '10px', overflow: 'hidden', background: '#111' }}>
        <div style={{ position: 'relative' }}>
          <video ref={videoRef} autoPlay muted playsInline
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
          />
          <div style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', background: '#E24B4A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>
          Reading test — task 3 of 3 · {screenieName}
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Reading Task
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
          Read the passage carefully
        </p>
      </div>

      {/* Passage */}
      <div ref={passageRef} style={{
        background: '#e2e8f0', borderRadius: '16px', padding: '2.5rem',
        maxWidth: '680px', width: '100%', marginBottom: '2rem',
      }}>
        {lines.map((line, lineIndex) => (
          <p key={lineIndex} data-line={lineIndex} style={{
            fontSize: '18px', lineHeight: 2, color: '#1e293b', margin: '0 0 0.5rem',
          }}>
            {line.split(' ').map((word, wordIndex) => (
              <span key={wordIndex} data-word={`${lineIndex}-${wordIndex}`}
                style={{ display: 'inline-block', padding: '0 2px', borderRadius: '2px' }}>
                {word}{' '}
              </span>
            ))}
          </p>
        ))}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af', marginBottom: '1.5rem' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isTracking ? '#1D9E75' : '#9ca3af' }} />
        {isComplete
          ? 'Assessment complete — data saved!'
          : isTracking
          ? 'Tracking gaze — child is reading...'
          : 'Press Start when the child is ready'}
      </div>

      {/* Buttons */}
      {!isTracking && !isComplete && (
        <button onClick={handleStart}
          style={{ padding: '12px 40px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
          Start
        </button>
      )}

      {/* ← End Reading Assessment button with progress ring */}
      {isTracking && (
        <div ref={endBtnRef} onClick={finishTask}
          style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg style={{ position: 'absolute', inset: '-6px', width: 'calc(100% + 12px)', height: 'calc(100% + 12px)' }}
            viewBox="0 0 184 56">
            <rect x="2" y="2" width="180" height="52" rx="10" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <rect x="2" y="2" width="180" height="52" rx="10"
              fill="none" stroke="#E24B4A" strokeWidth="3"
              strokeDasharray={`${strokeDash} 999`} strokeLinecap="round"
            />
          </svg>
          <div style={{ padding: '12px 32px', background: '#ffffff', color: '#E24B4A', border: '1.5px solid #E24B4A', borderRadius: '10px', fontSize: '15px', fontWeight: 500 }}>
            End Reading Assessment {/* ← CHANGED from "End task" */}
          </div>
        </div>
      )}

      {isComplete && (
        <div style={{ padding: '12px 40px', background: '#1D9E75', color: 'white', borderRadius: '10px', fontSize: '16px', fontWeight: 600 }}>
          Assessment complete ✓
        </div>
      )}
    </div>
  );
}