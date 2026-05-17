/**
 * LexGuard AI — Voice Accessibility Engine
 * Browser Web Speech API TTS with multilingual + literacy-tier formatting.
 */

export type VoiceLanguageCode =
  | 'english'
  | 'hindi'
  | 'kannada'
  | 'tamil'
  | 'telugu'
  | 'bengali'
  | 'malayalam';

export type LiteracyTier = 'professional' | 'simple' | 'illiterate_friendly';

export interface VoiceConfig {
  language: VoiceLanguageCode;
  rate: number;
  pitch: number;
  volume: number;
  literacyTier?: LiteracyTier;
}

export interface VoiceScriptResponse {
  full_script: string;
  chunks: string[];
  chunk_count: number;
  bcp47: string;
  estimated_speak_minutes?: number;
}

const LANG_MAP: Record<VoiceLanguageCode, string> = {
  english: 'en-IN',
  hindi: 'hi-IN',
  kannada: 'kn-IN',
  tamil: 'ta-IN',
  telugu: 'te-IN',
  bengali: 'bn-IN',
  malayalam: 'ml-IN',
};

const VOICE_HINTS: Record<VoiceLanguageCode, string[]> = {
  english: ['en-IN', 'English India', 'en-GB', 'en-US'],
  hindi: ['hi-IN', 'Hindi', 'Lekha', 'Microsoft Hemant'],
  kannada: ['kn-IN', 'Kannada'],
  tamil: ['ta-IN', 'Tamil', 'Latha'],
  telugu: ['te-IN', 'Telugu', 'Ravi'],
  bengali: ['bn-IN', 'Bengali', 'Bangla'],
  malayalam: ['ml-IN', 'Malayalam'],
};

/** Slower rate for conversational / illiterate-friendly tiers */
const TIER_RATE: Record<LiteracyTier, number> = {
  professional: 0.92,
  simple: 0.88,
  illiterate_friendly: 0.82,
};

let _utterances: SpeechSynthesisUtterance[] = [];
let _currentIndex = 0;
let _isPaused = false;
let _isPlaying = false;
let _onProgressCallback: ((progress: number, total: number) => void) | null = null;
let _onEndCallback: (() => void) | null = null;
let _onSectionCallback: ((sectionIndex: number) => void) | null = null;

function _pickVoice(lang: VoiceLanguageCode): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const hints = VOICE_HINTS[lang];
  const bcp47 = LANG_MAP[lang];

  for (const hint of hints) {
    const match = voices.find(
      (v) => v.lang === hint || v.name.toLowerCase().includes(hint.toLowerCase())
    );
    if (match) return match;
  }

  const prefix = bcp47.split('-')[0];
  return voices.find((v) => v.lang.startsWith(prefix)) ?? null;
}

/**
 * Voice-friendly formatting: pauses, spoken numbers, tier-specific shortening.
 */
