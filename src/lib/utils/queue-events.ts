import { useEffect } from 'react';

export interface HandoffEventDetail {
  visitId: string;
  fromStage: string;
  toStage: string;
  timestamp: number;
}

export interface ClockInEventDetail {
  visitId: string;
  stage: string;
  timestamp: number;
}

const HANDOFF_EVENT_NAME = 'patient-handoff';
const CLOCK_IN_EVENT_NAME = 'patient-clock-in';

export function emitHandoffEvent(
  visitId: string,
  fromStage: string,
  toStage: string
): void {
  if (typeof window === 'undefined') return;

  const detail: HandoffEventDetail = {
    visitId,
    fromStage,
    toStage,
    timestamp: Date.now(),
  };

  const event = new CustomEvent(HANDOFF_EVENT_NAME, {
    detail,
    bubbles: true,
  });

  window.dispatchEvent(event);
  
  console.log('[Queue Events] Handoff event emitted:', detail);
}

export function emitClockInEvent(
  visitId: string,
  stage: string
): void {
  if (typeof window === 'undefined') return;

  const detail: ClockInEventDetail = {
    visitId,
    stage,
    timestamp: Date.now(),
  };

  const event = new CustomEvent(CLOCK_IN_EVENT_NAME, {
    detail,
    bubbles: true,
  });

  window.dispatchEvent(event);
  
  console.log('[Queue Events] Clock-in event emitted:', detail);
}

export function useHandoffListener(
  callback: (detail: HandoffEventDetail) => void
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHandoff = (event: Event) => {
      const customEvent = event as CustomEvent<HandoffEventDetail>;
      if (customEvent.detail) {
        console.log('[Queue Events] Handoff event received:', customEvent.detail);
        callback(customEvent.detail);
      }
    };

    window.addEventListener(HANDOFF_EVENT_NAME, handleHandoff);

    return () => {
      window.removeEventListener(HANDOFF_EVENT_NAME, handleHandoff);
    };
  }, [callback]);
}

export function useClockInListener(
  callback: (detail: ClockInEventDetail) => void
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClockIn = (event: Event) => {
      const customEvent = event as CustomEvent<ClockInEventDetail>;
      if (customEvent.detail) {
        console.log('[Queue Events] Clock-in event received:', customEvent.detail);
        callback(customEvent.detail);
      }
    };

    window.addEventListener(CLOCK_IN_EVENT_NAME, handleClockIn);

    return () => {
      window.removeEventListener(CLOCK_IN_EVENT_NAME, handleClockIn);
    };
  }, [callback]);
}

export function useQueueUpdateListener(
  callback: () => void
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHandoff = (event: Event) => {
      const customEvent = event as CustomEvent<HandoffEventDetail>;
      if (customEvent.detail) {
        console.log('[Queue Events] Queue update from handoff:', customEvent.detail);
        callback();
      }
    };

    const handleClockIn = (event: Event) => {
      const customEvent = event as CustomEvent<ClockInEventDetail>;
      if (customEvent.detail) {
        console.log('[Queue Events] Queue update from clock-in:', customEvent.detail);
        callback();
      }
    };

    window.addEventListener(HANDOFF_EVENT_NAME, handleHandoff);
    window.addEventListener(CLOCK_IN_EVENT_NAME, handleClockIn);

    return () => {
      window.removeEventListener(HANDOFF_EVENT_NAME, handleHandoff);
      window.removeEventListener(CLOCK_IN_EVENT_NAME, handleClockIn);
    };
  }, [callback]);
}
