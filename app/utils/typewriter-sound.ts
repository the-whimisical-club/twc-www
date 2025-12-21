/**
 * Typewriter sound effect generator using Web Audio API
 * Creates realistic typewriter sounds with variations based on character type
 */

class TypewriterSound {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction (required by browsers)
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // Master volume (0-1)
      this.masterGain.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.isEnabled = false;
    }
  }

  private ensureAudioContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.initializeAudioContext();
    }
    // Resume audio context if suspended (required after user interaction)
    this.audioContext?.resume();
  }

  /**
   * Generate a typewriter sound based on character type
   */
  playSound(character: string): void {
    if (!this.isEnabled || !this.audioContext || !this.masterGain) {
      return;
    }

    this.ensureAudioContext();

    // Skip sounds for spaces (or make them quieter)
    if (character === ' ') {
      // Optional: play a very quiet space sound
      // For now, we'll skip spaces to avoid too much noise
      return;
    }

    // Determine sound characteristics based on character type
    const charCode = character.charCodeAt(0);
    const isLetter = /[a-zA-Z]/.test(character);
    const isPunctuation = /[.,!?;:'"\-]/.test(character);
    const isNumber = /[0-9]/.test(character);

    // Base frequency varies by character type
    let baseFreq: number;
    if (isLetter) {
      // Vowels get slightly different pitch than consonants
      const isVowel = /[aeiouAEIOU]/.test(character);
      baseFreq = isVowel ? 200 : 180;
      // Add variation based on character position in alphabet
      const charOffset = (charCode % 26) * 2;
      baseFreq += charOffset;
    } else if (isPunctuation) {
      baseFreq = 150; // Lower pitch for punctuation
    } else if (isNumber) {
      baseFreq = 190;
    } else {
      baseFreq = 180; // Default
    }

    // Add slight random variation for realism (±5%)
    const variation = 1 + (Math.random() - 0.5) * 0.1;
    const frequency = baseFreq * variation;

    // Create oscillator for the main "click" sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Configure oscillator
    oscillator.type = 'square'; // Square wave gives a more mechanical/typewriter sound
    oscillator.frequency.value = frequency;

    // Create envelope for realistic attack/decay
    const now = this.audioContext.currentTime;
    const attackTime = 0.001; // Very quick attack
    const decayTime = 0.05; // Quick decay
    const sustainLevel = 0.3;
    const releaseTime = 0.1;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.8, now + attackTime);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    gainNode.gain.linearRampToValueAtTime(0, now + attackTime + decayTime + releaseTime);

    // Add a second oscillator for more complex sound (optional "thunk")
    if (isLetter || isNumber) {
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode2 = this.audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(this.masterGain);

      oscillator2.type = 'sawtooth';
      oscillator2.frequency.value = frequency * 0.5; // Lower frequency for depth

      gainNode2.gain.setValueAtTime(0, now);
      gainNode2.gain.linearRampToValueAtTime(0.2, now + attackTime);
      gainNode2.gain.linearRampToValueAtTime(0, now + attackTime + decayTime * 2);

      oscillator2.start(now);
      oscillator2.stop(now + attackTime + decayTime * 2);
    }

    // Start and stop the sound
    oscillator.start(now);
    oscillator.stop(now + attackTime + decayTime + releaseTime);
  }

  /**
   * Play a sound for deletion (backspace)
   */
  playDeleteSound(): void {
    if (!this.isEnabled || !this.audioContext || !this.masterGain) {
      return;
    }

    this.ensureAudioContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.type = 'square';
    oscillator.frequency.value = 120; // Lower pitch for delete

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.08);

    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }

  /**
   * Play a sound for scrolling/transition
   */
  playScrollSound(): void {
    if (!this.isEnabled || !this.audioContext || !this.masterGain) {
      return;
    }

    this.ensureAudioContext();

    const now = this.audioContext.currentTime;
    const duration = 0.6; // 600ms for smooth scroll sound

    // Create a descending sweep sound (like a whoosh)
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.type = 'sine'; // Smooth sine wave for whoosh
    oscillator.frequency.setValueAtTime(300, now); // Start at 300Hz
    oscillator.frequency.exponentialRampToValueAtTime(150, now + duration); // Descend to 150Hz

    // Envelope: quick attack, sustain, then fade out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05); // Quick attack
    gainNode.gain.setValueAtTime(0.5, now + duration * 0.6); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Fade out

    // Add a second oscillator for depth (lower frequency)
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode2 = this.audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(this.masterGain);

    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(200, now);
    oscillator2.frequency.exponentialRampToValueAtTime(100, now + duration);

    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode2.gain.setValueAtTime(0.2, now + duration * 0.6);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
    oscillator2.start(now);
    oscillator2.stop(now + duration);
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Enable or disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Cleanup audio context
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.masterGain = null;
  }
}

// Export singleton instance
export const typewriterSound = new TypewriterSound();

