const path = require("path")
const express = require("express")
const cors = require("cors")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { Groq } = require("groq-sdk")
require("dotenv").config()
const db = require("./db")

const app = express()
app.use(cors())
app.use(express.json())

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const CHARACTERS = {
  owl: {
    id: "owl",
    name: "WhySo Owl",
    title: "WhySo Owl 🦉",
    bio: "a bubbly cartoon owl named WhySo",
    catchphrase: "Hi! What would you like to explore or learn today?",
    color: "#8B5CF6",
    accent: "#DDD6FE",
    avatar: "🦉"
  },
  dino: {
    id: "dino",
    name: "WhySo Dino",
    title: "WhySo Dino REX 🦖",
    bio: "an energetic little cartoon T-Rex named WhySo",
    catchphrase: "Rawr-some! I'm WhySo Dino! Let's explore together!",
    color: "#10B981",
    accent: "#A7F3D0",
    avatar: "🦖"
  },
  bunny: {
    id: "bunny",
    name: "WhySo Bunny",
    title: "WhySo Bunny 🐰",
    bio: "a playful cartoon rabbit named WhySo",
    catchphrase: "Hop hop hooray! What fun topic shall we discover today?",
    color: "#EC4899",
    accent: "#FBCFE8",
    avatar: "🐰"
  },
  robot: {
    id: "robot",
    name: "WhySo Bot",
    title: "WhySo Bot 🤖",
    bio: "a cute cartoon robot named WhySo",
    catchphrase: "Beep boop! WhySo Bot is ready for your questions!",
    color: "#3B82F6",
    accent: "#BFDBFE",
    avatar: "🤖"
  },
  fox: {
    id: "fox",
    name: "WhySo Fox",
    title: "WhySo Fox 🦊",
    bio: "a clever cartoon fox named WhySo",
    catchphrase: "Yippee! Nature's mysteries are waiting for us!",
    color: "#F97316",
    accent: "#FFEDD5",
    avatar: "🦊"
  }
}

const GROQ_MODELS = (process.env.GROQ_MODELS || "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean)

if (GROQ_MODELS.length === 0) {
  GROQ_MODELS.push(
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "allam-2-7b"
  )
}

// Passwords are stored as bcrypt( SHA-256(password + pepper) ).
// SHA-256 pre-hash keeps input fixed-length (bcrypt only reads 72 bytes),
// bcrypt adds a per-user salt + adaptive cost against brute-force.
const PEPPER = process.env.PASSWORD_PEPPER || "whyso_salt_2026"
const BCRYPT_ROUNDS = 10

function sha256(pwd) {
  return crypto.createHash("sha256").update(pwd + PEPPER).digest("hex")
}

function hashPassword(pwd) {
  return bcrypt.hash(sha256(pwd), BCRYPT_ROUNDS)
}

const isBcryptHash = (h) => typeof h === "string" && h.startsWith("$2")

// Supports old accounts (plain SHA-256 hex) so nobody gets locked out.
async function verifyPassword(pwd, stored) {
  if (isBcryptHash(stored)) return bcrypt.compare(sha256(pwd), stored)
  const a = Buffer.from(sha256(pwd))
  const b = Buffer.from(String(stored))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function generateToken(userId) {
  return `token_${userId}_${crypto.randomBytes(16).toString("hex")}`
}

function trimWords(text, max) {
  if (!text) return ""
  const words = text.trim().split(/\s+/)
  if (words.length <= max) return text.trim()
  const cut = words.slice(0, max).join(" ")
  const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"))
  return end > cut.length * 0.5 ? cut.slice(0, end + 1) : cut + "..."
}

function systemPrompt(name, characterKey = "owl") {
  const char = CHARACTERS[characterKey] || CHARACTERS.owl
  const userName = name && name.trim() ? name.trim() : "friend"

  return `You are ${char.name}, a super playful, funny cartoon character talking to a kid named "${userName}".

CRITICAL RULES:
1. ALWAYS REMEMBER USER'S NAME: The user's name is "${userName}". Address them naturally as "${userName}". NEVER forget their name!
2. NO ROBOTIC INTROS: NEVER say "I am WhySo, your friendly helper..." or "I can answer questions, tell stories...". That sounds super robotic and boring!
3. SIMPLE GREETINGS & SHORT CHAT:
   - If the user just greets you ("hi", "hello", "hey", "hi paiso", "kaise ho", "what are you doing"):
     Keep response VERY SHORT (strictly 5 to 12 words!).
     Match the exact language of the user! If they greet in Hindi/Hinglish ("kaise ho"), reply in short cute Hinglish: "Hey ${userName}! 🌟 Main badhiya hoon! Aaj kya seekhna hai?" If in English ("hello"), reply: "Hey ${userName}! 🌟 What would you like to explore today?"
4. WORD LIMIT: MAXIMUM 35 words for complex questions. NEVER inflate or stretch simple greetings with unnecessary filler text.
5. MATCH USER LANGUAGE IN RESPONSE: Automatically respond in whichever language the user's message is written in (Hindi, Hinglish, English, Spanish, etc.)!
6. CARTOON TONE: Be cute and playful! Use 1 to 3 fun emojis that match the topic (for example 🌈 for rainbow, 🦕 for dinosaurs, 🚀 for space, 🌿 for plants) plus happy ones like 🌟 😄 🎉. NEVER write actions or sounds in asterisks like *giggles*, *hoots* or *scratches head*. Show emotion with emojis only!`
}

async function generateCompletion(messages) {
  let lastErr = null
  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 120
      })
      const content = completion?.choices?.[0]?.message?.content
      if (content) return content
    } catch (err) {
      console.warn(`Groq model ${model} failed:`, err.message)
      lastErr = err
    }
  }

  console.error("All AI models failed. Returning fallback response.", lastErr?.message || lastErr)
  return "Oopsie! AI server busy hai 🌟 Thoda sa wait karke phir se pucho, friend!"
}

