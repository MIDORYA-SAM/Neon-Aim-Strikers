
class AudioService {
  private ctx: AudioContext | null = null;
  private isMusicPlaying: boolean = false;
  private activeOscillators: OscillatorNode[] = [];

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playClick(type: 'hit' | 'miss' | 'menu' = 'hit') {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    if (type === 'hit') {
      osc.type = 'square'; // Som mais arcade
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'miss') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  public stopMusic() {
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.activeOscillators = [];
    this.isMusicPlaying = false;
  }

  public async startMusic() {
    this.init();
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Música estilo "Classic Game" - Arpejo 8-bit
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    let currentNote = 0;

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(notes[currentNote % notes.length], this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
      
      this.activeOscillators.push(osc);
      currentNote++;
      
      // Ritmo de jogo clássico (150ms por nota)
      setTimeout(playStep, 150);
    };

    playStep();

    // Bassline simples
    const playBass = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
      this.activeOscillators.push(osc);
      setTimeout(playBass, 600);
    };
    playBass();
  }
}

export const audioService = new AudioService();
