import { useState, type ReactElement } from 'react'

// ═══════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}
function IconBrain({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M9.5 2a2.5 2.5 0 0 1 2.45 2H14a3 3 0 0 1 3 3v.5a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2v1a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-1a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2V7a3 3 0 0 1 3-3h.05A2.5 2.5 0 0 1 9.5 2z" />
    </svg>
  )
}
function IconChart({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}
function IconUser({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2c0 0-6 5.686-6 10a6 6 0 0 0 12 0C18 7.686 12 2 12 2zm0 14a2 2 0 0 1-2-2c0-2 2-4.5 2-4.5s2 2.5 2 4.5a2 2 0 0 1-2 2z" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  )
}
function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
function IconBack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
function IconMemory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function IconWords() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M4 7h16M4 12h10M4 17h7" />
    </svg>
  )
}
function IconNumbers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-8 h-8">
      <path d="M9 3H5l-1 6h2m3-6h5m-5 6H7m7-6h1l1 6h-2m-1-3h2M4 21h16M8 21V15l-2 2m6-2v6m4-6v6" />
    </svg>
  )
}
function IconAttention() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" />
    </svg>
  )
}
function IconSpeed() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// TYPES & DATA
// ═══════════════════════════════════════════════════════════════

type Screen = 'home' | 'activities' | 'game' | 'progress' | 'profile'

interface Session {
  id: number
  date: string
  activity: string
  exercise: string
  duration: number
  correct: number
  incorrect: number
  difficulty: 'Suave' | 'Normal' | 'Desafío'
  avgTime: number
}

const CATEGORIES = [
  {
    id: 'memoria', label: 'Memoria', color: '#C96A2E', bg: '#FDE8D8',
    icon: <IconMemory />,
    description: 'Ejercita tu capacidad de recordar imágenes, palabras y secuencias.',
    activities: [
      { name: 'Parejas de imágenes', time: '10 min', gameScreen: true },
      { name: 'Secuencia de colores', time: '8 min', gameScreen: false },
      { name: 'Lista de palabras', time: '12 min', gameScreen: false },
      { name: 'Recuerda el orden', time: '9 min', gameScreen: false },
    ],
  },
  {
    id: 'lenguaje', label: 'Lenguaje', color: '#6A9B7E', bg: '#D8EDE3',
    icon: <IconWords />,
    description: 'Mejora tu fluencia verbal, vocabulario y comprensión lectora.',
    activities: [
      { name: 'Crucigrama simple', time: '15 min', gameScreen: false },
      { name: 'Encuentra la palabra', time: '10 min', gameScreen: false },
      { name: 'Completar la frase', time: '8 min', gameScreen: false },
      { name: 'Sinónimos y antónimos', time: '12 min', gameScreen: false },
    ],
  },
  {
    id: 'calculo', label: 'Cálculo', color: '#8B7EC8', bg: '#E4E0F5',
    icon: <IconNumbers />,
    description: 'Practica operaciones matemáticas sencillas y series numéricas.',
    activities: [
      { name: 'Suma mental', time: '8 min', gameScreen: false },
      { name: 'Secuencias numéricas', time: '10 min', gameScreen: false },
      { name: 'Ordenar números', time: '7 min', gameScreen: false },
      { name: 'Resta y diferencia', time: '9 min', gameScreen: false },
    ],
  },
  {
    id: 'atencion', label: 'Atención y reconocimiento', color: '#B86A5A', bg: '#F5E0DB',
    icon: <IconAttention />,
    description: 'Entrena la concentración, la observación y el reconocimiento visual.',
    activities: [
      { name: 'Encuentra las diferencias', time: '12 min', gameScreen: false },
      { name: 'Seguir el objeto', time: '6 min', gameScreen: false },
      { name: 'Reconoce el patrón', time: '10 min', gameScreen: false },
      { name: 'Figura oculta', time: '8 min', gameScreen: false },
    ],
  },
  {
    id: 'velocidad', label: 'Velocidad', color: '#3E8FA8', bg: '#D0EBF4',
    icon: <IconSpeed />,
    description: 'Mejora la rapidez de respuesta y el procesamiento de la información.',
    activities: [
      { name: 'Reacción visual', time: '6 min', gameScreen: false },
      { name: 'Toca el color correcto', time: '7 min', gameScreen: false },
      { name: 'Respuesta rápida', time: '5 min', gameScreen: false },
      { name: 'Clasificar rápido', time: '8 min', gameScreen: false },
    ],
  },
]

