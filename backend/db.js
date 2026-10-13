const mongoose = require("mongoose")

const toJSON = {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id)
    ret.created_at = ret.createdAt
    delete ret._id
    delete ret.createdAt
    delete ret.updatedAt
    return ret
  }
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: "owl" },
    pitch: { type: Number, default: 1.5 },
    speed: { type: Number, default: 1.1 }
  },
  { timestamps: true, toJSON }
)

// Login sessions: 30 din baad MongoDB khud delete kar dega (TTL index)
const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }
})

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Adventure" },
    seed: { type: String, default: null },
    character: { type: String, default: "owl" }
  },
  { timestamps: true, toJSON }
)

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true }
  },
  { timestamps: true, toJSON }
)

const User = mongoose.model("User", userSchema)
const Session = mongoose.model("Session", sessionSchema)
const Chat = mongoose.model("Chat", chatSchema)
const Message = mongoose.model("Message", messageSchema)

async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to backend/.env (local) or Render Environment variables.")
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  await Promise.all([User.init(), Session.init()]) // indexes ready before serving
  console.log("MongoDB connected")
}

module.exports = { connectDB, User, Session, Chat, Message, mongoose }