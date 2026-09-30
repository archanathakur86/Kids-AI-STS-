import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { MascotAvatar } from "./components/MascotAvatar"
import { CharacterSelector } from "./components/CharacterSelector"
import { AuthModal } from "./components/AuthModal"
import { ProfileModal } from "./components/ProfileModal"
import { soundFx } from "./utils/soundEngine"
import "./App.css"

const API = "/api"

async function safeFetchJson(url, options = {}) {
  let res
  try {
    res = await fetch(url, options)
  } catch (err) {
    throw new Error("Could not connect to backend server. Please make sure backend (node server.js) is running on port 5000!")
  }

  const rawText = await res.text()
  let data = {}
  try {
    data = JSON.parse(rawText)
  } catch (e) {
    throw new Error("Backend server returned an invalid response. Please check backend server on port 5000.")
  }

  if (!res.ok) {
    throw new Error(data.error || `Server error (${res.status})`)
  }

  return data
}

const QUICK_STARTERS = [
  { icon: "🌈", text: "Why is the sky blue?" },
  { icon: "🤡", text: "Tell me a super funny joke!" },
  { icon: "🚀", text: "How high is outer space?" },
  { icon: "🦕", text: "What did big dinosaurs eat?" },
  { icon: "🌿", text: "Why are plants green?" },
  { icon: "🦉", text: "Why do owls sleep in the day?" }
]

