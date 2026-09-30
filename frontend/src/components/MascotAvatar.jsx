import { useState } from "react"
import { soundFx } from "../utils/soundEngine"

export function MascotAvatar({ character = "owl", state = "idle", size = "medium", onTap }) {
  const [bounce, setBounce] = useState(false)

  const handleTap = () => {
    soundFx.giggle()
    setBounce(true)
    setTimeout(() => setBounce(false), 800)
    if (onTap) onTap()
  }

  const isListening = state === "listening"
  const isThinking = state === "thinking"
  const isSpeaking = state === "speaking"

  const containerClass = `mascot-container ${size} state-${state} ${bounce ? "tap-bounce" : ""}`

  const renderCharacterSVG = () => {
    switch (character) {
      case "dino":
        return (
          <svg viewBox="0 0 120 120" className="mascot-svg">
            <defs>
              <linearGradient id="dinoBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="dinoBelly" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
            </defs>
            {/* Spikes */}
            <path d="M 30 25 L 38 10 L 46 25" fill="#EF4444" />
            <path d="M 48 20 L 58 5 L 68 20" fill="#F59E0B" />
            <path d="M 70 25 L 80 12 L 88 28" fill="#10B981" />
            {/* Body */}
            <rect x="25" y="30" width="70" height="75" rx="35" fill="url(#dinoBody)" />
            {/* Belly */}
            <ellipse cx="60" cy="72" rx="22" ry="25" fill="url(#dinoBelly)" />
            {/* Cheeks */}
            <circle cx="40" cy="55" r="7" fill="#F472B6" opacity="0.6" />
            <circle cx="80" cy="55" r="7" fill="#F472B6" opacity="0.6" />
            {/* Eyes */}
            <g className="mascot-eyes">
              <circle cx="46" cy="45" r="7" fill="#FFFFFF" />
              <circle cx="74" cy="45" r="7" fill="#FFFFFF" />
              <circle cx={isListening ? "47" : "46"} cy="45" r="3.5" fill="#1E293B" />
              <circle cx={isListening ? "75" : "74"} cy="45" r="3.5" fill="#1E293B" />
              <circle cx="48" cy="43" r="1.5" fill="#FFFFFF" />
              <circle cx="76" cy="43" r="1.5" fill="#FFFFFF" />
            </g>
            {/* Mouth */}
            {isSpeaking ? (
              <path d="M 48 62 Q 60 78 72 62 Z" fill="#DC2626" className="animated-mouth" />
            ) : isListening ? (
              <circle cx="60" cy="62" r="5" fill="#1E293B" />
            ) : (
              <path d="M 50 60 Q 60 70 70 60" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
            )}
            {/* Cute Dino Arms */}
            <path d="M 22 65 Q 12 68 22 75" fill="none" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
            <path d="M 98 65 Q 108 68 98 75" fill="none" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
          </svg>
        )

      case "bunny":
        return (
          <svg viewBox="0 0 120 120" className="mascot-svg">
            <defs>
              <linearGradient id="bunnyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#DB2777" />
              </linearGradient>
            </defs>
            {/* Ears */}
            <g className={isListening ? "wiggle-ears" : ""}>
              <ellipse cx="42" cy="20" rx="10" ry="24" fill="url(#bunnyGrad)" />
              <ellipse cx="42" cy="22" rx="5" ry="16" fill="#FBCFE8" />
              <ellipse cx="78" cy="20" rx="10" ry="24" fill="url(#bunnyGrad)" />
              <ellipse cx="78" cy="22" rx="5" ry="16" fill="#FBCFE8" />
            </g>
            {/* Head/Body */}
            <rect x="25" y="38" width="70" height="68" rx="34" fill="url(#bunnyGrad)" />
            {/* Cheeks */}
            <circle cx="38" cy="65" r="8" fill="#F472B6" opacity="0.8" />
            <circle cx="82" cy="65" r="8" fill="#F472B6" opacity="0.8" />
            {/* Eyes */}
            <g className="mascot-eyes">
              <ellipse cx="46" cy="55" rx="6" ry="7" fill="#1E293B" />
              <ellipse cx="74" cy="55" rx="6" ry="7" fill="#1E293B" />
              <circle cx="48" cy="53" r="2.5" fill="#FFFFFF" />
              <circle cx="76" cy="53" r="2.5" fill="#FFFFFF" />
            </g>
            {/* Nose */}
            <polygon points="60,63 56,60 64,60" fill="#F43F5E" />
            {/* Mouth */}
            {isSpeaking ? (
              <path d="M 52 66 Q 60 78 68 66 Z" fill="#991B1B" className="animated-mouth" />
            ) : (
              <path d="M 54 66 Q 60 72 66 66" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            )}
          </svg>
        )

      case "robot":
        return (
          <svg viewBox="0 0 120 120" className="mascot-svg">
            <defs>
              <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
            {/* Antenna */}
            <rect x="56" y="8" width="8" height="18" fill="#94A3B8" />
            <circle cx="60" cy="8" r="7" fill={isListening ? "#EF4444" : "#F59E0B"} className={isListening ? "pulse-light" : ""} />
            {/* Head Box */}
            <rect x="22" y="26" width="76" height="66" rx="18" fill="url(#botGrad)" stroke="#60A5FA" strokeWidth="3" />
            {/* Visor */}
            <rect x="30" y="38" width="60" height="30" rx="12" fill="#0F172A" />
            {/* Digital Eyes */}
            <g>
              <circle cx="46" cy="53" r="7" fill="#38BDF8" className={isSpeaking ? "glowing-eye" : ""} />
              <circle cx="74" cy="53" r="7" fill="#38BDF8" className={isSpeaking ? "glowing-eye" : ""} />
            </g>
            {/* Mouth Grill */}
            {isSpeaking ? (
              <rect x="48" y="74" width="24" height="8" rx="4" fill="#38BDF8" className="pulse-grill" />
            ) : (
              <path d="M 48 76 L 72 76" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
            )}
            {/* Side Bolts */}
            <circle cx="18" cy="59" r="5" fill="#64748B" />
            <circle cx="102" cy="59" r="5" fill="#64748B" />
          </svg>
        )

      case "fox":
        return (
          <svg viewBox="0 0 120 120" className="mascot-svg">
            <defs>
              <linearGradient id="foxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            {/* Ears */}
            <polygon points="25,48 10,12 45,35" fill="url(#foxGrad)" />
            <polygon points="23,43 14,18 38,34" fill="#1E293B" />
            <polygon points="95,48 110,12 75,35" fill="url(#foxGrad)" />
            <polygon points="97,43 106,18 82,34" fill="#1E293B" />
            {/* Head */}
            <ellipse cx="60" cy="62" rx="42" ry="34" fill="url(#foxGrad)" />
            {/* White Muzzle */}
            <path d="M 30 65 Q 60 98 90 65 Q 60 70 30 65 Z" fill="#FFF7ED" />
            {/* Eyes */}
            <g className="mascot-eyes">
              <circle cx="44" cy="54" r="6" fill="#1E293B" />
              <circle cx="76" cy="54" r="6" fill="#1E293B" />
              <circle cx="46" cy="52" r="2" fill="#FFFFFF" />
              <circle cx="78" cy="52" r="2" fill="#FFFFFF" />
            </g>
            {/* Cute Nose */}
            <circle cx="60" cy="68" r="4" fill="#1E293B" />
            {/* Mouth */}
            {isSpeaking ? (
              <path d="M 53 73 Q 60 82 67 73 Z" fill="#BE123C" className="animated-mouth" />
            ) : (
              <path d="M 54 73 Q 60 77 66 73" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </svg>
        )

      case "owl":
      default:
        return (
          <svg viewBox="0 0 120 120" className="mascot-svg">
            <defs>
              <linearGradient id="owlBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
              <linearGradient id="owlBelly" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#DDD6FE" />
                <stop offset="100%" stopColor="#C4B5FD" />
              </linearGradient>
            </defs>
            {/* Ear Tufts */}
            <polygon points="32,32 20,8 48,22" fill="#7C3AED" />
            <polygon points="88,32 100,8 72,22" fill="#7C3AED" />
            {/* Body */}
            <ellipse cx="60" cy="65" rx="42" ry="42" fill="url(#owlBody)" />
            {/* Belly */}
            <ellipse cx="60" cy="74" rx="25" ry="26" fill="url(#owlBelly)" />
            {/* Feather details */}
            <path d="M 50 68 Q 60 74 70 68" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
            <path d="M 48 78 Q 60 84 72 78" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
            {/* Big Owl Eye Rings */}
            <circle cx="42" cy="48" r="16" fill="#FDE047" />
            <circle cx="78" cy="48" r="16" fill="#FDE047" />
            {/* Pupils */}
            <g className="mascot-eyes">
              <circle cx="42" cy="48" r="8" fill="#1E293B" />
              <circle cx="78" cy="48" r="8" fill="#1E293B" />
              <circle cx="45" cy="45" r="3" fill="#FFFFFF" />
              <circle cx="81" cy="45" r="3" fill="#FFFFFF" />
            </g>
            {/* Beak */}
            <polygon points="60,52 54,63 66,63" fill="#F97316" />
            {/* Mouth gesture when speaking */}
            {isSpeaking && <ellipse cx="60" cy="65" rx="4" ry="3" fill="#BE123C" className="animated-mouth" />}
          </svg>
        )
    }
  }

  return (
    <div className={containerClass} onClick={handleTap} title="Click me to play!">
      {/* Decorative Aura / Waves */}
      {isListening && <div className="listening-wave-ring" />}
      {isThinking && <div className="thinking-sparkles">✨ 💭 ✨</div>}
      {isSpeaking && <div className="speaking-notes">🎵 🌟 🎶</div>}

      <div className="mascot-graphic">
        {renderCharacterSVG()}
      </div>

      <div className="tap-hint">Tap me! 💖</div>
    </div>
  )
}
