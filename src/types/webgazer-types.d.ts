interface WebGazer {
  setGazeListener: (
    callback: (data: { x: number; y: number } | null, timestamp: number) => void
  ) => WebGazer;
  clearGazeListener: () => WebGazer;
  begin: () => Promise<WebGazer>;
  end: () => void;
  pause: () => WebGazer;
  resume: () => WebGazer;
  recordScreenPosition: (x: number, y: number) => WebGazer;
  showVideo: (show: boolean) => WebGazer;
  showFaceOverlay: (show: boolean) => WebGazer;
  showFaceFeedbackBox: (show: boolean) => WebGazer;
  showPredictionPoints: (show: boolean) => WebGazer;
  applyKalmanFilter: (apply: boolean) => WebGazer;
  isReady: () => boolean;
}

declare global {
  interface Window {
    webgazer: WebGazer;
  }
}

export {};