// Sound system using Web Audio API - Internal sounds only
// No external dependencies, all sounds are generated programmatically

export type SoundType = 'default' | 'ding' | 'chime' | 'pop' | 'none';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private currentSound: SoundType = 'default';

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setSound(type: SoundType) {
    this.currentSound = type;
  }

  getSound(): SoundType {
    return this.currentSound;
  }

  play() {
    if (this.currentSound === 'none') return;

    try {
      const ctx = this.getContext();
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      switch (this.currentSound) {
        case 'ding':
          this.playDing(ctx);
          break;
        case 'chime':
          this.playChime(ctx);
          break;
        case 'pop':
          this.playPop(ctx);
          break;
        case 'default':
        default:
          this.playDefault(ctx);
          break;
      }
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  private playDefault(ctx: AudioContext) {
    const now = ctx.currentTime;
    
    // Simple notification beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(800, now);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private playDing(ctx: AudioContext) {
    const now = ctx.currentTime;
    
    // Bell-like ding
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.frequency.setValueAtTime(1200, now);
    osc1.type = 'sine';
    
    osc2.frequency.setValueAtTime(1800, now + 0.05);
    osc2.type = 'sine';
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc1.start(now);
    osc1.stop(now + 0.5);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.5);
  }

  private playChime(ctx: AudioContext) {
    const now = ctx.currentTime;
    
    // Musical chime - three notes ascending
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      osc.type = 'sine';
      
      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  private playPop(ctx: AudioContext) {
    const now = ctx.currentTime;
    
    // Quick pop sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    osc.type = 'triangle';
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Play notification when receiving a task
  playNotification(_message?: string) {
    if (this.currentSound === 'none') return;
    this.play();
  }
}

export const soundManager = new SoundManager();