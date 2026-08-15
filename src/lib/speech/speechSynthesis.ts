export interface SpeechUtteranceOptions {
  text: string;
  lang: string;
  rate: number;
}

export interface SpeakOptions {
  rate?: number;
  onEnd?: () => void;
  onError?: (e: any) => void;
}

/**
 * Checks if SpeechSynthesis API is supported in the current browser environment.
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

/**
 * Helper to generate speech utterance configuration for German.
 */
export function createSpeechUtterance(
  text: string,
  rate: number = 0.9,
  lang: string = 'de-DE'
): SpeechUtteranceOptions {
  return {
    text,
    lang,
    rate,
  };
}

/**
 * Speaks German text using SpeechSynthesis with optional rate and event callbacks.
 */
export function speakGerman(text: string, options?: SpeakOptions): void {
  if (!isSpeechSynthesisSupported()) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }

  try {
    // Cancel any currently running speech synthesis
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = options?.rate ?? 0.9;

    // Attempt to pick a German voice if available in the voice list
    const voices = window.speechSynthesis.getVoices?.() || [];
    const germanVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('de'));
    if (germanVoice) {
      utterance.voice = germanVoice;
    }

    if (options?.onEnd) {
      utterance.onend = () => options.onEnd?.();
    }

    if (options?.onError) {
      utterance.onerror = (e) => options.onError?.(e);
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Error speaking text with SpeechSynthesis:', err);
    if (options?.onError) {
      options.onError(err);
    }
  }
}

/**
 * Cancels active SpeechSynthesis utterances.
 */
export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.error('Error stopping speech synthesis:', err);
  }
}
