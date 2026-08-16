'use client';

import { useCallback, useRef, useState } from 'react';
import { createSpeechRecognizer, ISpeechRecognition } from './speechRecognition';

/**
 * Shared microphone toggle behavior for German speech input, used by both the
 * assessment and situational practice screens.
 */
export function useSpeechRecorder(
  onResult: (text: string, isFinal: boolean) => void,
  lang: string = 'de-DE'
) {
  const [isRecording, setIsRecording] = useState(false);
  const recognizerRef = useRef<ISpeechRecognition | null>(null);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) {
      stop();
      return;
    }

    const recognizer = createSpeechRecognizer({
      lang,
      onResult,
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      },
      onEnd: () => setIsRecording(false),
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
      setIsRecording(true);
    }
  }, [isRecording, lang, onResult, stop]);

  return { isRecording, toggle, stop };
}