const INITIAL_SESSIONS: Session[] = [
  { id: 1, date: '26 sep 2026', activity: 'Memoria', exercise: 'Parejas de imágenes', duration: 10, correct: 14, incorrect: 2, difficulty: 'Normal', avgTime: 3.2 },
  { id: 2, date: '26 sep 2026', activity: 'Lenguaje', exercise: 'Crucigrama simple', duration: 15, correct: 18, incorrect: 3, difficulty: 'Normal', avgTime: 5.1 },
  { id: 3, date: '25 sep 2026', activity: 'Cálculo', exercise: 'Suma mental', duration: 8, correct: 12, incorrect: 4, difficulty: 'Suave', avgTime: 4.5 },
  { id: 4, date: '25 sep 2026', activity: 'Atención y reconocimiento', exercise: 'Encuentra las diferencias', duration: 12, correct: 9, incorrect: 1, difficulty: 'Normal', avgTime: 8.3 },
  { id: 5, date: '24 sep 2026', activity: 'Velocidad', exercise: 'Reacción visual', duration: 6, correct: 20, incorrect: 5, difficulty: 'Desafío', avgTime: 1.8 },
  { id: 6, date: '24 sep 2026', activity: 'Memoria', exercise: 'Secuencia de colores', duration: 8, correct: 10, incorrect: 3, difficulty: 'Suave', avgTime: 4.1 },
  { id: 7, date: '23 sep 2026', activity: 'Lenguaje', exercise: 'Encuentra la palabra', duration: 14, correct: 15, incorrect: 2, difficulty: 'Normal', avgTime: 6.2 },
  { id: 8, date: '22 sep 2026', activity: 'Cálculo', exercise: 'Ordenar números', duration: 9, correct: 8, incorrect: 5, difficulty: 'Desafío', avgTime: 7.4 },
  { id: 9, date: '21 sep 2026', activity: 'Velocidad', exercise: 'Toca el color correcto', duration: 7, correct: 22, incorrect: 3, difficulty: 'Normal', avgTime: 2.1 },
  { id: 10, date: '20 sep 2026', activity: 'Atención y reconocimiento', exercise: 'Seguir el objeto', duration: 10, correct: 11, incorrect: 2, difficulty: 'Suave', avgTime: 5.7 },
]

// ═══════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════

function BarChart({ data, height = 160 }: {
  data: Array<{ label: string; value: number; highlight?: boolean; sublabel?: string }>
  height?: number
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = 44
  const gap = 18
  const padL = 10
  const totalW = data.length * (barW + gap) - gap + padL * 2
  const padBottom = 40

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${height + padBottom}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = padL + i * (barW + gap)
        const barH = (d.value / max) * height
        const y = height - barH
        const col = d.highlight ? 'var(--primary)' : 'var(--muted)'
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH || 4} rx={8} fill={col} opacity={barH ? 1 : 0.3} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 7} textAnchor="middle" fontSize="13" fontWeight="700"
                fill={d.highlight ? 'var(--primary)' : 'var(--muted-foreground)'}>
                {d.value}
              </text>
            )}
            <text x={x + barW / 2} y={height + 20} textAnchor="middle" fontSize="13" fill="var(--muted-foreground)">
              {d.label}
            </text>
            {d.sublabel && (
              <text x={x + barW / 2} y={height + 36} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" opacity="0.7">
                {d.sublabel}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data, color = 'var(--primary)', height = 140 }: {
  data: Array<{ label: string; value: number }>
  color?: string
  height?: number
}) {
  const W = 500
  const padTop = 24
  const padBottom = 36
  const padX = 20
  const chartH = height - padTop
  const max = Math.max(...data.map(d => d.value), 100)
  const min = Math.max(0, Math.min(...data.map(d => d.value)) - 10)

  const pts = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * (W - padX * 2),
    y: padTop + chartH - ((d.value - min) / (max - min || 1)) * chartH,
    ...d,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M${pts[0].x},${height} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${height} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + padBottom}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = padTop + chartH - ((v - min) / (max - min || 1)) * chartH
        if (y < padTop || y > height) return null
        return (
          <line key={v} x1={padX} x2={W - padX} y1={y} y2={y}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
        )
      })}
      <path d={area} fill="url(#lineGrad)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" />
          <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>
            {p.value}%
          </text>
          <text x={p.x} y={height + 20} textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// MEMORY GAME
// ═══════════════════════════════════════════════════════════════