// Auth Middleware
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Please log in." })
  }
  const token = authHeader.split(" ")[1]
  const session = db.prepare("SELECT user_id FROM user_sessions WHERE token = ?").get(token)
  if (!session) {
    return res.status(401).json({ error: "Session expired or invalid token. Please log in again." })
  }
  const user = db.prepare("SELECT id, email, name, avatar, pitch, speed FROM users WHERE id = ?").get(session.user_id)
  if (!user) {
    return res.status(401).json({ error: "User not found." })
  }
  req.user = user
  req.token = token
  next()
}

// Public endpoints
app.get("/api/characters", (req, res) => {
  res.json(Object.values(CHARACTERS))
})

// Auth Endpoints
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, avatar, pitch, speed } = req.body
  if (!email || !email.trim() || !email.includes("@")) {
    return res.status(400).json({ error: "Please enter a valid email address." })
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters long." })
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Please enter your name." })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail)
  if (existing) {
    return res.status(400).json({ error: "Email is already registered! Please log in instead." })
  }

  const hashedPwd = await hashPassword(password)
  const info = db.prepare(`
    INSERT INTO users (email, password, name, avatar, pitch, speed)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cleanEmail, hashedPwd, cleanName, avatar || "owl", pitch || 1.5, speed || 1.1)

  const userId = info.lastInsertRowid
  const token = generateToken(userId)

  db.prepare("INSERT INTO user_sessions (token, user_id) VALUES (?, ?)").run(token, userId)

  res.json({
    token,
    user: {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      avatar: avatar || "owl",
      pitch: pitch || 1.5,
      speed: speed || 1.1
    }
  })
})

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." })
  }

  const cleanEmail = email.trim().toLowerCase()
  const row = db.prepare("SELECT id, email, name, avatar, pitch, speed, password FROM users WHERE email = ?").get(cleanEmail)

  if (!row || !(await verifyPassword(password, row.password))) {
    return res.status(401).json({ error: "Incorrect email or password! Please check and try again." })
  }

  // Silently upgrade legacy SHA-256 accounts to bcrypt on successful login
  if (!isBcryptHash(row.password)) {
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(await hashPassword(password), row.id)
  }

  const { password: _pw, ...user } = row
  const token = generateToken(user.id)
  db.prepare("INSERT INTO user_sessions (token, user_id) VALUES (?, ?)").run(token, user.id)

  res.json({ token, user })
})

app.post("/api/auth/logout", authenticateUser, (req, res) => {
  db.prepare("DELETE FROM user_sessions WHERE token = ?").run(req.token)
  res.json({ ok: true })
})

app.get("/api/auth/me", authenticateUser, (req, res) => {
  res.json({ user: req.user })
})

app.post("/api/profile", authenticateUser, (req, res) => {
  const { name, avatar, pitch, speed } = req.body
  const cleanName = name && name.trim() ? name.trim() : req.user.name
  const cleanAvatar = avatar || req.user.avatar || "owl"
  const cleanPitch = pitch !== undefined ? pitch : req.user.pitch
  const cleanSpeed = speed !== undefined ? speed : req.user.speed

  db.prepare(`
    UPDATE users SET name = ?, avatar = ?, pitch = ?, speed = ? WHERE id = ?
  `).run(cleanName, cleanAvatar, cleanPitch, cleanSpeed, req.user.id)

  const updatedUser = db.prepare("SELECT id, email, name, avatar, pitch, speed FROM users WHERE id = ?").get(req.user.id)
  res.json({ user: updatedUser })
})

// Protected User Chat Endpoints
app.get("/api/chats", authenticateUser, (req, res) => {
  const chats = db.prepare("SELECT id, title, character, created_at FROM chats WHERE user_id = ? ORDER BY id DESC").all(req.user.id)
  res.json(chats)
})

app.post("/api/chats", authenticateUser, (req, res) => {
  const character = req.body.character || req.user.avatar || "owl"
  const last = db.prepare("SELECT id FROM chats WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(req.user.id)
  let seed = null

  if (last) {
    const prev = db.prepare("SELECT role, content FROM messages WHERE chat_id = ? AND user_id = ? ORDER BY id DESC LIMIT 15").all(last.id, req.user.id).reverse()
    if (prev.length) seed = JSON.stringify(prev)
  }

  const info = db.prepare("INSERT INTO chats (user_id, title, seed, character) VALUES (?, ?, ?, ?)").run(req.user.id, "New Adventure", seed, character)
  res.json({ id: info.lastInsertRowid, title: "New Adventure", character })
})

app.get("/api/chats/:id/messages", authenticateUser, (req, res) => {
  const chat = db.prepare("SELECT id FROM chats WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id)
  if (!chat) return res.status(404).json({ error: "Chat not found or access denied." })

  const msgs = db.prepare("SELECT role, content FROM messages WHERE chat_id = ? AND user_id = ? ORDER BY id ASC").all(req.params.id, req.user.id)
  res.json(msgs)
})

app.delete("/api/chats/:id", authenticateUser, (req, res) => {
  const chat = db.prepare("SELECT id FROM chats WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id)
  if (!chat) return res.status(404).json({ error: "Chat not found or access denied." })

  db.prepare("DELETE FROM messages WHERE chat_id = ? AND user_id = ?").run(req.params.id, req.user.id)
  db.prepare("DELETE FROM chats WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id)
  res.json({ ok: true })
})

app.post("/api/chat", authenticateUser, async (req, res) => {
  const { chatId, text, character: reqCharacter } = req.body
  if (!text || !chatId) return res.status(400).json({ error: "chatId and text required" })

  try {
    const chat = db.prepare("SELECT * FROM chats WHERE id = ? AND user_id = ?").get(chatId, req.user.id)
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied." })

    const activeChar = reqCharacter || chat.character || req.user.avatar || "owl"

    db.prepare("INSERT INTO messages (chat_id, user_id, role, content) VALUES (?, ?, 'user', ?)").run(chatId, req.user.id, text)

    const messages = [{ role: "system", content: systemPrompt(req.user.name, activeChar) }]

    if (chat.seed) {
      try {
        const seedMsgs = JSON.parse(chat.seed)
        messages.push({ role: "system", content: "Previous session context for memory carry-over:" })
        seedMsgs.forEach(m => messages.push({ role: m.role, content: m.content }))
        messages.push({ role: "system", content: "End of previous memory context. Current chat begins now:" })
      } catch (e) {
        console.error("Error parsing seed:", e)
      }
    }

    const history = db.prepare("SELECT role, content FROM messages WHERE chat_id = ? AND user_id = ? ORDER BY id ASC").all(chatId, req.user.id)
    history.forEach(m => messages.push({ role: m.role, content: m.content }))

    const rawResponse = await generateCompletion(messages)
    const stripped = rawResponse
    .replace(/(?<!\*)\*(?!\*)[^*\n]+\*(?!\*)/g, "")   
    .replace(/\s{2,}/g, " ")
    .trim()

  const answer = trimWords(stripped || rawResponse, 35)

    db.prepare("INSERT INTO messages (chat_id, user_id, role, content) VALUES (?, ?, 'assistant', ?)").run(chatId, req.user.id, answer)

    if (chat.title === "New Chat" || chat.title === "New Adventure") {
      let titleText = text.trim()
      if (/^(hi|hello|hey|hlo|namaste|kaise ho)\b/i.test(titleText)) {
        titleText = "Chat Adventure 🌟"
      } else {
        titleText = titleText.split(/\s+/).slice(0, 4).join(" ")
      }
      db.prepare("UPDATE chats SET title = ?, character = ? WHERE id = ?").run(titleText, activeChar, chatId)
    } else if (reqCharacter && reqCharacter !== chat.character) {
      db.prepare("UPDATE chats SET character = ? WHERE id = ?").run(reqCharacter, chatId)
    }

    res.json({ response: answer, character: activeChar })
  } catch (err) {
    console.error("Chat endpoint error:", err)
    res.json({
      response: "Oopsie! *giggles* Something glitched, please ask me again! 🌟",
      character: req.body?.character || req.user?.avatar || "owl",
      fallback: true
    })
  }
})
// ---- Production: built frontend serve karo ----
const distPath = path.join(__dirname, "../frontend/dist")
app.use(express.static(distPath))
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(distPath, "index.html"))
  }
  next()
})
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`WhySo Cartoon AI backend running on port ${PORT}`)
})

server.ref?.()

const keepAliveTimer = setInterval(() => {}, 60 * 60 * 1000)

process.on("SIGINT", () => {
  clearInterval(keepAliveTimer)
  server.close(() => process.exit(0))
})

process.on("SIGTERM", () => {
  clearInterval(keepAliveTimer)
  server.close(() => process.exit(0))
})