function App() {
  const [token, setToken] = useState(localStorage.getItem("whyso_token") || null)
  const [user, setUser] = useState(null)
  const [characters, setCharacters] = useState([])
  const [activeCharacterId, setActiveCharacterId] = useState("owl")

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const [chats, setChats] = useState([])
  const [chatId, setChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const recRef = useRef(null)
  const timerRef = useRef(null)
  const finalRef = useRef("")
  const feedEndRef = useRef(null)

  useEffect(() => {
    fetchCharacters()
    if (token) {
      loadCurrentUser(token)
    } else {
      setShowAuthModal(true)
    }
  }, [])

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const fetchCharacters = async () => {
    try {
      const data = await safeFetchJson(`${API}/characters`)
      setCharacters(data)
    } catch (e) {
      console.error("Error fetching characters:", e)
    }
  }

  const loadCurrentUser = async (authToken) => {
    try {
      const data = await safeFetchJson(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setUser(data.user)
      setActiveCharacterId(data.user.avatar || "owl")
      setShowAuthModal(false)
      loadChats(authToken)
    } catch (e) {
      console.error("Error loading user me:", e)
      handleLogoutLocal()
    }
  }

  const handleLogoutLocal = () => {
    localStorage.removeItem("whyso_token")
    setToken(null)
    setUser(null)
    setChats([])
    setChatId(null)
    setMessages([])
    setShowAuthModal(true)
  }

  const handleRegisterSuccess = async (regData) => {
    const data = await safeFetchJson(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regData)
    })
    localStorage.setItem("whyso_token", data.token)
    setToken(data.token)
    setUser(data.user)
    setActiveCharacterId(data.user.avatar || "owl")
    setShowAuthModal(false)
    loadChats(data.token)
  }

  const handleLoginSuccess = async (loginData) => {
    const data = await safeFetchJson(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData)
    })
    localStorage.setItem("whyso_token", data.token)
    setToken(data.token)
    setUser(data.user)
    setActiveCharacterId(data.user.avatar || "owl")
    setShowAuthModal(false)
    loadChats(data.token)
  }

  const handleLogout = async () => {
    soundFx.boop(false)
    if (token) {
      try {
        await safeFetchJson(`${API}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (e) {}
    }
    handleLogoutLocal()
  }

  const handleSaveSettings = async (profileData) => {
    if (!token) return
    try {
      const data = await safeFetchJson(`${API}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      setUser(data.user)
      setActiveCharacterId(data.user.avatar || "owl")
      setShowSettingsModal(false)
    } catch (e) {
      console.error("Error saving settings:", e)
    }
  }

  const loadChats = async (authToken = token) => {
    if (!authToken) return
    try {
      const data = await safeFetchJson(`${API}/chats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setChats(data)
    } catch (e) {
      console.error("Error loading chats:", e)
    }
  }

  const newChat = async (charId = activeCharacterId) => {
    if (!token) return
    soundFx.pop()
    try {
      const data = await safeFetchJson(`${API}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ character: charId })
      })
      setChats(prev => [{ id: data.id, title: data.title, character: data.character }, ...prev])
      setChatId(data.id)
      setMessages([])
      setActiveCharacterId(data.character || charId)
      if (window.innerWidth < 768) setSidebarOpen(false)
      return data.id
    } catch (e) {
      console.error("Error creating new chat:", e)
    }
  }

  const openChat = async (cId) => {
    if (!token) return
    soundFx.pop()
    setChatId(cId)
    const targetChat = chats.find(c => c.id === cId)
    if (targetChat && targetChat.character) {
      setActiveCharacterId(targetChat.character)
    }
    try {
      const msgs = await safeFetchJson(`${API}/chats/${cId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(msgs)
    } catch (e) {
      console.error("Error opening chat:", e)
    }
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  const deleteChat = async (cId, e) => {
    e.stopPropagation()
    if (!token) return
    soundFx.boop(false)
    try {
      await safeFetchJson(`${API}/chats/${cId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      setChats(prev => prev.filter(c => c.id !== cId))
      if (chatId === cId) {
        setChatId(null)
        setMessages([])
      }
    } catch (err) {
      console.error("Error deleting chat:", err)
    }
  }

  const speakText = (msg) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const cleanMsg = msg
    .replace(/\*.*?\*/g, "")   
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu, "")   
    .replace(/\s{2,}/g, " ")   
    .trim()

  if (!cleanMsg) return        

    const utter = new SpeechSynthesisUtterance(cleanMsg)
    const voices = window.speechSynthesis.getVoices()
    
    const prefVoice = voices.find(v => /female|zira|samantha|google uk english female|google hindi|victoria|karen/i.test(v.name)) || voices[0]
    if (prefVoice) utter.voice = prefVoice

    utter.pitch = user?.pitch || 1.7
    utter.rate = user?.speed || 1.1

    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utter)
  }

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }

  const resetMicTimer = (rec) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      rec.stop()
    }, 2800)
  }

  const startMic = () => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Rec) {
      alert("Microphone voice recognition is not supported in this browser.")
      return
    }

    soundFx.boop(true)
    const rec = new Rec()
    rec.continuous = true
    rec.interimResults = true
    finalRef.current = ""

    rec.onresult = (e) => {
      let interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) finalRef.current += transcript + " "
        else interim += transcript
      }
      setText((finalRef.current + interim).trim())
      resetMicTimer(rec)
    }

    rec.onerror = (e) => {
      console.warn("Speech recognition error:", e.error)
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
      clearTimeout(timerRef.current)
      soundFx.boop(false)
    }

    recRef.current = rec
    rec.start()
    setListening(true)
    resetMicTimer(rec)
  }

  const stopMic = () => {
    soundFx.boop(false)
    recRef.current?.stop()
    clearTimeout(timerRef.current)
    setListening(false)
  }

  const toggleMic = () => (listening ? stopMic() : startMic())

  const handleSend = async (customMsg = null) => {
    const msg = (customMsg || text).trim()
    if (!msg || loading || !token) return

    soundFx.pop()
    setText("")
    let currentId = chatId
    if (!currentId) {
      currentId = await newChat(activeCharacterId)
    }

    setMessages(prev => [...prev, { role: "user", content: msg }])
    setLoading(true)

    try {
      const data = await safeFetchJson(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: currentId,
          text: msg,
          character: activeCharacterId
        })
      })

      if (/[😄😆😂🤭🥳🎉]/u.test(data.response)) soundFx.giggle()
        else soundFx.chime()
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
      if (autoSpeak) {
        speakText(data.response)
      }
      loadChats()
    } catch (err) {
      console.error("Send message error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCharacterSwitch = (newCharId) => {
    setActiveCharacterId(newCharId)
  }

  const activeCharacter = characters.find(c => c.id === activeCharacterId) || characters[0] || {
    name: "WhySo Owl",
    title: "WhySo Owl 🦉",
    catchphrase: "Hoo-hoo! Hi! What would you like to explore or learn today?",
    avatar: "🦉",
    color: "#8B5CF6"
  }

  const activeState = listening ? "listening" : loading ? "thinking" : speaking ? "speaking" : "idle"
  const activeLabel = listening ? "Listening..." : loading ? "Thinking..." : speaking ? "Talking..." : "Ready to Talk!"
  const currentChatTitle = chats.find(c => c.id === chatId)?.title || "New Adventure"

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className={`app-shell theme-${activeCharacterId}`}>
      {/* Background Floating Decorative Elements */}
      <div className="decor-sparkles">
        <span className="sparkle s1">✨</span>
        <span className="sparkle s2">🎈</span>
        <span className="sparkle s3">⭐</span>
        <span className="sparkle s4">🎨</span>
        <span className="sparkle s5">🌟</span>
      </div>

      {showAuthModal && (
        <AuthModal
          characters={characters}
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}

      {showSettingsModal && (
        <ProfileModal
          profile={user}
          characters={characters}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Navigation & History */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">{activeCharacter.avatar}</div>
          <div className="brand-text">
            <h2>WhySo AI 🦉</h2>
            <p>Kid Cartoon Companion</p>
          </div>
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <button className="btn-new-chat" onClick={() => newChat(activeCharacterId)}>
          <span className="btn-icon">🚀</span>
          <span>New Adventure</span>
        </button>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search adventures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chat-history-list">
          <div className="history-header">My Private Adventures</div>
          {filteredChats.length === 0 ? (
            <div className="no-chats">No adventures saved yet!</div>
          ) : (
            filteredChats.map((c) => {
              const charObj = characters.find(ch => ch.id === c.character)
              const isSelected = chatId === c.id
              return (
                <div
                  key={c.id}
                  className={`chat-history-card ${isSelected ? "active" : ""}`}
                  onClick={() => openChat(c.id)}
                >
                  <span className="history-char-icon">{charObj?.avatar || "🦉"}</span>
                  <span className="history-title">{c.title}</span>
                  <button
                    className="history-delete-btn"
                    title="Delete Chat"
                    onClick={(e) => deleteChat(c.id, e)}
                  >
                    🗑️
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* User Profile Card Footer with Logout */}
        <div className="sidebar-profile-card">
          <div className="user-avatar-badge">{user?.name ? user.name[0].toUpperCase() : "👶"}</div>
          <div className="user-details">
            <span className="user-display-name">{user?.name || "Explorer"}</span>
            <span className="user-avatar-type">{user?.email || "Private Dashboard"}</span>
          </div>
          <button className="settings-btn" title="Settings" onClick={() => setShowSettingsModal(true)}>
            ⚙️
          </button>
          <button className="logout-btn" title="Log Out" onClick={handleLogout}>
            🚪
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {/* Top Header Navigation */}
        <header className="main-header">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div className="adventure-info">
              <span className="current-title">{currentChatTitle}</span>
              <span className={`status-pill ${activeState}`}>
                <span className="pulse-dot" />
                {activeLabel}
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className={`voice-toggle-btn ${autoSpeak ? "active" : ""}`}
              onClick={() => {
                soundFx.pop()
                if (speaking) stopSpeaking()
                setAutoSpeak(!autoSpeak)
              }}
              title={autoSpeak ? "Auto-Voice Enabled" : "Auto-Voice Muted"}
            >
              {autoSpeak ? "🔊 Voice On" : "🔇 Mute Voice"}
            </button>
          </div>
        </header>

        {/* Character Buddy Selector Bar */}
        <div className="character-bar-container">
          <CharacterSelector
            characters={characters}
            activeId={activeCharacterId}
            onSelect={handleCharacterSwitch}
          />
        </div>

        {/* Interactive Animated Character Mascot Showcase */}
        <div className="mascot-hero-banner">
          <MascotAvatar
            character={activeCharacterId}
            state={activeState}
            size="medium"
            onTap={() => {
              speakText(activeCharacter.catchphrase)
            }}
          />
          <div className="mascot-speech-bubble">
            <span className="mascot-name">{activeCharacter.name}:</span>
            <p>"{activeCharacter.catchphrase}"</p>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="chat-feed-wrap">
          {messages.length === 0 ? (
            <div className="welcome-hero-state">
              <h1>Hello {user?.name ? user.name : "Explorer"}! 🎉</h1>
              <p>I am <strong>WhySo</strong>! Ask me any question in <strong>35 words or less</strong>, in whatever language you speak! 🗣️</p>
              
              <div className="starters-grid">
                <span className="starters-label">Tap a question to ask WhySo:</span>
                <div className="chips-wrapper">
                  {QUICK_STARTERS.map((item, idx) => (
                    <button
                      key={idx}
                      className="starter-chip"
                      onClick={() => handleSend(item.text)}
                    >
                      <span className="chip-icon">{item.icon}</span>
                      <span className="chip-text">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-feed">
              {messages.map((m, idx) => (
                <div key={idx} className={`chat-bubble-row ${m.role}`}>
                  {m.role === "assistant" && (
                    <div className="assistant-avatar-badge">{activeCharacter.avatar}</div>
                  )}
                  <div className={`chat-bubble ${m.role}`}>
                    <div className="bubble-content">
                      <ReactMarkdown>
                      {m.content.replace(/(?<!\*)\*(?!\*)[^*\n]+\*(?!\*)/g, "").replace(/\s{2,}/g, " ").trim()}
                    </ReactMarkdown>
                    </div>

                    {m.role === "assistant" && (
                      <div className="bubble-actions">
                        <button
                          className="read-aloud-btn"
                          title="Speak answer"
                          onClick={() => {
                            if (speaking) stopSpeaking()
                            else speakText(m.content)
                          }}
                        >
                          {speaking ? "⏹️ Stop" : "🔊 Listen"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-bubble-row assistant">
                  <div className="assistant-avatar-badge">{activeCharacter.avatar}</div>
                  <div className="chat-bubble assistant typing-bubble">
                    <span className="bounce-dot d1" />
                    <span className="bounce-dot d2" />
                    <span className="bounce-dot d3" />
                  </div>
                </div>
              )}

              <div ref={feedEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Controls Bar */}
        <div className="input-dock-wrap">
          {listening && (
            <div className="listening-banner">
              <span className="mic-wave-icon">🎙️</span>
              <span>Listening to your voice... Speak now!</span>
            </div>
          )}

          <div className="input-dock">
            <button
              className={`btn-mic-pulse ${listening ? "listening" : ""}`}
              onClick={toggleMic}
              title={listening ? "Stop Mic" : "Start Voice Input"}
            >
              {listening ? "⏹️" : "🎤"}
            </button>

            <input
              type="text"
              className="chat-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Ask WhySo anything (Hindi, English, etc)...`}
            />

            <button
              className="btn-send-sparkle"
              onClick={() => handleSend()}
              disabled={loading || !text.trim()}
            >
              Send 🚀
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App