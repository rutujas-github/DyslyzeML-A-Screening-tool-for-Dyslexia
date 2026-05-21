import { useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

export interface GazeData {
  x: number;
  y: number;
  timestamp: number;
}

export interface CalibrationPoint {
  dotIndex: number;
  dotPosition: { x: number; y: number };
  gazeEstimate: { x: number; y: number };
  timestamp: number;
}

// Iris landmark indices for left and right eye
const LEFT_IRIS = [473, 474, 475, 476, 477];
const RIGHT_IRIS = [468, 469, 470, 471, 472];

export function useGazeTracker() {
  const detectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isRunning = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const gazeListenerRef = useRef<((data: GazeData) => void) | null>(null);

  // Calibration data: maps dot positions to iris positions
  const calibrationDataRef = useRef<{ iris: { x: number; y: number }; screen: { x: number; y: number } }[]>([]);

  const start = useCallback(async (video: HTMLVideoElement): Promise<boolean> => {
    try {
      await tf.setBackend('webgl');
      await tf.ready();

      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'tfjs',
        refineLandmarks: true, // needed for iris tracking
        maxFaces: 1,
      });

      detectorRef.current = detector;
      videoRef.current = video;
      isRunning.current = true;
      return true;
    } catch (error) {
      console.error('GazeTracker failed to start:', error);
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    try {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
      gazeListenerRef.current = null;
      isRunning.current = false;
    } catch (error) {
      console.error('GazeTracker failed to stop:', error);
    }
  }, []);

  // Get current iris center from video frame
  const getIrisPosition = useCallback(async (): Promise<{ x: number; y: number } | null> => {
    if (!detectorRef.current || !videoRef.current) return null;
    if (videoRef.current.readyState < 2) return null;

    try {
      const faces = await detectorRef.current.estimateFaces(videoRef.current);
      if (!faces.length) return null;

      const keypoints = faces[0].keypoints;

      // Get left iris center
      const leftIris = LEFT_IRIS.map(i => keypoints[i]).filter(Boolean);
      const rightIris = RIGHT_IRIS.map(i => keypoints[i]).filter(Boolean);

      if (!leftIris.length || !rightIris.length) return null;

      const avgX = [...leftIris, ...rightIris].reduce((s, p) => s + p.x, 0) / (leftIris.length + rightIris.length);
      const avgY = [...leftIris, ...rightIris].reduce((s, p) => s + p.y, 0) / (leftIris.length + rightIris.length);

      return { x: Math.round(avgX), y: Math.round(avgY) };
    } catch {
      return null;
    }
  }, []);

  const recordCalibrationPoint = useCallback(
    async (screenX: number, screenY: number): Promise<CalibrationPoint['gazeEstimate']> => {
      const iris = await getIrisPosition();
      if (!iris) return { x: 0, y: 0 };

      // Store calibration mapping
      calibrationDataRef.current.push({
        iris: { x: iris.x, y: iris.y },
        screen: { x: screenX, y: screenY },
      });

      return { x: iris.x, y: iris.y };
    },
    [getIrisPosition]
  );

  // Map iris position to screen position using calibration data
  const irisToScreen = useCallback((iris: { x: number; y: number }): { x: number; y: number } => {
    const data = calibrationDataRef.current;
    if (data.length < 3) return { x: 0, y: 0 };

    // Simple weighted average based on distance to calibration points
    let totalWeight = 0;
    let screenX = 0;
    let screenY = 0;

    data.forEach(point => {
      const dist = Math.sqrt(
        Math.pow(iris.x - point.iris.x, 2) +
        Math.pow(iris.y - point.iris.y, 2)
      );
      const weight = 1 / (dist + 0.001);
      totalWeight += weight;
      screenX += point.screen.x * weight;
      screenY += point.screen.y * weight;
    });

    return {
      x: Math.round(screenX / totalWeight),
      y: Math.round(screenY / totalWeight),
    };
  }, []);

  const startGazeListener = useCallback((onGaze: (data: GazeData) => void) => {
    gazeListenerRef.current = onGaze;

    const loop = async () => {
      if (!isRunning.current) return;

      const iris = await getIrisPosition();
      if (iris && gazeListenerRef.current) {
        const screen = irisToScreen(iris);
        gazeListenerRef.current({
          x: screen.x,
          y: screen.y,
          timestamp: Date.now(),
        });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, [getIrisPosition, irisToScreen]);

  const stopGazeListener = useCallback(() => {
    gazeListenerRef.current = null;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  return {
    start,
    stop,
    recordCalibrationPoint,
    startGazeListener,
    stopGazeListener,
  };
}