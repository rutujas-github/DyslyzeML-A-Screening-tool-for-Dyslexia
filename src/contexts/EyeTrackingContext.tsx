import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CalibrationPoint, GazeData } from '../hooks/useGazeTracker'; // ← CHANGED

interface EyeTrackingState {
  // Calibration
  calibrationPoints: CalibrationPoint[];
  calibrationAccuracy: number | null;
  isCalibrated: boolean;

  // Gaze data during reading tasks
  gazeData: GazeData[];

  // Actions
  addCalibrationPoint: (point: CalibrationPoint) => void;
  setCalibrationAccuracy: (accuracy: number) => void;
  setIsCalibrated: (value: boolean) => void;
  addGazePoint: (point: GazeData) => void;
  resetSession: () => void;
}

const EyeTrackingContext = createContext<EyeTrackingState | null>(null);

export function EyeTrackingProvider({ children }: { children: ReactNode }) {
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([]);
  const [calibrationAccuracy, setCalibrationAccuracyState] = useState<number | null>(null);
  const [isCalibrated, setIsCalibratedState] = useState(false);
  const [gazeData, setGazeData] = useState<GazeData[]>([]);

  const addCalibrationPoint = useCallback((point: CalibrationPoint) => {
    setCalibrationPoints(prev => [...prev, point]);
  }, []);

  const setCalibrationAccuracy = useCallback((accuracy: number) => {
    setCalibrationAccuracyState(accuracy);
  }, []);

  const setIsCalibrated = useCallback((value: boolean) => {
    setIsCalibratedState(value);
  }, []);

  const addGazePoint = useCallback((point: GazeData) => {
    setGazeData(prev => [...prev, point]);
  }, []);

  const resetSession = useCallback(() => {
    setCalibrationPoints([]);
    setCalibrationAccuracyState(null);
    setIsCalibratedState(false);
    setGazeData([]);
  }, []);

  return (
    <EyeTrackingContext.Provider
      value={{
        calibrationPoints,
        calibrationAccuracy,
        isCalibrated,
        gazeData,
        addCalibrationPoint,
        setCalibrationAccuracy,
        setIsCalibrated,
        addGazePoint,
        resetSession,
      }}
    >
      {children}
    </EyeTrackingContext.Provider>
  );
}

export function useEyeTracking() {
  const context = useContext(EyeTrackingContext);
  if (!context) {
    throw new Error('useEyeTracking must be used inside EyeTrackingProvider');
  }
  return context;
}