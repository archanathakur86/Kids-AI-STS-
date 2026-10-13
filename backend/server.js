const path = require("path")
const express = require("express")
const cors = require("cors")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { Groq } = require("groq-sdk")
require("dotenv").config()
const { connectDB, User, Session, Chat, Message, mongoose } = require("./db")

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

function verifyPassword(pwd, stored) {
  return bcrypt.compare(sha256(pwd), String(stored))
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
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Please log in." })
  }
  const token = authHeader.split(" ")[1]
  const session = await Session.findOne({ token }).lean()
  if (!session) {
    return res.status(401).json({ error: "Session expired or invalid token. Please log in again." })
  }
  const user = await User.findById(session.userId).select("-password")
  if (!user) {
    return res.status(401).json({ error: "User not found." })
  }
  req.user = user.toJSON()      // { id, email, name, avatar, pitch, speed }
  req.userId = user._id         // ObjectId (queries ke liye)
  req.token = token
  next()
}

const validId = (id) => mongoose.isValidObjectId(id)

// Public endpoints
app.get("/api/characters", (req, res) => {
  res.json(Object.values(CHARACTERS))
})

// Health check (Render ke liye)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 })
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

  if (await User.exists({ email: cleanEmail })) {
    return res.status(400).json({ error: "Email is already registered! Please log in instead." })
  }

  let user
  try {
    user = await User.create({
      email: cleanEmail,
      password: await hashPassword(password),
      name: cleanName,
      avatar: avatar || "owl",
      pitch: pitch || 1.5,
      speed: speed || 1.1
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email is already registered! Please log in instead." })
    }
    throw err
  }

  const token = generateToken(user._id)
  await Session.create({ token, userId: user._id })

  const { password: _pw, ...safeUser } = user.toJSON()
  res.json({ token, user: safeUser })
})

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." })
  }

  const cleanEmail = email.trim().toLowerCase()
  const row = await User.findOne({ email: cleanEmail })

  if (!row || !(await verifyPassword(password, row.password))) {
    return res.status(401).json({ error: "Incorrect email or password! Please check and try again." })
  }

  const token = generateToken(row._id)
  await Session.create({ token, userId: row._id })

  const { password: _pw, ...user } = row.toJSON()
  res.json({ token, user })
})

app.post("/api/auth/logout", authenticateUser, async (req, res) => {
  await Session.deleteOne({ token: req.token })
  res.json({ ok: true })
})

app.get("/api/auth/me", authenticateUser, (req, res) => {
  res.json({ user: req.user })
})

app.post("/api/profile", authenticateUser, async (req, res) => {
  const { name, avatar, pitch, speed } = req.body
  const update = {
    name: name && name.trim() ? name.trim() : req.user.name,
    avatar: avatar || req.user.avatar || "owl",
    pitch: pitch !== undefined ? pitch : req.user.pitch,
    speed: speed !== undefined ? speed : req.user.speed
  }
  const updated = await User.findByIdAndUpdate(req.userId, update, { new: true }).select("-password")
  res.json({ user: updated.toJSON() })
})

// Protected User Chat Endpoints
app.get("/api/chats", authenticateUser, async (req, res) => {
  const chats = await Chat.find({ userId: req.userId }).sort({ _id: -1 }).select("title character createdAt")
  res.json(chats.map((c) => c.toJSON()))
})

app.post("/api/chats", authenticateUser, async (req, res) => {
  const character = req.body.character || req.user.avatar || "owl"
  const last = await Chat.findOne({ userId: req.userId }).sort({ _id: -1 }).select("_id")
  let seed = null

  if (last) {
    const prev = (await Message.find({ chatId: last._id, userId: req.userId })
      .sort({ _id: -1 }).limit(15).select("role content").lean()).reverse()
    if (prev.length) seed = JSON.stringify(prev.map((m) => ({ role: m.role, content: m.content })))
  }

  const chat = await Chat.create({ userId: req.userId, title: "New Adventure", seed, character })
  res.json({ id: String(chat._id), title: "New Adventure", character })
})

app.get("/api/chats/:id/messages", authenticateUser, async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Chat not found or access denied." })
  const chat = await Chat.exists({ _id: req.params.id, userId: req.userId })
  if (!chat) return res.status(404).json({ error: "Chat not found or access denied." })

  const msgs = await Message.find({ chatId: req.params.id, userId: req.userId })
    .sort({ _id: 1 }).select("role content -_id").lean()
  res.json(msgs)
})

app.delete("/api/chats/:id", authenticateUser, async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Chat not found or access denied." })
  const chat = await Chat.exists({ _id: req.params.id, userId: req.userId })
  if (!chat) return res.status(404).json({ error: "Chat not found or access denied." })

  await Message.deleteMany({ chatId: req.params.id, userId: req.userId })
  await Chat.deleteOne({ _id: req.params.id, userId: req.userId })
  res.json({ ok: true })
})

app.post("/api/chat", authenticateUser, async (req, res) => {
  const { chatId, text, character: reqCharacter } = req.body
  if (!text || !chatId) return res.status(400).json({ error: "chatId and text required" })
  if (!validId(chatId)) return res.status(404).json({ error: "Chat not found or access denied." })

  try {
    const chat = await Chat.findOne({ _id: chatId, userId: req.userId })
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied." })

    const activeChar = reqCharacter || chat.character || req.user.avatar || "owl"

    await Message.create({ chatId, userId: req.userId, role: "user", content: text })

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

    const history = await Message.find({ chatId, userId: req.userId }).sort({ _id: 1 }).select("role content").lean()
    history.forEach(m => messages.push({ role: m.role, content: m.content }))

    const rawResponse = await generateCompletion(messages)
    const stripped = rawResponse
      .replace(/(?<!\*)\*(?!\*)[^*\n]+\*(?!\*)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()

    const answer = trimWords(stripped || rawResponse, 35)

    await Message.create({ chatId, userId: req.userId, role: "assistant", content: answer })

    if (chat.title === "New Chat" || chat.title === "New Adventure") {
      let titleText = text.trim()
      if (/^(hi|hello|hey|hlo|namaste|kaise ho)\b/i.test(titleText)) {
        titleText = "Chat Adventure 🌟"
      } else {
        titleText = titleText.split(/\s+/).slice(0, 4).join(" ")
      }
      chat.title = titleText
      chat.character = activeChar
      await chat.save()
    } else if (reqCharacter && reqCharacter !== chat.character) {
      chat.character = reqCharacter
      await chat.save()
    }

    res.json({ response: answer, character: activeChar })
  } catch (err) {
    console.error("Chat endpoint error:", err)
    res.json({
      response: "Oopsie! Something glitched, please ask me again! 🌟",
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
// Unexpected errors par bhi server crash na ho
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ error: "Something went wrong on the server. Please try again." })
})

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`WhySo Cartoon AI backend running on port ${PORT}`)
    })
    const shutdown = () => server.close(() => mongoose.connection.close().then(() => process.exit(0)))
    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
  })
  .catch((err) => {
    console.error("Failed to start:", err.message)
    process.exit(1)
  })