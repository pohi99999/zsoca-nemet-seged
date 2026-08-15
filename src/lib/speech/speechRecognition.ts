export interface SpeechRecognitionCallbacks {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
  lang?: string;
}

export interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

/**
 * Checks whether Web SpeechRecognition or webkitSpeechRecognition is available in the environment.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Creates and configures a SpeechRecognition instance for German listening.
 */
export function createSpeechRecognizer(
  callbacks: SpeechRecognitionCallbacks
): ISpeechRecognition | null {
  if (!isSpeechRecognitionSupported()) {
    console.warn('SpeechRecognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition: ISpeechRecognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = callbacks.lang || 'de-DE';

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      const transcript = item[0]?.transcript || '';
      if (item.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onResult(finalTranscript.trim(), true);
    } else if (interimTranscript) {
      callbacks.onResult(interimTranscript.trim(), false);
    }
  };

  recognition.onerror = (event: any) => {
    if (callbacks.onError) {
      callbacks.onError(event);
    }
  };

  recognition.onend = () => {
    if (callbacks.onEnd) {
      callbacks.onEnd();
    }
  };

  return recognition;
}
