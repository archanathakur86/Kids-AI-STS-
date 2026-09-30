import { useState } from "react"
import { soundFx } from "../utils/soundEngine"

export function ProfileModal({ profile, characters = [], onSave, onClose }) {
  const [name, setName] = useState(profile?.name || "")
  const [avatar, setAvatar] = useState(profile?.avatar || "owl")
  const [pitch, setPitch] = useState(profile?.pitch || 1.7)
  const [speed, setSpeed] = useState(profile?.speed || 1.1)

  const handleSave = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    soundFx.chime()
    onSave({ name: name.trim(), avatar, pitch: parseFloat(pitch), speed: parseFloat(speed) })
  }

  const testCartoonVoice = () => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const sampleText = `Hello ${name || "friend"}! I am WhySo! *giggles*`
    const utter = new SpeechSynthesisUtterance(sampleText)
    const voices = window.speechSynthesis.getVoices()
    const prefVoice = voices.find(v => /female|zira|samantha|google uk english female|google hindi/i.test(v.name)) || voices[0]
    if (prefVoice) utter.voice = prefVoice
    utter.pitch = parseFloat(pitch)
    utter.rate = parseFloat(speed)
    window.speechSynthesis.speak(utter)
  }

  const activeChar = characters.find(c => c.id === avatar) || characters[0]

  return (
    <div className="modal-overlay">
      <div className="modal-card cartoon-card">
        <div className="modal-header">
          <span className="modal-hero-avatar">{activeChar?.avatar || "🦉"}</span>
          <h2>Edit Profile & Voice ⚙️</h2>
          <p>Logged in as <strong>{profile?.email}</strong></p>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          <div className="form-group">
            <label>Display Name ✨</label>
            <input
              type="text"
              autoFocus
              className="cartoon-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What name should WhySo call you?"
              required
            />
          </div>

          <div className="form-group">
            <label>Choose your Cartoon Buddy: 🎭</label>
            <div className="character-grid">
              {characters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  className={`char-card-btn ${avatar === char.id ? "selected" : ""}`}
                  style={{ "--char-color": char.color }}
                  onClick={() => {
                    soundFx.pop()
                    setAvatar(char.id)
                  }}
                >
                  <span className="char-card-icon">{char.avatar}</span>
                  <span className="char-card-title">{char.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row sliders-row">
            <div className="form-group flex-1">
              <label>Cartoon Voice Pitch 🐥: <strong>{pitch}x</strong></label>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label>Speech Speed ⚡: <strong>{speed}x</strong></label>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
              />
            </div>
          </div>

          <div className="voice-preview-row">
            <button type="button" className="btn-test-voice" onClick={testCartoonVoice}>
              🔊 Test Cartoon Voice
            </button>
          </div>

          <div className="modal-actions">
            {onClose && (
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary-sparkle">
              Save Changes 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
