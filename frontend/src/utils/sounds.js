// ── Quizzeria Sound Effects ─────────────────────────────────────
// Pure Web Audio API — no external files needed

let ctx = null
const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

const play = (fn) => {
  try { fn(getCtx()) } catch (e) { /* silently ignore if audio unavailable */ }
}

// ── Individual sound builders ────────────────────────────────────

export const sounds = {

  // Landing page logo reveal — triumphant 3-note fanfare
  fanfare: () => play(ac => {
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.start(t); osc.stop(t + 0.46)
    })
  }),

  // Round intro page whoosh
  whoosh: () => play(ac => {
    const bufLen = ac.sampleRate * 0.6
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1)
    const src = ac.createBufferSource()
    src.buffer = buf
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(800, ac.currentTime)
    filter.frequency.exponentialRampToValueAtTime(3200, ac.currentTime + 0.4)
    filter.Q.value = 0.8
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.001, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.28, ac.currentTime + 0.15)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6)
    src.connect(filter); filter.connect(gain); gain.connect(ac.destination)
    src.start(); src.stop(ac.currentTime + 0.65)
  }),

  // Correct answer — bright upward chime
  correct: () => play(ac => {
    const freqs = [880, 1108.73, 1318.51]
    freqs.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.09
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t); osc.stop(t + 0.56)
    })
  }),

  // Wrong answer — low buzz
  wrong: () => play(ac => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(90, ac.currentTime + 0.28)
    gain.gain.setValueAtTime(0.22, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3)
    osc.start(); osc.stop(ac.currentTime + 0.32)
  }),

  // Buzzer press — sharp electronic buzz
  buzz: () => play(ac => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'square'
    osc.frequency.value = 220
    gain.gain.setValueAtTime(0.25, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18)
    osc.start(); osc.stop(ac.currentTime + 0.2)
  }),

  // Score popup — coin ding
  score: () => play(ac => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.18)
    gain.gain.setValueAtTime(0.18, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4)
    osc.start(); osc.stop(ac.currentTime + 0.42)
  }),

  // Timer danger tick (plays once, call repeatedly at 1s interval)
  tick: () => play(ac => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = 1400
    gain.gain.setValueAtTime(0.12, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06)
    osc.start(); osc.stop(ac.currentTime + 0.07)
  }),

  // Timer expired — alarm beeps
  timerEnd: () => play(ac => {
    [0, 0.2, 0.4].forEach(delay => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'square'
      osc.frequency.value = 660
      const t = ac.currentTime + delay
      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.start(t); osc.stop(t + 0.16)
    })
  }),

  // Round complete — victory chord
  roundDone: () => play(ac => {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51]
    chord.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = i < 3 ? 'sine' : 'triangle'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.06
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.16, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
      osc.start(t); osc.stop(t + 1.25)
    })
  }),

  // Button click — soft UI tap
  click: () => play(ac => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = 600
    gain.gain.setValueAtTime(0.08, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08)
    osc.start(); osc.stop(ac.currentTime + 0.09)
  }),

  // Coin flip whoosh - for toss
  coinFlip: () => play(ac => {
    for (let i = 0; i < 3; i++) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'sine'
      const t = ac.currentTime + i * 0.12
      osc.frequency.setValueAtTime(300 + i * 200, t)
      osc.frequency.exponentialRampToValueAtTime(800 + i * 300, t + 0.1)
      gain.gain.setValueAtTime(0.14, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.start(t); osc.stop(t + 0.2)
    }
  }),

  // Drum roll beat - call repeatedly
  drumBeat: () => play(ac => {
    const bufLen = Math.floor(ac.sampleRate * 0.04)
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.3))
    const src = ac.createBufferSource()
    src.buffer = buf
    const gain = ac.createGain()
    gain.gain.value = 0.35
    src.connect(gain); gain.connect(ac.destination)
    src.start()
  }),

  // Toss winner reveal - triumphant hit
  tossReveal: () => play(ac => {
    const freqs = [440, 554.37, 659.25, 880]
    freqs.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = i < 2 ? 'triangle' : 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.07
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
      osc.start(t); osc.stop(t + 0.75)
    })
  }),

  // Game winner - full victory fanfare
  victory: () => play(ac => {
    const melody = [523.25, 523.25, 523.25, 415.30, 523.25, 659.25, 783.99, 1046.5]
    const timing = [0, 0.18, 0.36, 0.50, 0.58, 0.76, 0.94, 1.12]
    melody.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = ac.currentTime + timing[i]
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + (i === melody.length - 1 ? 1.2 : 0.22))
      osc.start(t); osc.stop(t + (i === melody.length - 1 ? 1.25 : 0.25))
    })
  }),

  // Sub-round landing page whoosh (slightly different from main whoosh)
  subWhoosh: () => play(ac => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.25)
    osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.45)
    gain.gain.setValueAtTime(0, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5)
    osc.start(); osc.stop(ac.currentTime + 0.55)
  }),

  // Halftime reveal - mid-game dramatic
  halftime: () => play(ac => {
    const notes = [392, 493.88, 587.33, 739.99, 587.33, 739.99, 880]
    const times = [0, 0.15, 0.30, 0.50, 0.65, 0.80, 1.0]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + times[i]
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.15, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.start(t); osc.stop(t + 0.28)
    })
  }),

  // Round complete overlay
  roundComplete: () => play(ac => {
    const chord = [523.25, 659.25, 783.99, 1046.5]
    chord.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.08
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0)
      osc.start(t); osc.stop(t + 1.05)
    })
  }),

  // Team name entry confirm
  teamReady: () => play(ac => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ac.currentTime)
    osc.frequency.linearRampToValueAtTime(900, ac.currentTime + 0.15)
    gain.gain.setValueAtTime(0.15, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35)
    osc.start(); osc.stop(ac.currentTime + 0.38)
  }),
}
