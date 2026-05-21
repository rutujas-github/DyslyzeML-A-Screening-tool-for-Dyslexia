import { useEffect, useRef, useState, useCallback } from 'react';
import { useGazeTracker } from '../hooks/useGazeTracker';

interface SyllableMatrixTestProps {
  screenieId: string;
  screenieName: string;
  onComplete: () => void;
  onCancel: () => void;
}

// Fixed pool of syllables — randomly arranged each session
const SYLLABLE_POOL = [
  'ba','ka','mi','ro','tu','le','pa',
  'si','no','de','fu','we','ti','bo',
  'ra','ki','mo','su','la','pe','di',
  'fo','na','ni','bu','sa','lo','te',
  'pi','da','ko','mu','ri','be','so',
  'lu','ta','fi','wo','ne','pu','li',
  'do','re','ku','bi','vu','za','to',
];

const GRID_SIZE = 7;
const FIXATION_THRESHOLD_MS = 100;    // min gaze duration to count as fixation
const END_TASK_FIXATION_MS = 2000;    // gaze on End Task button to stop
const GAZE_RADIUS = 40;              // pixels — how close gaze must be to cell center

interface CellFeatures {
  syllable: string;
  row: number;
  col: number;
  cellIndex: number;
  firstFixationDuration: number | null;
  avgFixationDuration: number;
  totalFixationDuration: number;
  fixationCount: number;
  fixationsAndSaccades: number;
  revisitCount: number;
  fixationDurations: number[];
  gazeEntryTimestamps: number[];
}

interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SyllableMatrixTest({
  screenieId,
  screenieName,
  onComplete,
  onCancel,
}: SyllableMatrixTestProps) {
  const { startGazeListener, stopGazeListener } = useGazeTracker();

  const [isTracking, setIsTracking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [endTaskProgress, setEndTaskProgress] = useState(0);
  const [syllables] = useState(() => shuffleArray(SYLLABLE_POOL));

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const endBtnRef = useRef<HTMLDivElement>(null);
  const cellFeaturesRef = useRef<CellFeatures[]>([]);
  const gazeRawRef = useRef<GazePoint[]>([]);
  const currentCellRef = useRef<number | null>(null);
  const cellEntryTimeRef = useRef<number | null>(null);
  const endTaskGazeStartRef = useRef<number | null>(null);
  const trackingStartRef = useRef<number | null>(null);
  const prevCellRef = useRef<number | null>(null);

  // Initialize cell features
  useEffect(() => {
    cellFeaturesRef.current = syllables.map((syllable, index) => ({
      syllable,
      row: Math.floor(index / GRID_SIZE),
      col: index % GRID_SIZE,
      cellIndex: index,
      firstFixationDuration: null,
      avgFixationDuration: 0,
      totalFixationDuration: 0,
      fixationCount: 0,
      fixationsAndSaccades: 0,
      revisitCount: 0,
      fixationDurations: [],
      gazeEntryTimestamps: [],
    }));
  }, [syllables]);

  // Camera preview
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

  // Get cell index from gaze coordinates
  const getCellAtGaze = useCallback((gazeX: number, gazeY: number): number | null => {
    if (!gridRef.current) return null;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / GRID_SIZE;
    const cellHeight = gridRect.height / GRID_SIZE;

    const relX = gazeX - gridRect.left;
    const relY = gazeY - gridRect.top;

    if (relX < 0 || relY < 0 || relX > gridRect.width || relY > gridRect.height) return null;

    const col = Math.floor(relX / cellWidth);
    const row = Math.floor(relY / cellHeight);

    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;

    // Check gaze is close enough to cell center
    const cellCenterX = gridRect.left + col * cellWidth + cellWidth / 2;
    const cellCenterY = gridRect.top + row * cellHeight + cellHeight / 2;
    const dist = Math.sqrt(Math.pow(gazeX - cellCenterX, 2) + Math.pow(gazeY - cellCenterY, 2));
    if (dist > GAZE_RADIUS * 2) return null;

    return row * GRID_SIZE + col;
  }, []);

  // Check if gaze is on End Task button
  const isGazeOnEndButton = useCallback((gazeX: number, gazeY: number): boolean => {
    if (!endBtnRef.current) return false;
    const rect = endBtnRef.current.getBoundingClientRect();
    return (
      gazeX >= rect.left &&
      gazeX <= rect.right &&
      gazeY >= rect.top &&
      gazeY <= rect.bottom
    );
  }, []);

  // Record fixation for a cell when gaze leaves it
  const recordFixation = useCallback((cellIndex: number, entryTime: number, exitTime: number) => {
    const duration = exitTime - entryTime;
    if (duration < FIXATION_THRESHOLD_MS) return;

    const cell = cellFeaturesRef.current[cellIndex];
    const isRevisit = cell.fixationCount > 0;

    cell.fixationDurations.push(duration);
    cell.totalFixationDuration += duration;
    cell.fixationCount += 1;
    cell.fixationsAndSaccades += 1; // count this fixation
    cell.gazeEntryTimestamps.push(entryTime);

    if (cell.firstFixationDuration === null) {
      cell.firstFixationDuration = duration;
    }

    cell.avgFixationDuration = cell.totalFixationDuration / cell.fixationCount;

    if (isRevisit) {
      cell.revisitCount += 1;
    }
  }, []);

  // Main gaze processing
  const processGaze = useCallback((gaze: { x: number; y: number; timestamp: number }) => {
    const { x, y, timestamp } = gaze;
    gazeRawRef.current.push({ x, y, timestamp });

    // Check End Task button fixation
    if (isGazeOnEndButton(x, y)) {
      if (!endTaskGazeStartRef.current) {
        endTaskGazeStartRef.current = timestamp;
      }
      const elapsed = timestamp - endTaskGazeStartRef.current;
      const progress = Math.min(100, Math.round((elapsed / END_TASK_FIXATION_MS) * 100));
      setEndTaskProgress(progress);

      if (elapsed >= END_TASK_FIXATION_MS) {
        finishTask();
        return;
      }
    } else {
      endTaskGazeStartRef.current = null;
      setEndTaskProgress(0);
    }

    // Detect current cell
    const cellIndex = getCellAtGaze(x, y);

    if (cellIndex !== currentCellRef.current) {
      // Left previous cell — record fixation
      if (currentCellRef.current !== null && cellEntryTimeRef.current !== null) {
        recordFixation(currentCellRef.current, cellEntryTimeRef.current, timestamp);

        // Count saccade on previous cell (outgoing) and new cell (incoming)
        if (cellIndex !== null) {
          // Count incoming saccade on new cell
          cellFeaturesRef.current[cellIndex].fixationsAndSaccades += 1;
          // Count as revisit if previously visited
          if (cellFeaturesRef.current[cellIndex].fixationCount > 0) {
            cellFeaturesRef.current[cellIndex].revisitCount += 1;
          }
        }
      }

      prevCellRef.current = currentCellRef.current;
      currentCellRef.current = cellIndex;
      cellEntryTimeRef.current = cellIndex !== null ? timestamp : null;
    }
  }, [getCellAtGaze, isGazeOnEndButton, recordFixation]);

  // Finish task and save results
  const finishTask = useCallback(() => {
    if (!isTracking) return;
    stopGazeListener();
    setIsTracking(false);
    setIsComplete(true);

    const endTime = Date.now();
    const totalDuration = trackingStartRef.current
      ? endTime - trackingStartRef.current
      : 0;

    // Record any ongoing fixation
    if (currentCellRef.current !== null && cellEntryTimeRef.current !== null) {
      recordFixation(currentCellRef.current, cellEntryTimeRef.current, endTime);
    }

    // Build results JSON
    const results = {
      screenieId,
      screenieName,
      testName: 'Syllable Matrix',
      taskNumber: 1,
      timestamp: new Date().toISOString(),
      testDurationMs: totalDuration,
      gridSize: `${GRID_SIZE}x${GRID_SIZE}`,
      totalCells: GRID_SIZE * GRID_SIZE,
      syllableGrid: syllables,
      summary: {
        totalFixations: cellFeaturesRef.current.reduce((s, c) => s + c.fixationCount, 0),
        totalFixationDurationMs: cellFeaturesRef.current.reduce((s, c) => s + c.totalFixationDuration, 0),
        avgFixationDurationMs: Math.round(
          cellFeaturesRef.current.reduce((s, c) => s + c.totalFixationDuration, 0) /
          Math.max(1, cellFeaturesRef.current.reduce((s, c) => s + c.fixationCount, 0))
        ),
        totalRevisits: cellFeaturesRef.current.reduce((s, c) => s + c.revisitCount, 0),
        cellsVisited: cellFeaturesRef.current.filter(c => c.fixationCount > 0).length,
        cellsNotVisited: cellFeaturesRef.current.filter(c => c.fixationCount === 0).length,
      },
      cellFeatures: cellFeaturesRef.current.map(cell => ({
        cellIndex: cell.cellIndex,
        row: cell.row,
        col: cell.col,
        syllable: cell.syllable,
        firstFixationDurationMs: cell.firstFixationDuration,
        avgFixationDurationMs: Math.round(cell.avgFixationDuration),
        totalFixationDurationMs: cell.totalFixationDuration,
        fixationCount: cell.fixationCount,
        fixationsAndSaccadesCount: cell.fixationsAndSaccades,
        revisitCount: cell.revisitCount,
        fixationDurationsMs: cell.fixationDurations,
        gazeEntryTimestamps: cell.gazeEntryTimestamps,
        wasVisited: cell.fixationCount > 0,
      })),
      rawGazePoints: gazeRawRef.current,
    };

    // Save to file via download
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllable_matrix_${screenieId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Also store in sessionStorage for in-memory access
    sessionStorage.setItem('syllableMatrixResults', JSON.stringify(results));

    setTimeout(() => onComplete(), 1500);
  }, [isTracking, screenieId, screenieName, syllables, recordFixation, stopGazeListener, onComplete]);

  // Start tracking
  const handleStart = useCallback(() => {
    setIsTracking(true);
    trackingStartRef.current = Date.now();
    currentCellRef.current = null;
    cellEntryTimeRef.current = null;
    gazeRawRef.current = [];
    endTaskGazeStartRef.current = null;

    startGazeListener((gaze) => {
      processGaze(gaze);
    });
  }, [startGazeListener, processGaze]);

  // Progress ring for End Task button
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (endTaskProgress / 100) * circumference;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#ffffff',
      zIndex: 50,
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
    }}>
      {/* Camera Preview — top left */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', width: '110px', borderRadius: '10px', overflow: 'hidden', background: '#111' }}>
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
          />
          <div style={{ position: 'absolute', top: '5px', right: '5px', width: '20px', height: '20px', background: '#E24B4A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 2px' }}>
          Reading test — task 1 of 3 · {screenieName}
        </p>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#111827', margin: 0 }}>
          Syllable matrix
        </h1>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af', marginBottom: '1rem' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isTracking ? '#1D9E75' : '#9ca3af', flexShrink: 0 }} />
        {isComplete
          ? 'Test complete — data saved!'
          : isTracking
          ? 'Tracking gaze — child is reading...'
          : 'Press Start when the child is ready'}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        style={{
          border: '1px solid #111',
          marginBottom: '1.5rem',
        }}
      >
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <div key={row} style={{ display: 'flex' }}>
            {Array.from({ length: GRID_SIZE }, (_, col) => {
              const index = row * GRID_SIZE + col;
              return (
                <div
                  key={col}
                  id={`cell-${index}`}
                  style={{
                    width: '44px',
                    height: '44px',
                    border: '0.5px solid #111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: '#111',
                  }}
                >
                  {syllables[index]}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Buttons */}
      {!isTracking && !isComplete && (
        <button
          onClick={handleStart}
          style={{ padding: '10px 32px', background: '#E24B4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Start
        </button>
      )}

      {isTracking && (
        <div
          ref={endBtnRef}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '44px', cursor: 'pointer' }}
          onClick={finishTask}
        >
          {/* Progress ring */}
          <svg style={{ position: 'absolute', top: '-8px', left: '-8px', width: '136px', height: '60px' }} viewBox="0 0 136 60">
            <rect x="2" y="2" width="132" height="56" rx="8" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <rect
              x="2" y="2" width="132" height="56" rx="8"
              fill="none"
              stroke="#E24B4A"
              strokeWidth="3"
              strokeDasharray={`${(endTaskProgress / 100) * (2 * (132 + 56))} 999`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ padding: '10px 20px', background: '#ffffff', color: '#E24B4A', border: '1.5px solid #E24B4A', borderRadius: '8px', fontSize: '14px', fontWeight: 500, zIndex: 1 }}>
            End task
          </div>
        </div>
      )}

      {isComplete && (
        <div style={{ padding: '10px 32px', background: '#1D9E75', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
          Saved ✓
        </div>
      )}
    </div>
  );
}