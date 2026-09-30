import { useState } from "react"
import { soundFx } from "../utils/soundEngine"

export function AuthModal({ characters = [], onLoginSuccess, onRegisterSuccess }) {
  const [tab, setTab] = useState("login") // 'login' | 'register'
  
  // Register fields
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regAvatar, setRegAvatar] = useState("owl")
  const [regPitch, setRegPitch] = useState(1.7)
  const [regSpeed, setRegSpeed] = useState(1.1)

  // Login fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [errorMsg, setErrorMsg] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const activeChar = characters.find(c => c.id === regAvatar) || characters[0]

  const testCartoonVoice = () => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const sampleText = `Hello ${name || "friend"}! I am WhySo!`
    const utter = new SpeechSynthesisUtterance(sampleText)
    const voices = window.speechSynthesis.getVoices()
    const prefVoice = voices.find(v => /female|zira|samantha|google uk english female|google hindi/i.test(v.name)) || voices[0]
    if (prefVoice) utter.voice = prefVoice
    utter.pitch = parseFloat(regPitch)
    utter.rate = parseFloat(regSpeed)
    window.speechSynthesis.speak(utter)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    if (!regEmail.trim() || !regPassword || !regName.trim()) {
      setErrorMsg("Please fill in all required fields.")
      return
    }

    soundFx.pop()
    setSubmitting(true)
    try {
      await onRegisterSuccess({
        email: regEmail.trim(),
        password: regPassword,
        name: regName.trim(),
        avatar: regAvatar,
        pitch: parseFloat(regPitch),
        speed: parseFloat(regSpeed)
      })
      soundFx.chime()
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Please try again.")
      soundFx.boop(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg("Please enter both email and password.")
      return
    }

    soundFx.pop()
    setSubmitting(true)
    try {
      await onLoginSuccess({
        email: loginEmail.trim(),
        password: loginPassword
      })
      soundFx.chime()
    } catch (err) {
      setErrorMsg(err.message || "Login failed. Please check your credentials.")
      soundFx.boop(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card cartoon-card auth-modal-card">
        <div className="modal-header">
          <span className="modal-hero-avatar">{activeChar?.avatar || "🦉"}</span>
          <h2>WhySo AI Platform 🌟</h2>
          <p>Log in or create an account for your private dashboard!</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              soundFx.pop()
              setErrorMsg("")
              setTab("login")
            }}
          >
            🔑 Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => {
              soundFx.pop()
              setErrorMsg("")
              setTab("register")
            }}
          >
            ✨ Register Account
          </button>
        </div>

        {errorMsg && <div className="auth-error-banner">⚠️ {errorMsg}</div>}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="modal-body">
            <div className="form-group">
              <label>Email Address 📧</label>
              <input
                type="email"
                autoFocus
                className="cartoon-input"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email (e.g. ana@gmail.com)"
                required
              />
            </div>

            <div className="form-group">
              <label>Password 🔒</label>
              <input
                type="password"
                className="cartoon-input"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn-primary-sparkle full-width" disabled={submitting}>
                {submitting ? "Logging in..." : "Log In To Dashboard 🔑"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="modal-body">
            <div className="form-group">
              <label>Email Address 📧</label>
              <input
                type="email"
                className="cartoon-input"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Enter your email (e.g. ana@gmail.com)"
                required
              />
            </div>

            <div className="form-group">
              <label>Password 🔒</label>
              <input
                type="password"
                className="cartoon-input"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimum 4 characters..."
                required
              />
            </div>

            <div className="form-group">
              <label>Display Name ✨</label>
              <input
                type="text"
                className="cartoon-input"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
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
                    className={`char-card-btn ${regAvatar === char.id ? "selected" : ""}`}
                    style={{ "--char-color": char.color }}
                    onClick={() => {
                      soundFx.pop()
                      setRegAvatar(char.id)
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
                <label>Cartoon Voice Pitch 🐥: <strong>{regPitch}x</strong></label>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={regPitch}
                  onChange={(e) => setRegPitch(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Speech Speed ⚡: <strong>{regSpeed}x</strong></label>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.1"
                  value={regSpeed}
                  onChange={(e) => setRegSpeed(e.target.value)}
                />
              </div>
            </div>

            <div className="voice-preview-row">
              <button type="button" className="btn-test-voice" onClick={testCartoonVoice}>
                🔊 Test Cartoon Voice
              </button>
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn-primary-sparkle full-width" disabled={submitting}>
                {submitting ? "Creating..." : "Create Account & Start Chat 🚀"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
