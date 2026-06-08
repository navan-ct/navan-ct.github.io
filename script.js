document.addEventListener('DOMContentLoaded', () => {
  
  /* ==========================================================================
     1. Page Entrance & Reveal Animations
     ========================================================================== */
  const revealItems = document.querySelectorAll('.reveal-item');
  revealItems.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add('revealed');
    }, index * 120); // Beautiful staggered load
  });

  // Copyright Year Update
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Header Shrink on Scroll
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });


  /* ==========================================================================
     2. Cursor Glowing Orb Tracker
     ========================================================================== */
  const glowOrb = document.getElementById('glow-orb');
  if (glowOrb && window.innerWidth > 900) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let orbX = mouseX;
    let orbY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Smooth lerping animation loop for the glow orb
    const updateOrb = () => {
      const ease = 0.08;
      orbX += (mouseX - orbX) * ease;
      orbY += (mouseY - orbY) * ease;
      
      glowOrb.style.setProperty('--mouse-x', `${orbX}px`);
      glowOrb.style.setProperty('--mouse-y', `${orbY}px`);
      
      requestAnimationFrame(updateOrb);
    };
    updateOrb();
  }


  /* ==========================================================================
     3. Light / Dark Theme Switcher
     ========================================================================== */
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  // Initialize theme from storage or system preferences
  const getPreferredTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const setTheme = (theme) => {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  // Set default theme
  setTheme(getPreferredTheme());

  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });


  /* ==========================================================================
     4. Generative Ambient Synth Engine
     ========================================================================== */
  
  // Track details and sound parameters
  const tracks = [
    {
      title: "Ambient Synthesizer",
      desc: "Generative Chill Chord Engine",
      chords: [
        [138.61, 174.61, 207.65, 261.63], // Db Maj7 (Db3, F3, Ab3, C4)
        [103.83, 130.81, 155.56, 196.00], // Ab Maj7 (Ab2, C3, Eb3, G3)
        [87.31, 103.83, 130.81, 155.56],  // F min7 (F2, Ab3, C4, Eb4)
        [77.78, 98.00, 116.54, 146.83]    // Eb Maj7 (Eb2, G3, Bb3, D4)
      ],
      wave: "triangle",
      filterFreq: 380,
      detune: 4
    },
    {
      title: "Cosmic Drone Pad",
      desc: "Warm Space Resonance",
      chords: [
        [146.83, 220.00, 293.66, 369.99], // D Maj7-ish / A/D
        [110.00, 165.00, 220.00, 277.18], // A Maj
        [98.00, 146.83, 196.00, 246.94],   // G Maj
        [82.41, 123.47, 164.81, 207.65]    // E Maj
      ],
      wave: "sawtooth", // very heavily lowpassed
      filterFreq: 240,
      detune: 8
    },
    {
      title: "Deep Focus Sines",
      desc: "Binaural Atmospheric Frequencies",
      chords: [
        [110.00, 165.00, 220.00, 330.00], // A5 drone
        [110.00, 165.00, 220.80, 330.00], // Slightly offset for binaural beat
        [116.54, 174.61, 233.08, 349.23], // Bb5 drone
        [116.54, 174.61, 233.88, 349.23]
      ],
      wave: "sine",
      filterFreq: 500,
      detune: 0
    }
  ];

  class AmbientSynth {
    constructor() {
      this.audioCtx = null;
      this.isPlaying = false;
      this.currentTrackIndex = 0;
      
      // Node references
      this.masterGain = null;
      this.filter = null;
      this.delayNode = null;
      this.delayGain = null;
      
      // Scheduling/Tracking state
      this.activeVoices = [];
      this.chordCycleInterval = null;
      this.chordIndex = 0;
      
      // DOM Elements
      this.playBtn = document.getElementById('music-play');
      this.prevBtn = document.getElementById('music-prev');
      this.nextBtn = document.getElementById('music-next');
      this.trackTitle = document.getElementById('track-title');
      this.trackDesc = document.getElementById('track-desc');
      this.visualizer = document.getElementById('visualizer');
      this.vinyl = document.getElementById('vinyl-record');

      this.initEvents();
    }

    initEvents() {
      if (!this.playBtn) return;
      
      this.playBtn.addEventListener('click', () => this.togglePlayback());
      this.prevBtn.addEventListener('click', () => this.changeTrack(-1));
      this.nextBtn.addEventListener('click', () => this.changeTrack(1));
    }

    initAudio() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      
      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
      
      // Main Lowpass Filter to make notes soft and ambient
      this.filter = this.audioCtx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.Q.setValueAtTime(1.5, this.audioCtx.currentTime);
      this.filter.connect(this.masterGain);
      
      // Atmospheric Space Delay Node
      this.delayNode = this.audioCtx.createDelay(1.5);
      this.delayGain = this.audioCtx.createGain();
      
      // Connect delay loop
      this.filter.connect(this.delayNode);
      this.delayNode.connect(this.delayGain);
      this.delayGain.connect(this.filter); // feedback loop
      this.delayGain.connect(this.masterGain); // mix delay output into master
      
      // Configure initial delay parameters
      this.delayNode.delayTime.setValueAtTime(0.5, this.audioCtx.currentTime); // 500ms echo
      this.delayGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime); // feedback level
    }

    togglePlayback() {
      // Lazy init AudioContext on user action to meet security standards
      if (!this.audioCtx) {
        this.initAudio();
      }

      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    play() {
      if (this.isPlaying) return;

      // Resume context if suspended
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.isPlaying = true;
      this.updateUI();

      // Configure current track parameters
      const track = tracks[this.currentTrackIndex];
      this.filter.frequency.setValueAtTime(track.filterFreq, this.audioCtx.currentTime);

      // Fade in master volume slowly
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.audioCtx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.35, this.audioCtx.currentTime + 1.5); // Warm fade-in

      // Trigger first chord immediately, then start chord loop
      this.chordIndex = 0;
      this.triggerChord();
      
      this.chordCycleInterval = setInterval(() => {
        this.triggerChord();
      }, 5500); // Trigger chord transition every 5.5s
    }

    pause() {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      this.updateUI();

      // Clear the trigger interval
      if (this.chordCycleInterval) {
        clearInterval(this.chordCycleInterval);
        this.chordCycleInterval = null;
      }

      // Fade out master volume
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.audioCtx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.8);

      // Stop notes after fade-out
      setTimeout(() => {
        if (!this.isPlaying) {
          this.stopAllVoices();
        }
      }, 900);
    }

    triggerChord() {
      if (!this.isPlaying || !this.audioCtx) return;

      const track = tracks[this.currentTrackIndex];
      const chord = track.chords[this.chordIndex];
      const now = this.audioCtx.currentTime;

      // 1. Gently fade out currently active voices
      const voicesToFade = [...this.activeVoices];
      this.activeVoices = [];
      
      voicesToFade.forEach(voice => {
        const gainNode = voice.gain;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 2.0); // Smooth 2s fade out overlap
        
        // Stop oscillators after they are fully silent
        setTimeout(() => {
          try {
            voice.oscillators.forEach(osc => osc.stop());
          } catch(e) {}
        }, 2100);
      });

      // 2. Spawn and fade in new voices for the new chord
      const newVoices = chord.map((freq, index) => {
        // Voice gain node
        const vGain = this.audioCtx.createGain();
        vGain.gain.setValueAtTime(0, now);
        
        // Connect voice gain to filter
        vGain.connect(this.filter);

        // Multiple oscillators per note for thick detuned stereo-like effect
        const numOscs = track.detune > 0 ? 2 : 1;
        const oscs = [];

        for (let i = 0; i < numOscs; i++) {
          const osc = this.audioCtx.createOscillator();
          osc.type = track.wave;
          
          // Apply detuning if configured
          const detuneVal = i === 0 ? -track.detune : track.detune;
          osc.frequency.setValueAtTime(freq, now);
          if (track.detune > 0) {
            osc.detune.setValueAtTime(detuneVal, now);
          }
          
          osc.connect(vGain);
          osc.start(now);
          oscs.push(osc);
        }

        // Program smooth volume envelope
        vGain.gain.linearRampToValueAtTime(0.12 / chord.length, now + 2.0); // 2s slow attack

        return {
          oscillators: oscs,
          gain: vGain
        };
      });

      this.activeVoices = newVoices;

      // Cycle to the next chord index
      this.chordIndex = (this.chordIndex + 1) % track.chords.length;
    }

    stopAllVoices() {
      this.activeVoices.forEach(voice => {
        try {
          voice.oscillators.forEach(osc => osc.stop());
        } catch(e) {}
      });
      this.activeVoices = [];
    }

    changeTrack(direction) {
      const wasPlaying = this.isPlaying;
      
      // Stop current playback
      this.pause();
      this.stopAllVoices();

      // Cycle track index
      this.currentTrackIndex = (this.currentTrackIndex + direction + tracks.length) % tracks.length;

      // Update text fields
      const track = tracks[this.currentTrackIndex];
      if (this.trackTitle) this.trackTitle.textContent = track.title;
      if (this.trackDesc) this.trackDesc.textContent = track.desc;

      // Auto-resume if it was already playing
      if (wasPlaying) {
        setTimeout(() => {
          this.play();
        }, 150);
      }
    }

    updateUI() {
      const playIcon = this.playBtn.querySelector('.play-icon');
      const pauseIcon = this.playBtn.querySelector('.pause-icon');

      if (this.isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        this.visualizer.classList.add('playing');
        this.vinyl.classList.add('playing');
      } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        this.visualizer.classList.remove('playing');
        this.vinyl.classList.remove('playing');
      }
    }
  }

  // Instantiate the synth engine
  new AmbientSynth();

});
