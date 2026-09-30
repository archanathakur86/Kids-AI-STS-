// Web Audio API Cartoon Sound Synthesizer for Kids App

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) {
      audioCtx = new AudioContext()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume()
  }
  return audioCtx
}

export const soundFx = {
  pop: () => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08)
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch (e) {}
  },

  boop: (isHigh = false) => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = "triangle"
      const freq = isHigh ? 650 : 350
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch (e) {}
  },

  chime: () => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06)
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(ctx.currentTime + idx * 0.06)
        osc.stop(ctx.currentTime + idx * 0.06 + 0.25)
      })
    } catch (e) {}
  },

  giggle: () => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const pitchOffset = [0, 150, 50, 200, 100]
      pitchOffset.forEach((p, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(600 + p, ctx.currentTime + idx * 0.05)
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.05 + 0.08)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(ctx.currentTime + idx * 0.05)
        osc.stop(ctx.currentTime + idx * 0.05 + 0.08)
      })
    } catch (e) {}
  }
}
