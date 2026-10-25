/**
 * Subtle completion chime using Web Audio API synthesis
 * No external media files or dependencies needed.
 */
export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // First harmonic tone (D5 - 587.33Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.18, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.55)

    // Second harmonic chime tone (A5 - 880Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, now + 0.12)
    gain2.gain.setValueAtTime(0.22, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.85)
  } catch (err) {
    // Non-blocking fallback if browser policy or audio device is restricted
    console.warn('Audio chime notice:', err)
  }
}