const EMOJIS = ['🌸', '🦋', '🌿', '☀️', '🐦', '🍊', '🎵', '⭐']
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function MemoryGame({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState(() =>
    shuffle([...EMOJIS, ...EMOJIS]).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
  )
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [disabled, setDisabled] = useState(false)

  const matched = board.filter(c => c.matched).length / 2
  const total = EMOJIS.length

  function flip(id: number) {
    if (disabled) return
    const card = board.find(c => c.id === id)
    if (!card || card.flipped || card.matched) return
    const newBoard = board.map(c => c.id === id ? { ...c, flipped: true } : c)
    const newSelected = [...selected, id]
    setBoard(newBoard)
    setSelected(newSelected)
    if (newSelected.length === 2) {
      setMoves(m => m + 1)
      setDisabled(true)
      const [a, b] = newSelected.map(sid => newBoard.find(c => c.id === sid)!)
      setTimeout(() => {
        if (a.emoji === b.emoji) {
          setBoard(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, matched: true } : c))
        } else {
          setBoard(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, flipped: false } : c))
        }
        setSelected([])
        setDisabled(false)
      }, 900)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="px-10 pt-8 pb-6" style={{ background: 'var(--primary)' }}>
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack}
            className="flex items-center gap-2 mb-4 font-semibold text-base transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,251,245,0.9)' }}>
            <IconBack /> Volver a ejercicios
          </button>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>
                Memoria con Parejas
              </h1>
              <p className="text-base mt-1" style={{ color: 'rgba(255,251,245,0.8)' }}>
                Encuentra las 8 parejas de imágenes iguales
              </p>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'var(--primary-foreground)', fontFamily: 'Fraunces, serif' }}>{moves}</p>
                <p className="text-sm" style={{ color: 'rgba(255,251,245,0.8)' }}>Jugadas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'var(--primary-foreground)', fontFamily: 'Fraunces, serif' }}>{matched}/{total}</p>
                <p className="text-sm" style={{ color: 'rgba(255,251,245,0.8)' }}>Parejas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-10 py-10">
        {matched === total ? (
          <div className="flex flex-col items-center gap-6">
            <div className="text-8xl">🎉</div>
            <h2 className="text-4xl font-bold text-center" style={{ fontFamily: 'Fraunces, serif' }}>
              ¡Excelente, Rosa!
            </h2>
            <p className="text-xl text-center" style={{ color: 'var(--muted-foreground)' }}>
              Completaste el juego en <strong style={{ color: 'var(--foreground)' }}>{moves} jugadas</strong>
            </p>
            <div className="flex gap-2" style={{ color: 'var(--accent)' }}>
              {[1, 2, 3].map(s => <IconStar key={s} />)}
            </div>
            <button onClick={onBack}
              className="mt-2 px-12 py-5 rounded-2xl text-xl font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              Terminar
            </button>
          </div>
        ) : (
          <div className="max-w-2xl w-full">
            <div className="grid grid-cols-4 gap-4">
              {board.map(card => (
                <button key={card.id} onClick={() => flip(card.id)}
                  className="aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 select-none"
                  style={{
                    background: card.flipped || card.matched ? 'var(--card)' : 'var(--primary)',
                    boxShadow: card.matched ? `0 0 0 3px var(--secondary)` : card.flipped ? `0 4px 16px rgba(0,0,0,0.1)` : `0 4px 0 rgba(0,0,0,0.2)`,
                    opacity: card.matched ? 0.55 : 1,
                    fontSize: '2.5rem',
                  }}>
                  {(card.flipped || card.matched) ? card.emoji : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const todayActivities = [
    { done: true, label: 'Memoria: Parejas de imágenes', time: '10 min', cat: 'Memoria' },
    { done: true, label: 'Lenguaje: Crucigrama simple', time: '15 min', cat: 'Lenguaje' },
    { done: false, label: 'Cálculo: Suma mental', time: '8 min', cat: 'Cálculo' },
    { done: false, label: 'Atención: Encuentra diferencias', time: '12 min', cat: 'Atención' },
  ]
  const completed = todayActivities.filter(a => a.done).length
  const pct = Math.round((completed / todayActivities.length) * 100)
  const catColors: Record<string, string> = { Memoria: '#C96A2E', Lenguaje: '#6A9B7E', Cálculo: '#8B7EC8', Atención: '#B86A5A' }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {/* Welcome banner */}
      <div className="rounded-3xl px-10 py-8 mb-8 flex items-center justify-between"
        style={{ background: 'var(--primary)' }}>
        <div>
          <p className="text-base font-semibold mb-1" style={{ color: 'rgba(255,251,245,0.8)' }}>
            Sábado, 26 de septiembre de 2026
          </p>
          <h1 className="text-5xl font-bold leading-tight" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>
            Buenos días, Rosa 👋
          </h1>
          <p className="text-lg mt-2" style={{ color: 'rgba(255,251,245,0.85)' }}>
            Llevas 12 días activa. ¡Sigue así!
          </p>
        </div>
        <div className="flex items-center gap-4 px-8 py-5 rounded-2xl"
          style={{ background: 'rgba(255,251,245,0.18)' }}>
          <span style={{ color: '#FFD166', fontSize: '2.5rem' }}>🔥</span>
          <div>
            <p className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>12</p>
            <p className="text-base" style={{ color: 'rgba(255,251,245,0.8)' }}>días seguidos</p>
          </div>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Today's progress */}
        <div className="col-span-2 space-y-5">
          {/* Progress card */}
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Progreso de hoy</h2>
              <span className="text-3xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Fraunces, serif' }}>{pct}%</span>
            </div>
            <div className="h-5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--muted)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            </div>
            <p className="text-base mb-5" style={{ color: 'var(--muted-foreground)' }}>
              {completed} de {todayActivities.length} ejercicios completados
            </p>
            <div className="space-y-3">
              {todayActivities.map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl transition-colors"
                  style={{ background: a.done ? 'var(--muted)' : 'transparent', opacity: a.done ? 0.75 : 1 }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: a.done ? 'var(--secondary)' : 'white', color: a.done ? 'white' : 'var(--muted-foreground)', border: a.done ? 'none' : '2px solid var(--border)' }}>
                    {a.done ? <IconCheck /> : <span className="text-sm font-bold">{i + 1}</span>}
                  </div>
                  <span className="text-base font-medium flex-1" style={{ textDecoration: a.done ? 'line-through' : 'none', color: a.done ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                    {a.label}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full font-semibold"
                    style={{ background: catColors[a.cat] + '22', color: catColors[a.cat] }}>
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick start */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Continuar con</h2>
            <button onClick={() => onNavigate('game')}
              className="w-full flex items-center gap-5 p-6 rounded-3xl text-left transition-all hover:scale-[1.01] active:scale-98"
              style={{ background: 'linear-gradient(135deg, var(--secondary), #4d8a68)', color: 'white' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                <IconMemory />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">Cálculo: Suma mental</p>
                <p className="text-base" style={{ color: 'rgba(255,255,255,0.85)' }}>Siguiente ejercicio del día · 8 min</p>
              </div>
              <IconArrow />
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Esta semana</h2>
            <div className="space-y-4">
              {[
                { emoji: '🧩', label: 'Sesiones', value: '17' },
                { emoji: '✅', label: 'Ejercicios', value: '58' },
                { emoji: '⏱️', label: 'Tiempo total', value: '4h 20m' },
                { emoji: '🎯', label: 'Precisión media', value: '83%' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-3 text-base font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="text-xl">{s.emoji}</span>{s.label}
                  </span>
                  <span className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Fraunces, serif' }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-3xl p-6" style={{ background: 'var(--accent)' }}>
            <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--accent-foreground)', opacity: 0.65 }}>
              Consejo del día
            </p>
            <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--accent-foreground)' }}>
              "Practicar 20 minutos cada día mejora la memoria significativamente. ¡Pequeños pasos, grandes resultados!"
            </p>
          </div>

          {/* Badges */}
          <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Logros recientes</h2>
            <div className="space-y-3">
              {[
                { icon: '🌟', label: '12 días seguidos', sub: '26 sep' },
                { icon: '🏆', label: '50 ejercicios', sub: '20 sep' },
                { icon: '🧠', label: 'Primera semana', sub: '14 sep' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="text-sm font-bold leading-tight">{b.label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITIES SCREEN
// ═══════════════════════════════════════════════════════════════

function ActivitiesScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [selected, setSelected] = useState(CATEGORIES[0])

  return (
    <div className="flex h-full">
      {/* Left panel: categories */}
      <div className="w-80 flex-shrink-0 p-6 overflow-y-auto" style={{ borderRight: '1.5px solid var(--border)', background: 'var(--card)' }}>
        <h2 className="text-2xl font-bold mb-5 px-2" style={{ fontFamily: 'Fraunces, serif' }}>
          Categorías
        </h2>
        <div className="space-y-2">
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              onClick={() => setSelected(cat)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
              style={{
                background: selected.id === cat.id ? cat.bg : 'transparent',
                border: selected.id === cat.id ? `2px solid ${cat.color}` : '2px solid transparent',
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: selected.id === cat.id ? cat.color : cat.bg, color: selected.id === cat.id ? 'white' : cat.color }}>
                {cat.icon}
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: selected.id === cat.id ? cat.color : 'var(--foreground)' }}>
                  {cat.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {cat.activities.length} ejercicios
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel: exercises */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-3xl">
          {/* Category header */}
          <div className="flex items-center gap-5 mb-8 p-6 rounded-3xl" style={{ background: selected.bg }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: selected.color, color: 'white' }}>
              {selected.icon}
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: selected.color }}>
                {selected.label}
              </h2>
              <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {selected.description}
              </p>
            </div>
          </div>

          {/* Exercises grid */}
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Ejercicios disponibles
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {selected.activities.map((act, i) => (
              <button key={i}
                onClick={() => act.gameScreen && onNavigate('game')}
                className="flex flex-col p-6 rounded-3xl text-left transition-all hover:scale-[1.02] active:scale-98"
                style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: selected.bg, color: selected.color }}>
                    {i === 0 ? '★' : i === 1 ? '●' : i === 2 ? '◆' : '▲'}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ background: selected.bg, color: selected.color }}>
                    <IconClock />
                    {act.time}
                  </div>
                </div>
                <p className="text-lg font-bold mb-1">{act.name}</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Ejercicio {i === 0 ? 'recomendado para hoy' : 'de ' + selected.label.toLowerCase()}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    {i % 3 === 0 ? 'Suave' : i % 3 === 1 ? 'Normal' : 'Desafío'}
                  </span>
                  <div className="flex items-center gap-1 font-bold" style={{ color: selected.color }}>
                    <span className="text-sm">Jugar</span>
                    <IconArrow />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Difficulty explanation */}
          <div className="mt-8 p-6 rounded-3xl" style={{ background: 'var(--muted)' }}>
            <p className="text-base font-bold mb-3">Niveles de dificultad</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { level: 'Suave', desc: 'Ideal para empezar o días tranquilos', color: '#6A9B7E' },
                { level: 'Normal', desc: 'El nivel recomendado para la mayoría', color: '#C96A2E' },
                { level: 'Desafío', desc: 'Para quienes buscan un reto mayor', color: '#8B7EC8' },
              ].map(d => (
                <div key={d.level} className="flex items-start gap-2">
                  <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: d.color }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: d.color }}>{d.level}</p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS SCREEN
// ═══════════════════════════════════════════════════════════════

interface LogForm {
  activity: string
  exercise: string
  duration: string
  correct: string
  incorrect: string
  difficulty: 'Suave' | 'Normal' | 'Desafío'
}

const BLANK_FORM: LogForm = { activity: 'Memoria', exercise: '', duration: '', correct: '', incorrect: '', difficulty: 'Normal' }

function ProgressScreen() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)
  const [showLog, setShowLog] = useState(false)
  const [showDetail, setShowDetail] = useState<Session | null>(null)
  const [form, setForm] = useState<LogForm>(BLANK_FORM)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const catExercises: Record<string, string[]> = {
    'Memoria': ['Parejas de imágenes', 'Secuencia de colores', 'Lista de palabras', 'Recuerda el orden'],
    'Lenguaje': ['Crucigrama simple', 'Encuentra la palabra', 'Completar la frase', 'Sinónimos y antónimos'],
    'Cálculo': ['Suma mental', 'Secuencias numéricas', 'Ordenar números', 'Resta y diferencia'],
    'Atención y reconocimiento': ['Encuentra las diferencias', 'Seguir el objeto', 'Reconoce el patrón', 'Figura oculta'],
    'Velocidad': ['Reacción visual', 'Toca el color correcto', 'Respuesta rápida', 'Clasificar rápido'],
  }

  const totalSessions = sessions.length
  const totalCorrect = sessions.reduce((a, s) => a + s.correct, 0)
  const totalIncorrect = sessions.reduce((a, s) => a + s.incorrect, 0)
  const avgAccuracy = Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
  const avgResponseTime = (sessions.reduce((a, s) => a + s.avgTime, 0) / sessions.length).toFixed(1)
  const totalMinutes = sessions.reduce((a, s) => a + s.duration, 0)

  const weeklyData = [
    { label: 'Lun', sublabel: '21 sep', value: 3 },
    { label: 'Mar', sublabel: '22 sep', value: 2 },
    { label: 'Mié', sublabel: '23 sep', value: 3 },
    { label: 'Jue', sublabel: '24 sep', value: 4 },
    { label: 'Vie', sublabel: '25 sep', value: 3 },
    { label: 'Sáb', sublabel: '26 sep', value: 2, highlight: true },
    { label: 'Dom', sublabel: '27 sep', value: 0 },
  ]

  const accuracyTrend = [
    { label: 'Lun', value: 78 },
    { label: 'Mar', value: 72 },
    { label: 'Mié', value: 85 },
    { label: 'Jue', value: 80 },
    { label: 'Vie', value: 88 },
    { label: 'Sáb', value: 83 },
  ]

  const catAccuracy = [
    { label: 'Lenguaje', pct: 86, color: '#6A9B7E' },
    { label: 'Memoria', pct: 81, color: '#C96A2E' },
    { label: 'Atención', pct: 77, color: '#B86A5A' },
    { label: 'Cálculo', pct: 70, color: '#8B7EC8' },
    { label: 'Velocidad', pct: 64, color: '#3E8FA8' },
  ]

  const catAvgTime = [
    { label: 'Velocidad', time: 1.9, color: '#3E8FA8' },
    { label: 'Memoria', time: 3.7, color: '#C96A2E' },
    { label: 'Cálculo', time: 4.5, color: '#8B7EC8' },
    { label: 'Lenguaje', time: 5.7, color: '#6A9B7E' },
    { label: 'Atención', time: 7.0, color: '#B86A5A' },
  ]
  const maxTime = Math.max(...catAvgTime.map(c => c.time))

  const diffCount = { Suave: 0, Normal: 0, Desafío: 0 }
  sessions.forEach(s => { diffCount[s.difficulty]++ })
  const diffTotal = sessions.length

  const diffColors: Record<string, string> = { Suave: '#6A9B7E', Normal: '#C96A2E', Desafío: '#8B7EC8' }

  function submitLog() {
    if (!form.exercise || !form.duration || !form.correct || !form.incorrect) {
      setFormError('Por favor completa todos los campos.')
      return
    }
    const newSession: Session = {
      id: Date.now(),
      date: '26 sep 2026',
      activity: form.activity,
      exercise: form.exercise,
      duration: parseInt(form.duration),
      correct: parseInt(form.correct),
      incorrect: parseInt(form.incorrect),
      difficulty: form.difficulty,
      avgTime: parseFloat((parseInt(form.duration) * 60 / Math.max(1, parseInt(form.correct) + parseInt(form.incorrect))).toFixed(1)),
    }
    setSessions(prev => [newSession, ...prev])
    setShowLog(false)
    setForm(BLANK_FORM)
    setFormError('')
    setSuccessMsg('¡Resultado registrado con éxito!')
    setTimeout(() => setSuccessMsg(''), 3500)
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {/* Title row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Mi Progreso</h1>
          <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>Septiembre 2026 · {totalSessions} sesiones registradas</p>
        </div>
        <button onClick={() => setShowLog(true)}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <IconPlus /> Registrar resultado
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 px-6 py-4 rounded-2xl"
          style={{ background: '#D8EDE3', border: '2px solid #6A9B7E', color: '#2A4A35' }}>
          <span className="text-xl">✅</span>
          <span className="text-base font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { emoji: '📅', label: 'Sesiones', value: `${totalSessions}` },
          { emoji: '✅', label: 'Respuestas correctas', value: `${totalCorrect}` },
          { emoji: '❌', label: 'Respuestas incorrectas', value: `${totalIncorrect}` },
          { emoji: '🎯', label: 'Precisión media', value: `${avgAccuracy}%` },
          { emoji: '⏱️', label: 'Tiempo de respuesta', value: `${avgResponseTime}s` },
        ].map((s, i) => (
          <div key={i} className="rounded-3xl p-5" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <div className="text-2xl mb-2">{s.emoji}</div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary)' }}>{s.value}</p>
            <p className="text-sm mt-1 leading-tight" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Weekly bar + Category accuracy */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Sesiones por día</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Semana del 21 al 27 de septiembre</p>
          <BarChart data={weeklyData} height={150} />
        </div>
        <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Precisión por categoría</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Porcentaje de respuestas correctas</p>
          <div className="space-y-4">
            {catAccuracy.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold">{cat.label}</span>
                  <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.pct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.pct}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Accuracy trend + Response times + Difficulty */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Evolución de la precisión</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Porcentaje de aciertos en los últimos 6 días</p>
          <LineChart data={accuracyTrend} color="var(--primary)" height={140} />
        </div>

        <div className="space-y-5">
          {/* Response time by category */}
          <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Tiempo de respuesta</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>Promedio en segundos por categoría</p>
            <div className="space-y-3">
              {catAvgTime.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold">{cat.label}</span>
                    <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.time}s</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${(cat.time / maxTime) * 100}%`, background: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty distribution */}
          <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Distribución de dificultad</h2>
            <div className="space-y-3">
              {(['Suave', 'Normal', 'Desafío'] as const).map(diff => {
                const count = diffCount[diff]
                const pct = Math.round((count / diffTotal) * 100)
                return (
                  <div key={diff}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold">{diff}</span>
                      <span className="text-sm font-bold" style={{ color: diffColors[diff] }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: diffColors[diff] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions table */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
        <div className="px-7 py-5" style={{ borderBottom: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Historial de sesiones</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Últimas {sessions.length} sesiones registradas</p>
        </div>
        {/* Table header */}
        <div className="grid px-7 py-3 text-sm font-bold uppercase tracking-wide"
          style={{ gridTemplateColumns: '1.2fr 1.5fr 0.8fr 0.6fr 0.6fr 0.8fr 0.8fr auto', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
          <span>Fecha</span>
          <span>Ejercicio</span>
          <span>Categoría</span>
          <span>Correctas</span>
          <span>Incorrectas</span>
          <span>Precisión</span>
          <span>Dificultad</span>
          <span></span>
        </div>
        {sessions.map((s, i) => {
          const acc = Math.round((s.correct / (s.correct + s.incorrect)) * 100)
          const catCol = CATEGORIES.find(c => s.activity.includes(c.label) || c.label.includes(s.activity))?.color ?? 'var(--primary)'
          const diffBg = { Suave: '#D8EDE3', Normal: '#FDE8D8', Desafío: '#E4E0F5' }[s.difficulty]
          const diffColor = diffColors[s.difficulty]
          return (
            <div key={s.id}
              className="grid items-center px-7 py-4 transition-colors hover:bg-[var(--muted)]"
              style={{
                gridTemplateColumns: '1.2fr 1.5fr 0.8fr 0.6fr 0.6fr 0.8fr 0.8fr auto',
                borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
              <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{s.date}</span>
              <div>
                <p className="text-base font-semibold leading-tight">{s.exercise}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.duration} min · {s.avgTime}s resp.</p>
              </div>
              <span className="text-sm font-semibold" style={{ color: catCol }}>{s.activity}</span>
              <span className="text-base font-bold" style={{ color: '#6A9B7E' }}>{s.correct}</span>
              <span className="text-base font-bold" style={{ color: '#B86A5A' }}>{s.incorrect}</span>
              <span className="text-base font-bold" style={{ color: acc >= 80 ? '#6A9B7E' : acc >= 60 ? '#C96A2E' : '#B86A5A' }}>
                {acc}%
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full inline-block"
                style={{ background: diffBg, color: diffColor }}>
                {s.difficulty}
              </span>
              <button onClick={() => setShowDetail(s)}
                className="text-sm font-bold px-3 py-2 rounded-xl transition-all hover:opacity-80"
                style={{ color: 'var(--primary)', background: '#FDE8D8' }}>
                Detalles
              </button>
            </div>
          )
        })}
      </div>

      {/* Total time footer */}
      <div className="mt-6 text-center">
        <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
          Tiempo total registrado: <strong style={{ color: 'var(--foreground)' }}>{totalMinutes} minutos</strong>
          {' '}· Promedio por sesión: <strong style={{ color: 'var(--foreground)' }}>{Math.round(totalMinutes / totalSessions)} min</strong>
        </p>
      </div>

      {/* LOG RESULT MODAL */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(42,26,10,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: 'var(--card)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between px-8 py-6" style={{ background: 'var(--primary)' }}>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>
                Registrar resultado
              </h2>
              <button onClick={() => { setShowLog(false); setFormError('') }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,251,245,0.2)', color: 'var(--primary-foreground)' }}>
                <IconX />
              </button>
            </div>
            <div className="p-8 space-y-5">
              {/* Activity */}
              <div>
                <label className="block text-base font-bold mb-2">Categoría</label>
                <select value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value, exercise: '' })}
                  className="w-full px-4 py-3 rounded-2xl text-base font-medium"
                  style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
                  {Object.keys(catExercises).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* Exercise */}
              <div>
                <label className="block text-base font-bold mb-2">Ejercicio</label>
                <select value={form.exercise} onChange={e => setForm({ ...form, exercise: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-base font-medium"
                  style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
                  <option value="">Selecciona un ejercicio</option>
                  {catExercises[form.activity].map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              {/* Numeric fields */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Duración (min)', key: 'duration', placeholder: 'Ej: 10' },
                  { label: 'Respuestas correctas', key: 'correct', placeholder: 'Ej: 12' },
                  { label: 'Respuestas incorrectas', key: 'incorrect', placeholder: 'Ej: 3' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-bold mb-2">{f.label}</label>
                    <input type="number" min="0" placeholder={f.placeholder}
                      value={form[f.key as keyof LogForm]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl text-base font-medium"
                      style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }} />
                  </div>
                ))}
              </div>
              {/* Difficulty */}
              <div>
                <label className="block text-base font-bold mb-2">Nivel de dificultad</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Suave', 'Normal', 'Desafío'] as const).map(diff => (
                    <button key={diff} onClick={() => setForm({ ...form, difficulty: diff })}
                      className="py-3 rounded-2xl text-base font-bold transition-all"
                      style={{
                        background: form.difficulty === diff ? diffColors[diff] : 'var(--muted)',
                        color: form.difficulty === diff ? 'white' : 'var(--muted-foreground)',
                      }}>
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className="text-base font-semibold" style={{ color: '#B86A5A' }}>{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowLog(false); setFormError('') }}
                  className="flex-1 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-80"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  Cancelar
                </button>
                <button onClick={submitLog}
                  className="flex-1 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  Guardar resultado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SESSION DETAIL MODAL */}
      {showDetail && (() => {
        const s = showDetail
        const acc = Math.round((s.correct / (s.correct + s.incorrect)) * 100)
        const catObj = CATEGORIES.find(c => s.activity.includes(c.label) || c.label.includes(s.activity))
        const color = catObj?.color ?? 'var(--primary)'
        const bg = catObj?.bg ?? 'var(--muted)'
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(42,26,10,0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{ background: 'var(--card)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <div className="flex items-center justify-between px-8 py-6" style={{ background: color }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.date}</p>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'white' }}>
                    {s.exercise}
                  </h2>
                </div>
                <button onClick={() => setShowDetail(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <IconX />
                </button>
              </div>
              <div className="p-8">
                {/* Accuracy highlight */}
                <div className="text-center mb-7 p-5 rounded-2xl" style={{ background: bg }}>
                  <p className="text-6xl font-bold" style={{ fontFamily: 'Fraunces, serif', color }}>
                    {acc}%
                  </p>
                  <p className="text-base mt-1 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                    Precisión en este ejercicio
                  </p>
                </div>
                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { emoji: '✅', label: 'Respuestas correctas', value: `${s.correct}`, color: '#6A9B7E' },
                    { emoji: '❌', label: 'Respuestas incorrectas', value: `${s.incorrect}`, color: '#B86A5A' },
                    { emoji: '⏱️', label: 'Tiempo de respuesta', value: `${s.avgTime}s`, color: 'var(--primary)' },
                    { emoji: '⏳', label: 'Duración total', value: `${s.duration} min`, color: 'var(--foreground)' },
                  ].map((d, i) => (
                    <div key={i} className="p-4 rounded-2xl" style={{ background: 'var(--muted)' }}>
                      <span className="text-lg">{d.emoji}</span>
                      <p className="text-xl font-bold mt-1" style={{ color: d.color, fontFamily: 'Fraunces, serif' }}>{d.value}</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{d.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Categoría</p>
                    <p className="text-base font-bold" style={{ color }}>{s.activity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Dificultad</p>
                    <span className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{ background: bg, color }}>
                      {s.difficulty}
                    </span>
                  </div>
                </div>
                {/* Comparison */}
                <div className="p-4 rounded-2xl" style={{ background: 'var(--muted)' }}>
                  <p className="text-sm font-bold mb-1">Comparación con tu promedio</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Tu media en <strong>{s.activity}</strong> es{' '}
                    <strong style={{ color }}>
                      {catAccuracy.find(c => s.activity.includes(c.label) || c.label.includes(s.activity))?.pct ?? acc}%
                    </strong>
                    {acc >= (catAccuracy.find(c => s.activity.includes(c.label) || c.label.includes(s.activity))?.pct ?? acc)
                      ? ' · Esta sesión estuvo por encima 🎉'
                      : ' · Sigue practicando, ¡mejorarás!'
                    }
                  </p>
                </div>
                <button onClick={() => setShowDetail(null)}
                  className="w-full mt-5 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90"
                  style={{ background: color, color: 'white' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROFILE SCREEN (desktop 2-col adapted)
// ═══════════════════════════════════════════════════════════════

function ProfileScreen() {
  const [fontSize, setFontSize] = useState<'normal' | 'grande' | 'extra'>('grande')
  const [reminders, setReminders] = useState(true)
  const [sound, setSound] = useState(true)

  return (
    <div className="p-10 max-w-5xl mx-auto">
      {/* Profile header */}
      <div className="rounded-3xl px-10 py-8 mb-8 flex items-center justify-between"
        style={{ background: 'var(--primary)' }}>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl flex-shrink-0"
            style={{ background: 'rgba(255,251,245,0.25)', border: '3px solid rgba(255,251,245,0.5)' }}>
            👵
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>
              Rosa Martínez
            </h1>
            <p className="text-base mt-1" style={{ color: 'rgba(255,251,245,0.85)' }}>72 años · Nivel: Intermedio</p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,251,245,0.7)' }}>Miembro desde marzo 2026</p>
          </div>
        </div>
        <div className="flex gap-8 text-center">
          {[
            { value: '12', label: 'Días seguidos' },
            { value: '58', label: 'Ejercicios' },
            { value: '14h', label: 'Tiempo total' },
          ].map((s, i) => (
            <div key={i} className="px-6 py-4 rounded-2xl" style={{ background: 'rgba(255,251,245,0.18)' }}>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,251,245,0.8)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2-column settings */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Difficulty */}
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Fraunces, serif' }}>Nivel de dificultad</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['Suave', 'Normal', 'Desafío'] as const).map((level) => (
                <button key={level}
                  className="py-4 px-2 rounded-2xl text-base font-bold transition-all hover:opacity-80"
                  style={{
                    background: level === 'Normal' ? 'var(--primary)' : 'var(--muted)',
                    color: level === 'Normal' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}>
                  {level}
                </button>
              ))}
            </div>
            <p className="text-sm mt-3" style={{ color: 'var(--muted-foreground)' }}>
              El nivel afecta a todos los ejercicios nuevos.
            </p>
          </div>

          {/* Font size */}
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Fraunces, serif' }}>Tamaño de letra</h2>
            <div className="grid grid-cols-3 gap-3">
              {([['normal', 'Normal'], ['grande', 'Grande'], ['extra', 'Extra grande']] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setFontSize(val)}
                  className="py-4 px-2 rounded-2xl text-sm font-bold transition-all hover:opacity-80"
                  style={{
                    background: fontSize === val ? 'var(--primary)' : 'var(--muted)',
                    color: fontSize === val ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Help & logout */}
          <button className="w-full py-5 rounded-3xl text-xl font-bold text-center transition-all hover:opacity-80 active:scale-98"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
            ❓ Ayuda y preguntas frecuentes
          </button>
          <button className="w-full py-5 rounded-3xl text-xl font-bold text-center transition-all hover:opacity-80 active:scale-98"
            style={{ background: '#FDE8D8', color: 'var(--primary)' }}>
            🚪 Cerrar sesión
          </button>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Toggles */}
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold p-7 pb-4" style={{ fontFamily: 'Fraunces, serif' }}>Configuración</h2>
            {[
              { label: 'Recordatorios diarios', sub: 'Recibe un aviso cada día a las 10:00', val: reminders, set: setReminders },
              { label: 'Sonidos del juego', sub: 'Efectos de sonido durante los ejercicios', val: sound, set: setSound },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-7 py-5"
                style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <p className="text-base font-semibold">{item.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.sub}</p>
                </div>
                <button onClick={() => item.set(!item.val)}
                  className="w-14 h-8 rounded-full transition-all duration-300 relative flex-shrink-0"
                  style={{ background: item.val ? 'var(--secondary)' : 'var(--muted)' }}>
                  <span className="w-6 h-6 rounded-full absolute top-1 transition-all duration-300"
                    style={{ background: 'white', left: item.val ? '30px' : '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Data & privacy */}
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Fraunces, serif' }}>Datos y privacidad</h2>
            <div className="space-y-3">
              {[
                { icon: '📤', label: 'Exportar mis datos' },
                { icon: '🔒', label: 'Política de privacidad' },
                { icon: '🗑️', label: 'Eliminar mi cuenta' },
              ].map((item, i) => (
                <button key={i}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:opacity-80"
                  style={{ background: 'var(--muted)' }}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-base font-semibold">{item.label}</span>
                  <IconArrow />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════

const NAV_ITEMS: { id: Screen; label: string; icon: (active: boolean) => ReactElement }[] = [
  { id: 'home', label: 'Inicio', icon: (a) => <IconHome active={a} /> },
  { id: 'activities', label: 'Ejercicios', icon: (a) => <IconBrain active={a} /> },
  { id: 'progress', label: 'Progreso', icon: (a) => <IconChart active={a} /> },
  { id: 'profile', label: 'Perfil', icon: (a) => <IconUser active={a} /> },
]

function Sidebar({ current, onNavigate }: { current: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <aside className="flex flex-col w-64 flex-shrink-0 h-screen sticky top-0"
      style={{ background: 'var(--card)', borderRight: '1.5px solid var(--border)' }}>
      {/* Brand */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'var(--primary)' }}>
            🧠
          </div>
          <div>
            <p className="text-base font-bold leading-tight" style={{ fontFamily: 'Fraunces, serif' }}>MenteClear</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Estimulación cognitiva</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = current === item.id
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all"
              style={{
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}>
              {item.icon(active)}
              <span className="text-base font-bold">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User card */}
      <div className="p-4 mx-2 mb-4 rounded-2xl" style={{ background: 'var(--muted)' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">👵</span>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">Rosa Martínez</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>72 años · Intermedio</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  function navigate(s: Screen) {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (screen === 'game') {
    return <MemoryGame onBack={() => navigate('activities')} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar current={screen} onNavigate={navigate} />
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {screen === 'home' && <HomeScreen onNavigate={navigate} />}
        {screen === 'activities' && <ActivitiesScreen onNavigate={navigate} />}
        {screen === 'progress' && <ProgressScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </main>
    </div>
  )
}
