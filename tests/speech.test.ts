import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSpeechUtterance,
  speakGerman,
  stopSpeaking,
  isSpeechSynthesisSupported,
} from '../src/lib/speech/speechSynthesis';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
} from '../src/lib/speech/speechRecognition';

describe('Speech Synthesis Utility', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore window
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    }
  });

  describe('createSpeechUtterance', () => {
    it('should create an utterance object configured for German (de-DE) by default', () => {
      const utterance = createSpeechUtterance('Guten Tag, wie geht es Ihnen?');
      expect(utterance.text).toBe('Guten Tag, wie geht es Ihnen?');
      expect(utterance.lang).toBe('de-DE');
      expect(utterance.rate).toBe(0.9);
    });

    it('should allow custom rate and language options', () => {
      const utterance = createSpeechUtterance('Hallo', 0.8, 'de-AT');
      expect(utterance.text).toBe('Hallo');
      expect(utterance.lang).toBe('de-AT');
      expect(utterance.rate).toBe(0.8);
    });
  });

  describe('isSpeechSynthesisSupported', () => {
    it('should return false if window is not defined', () => {
      const original = globalThis.window;
      // @ts-ignore
      delete globalThis.window;
      expect(isSpeechSynthesisSupported()).toBe(false);
      globalThis.window = original;
    });

    it('should return false if speechSynthesis is not in window', () => {
      // @ts-ignore
      globalThis.window = {};
      expect(isSpeechSynthesisSupported()).toBe(false);
    });

    it('should return true if speechSynthesis is supported in window', () => {
      // @ts-ignore
      globalThis.window = {
        speechSynthesis: {
          speak: vi.fn(),
          cancel: vi.fn(),
          getVoices: vi.fn().mockReturnValue([]),
        },
      };
      expect(isSpeechSynthesisSupported()).toBe(true);
    });
  });

  describe('speakGerman', () => {
    it('should safely do nothing if speechSynthesis is not supported', () => {
      // @ts-ignore
      globalThis.window = {};
      expect(() => speakGerman('Hallo')).not.toThrow();
    });

    it('should cancel active speech, configure German utterance and voice, and speak', () => {
      const cancelMock = vi.fn();
      const speakMock = vi.fn();
      const germanVoice = { name: 'Marlene', lang: 'de-DE' };
      const englishVoice = { name: 'Alex', lang: 'en-US' };

      class MockSpeechSynthesisUtterance {
        text: string;
        lang: string = '';
        rate: number = 1;
        voice: any = null;
        onend: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }

      // @ts-ignore
      globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
      // @ts-ignore
      globalThis.window = {
        speechSynthesis: {
          cancel: cancelMock,
          speak: speakMock,
          getVoices: vi.fn().mockReturnValue([englishVoice, germanVoice]),
        },
      };

      const onEndMock = vi.fn();
      const onErrorMock = vi.fn();

      speakGerman('Wie geht es dir?', {
        rate: 0.85,
        onEnd: onEndMock,
        onError: onErrorMock,
      });

      expect(cancelMock).toHaveBeenCalledTimes(1);
      expect(speakMock).toHaveBeenCalledTimes(1);

      const utteranceInstance = speakMock.mock.calls[0][0];
      expect(utteranceInstance.text).toBe('Wie geht es dir?');
      expect(utteranceInstance.lang).toBe('de-DE');
      expect(utteranceInstance.rate).toBe(0.85);
      expect(utteranceInstance.voice).toEqual(germanVoice);

      // Trigger callbacks
      utteranceInstance.onend();
      expect(onEndMock).toHaveBeenCalledTimes(1);

      utteranceInstance.onerror({ error: 'canceled' });
      expect(onErrorMock).toHaveBeenCalledWith({ error: 'canceled' });
    });
  });

  describe('stopSpeaking', () => {
    it('should safely do nothing if speechSynthesis is not supported', () => {
      // @ts-ignore
      globalThis.window = {};
      expect(() => stopSpeaking()).not.toThrow();
    });

    it('should call speechSynthesis.cancel when supported', () => {
      const cancelMock = vi.fn();
      // @ts-ignore
      globalThis.window = {
        speechSynthesis: {
          cancel: cancelMock,
        },
      };

      stopSpeaking();
      expect(cancelMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Speech Recognition Utility', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    }
  });

  describe('isSpeechRecognitionSupported', () => {
    it('should return false if window is not defined', () => {
      const original = globalThis.window;
      // @ts-ignore
      delete globalThis.window;
      expect(isSpeechRecognitionSupported()).toBe(false);
      globalThis.window = original;
    });

    it('should return false if neither SpeechRecognition nor webkitSpeechRecognition is available', () => {
      // @ts-ignore
      globalThis.window = {};
      expect(isSpeechRecognitionSupported()).toBe(false);
    });

    it('should return true if standard SpeechRecognition is available', () => {
      // @ts-ignore
      globalThis.window = {
        SpeechRecognition: vi.fn(),
      };
      expect(isSpeechRecognitionSupported()).toBe(true);
    });

    it('should return true if webkitSpeechRecognition is available', () => {
      // @ts-ignore
      globalThis.window = {
        webkitSpeechRecognition: vi.fn(),
      };
      expect(isSpeechRecognitionSupported()).toBe(true);
    });
  });

  describe('createSpeechRecognizer', () => {
    it('should return null if SpeechRecognition is not supported', () => {
      // @ts-ignore
      globalThis.window = {};
      const recognizer = createSpeechRecognizer({
        onResult: vi.fn(),
      });
      expect(recognizer).toBeNull();
    });

    it('should initialize and configure SpeechRecognition for German', () => {
      class MockSpeechRecognition {
        continuous: boolean = false;
        interimResults: boolean = false;
        lang: string = '';
        onresult: ((event: any) => void) | null = null;
        onerror: ((event: any) => void) | null = null;
        onend: (() => void) | null = null;
        start = vi.fn();
        stop = vi.fn();
        abort = vi.fn();
      }

      // @ts-ignore
      globalThis.window = {
        SpeechRecognition: MockSpeechRecognition,
      };

      const onResultMock = vi.fn();
      const onErrorMock = vi.fn();
      const onEndMock = vi.fn();

      const recognizer = createSpeechRecognizer({
        onResult: onResultMock,
        onError: onErrorMock,
        onEnd: onEndMock,
      });

      expect(recognizer).not.toBeNull();
      expect(recognizer?.continuous).toBe(true);
      expect(recognizer?.interimResults).toBe(true);
      expect(recognizer?.lang).toBe('de-DE');

      // Test onresult handler with final & interim transcripts
      const mockResultEvent = {
        resultIndex: 0,
        results: [
          [
            { transcript: 'Ich lerne Deutsch' },
          ],
        ],
      };
      // @ts-ignore
      mockResultEvent.results[0].isFinal = true;

      recognizer?.onresult(mockResultEvent);
      expect(onResultMock).toHaveBeenCalledWith('Ich lerne Deutsch', true);

      // Test interim result
      const mockInterimEvent = {
        resultIndex: 0,
        results: [
          [
            { transcript: 'Ich lerne' },
          ],
        ],
      };
      // @ts-ignore
      mockInterimEvent.results[0].isFinal = false;

      recognizer?.onresult(mockInterimEvent);
      expect(onResultMock).toHaveBeenCalledWith('Ich lerne', false);

      // Test onerror handler
      recognizer?.onerror({ error: 'network' });
      expect(onErrorMock).toHaveBeenCalledWith({ error: 'network' });

      // Test onend handler
      recognizer?.onend();
      expect(onEndMock).toHaveBeenCalledTimes(1);
    });
  });
});