export function formatForVoice(
  text: string,
  _lang: VoiceLanguageCode,
  tier: LiteracyTier = 'simple'
): string {
  let cleaned = text
    .replace(/[#*_`~>]/g, '')
    .replace(/^[•\-–]\s+/gm, '. ')
    .replace(/\bvs\./gi, 'versus')
    .replace(/\betc\./gi, 'etcetera')
    .replace(/\be\.g\./gi, 'for example')
    .replace(/\bi\.e\./gi, 'that is')
    .replace(/\bsec\.\s+/gi, 'section ')
    .replace(/\bArt\.\s+/gi, 'article ')
    .replace(/₹\s*([\d,]+)/g, '$1 rupees')
    .replace(/\$\s*([\d,]+)/g, '$1 dollars')
    .replace(/^([A-Z][A-Z\s&.]{4,})\s*$/gm, '$1. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n+/g, '. ')
    .trim();

  if (tier === 'illiterate_friendly') {
    cleaned = cleaned
      .replace(/\b(pursuant|notwithstanding|herein|thereof|indemnif\w+)\b/gi, '')
      .replace(/;/g, ',')
      .replace(/\([^)]{30,}\)/g, '');
  }

  if (tier === 'professional') {
    cleaned = cleaned.replace(/,\s*,/g, ',');
  } else {
    cleaned = cleaned.replace(/;\s*/g, ', ').replace(/:\s*/g, ', ');
  }

  if (cleaned && !cleaned.endsWith('.')) cleaned += '.';
  return cleaned;
}

function _chunkText(text: string, maxChars = 185): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    const candidate = (current + ' ' + sentence).trim();
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      if (sentence.length > maxChars) {
        const subParts = sentence.split(/(?<=[,;])\s+/);
        let sub = '';
        for (const part of subParts) {
          if ((sub + ' ' + part).trim().length <= maxChars) {
            sub = (sub + ' ' + part).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = part;
          }
        }
        if (sub) chunks.push(sub);
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((c) => c.trim().length > 0);
}

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface PlayOptions {
  config: VoiceConfig;
  onProgress?: (chunk: number, total: number) => void;
  onEnd?: () => void;
}

function _speakChunks(chunks: string[], config: VoiceConfig, options: PlayOptions): void {
  const { onProgress, onEnd } = options;
  _onProgressCallback = onProgress ?? null;
  _onEndCallback = onEnd ?? null;

  const tier = config.literacyTier ?? 'simple';
  const rate = config.rate || TIER_RATE[tier];

  _utterances = chunks.map((chunk) => {
    const utt = new SpeechSynthesisUtterance(chunk);
    utt.lang = LANG_MAP[config.language];
    utt.rate = rate;
    utt.pitch = config.pitch;
    utt.volume = config.volume;
    const voice = _pickVoice(config.language);
    if (voice) utt.voice = voice;

    utt.onend = () => {
      _currentIndex++;
      _onProgressCallback?.(_currentIndex, chunks.length);
      if (_currentIndex < _utterances.length && !_isPaused) {
        window.speechSynthesis.speak(_utterances[_currentIndex]);
      } else if (_currentIndex >= _utterances.length) {
        _isPlaying = false;
        _onEndCallback?.();
      }
    };
    return utt;
  });

  _currentIndex = 0;
  _isPaused = false;
  _isPlaying = true;

  const start = () => window.speechSynthesis.speak(_utterances[0]);

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const voice = _pickVoice(config.language);
      if (voice) _utterances.forEach((u) => (u.voice = voice));
      start();
    };
  } else {
    start();
  }
}

export function speak(text: string, options: PlayOptions): void {
  if (!isVoiceSupported()) return;
  stopSpeech();

  const tier = options.config.literacyTier ?? 'simple';
  const prepared = formatForVoice(text, options.config.language, tier);
  const chunks = _chunkText(prepared);
  _speakChunks(chunks, options.config, options);
}

/** Speak pre-chunked script from backend /voice-script */
export function speakScript(script: VoiceScriptResponse, options: PlayOptions): void {
  if (!isVoiceSupported()) return;
  stopSpeech();
  const chunks = script.chunks?.length ? script.chunks : _chunkText(script.full_script);
  _speakChunks(chunks, options.config, options);
}

/** Long documents: play sections sequentially with optional section callback */
export function speakLongDocument(
  sections: { title?: string; text: string }[],
  options: PlayOptions & { onSectionChange?: (index: number) => void }
): void {
  if (!isVoiceSupported() || sections.length === 0) return;
  stopSpeech();

  let sectionIdx = 0;
  _onSectionCallback = options.onSectionChange ?? null;

  const playSection = () => {
    if (sectionIdx >= sections.length) {
      _isPlaying = false;
      options.onEnd?.();
      return;
    }
    const sec = sections[sectionIdx];
    _onSectionCallback?.(sectionIdx);
    const body = sec.title ? `${sec.title}. ${sec.text}` : sec.text;
    const tier = options.config.literacyTier ?? 'simple';
    const prepared = formatForVoice(body, options.config.language, tier);
    const chunks = _chunkText(prepared);

    _speakChunks(chunks, options.config, {
      config: options.config,
      onProgress: options.onProgress,
      onEnd: () => {
        sectionIdx++;
        playSection();
      },
    });
  };

  playSection();
}

export function pauseSpeech(): void {
  if (_isPlaying && !_isPaused) {
    _isPaused = true;
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (_isPaused) {
    _isPaused = false;
    window.speechSynthesis.resume();
  }
}

export function stopSpeech(): void {
  window.speechSynthesis.cancel();
  _utterances = [];
  _currentIndex = 0;
  _isPaused = false;
  _isPlaying = false;
}

export function isSpeaking(): boolean {
  return _isPlaying && !_isPaused;
}

export function isPaused(): boolean {
  return _isPaused;
}

export function getAvailableVoices(lang: VoiceLanguageCode): SpeechSynthesisVoice[] {
  const prefix = LANG_MAP[lang].split('-')[0];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith(prefix));
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  language: 'english',
  rate: 0.88,
  pitch: 1.0,
  volume: 1.0,
  literacyTier: 'simple',
};
