import { soundFx } from "../utils/soundEngine"

export function CharacterSelector({ characters = [], activeId = "owl", onSelect }) {
  const handleSelect = (charId) => {
    soundFx.pop()
    onSelect(charId)
  }

  return (
    <div className="character-selector-bar">
      <span className="selector-label">Choose your Cartoon Buddy:</span>
      <div className="character-pills">
        {characters.map((char) => {
          const isActive = char.id === activeId
          return (
            <button
              key={char.id}
              type="button"
              className={`char-pill ${isActive ? "active" : ""}`}
              style={{
                "--char-color": char.color,
                "--char-accent": char.accent
              }}
              onClick={() => handleSelect(char.id)}
            >
              <span className="char-pill-avatar">{char.avatar}</span>
              <span className="char-pill-name">{char.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
