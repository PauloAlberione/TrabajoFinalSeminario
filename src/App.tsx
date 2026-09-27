import { useState, useRef } from 'react'
import type { ReactElement } from 'react'

// ═══════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" />
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
function IconHelp({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeWidth="2.5" />
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
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5 transition-transform duration-300"
      style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
function IconEye({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
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

// ═══════════════════════════════════════════════════════════════
// TYPES & DATA
// ═══════════════════════════════════════════════════════════════

type Screen = 'home' | 'activities' | 'game' | 'lenguaje-game' | 'calculo-game' | 'atencion-game' | 'velocidad-game' | 'progress' | 'profile' | 'help'
type AppState = 'login' | 'forgot' | 'app'

interface Session {
  id: number; date: string; activity: string; exercise: string
  duration: number; correct: number; incorrect: number
  difficulty: 'Suave' | 'Normal' | 'Desafío'; avgTime: number
}

const CAT_COLOR: Record<string, string> = {
  Memoria: '#C96A2E', Lenguaje: '#6A9B7E', 'Cálculo': '#8B7EC8',
  'Atención y reconocimiento': '#B86A5A', Velocidad: '#3E8FA8',
}
const CAT_BG: Record<string, string> = {
  Memoria: '#FDE8D8', Lenguaje: '#D8EDE3', 'Cálculo': '#E4E0F5',
  'Atención y reconocimiento': '#F5E0DB', Velocidad: '#D0EBF4',
}

const CATEGORIES: {
  id: string; label: string; color: string; bg: string
  icon: ReactElement; description: string; demoScreen: Screen
  activities: { name: string; time: string }[]
}[] = [
  {
    id: 'memoria', label: 'Memoria', color: '#C96A2E', bg: '#FDE8D8', demoScreen: 'game',
    icon: <IconMemory />,
    description: 'Ejercita tu capacidad de recordar imágenes, palabras y secuencias.',
    activities: [
      { name: 'Parejas de imágenes', time: '10 min' },
      { name: 'Secuencia de colores', time: '8 min' },
      { name: 'Lista de palabras', time: '12 min' },
      { name: 'Recuerda el orden', time: '9 min' },
    ],
  },
  {
    id: 'lenguaje', label: 'Lenguaje', color: '#6A9B7E', bg: '#D8EDE3', demoScreen: 'lenguaje-game',
    icon: <IconWords />,
    description: 'Mejora tu fluencia verbal, vocabulario y comprensión lectora.',
    activities: [
      { name: 'Asociación de palabras', time: '10 min' },
      { name: 'Crucigrama simple', time: '15 min' },
      { name: 'Completar la frase', time: '8 min' },
      { name: 'Sinónimos y antónimos', time: '12 min' },
    ],
  },
  {
    id: 'calculo', label: 'Cálculo', color: '#8B7EC8', bg: '#E4E0F5', demoScreen: 'calculo-game',
    icon: <IconNumbers />,
    description: 'Practica operaciones matemáticas sencillas y series numéricas.',
    activities: [
      { name: 'Cálculo mental', time: '8 min' },
      { name: 'Secuencias numéricas', time: '10 min' },
      { name: 'Ordenar números', time: '7 min' },
      { name: 'Resta y diferencia', time: '9 min' },
    ],
  },
  {
    id: 'atencion', label: 'Atención y reconocimiento', color: '#B86A5A', bg: '#F5E0DB', demoScreen: 'atencion-game',
    icon: <IconAttention />,
    description: 'Entrena la concentración, la observación y el reconocimiento visual.',
    activities: [
      { name: 'Identificar elementos', time: '10 min' },
      { name: 'Seguir el objeto', time: '6 min' },
      { name: 'Reconoce el patrón', time: '8 min' },
      { name: 'Figura oculta', time: '12 min' },
    ],
  },
  {
    id: 'velocidad', label: 'Velocidad', color: '#3E8FA8', bg: '#D0EBF4', demoScreen: 'velocidad-game',
    icon: <IconSpeed />,
    description: 'Mejora la rapidez de respuesta y el procesamiento de la información.',
    activities: [
      { name: 'Respuesta rápida', time: '6 min' },
      { name: 'Toca el color correcto', time: '7 min' },
      { name: 'Clasificar rápido', time: '8 min' },
      { name: 'Reacción visual', time: '5 min' },
    ],
  },
]

const INITIAL_SESSIONS: Session[] = [
  { id: 1, date: '26 sep 2026', activity: 'Memoria', exercise: 'Parejas de imágenes', duration: 10, correct: 14, incorrect: 2, difficulty: 'Normal', avgTime: 3.2 },
  { id: 2, date: '26 sep 2026', activity: 'Lenguaje', exercise: 'Asociación de palabras', duration: 10, correct: 7, incorrect: 1, difficulty: 'Normal', avgTime: 5.1 },
  { id: 3, date: '25 sep 2026', activity: 'Cálculo', exercise: 'Cálculo mental', duration: 8, correct: 6, incorrect: 2, difficulty: 'Suave', avgTime: 4.5 },
  { id: 4, date: '25 sep 2026', activity: 'Atención y reconocimiento', exercise: 'Identificar elementos', duration: 12, correct: 9, incorrect: 1, difficulty: 'Normal', avgTime: 8.3 },
  { id: 5, date: '24 sep 2026', activity: 'Velocidad', exercise: 'Respuesta rápida', duration: 6, correct: 8, incorrect: 2, difficulty: 'Normal', avgTime: 1.8 },
  { id: 6, date: '24 sep 2026', activity: 'Memoria', exercise: 'Secuencia de colores', duration: 8, correct: 10, incorrect: 3, difficulty: 'Suave', avgTime: 4.1 },
  { id: 7, date: '23 sep 2026', activity: 'Lenguaje', exercise: 'Sinónimos y antónimos', duration: 12, correct: 7, incorrect: 1, difficulty: 'Normal', avgTime: 6.2 },
  { id: 8, date: '22 sep 2026', activity: 'Cálculo', exercise: 'Secuencias numéricas', duration: 9, correct: 5, incorrect: 3, difficulty: 'Desafío', avgTime: 7.4 },
  { id: 9, date: '21 sep 2026', activity: 'Velocidad', exercise: 'Toca el color correcto', duration: 7, correct: 9, incorrect: 1, difficulty: 'Normal', avgTime: 2.1 },
  { id: 10, date: '20 sep 2026', activity: 'Atención y reconocimiento', exercise: 'Identificar elementos', duration: 10, correct: 8, incorrect: 2, difficulty: 'Suave', avgTime: 5.7 },
]

const DIFF_COLORS: Record<string, string> = { Suave: '#6A9B7E', Normal: '#C96A2E', Desafío: '#8B7EC8' }
const DIFF_BG: Record<string, string> = { Suave: '#D8EDE3', Normal: '#FDE8D8', Desafío: '#E4E0F5' }

// ═══════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════

function BarChart({ data, height = 160 }: { data: Array<{ label: string; value: number; highlight?: boolean; sublabel?: string }>; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = 44; const gap = 18; const padL = 10
  const totalW = data.length * (barW + gap) - gap + padL * 2
  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${height + 40}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = padL + i * (barW + gap)
        const barH = (d.value / max) * height
        const y = height - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH || 4} rx={8} fill={d.highlight ? 'var(--primary)' : 'var(--muted)'} opacity={barH ? 1 : 0.3} />
            {d.value > 0 && <text x={x + barW / 2} y={y - 7} textAnchor="middle" fontSize="13" fontWeight="700" fill={d.highlight ? 'var(--primary)' : 'var(--muted-foreground)'}>{d.value}</text>}
            <text x={x + barW / 2} y={height + 20} textAnchor="middle" fontSize="13" fill="var(--muted-foreground)">{d.label}</text>
            {d.sublabel && <text x={x + barW / 2} y={height + 36} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" opacity="0.7">{d.sublabel}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data, color = 'var(--primary)', height = 140 }: { data: Array<{ label: string; value: number }>; color?: string; height?: number }) {
  const W = 500; const padTop = 24; const padBottom = 36; const padX = 20; const chartH = height - padTop
  const max = Math.max(...data.map(d => d.value), 100)
  const min = Math.max(0, Math.min(...data.map(d => d.value)) - 10)
  const pts = data.map((d, i) => ({ x: padX + (i / (data.length - 1)) * (W - padX * 2), y: padTop + chartH - ((d.value - min) / (max - min || 1)) * chartH, ...d }))
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M${pts[0].x},${height} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${height} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + padBottom}`} preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
      {[0, 25, 50, 75, 100].map(v => { const y = padTop + chartH - ((v - min) / (max - min || 1)) * chartH; return y >= padTop && y <= height ? <line key={v} x1={padX} x2={W - padX} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" /> : null })}
      <path d={area} fill="url(#lg)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" /><text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{p.value}%</text><text x={p.x} y={height + 20} textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">{p.label}</text></g>))}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// SHARED EXERCISE COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ExerciseHeader({ title, category, color, difficulty, onBack }: { title: string; category: string; color: string; difficulty: string; onBack: () => void }) {
  return (
    <div className="px-10 pt-8 pb-6" style={{ background: color }}>
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 mb-4 font-semibold text-base hover:opacity-80" style={{ color: 'rgba(255,251,245,0.9)' }}>
          <IconBack /> Volver a ejercicios
        </button>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-base font-semibold mb-1" style={{ color: 'rgba(255,251,245,0.8)' }}>{category}</p>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'white' }}>{title}</h1>
          </div>
          <span className="text-sm font-bold px-4 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            Nivel: {difficulty}
          </span>
        </div>
      </div>
    </div>
  )
}

function ExerciseResults({ correct, incorrect, totalMs, color, onBack, onRetry }: {
  correct: number; incorrect: number; totalMs: number; color: string
  onBack: () => void; onRetry: () => void
}) {
  const total = correct + incorrect
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const avgS = total > 0 ? (totalMs / 1000 / total).toFixed(1) : '0.0'
  const emoji = accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'
  const msg = accuracy >= 80 ? '¡Excelente trabajo!' : accuracy >= 60 ? '¡Buen esfuerzo!' : '¡Sigue practicando!'
  return (
    <div className="flex-1 max-w-2xl mx-auto px-10 py-10 w-full">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">{emoji}</div>
        <h2 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>{msg}</h2>
        <p className="text-lg mt-2" style={{ color: 'var(--muted-foreground)' }}>Ejercicio completado</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-6 rounded-3xl text-center" style={{ background: '#D8EDE3' }}>
          <p className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#6A9B7E' }}>{correct}</p>
          <p className="text-base font-semibold mt-1" style={{ color: '#4a7a5e' }}>Respuestas correctas</p>
        </div>
        <div className="p-6 rounded-3xl text-center" style={{ background: '#F5E0DB' }}>
          <p className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#B86A5A' }}>{incorrect}</p>
          <p className="text-base font-semibold mt-1" style={{ color: '#8a4a3a' }}>Respuestas incorrectas</p>
        </div>
        <div className="p-6 rounded-3xl text-center" style={{ background: color + '22' }}>
          <p className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color }}>{accuracy}%</p>
          <p className="text-base font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>Precisión</p>
        </div>
        <div className="p-6 rounded-3xl text-center" style={{ background: 'var(--muted)' }}>
          <p className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}>{avgS}s</p>
          <p className="text-base font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>Tiempo por respuesta</p>
        </div>
      </div>
      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 py-5 rounded-2xl text-lg font-bold hover:opacity-80 transition-opacity" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
          ← Volver a ejercicios
        </button>
        <button onClick={onRetry} className="flex-1 py-5 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity" style={{ background: color, color: 'white' }}>
          Repetir ejercicio ↺
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════

function LoginScreen({ onLogin, onForgot }: { onLogin: () => void; onForgot: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegisterMsg, setShowRegisterMsg] = useState(false)

  function handleSubmit() {
    setError('')
    if (!email || !email.includes('@')) { setError('Por favor, introduce un correo electrónico válido.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 1200)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-96 flex-col items-center justify-center p-12" style={{ background: 'var(--primary)' }}>
        <div className="text-center">
          <div className="text-7xl mb-6">🧠</div>
          <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Fraunces, serif', color: 'white' }}>
            Cuida tu mente cada día
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,251,245,0.85)' }}>
            Ejercicios sencillos y amigables para mantener tu mente activa y saludable.
          </p>
          <div className="mt-10 space-y-4">
            {['Ejercicios de memoria', 'Cálculo mental', 'Atención y lenguaje', 'Seguimiento de progreso'].map(f => (
              <div key={f} className="flex items-center gap-3 text-left">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <IconCheck />
                </div>
                <span className="text-base font-semibold" style={{ color: 'rgba(255,251,245,0.9)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 lg:hidden" style={{ background: 'var(--primary)' }}>🧠</div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>MenteClear</h1>
            <p className="text-lg mt-1" style={{ color: 'var(--muted-foreground)' }}>Estimulación cognitiva</p>
          </div>

          <div className="rounded-3xl p-10" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: 'Fraunces, serif' }}>
              Iniciar sesión
            </h2>

            <div className="mb-6">
              <label className="block text-base font-bold mb-2">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="ejemplo@correo.com"
                className="w-full px-5 py-4 rounded-2xl text-lg outline-none transition-all"
                style={{ border: `2px solid ${error && !email.includes('@') ? '#B86A5A' : 'var(--border)'}`, background: 'var(--muted)', color: 'var(--foreground)' }} />
            </div>

            <div className="mb-4">
              <label className="block text-base font-bold mb-2">Contraseña</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Su contraseña"
                  className="w-full px-5 py-4 rounded-2xl text-lg pr-14 outline-none"
                  style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--muted-foreground)' }}>
                  <IconEye visible={showPwd} />
                </button>
              </div>
            </div>

            <div className="text-right mb-6">
              <button onClick={onForgot} className="text-base font-semibold hover:opacity-75 transition-opacity" style={{ color: 'var(--primary)' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <div className="mb-5 px-5 py-4 rounded-2xl flex items-start gap-3" style={{ background: '#F5E0DB', border: '1.5px solid #B86A5A' }}>
                <span className="text-xl flex-shrink-0">⚠️</span>
                <p className="text-base font-semibold" style={{ color: '#7a3a2a' }}>{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-5 rounded-2xl text-xl font-bold transition-all hover:opacity-90 active:scale-98"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', opacity: loading ? 0.8 : 1 }}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            <div className="text-center mt-6">
              <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
                ¿Aún no tienes cuenta?{' '}
                <button onClick={() => setShowRegisterMsg(!showRegisterMsg)} className="font-bold hover:opacity-75 transition-opacity" style={{ color: 'var(--primary)' }}>
                  Crear una cuenta
                </button>
              </p>
              {showRegisterMsg && (
                <p className="text-sm mt-3 px-4 py-3 rounded-xl" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  El registro estará disponible próximamente. Contacta con tu centro de salud para obtener acceso.
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
            Para acceder al prototipo, introduce cualquier correo válido y una contraseña de al menos 6 caracteres.
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FORGOT PASSWORD SCREEN
// ═══════════════════════════════════════════════════════════════

function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit() {
    setError('')
    if (!email || !email.includes('@')) { setError('Por favor, introduce un correo electrónico válido.'); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md text-center">
          <div className="text-8xl mb-6">📧</div>
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>¡Correo enviado!</h2>
          <p className="text-lg mb-2" style={{ color: 'var(--foreground)' }}>Hemos enviado instrucciones de recuperación a:</p>
          <p className="text-xl font-bold mb-6 px-4 py-3 rounded-2xl inline-block" style={{ background: '#FDE8D8', color: 'var(--primary)' }}>{email}</p>
          <p className="text-base mb-3 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Revisa tu bandeja de entrada y sigue las instrucciones del correo para crear una nueva contraseña.
          </p>
          <p className="text-base mb-10 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Si no encuentras el mensaje, revisa también la carpeta de correo no deseado o spam.
          </p>
          <button onClick={onBack} className="px-12 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4" style={{ background: 'var(--primary)' }}>🧠</div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>MenteClear</h1>
          <p className="text-lg mt-1" style={{ color: 'var(--muted-foreground)' }}>Estimulación cognitiva</p>
        </div>
        <div className="rounded-3xl p-10" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔑</div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Recuperar contraseña</h2>
            <p className="text-base mt-2 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Introduce tu correo electrónico y te enviaremos instrucciones para crear una contraseña nueva.
            </p>
          </div>
          <div className="mb-5">
            <label className="block text-base font-bold mb-2">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="ejemplo@correo.com"
              className="w-full px-5 py-4 rounded-2xl text-lg outline-none"
              style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }} />
          </div>
          {error && (
            <div className="mb-5 px-5 py-4 rounded-2xl flex items-start gap-3" style={{ background: '#F5E0DB', border: '1.5px solid #B86A5A' }}>
              <span>⚠️</span>
              <p className="text-base font-semibold" style={{ color: '#7a3a2a' }}>{error}</p>
            </div>
          )}
          <button onClick={handleSubmit} className="w-full py-5 rounded-2xl text-xl font-bold mb-4 hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            Enviar enlace de recuperación
          </button>
          <button onClick={onBack} className="w-full py-4 rounded-2xl text-lg font-bold hover:opacity-80 transition-opacity"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MEMORY GAME (Memoria)
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
    setBoard(newBoard); setSelected(newSelected)
    if (newSelected.length === 2) {
      setMoves(m => m + 1); setDisabled(true)
      const [a, b] = newSelected.map(sid => newBoard.find(c => c.id === sid)!)
      setTimeout(() => {
        if (a.emoji === b.emoji) setBoard(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, matched: true } : c))
        else setBoard(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, flipped: false } : c))
        setSelected([]); setDisabled(false)
      }, 900)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <ExerciseHeader title="Parejas de imágenes" category="Memoria" color="#C96A2E" difficulty="Normal" onBack={onBack} />
      <div className="flex-1 flex items-center justify-center px-10 py-10">
        {matched === total ? (
          <div className="flex flex-col items-center gap-6 max-w-lg text-center">
            <div className="text-8xl">🎉</div>
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>¡Excelente, Rosa!</h2>
            <p className="text-xl" style={{ color: 'var(--muted-foreground)' }}>Completaste el juego en <strong style={{ color: 'var(--foreground)' }}>{moves} jugadas</strong></p>
            <div className="flex gap-2" style={{ color: 'var(--accent)' }}>{[1, 2, 3].map(s => <IconStar key={s} />)}</div>
            <div className="flex gap-4 mt-2">
              <button onClick={onBack} className="px-8 py-4 rounded-2xl text-lg font-bold" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>← Volver</button>
              <button onClick={() => { setBoard(shuffle([...EMOJIS, ...EMOJIS]).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))); setMoves(0) }}
                className="px-8 py-4 rounded-2xl text-lg font-bold" style={{ background: '#C96A2E', color: 'white' }}>Repetir ↺</button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl w-full">
            <div className="flex justify-between mb-6 px-2">
              <span className="text-lg font-semibold" style={{ color: 'var(--muted-foreground)' }}>Jugadas: <strong style={{ color: 'var(--foreground)' }}>{moves}</strong></span>
              <span className="text-lg font-semibold" style={{ color: 'var(--muted-foreground)' }}>Parejas: <strong style={{ color: '#C96A2E' }}>{matched}/{total}</strong></span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {board.map(card => (
                <button key={card.id} onClick={() => flip(card.id)}
                  className="aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 select-none"
                  style={{ background: card.flipped || card.matched ? 'var(--card)' : '#C96A2E', boxShadow: card.matched ? '0 0 0 3px #6A9B7E' : card.flipped ? '0 4px 16px rgba(0,0,0,0.1)' : '0 4px 0 rgba(0,0,0,0.2)', opacity: card.matched ? 0.55 : 1 }}>
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
// LENGUAJE GAME — Asociación de palabras
// ═══════════════════════════════════════════════════════════════

const LENGUAJE_Q = [
  { instruction: 'Selecciona el ANTÓNIMO (contrario) de:', word: 'CALIENTE', options: ['FRÍO', 'ARDIENTE', 'TIBIO', 'CALUROSO'], correct: 0 },
  { instruction: 'Selecciona el SINÓNIMO (similar) de:', word: 'FELIZ', options: ['TRISTE', 'CONTENTO', 'ENOJADO', 'ABURRIDO'], correct: 1 },
  { instruction: 'Selecciona el ANTÓNIMO (contrario) de:', word: 'GRANDE', options: ['ENORME', 'GIGANTE', 'PEQUEÑO', 'ANCHO'], correct: 2 },
  { instruction: '¿Cuál de estas palabras es una FRUTA?', word: '', options: ['SILLA', 'CAMINO', 'NARANJA', 'ZAPATO'], correct: 2 },
  { instruction: 'Selecciona el SINÓNIMO (similar) de:', word: 'COMENZAR', options: ['TERMINAR', 'PARAR', 'INICIAR', 'DORMIR'], correct: 2 },
  { instruction: 'Selecciona el ANTÓNIMO (contrario) de:', word: 'RÁPIDO', options: ['VELOZ', 'LENTO', 'ÁGIL', 'DINÁMICO'], correct: 1 },
  { instruction: '¿Cuál de estas palabras es un ANIMAL?', word: '', options: ['MESA', 'DELFÍN', 'VENTANA', 'CAMINO'], correct: 1 },
  { instruction: 'Selecciona el SINÓNIMO (similar) de:', word: 'BONITO', options: ['FEO', 'RARO', 'OSCURO', 'HERMOSO'], correct: 3 },
]

function LenguajeGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'instructions' | 'playing' | 'results'>('instructions')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const startRef = useRef(Date.now())

  function startExercise() { setPhase('playing'); startRef.current = Date.now() }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    const elapsed = Date.now() - startRef.current
    setTimes(t => [...t, elapsed])
    setSelected(idx)
    const isCorrect = idx === LENGUAJE_Q[qIdx].correct
    if (isCorrect) setCorrect(c => c + 1); else setIncorrect(i => i + 1)
  }

  function nextQuestion() {
    if (qIdx + 1 >= LENGUAJE_Q.length) { setPhase('results'); return }
    setQIdx(q => q + 1); setSelected(null); startRef.current = Date.now()
  }

  function reset() { setPhase('instructions'); setQIdx(0); setSelected(null); setCorrect(0); setIncorrect(0); setTimes([]) }

  const q = LENGUAJE_Q[qIdx]
  const totalMs = times.reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <ExerciseHeader title="Asociación de palabras" category="Lenguaje" color="#6A9B7E" difficulty="Normal" onBack={onBack} />
      {phase === 'instructions' && (
        <div className="flex-1 flex items-center justify-center px-10 py-10">
          <div className="max-w-xl text-center space-y-6">
            <div className="text-6xl">📖</div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Cómo funciona</h2>
            <div className="rounded-3xl p-8 text-left space-y-4" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
              <p className="text-lg leading-relaxed"><span className="font-bold">1.</span> Se mostrará una palabra o pregunta en pantalla.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">2.</span> Elige una de las cuatro opciones que mejor se relacione.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">3.</span> Hay 8 preguntas en total. Tómate el tiempo que necesites.</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-base" style={{ color: 'var(--muted-foreground)' }}>
              <IconClock /><span>Aproximadamente 10 minutos · 8 preguntas</span>
            </div>
            <button onClick={startExercise} className="px-14 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity active:scale-95"
              style={{ background: '#6A9B7E', color: 'white' }}>
              Comenzar ejercicio →
            </button>
          </div>
        </div>
      )}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-10 py-8">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
              <span>Pregunta {qIdx + 1} de {LENGUAJE_Q.length}</span>
              <span>{correct} correctas · {incorrect} incorrectas</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((qIdx) / LENGUAJE_Q.length) * 100}%`, background: '#6A9B7E' }} />
            </div>
          </div>
          {/* Question */}
          <div className="rounded-3xl p-8 mb-6 text-center" style={{ background: '#D8EDE3' }}>
            <p className="text-xl font-semibold mb-4" style={{ color: '#4a7a5e' }}>{q.instruction}</p>
            {q.word && <p className="text-5xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#6A9B7E' }}>{q.word}</p>}
          </div>
          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {q.options.map((opt, i) => {
              let bg = 'var(--card)'; let border = '1.5px solid var(--border)'; let color = 'var(--foreground)'
              if (selected !== null) {
                if (i === q.correct) { bg = '#D8EDE3'; border = '2px solid #6A9B7E'; color = '#2a5a3e' }
                else if (i === selected && i !== q.correct) { bg = '#F5E0DB'; border = '2px solid #B86A5A'; color = '#7a2a1a' }
                else { bg = 'var(--muted)'; color = 'var(--muted-foreground)' }
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)}
                  className="py-6 px-6 rounded-2xl text-xl font-bold text-center transition-all hover:scale-[1.02] active:scale-98"
                  style={{ background: bg, border, color, boxShadow: selected === null ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
                  {opt}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-base font-semibold" style={{ color: selected === q.correct ? '#4a7a5e' : '#7a2a1a' }}>
                {selected === q.correct ? '✅ ¡Correcto!' : `❌ La respuesta correcta era: ${q.options[q.correct]}`}
              </p>
              <button onClick={nextQuestion} className="px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity"
                style={{ background: '#6A9B7E', color: 'white' }}>
                {qIdx + 1 >= LENGUAJE_Q.length ? 'Ver resultados →' : 'Siguiente pregunta →'}
              </button>
            </div>
          )}
        </div>
      )}
      {phase === 'results' && (
        <ExerciseResults correct={correct} incorrect={incorrect} totalMs={totalMs} color="#6A9B7E" onBack={onBack} onRetry={reset} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CALCULO GAME — Cálculo mental
// ═══════════════════════════════════════════════════════════════

const CALCULO_Q = [
  { op: '6 + 7', answer: 13, options: [13, 11, 14, 12] },
  { op: '15 − 8', answer: 7, options: [6, 8, 7, 9] },
  { op: '4 × 3', answer: 12, options: [10, 9, 14, 12] },
  { op: '20 ÷ 4', answer: 5, options: [6, 5, 4, 8] },
  { op: '9 + 14', answer: 23, options: [21, 25, 24, 23] },
  { op: '30 − 12', answer: 18, options: [16, 18, 19, 20] },
  { op: '3 × 6', answer: 18, options: [15, 21, 18, 24] },
  { op: '24 ÷ 6', answer: 4, options: [3, 5, 6, 4] },
]

function CalculoGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'instructions' | 'playing' | 'results'>('instructions')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const startRef = useRef(Date.now())

  function startExercise() { setPhase('playing'); startRef.current = Date.now() }
  function handleAnswer(val: number) {
    if (selected !== null) return
    const elapsed = Date.now() - startRef.current
    setTimes(t => [...t, elapsed]); setSelected(val)
    if (val === CALCULO_Q[qIdx].answer) setCorrect(c => c + 1); else setIncorrect(i => i + 1)
  }
  function nextQuestion() {
    if (qIdx + 1 >= CALCULO_Q.length) { setPhase('results'); return }
    setQIdx(q => q + 1); setSelected(null); startRef.current = Date.now()
  }
  function reset() { setPhase('instructions'); setQIdx(0); setSelected(null); setCorrect(0); setIncorrect(0); setTimes([]) }

  const q = CALCULO_Q[qIdx]
  const totalMs = times.reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <ExerciseHeader title="Cálculo mental" category="Cálculo" color="#8B7EC8" difficulty="Normal" onBack={onBack} />
      {phase === 'instructions' && (
        <div className="flex-1 flex items-center justify-center px-10 py-10">
          <div className="max-w-xl text-center space-y-6">
            <div className="text-6xl">🔢</div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Cómo funciona</h2>
            <div className="rounded-3xl p-8 text-left space-y-4" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
              <p className="text-lg leading-relaxed"><span className="font-bold">1.</span> Aparecerá una operación matemática sencilla en pantalla.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">2.</span> Elige el resultado correcto entre las cuatro opciones.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">3.</span> Hay 8 operaciones en total. Tómate tu tiempo.</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-base" style={{ color: 'var(--muted-foreground)' }}>
              <IconClock /><span>Aproximadamente 8 minutos · 8 operaciones</span>
            </div>
            <button onClick={startExercise} className="px-14 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#8B7EC8', color: 'white' }}>
              Comenzar ejercicio →
            </button>
          </div>
        </div>
      )}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-10 py-8">
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
              <span>Operación {qIdx + 1} de {CALCULO_Q.length}</span>
              <span>{correct} correctas · {incorrect} incorrectas</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(qIdx / CALCULO_Q.length) * 100}%`, background: '#8B7EC8' }} />
            </div>
          </div>
          <div className="rounded-3xl p-10 mb-8 text-center" style={{ background: '#E4E0F5' }}>
            <p className="text-lg font-semibold mb-2" style={{ color: '#6a5ea8' }}>¿Cuánto es?</p>
            <p className="text-7xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#8B7EC8' }}>
              {q.op} = <span style={{ color: '#3a2e88' }}>?</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {q.options.map((opt, i) => {
              let bg = 'var(--card)'; let border = '1.5px solid var(--border)'; let color = 'var(--foreground)'
              if (selected !== null) {
                if (opt === q.answer) { bg = '#D8EDE3'; border = '2px solid #6A9B7E'; color = '#2a5a3e' }
                else if (opt === selected && opt !== q.answer) { bg = '#F5E0DB'; border = '2px solid #B86A5A'; color = '#7a2a1a' }
                else { bg = 'var(--muted)'; color = 'var(--muted-foreground)' }
              }
              return (
                <button key={i} onClick={() => handleAnswer(opt)}
                  className="py-7 rounded-2xl text-4xl font-bold text-center transition-all hover:scale-[1.02] active:scale-98"
                  style={{ background: bg, border, color, fontFamily: 'Fraunces, serif' }}>
                  {opt}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-base font-semibold" style={{ color: selected === q.answer ? '#4a7a5e' : '#7a2a1a' }}>
                {selected === q.answer ? '✅ ¡Correcto!' : `❌ La respuesta correcta era: ${q.answer}`}
              </p>
              <button onClick={nextQuestion} className="px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity"
                style={{ background: '#8B7EC8', color: 'white' }}>
                {qIdx + 1 >= CALCULO_Q.length ? 'Ver resultados →' : 'Siguiente →'}
              </button>
            </div>
          )}
        </div>
      )}
      {phase === 'results' && (
        <ExerciseResults correct={correct} incorrect={incorrect} totalMs={totalMs} color="#8B7EC8" onBack={onBack} onRetry={reset} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ATENCIÓN GAME — Identificar elementos
// ═══════════════════════════════════════════════════════════════

const ATENCION_ROUNDS = [
  {
    reference: '🌸', label: 'la flor',
    instruction: 'Haz clic en todas las flores iguales a la muestra. Cuando hayas terminado, pulsa "Comprobar".',
    grid: ['🌸','🌙','🌸','⚡','🎪','🌸','🎭','🏆','🌸','🎸','🎯','🌸','🎪','⚡','🌙','🎵','🎭','🏆','🎯','🎸'],
    correct: new Set([0, 2, 5, 8, 11]),
  },
  {
    reference: '★', label: 'la estrella',
    instruction: 'Haz clic en todas las estrellas iguales a la muestra. Cuando hayas terminado, pulsa "Comprobar".',
    grid: ['★','●','▲','★','■','◆','★','●','■','▲','◆','★','▲','●','◆','■','●','▲','◆','■'],
    correct: new Set([0, 3, 6, 11]),
  },
]

function AtencionGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'instructions' | 'playing' | 'results'>('instructions')
  const [roundIdx, setRoundIdx] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [checked, setChecked] = useState(false)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalIncorrect, setTotalIncorrect] = useState(0)
  const startRef = useRef(Date.now())
  const [totalMs, setTotalMs] = useState(0)

  function startExercise() { setPhase('playing'); startRef.current = Date.now() }

  function toggleSelect(i: number) {
    if (checked) return
    setSelected(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next })
  }

  function checkRound() {
    const round = ATENCION_ROUNDS[roundIdx]
    let found = 0, falsePos = 0
    selected.forEach(i => { if (round.correct.has(i)) found++; else falsePos++ })
    const missed = round.correct.size - found
    setTotalCorrect(c => c + found)
    setTotalIncorrect(i => i + falsePos + missed)
    setChecked(true)
  }

  function nextRound() {
    if (roundIdx + 1 >= ATENCION_ROUNDS.length) {
      setTotalMs(Date.now() - startRef.current)
      setPhase('results')
    } else {
      setRoundIdx(r => r + 1); setSelected(new Set()); setChecked(false)
    }
  }

  function reset() { setPhase('instructions'); setRoundIdx(0); setSelected(new Set()); setChecked(false); setTotalCorrect(0); setTotalIncorrect(0) }

  const round = ATENCION_ROUNDS[roundIdx]

  function getCellStyle(i: number) {
    const isTarget = round.correct.has(i)
    const isSel = selected.has(i)
    if (!checked) return { background: isSel ? '#B86A5A' : 'var(--card)', color: isSel ? 'white' : 'var(--foreground)', border: isSel ? '2px solid #8a3a2a' : '1.5px solid var(--border)' }
    if (isTarget && isSel) return { background: '#6A9B7E', color: 'white', border: '2px solid #4a7a5e' }
    if (!isTarget && isSel) return { background: '#B86A5A', color: 'white', border: '2px solid #8a3a2a' }
    if (isTarget && !isSel) return { background: '#E8A44A', color: 'white', border: '2px solid #c8843a' }
    return { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1.5px solid transparent' }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <ExerciseHeader title="Identificar elementos" category="Atención y reconocimiento" color="#B86A5A" difficulty="Normal" onBack={onBack} />
      {phase === 'instructions' && (
        <div className="flex-1 flex items-center justify-center px-10 py-10">
          <div className="max-w-xl text-center space-y-6">
            <div className="text-6xl">🔍</div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Cómo funciona</h2>
            <div className="rounded-3xl p-8 text-left space-y-4" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
              <p className="text-lg leading-relaxed"><span className="font-bold">1.</span> Se muestra un elemento de referencia en pantalla.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">2.</span> Encuentra y haz clic en todos los elementos iguales dentro de la cuadrícula.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">3.</span> Cuando termines, pulsa "Comprobar" para ver tu resultado. Hay 2 rondas.</p>
            </div>
            <div className="flex justify-center gap-4 text-sm font-semibold">
              <span className="px-3 py-1.5 rounded-full" style={{ background: '#6A9B7E', color: 'white' }}>✓ Verde = correcto</span>
              <span className="px-3 py-1.5 rounded-full" style={{ background: '#B86A5A', color: 'white' }}>✗ Rojo = incorrecto</span>
              <span className="px-3 py-1.5 rounded-full" style={{ background: '#E8A44A', color: 'white' }}>⚠ Naranja = perdido</span>
            </div>
            <button onClick={startExercise} className="px-14 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#B86A5A', color: 'white' }}>
              Comenzar ejercicio →
            </button>
          </div>
        </div>
      )}
      {phase === 'playing' && (
        <div className="flex-1 max-w-4xl mx-auto w-full px-10 py-8">
          <div className="mb-4 flex justify-between items-center">
            <span className="text-base font-semibold" style={{ color: 'var(--muted-foreground)' }}>Ronda {roundIdx + 1} de {ATENCION_ROUNDS.length}</span>
            <span className="text-base font-semibold" style={{ color: 'var(--muted-foreground)' }}>{selected.size} seleccionados</span>
          </div>
          <div className="rounded-3xl p-6 mb-6 flex items-center gap-6" style={{ background: '#F5E0DB' }}>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: '#7a3a2a' }}>Elemento de referencia</p>
              <p className="text-6xl">{round.reference}</p>
            </div>
            <div style={{ borderLeft: '2px solid #e0c0b8' }} className="pl-6">
              <p className="text-lg font-semibold leading-relaxed" style={{ color: '#5a2a1a' }}>{round.instruction}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {round.grid.map((item, i) => {
              const style = getCellStyle(i)
              return (
                <button key={i} onClick={() => toggleSelect(i)}
                  className="aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all duration-200 hover:scale-105 select-none"
                  style={{ ...style, cursor: checked ? 'default' : 'pointer' }}>
                  {item}
                </button>
              )
            })}
          </div>
          {!checked ? (
            <div className="flex justify-center">
              <button onClick={checkRound} className="px-12 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
                style={{ background: '#B86A5A', color: 'white' }}>
                Comprobar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-base font-semibold">
                <span style={{ color: '#4a7a5e' }}>✅ Correctos</span>
                <span style={{ color: '#7a2a1a' }}>❌ Incorrectos</span>
                <span style={{ color: '#8a5a00' }}>⚠️ No encontrados</span>
              </div>
              <button onClick={nextRound} className="px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity"
                style={{ background: '#B86A5A', color: 'white' }}>
                {roundIdx + 1 >= ATENCION_ROUNDS.length ? 'Ver resultados →' : 'Siguiente ronda →'}
              </button>
            </div>
          )}
        </div>
      )}
      {phase === 'results' && (
        <ExerciseResults correct={totalCorrect} incorrect={totalIncorrect} totalMs={totalMs} color="#B86A5A" onBack={onBack} onRetry={reset} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VELOCIDAD GAME — Respuesta rápida
// ═══════════════════════════════════════════════════════════════

const VELOCIDAD_Q = [
  { question: '¿PERRO es un animal?', correct: true },
  { question: '¿MESA es una fruta?', correct: false },
  { question: '¿16 es un número par?', correct: true },
  { question: '¿AZUL es un color?', correct: true },
  { question: '¿NARANJA es una verdura?', correct: false },
  { question: '¿PIANO es un instrumento musical?', correct: true },
  { question: '¿5 es mayor que 10?', correct: false },
  { question: '¿MARTES viene después de LUNES?', correct: true },
  { question: '¿ROSA es una flor?', correct: true },
  { question: '¿9 es un número par?', correct: false },
]

function VelocidadGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'instructions' | 'playing' | 'results'>('instructions')
  const [qIdx, setQIdx] = useState(0)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const startRef = useRef(Date.now())

  function startExercise() { setPhase('playing'); startRef.current = Date.now() }

  function handleAnswer(ans: boolean) {
    if (answer !== null) return
    const elapsed = Date.now() - startRef.current
    setTimes(t => [...t, elapsed]); setAnswer(ans)
    if (ans === VELOCIDAD_Q[qIdx].correct) setCorrect(c => c + 1); else setIncorrect(i => i + 1)
  }

  function nextQuestion() {
    if (qIdx + 1 >= VELOCIDAD_Q.length) { setPhase('results'); return }
    setQIdx(q => q + 1); setAnswer(null); startRef.current = Date.now()
  }

  function reset() { setPhase('instructions'); setQIdx(0); setAnswer(null); setCorrect(0); setIncorrect(0); setTimes([]) }

  const q = VELOCIDAD_Q[qIdx]
  const totalMs = times.reduce((a, b) => a + b, 0)
  const lastTime = times.length > 0 ? (times[times.length - 1] / 1000).toFixed(1) : null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <ExerciseHeader title="Respuesta rápida" category="Velocidad" color="#3E8FA8" difficulty="Normal" onBack={onBack} />
      {phase === 'instructions' && (
        <div className="flex-1 flex items-center justify-center px-10 py-10">
          <div className="max-w-xl text-center space-y-6">
            <div className="text-6xl">⚡</div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Cómo funciona</h2>
            <div className="rounded-3xl p-8 text-left space-y-4" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
              <p className="text-lg leading-relaxed"><span className="font-bold">1.</span> Aparecerá una pregunta sencilla en pantalla.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">2.</span> Responde <strong>SÍ</strong> o <strong>NO</strong> lo más rápido que puedas.</p>
              <p className="text-lg leading-relaxed"><span className="font-bold">3.</span> Se registrará tu tiempo de respuesta. Hay 10 preguntas en total.</p>
            </div>
            <div className="px-6 py-4 rounded-2xl" style={{ background: '#D0EBF4' }}>
              <p className="text-base font-semibold" style={{ color: '#2a6a88' }}>
                💡 No hay prisa real, pero intenta responder sin dudar mucho.
              </p>
            </div>
            <button onClick={startExercise} className="px-14 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#3E8FA8', color: 'white' }}>
              Comenzar ejercicio →
            </button>
          </div>
        </div>
      )}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full px-10 py-8">
          <div className="w-full mb-6">
            <div className="flex justify-between text-sm font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
              <span>Pregunta {qIdx + 1} de {VELOCIDAD_Q.length}</span>
              <span>{correct} correctas · {incorrect} incorrectas</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(qIdx / VELOCIDAD_Q.length) * 100}%`, background: '#3E8FA8' }} />
            </div>
          </div>
          <div className="w-full rounded-3xl p-10 mb-8 text-center" style={{ background: '#D0EBF4' }}>
            <p className="text-3xl font-bold leading-relaxed" style={{ fontFamily: 'Fraunces, serif', color: '#2a5a70' }}>
              {q.question}
            </p>
            {lastTime && answer !== null && (
              <p className="text-sm mt-3 font-semibold" style={{ color: '#3E8FA8' }}>
                ⏱ Tiempo de respuesta: {lastTime}s
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6 w-full">
            {[{ label: '✓ SÍ', val: true, bg: '#6A9B7E', hoverBg: '#4a7a5e' }, { label: '✗ NO', val: false, bg: '#B86A5A', hoverBg: '#8a3a2a' }].map(btn => {
              let bg = btn.bg; let opacity = 1
              if (answer !== null) {
                if (btn.val === q.correct) { bg = '#6A9B7E'; opacity = 1 }
                else if (btn.val === answer && btn.val !== q.correct) { bg = '#B86A5A'; opacity = 1 }
                else { opacity = 0.35 }
              }
              return (
                <button key={String(btn.val)} onClick={() => handleAnswer(btn.val)}
                  className="py-8 rounded-2xl text-3xl font-bold transition-all hover:scale-[1.03] active:scale-98"
                  style={{ background: bg, color: 'white', opacity, cursor: answer !== null ? 'default' : 'pointer', fontFamily: 'Fraunces, serif' }}>
                  {btn.label}
                </button>
              )
            })}
          </div>
          {answer !== null && (
            <div className="mt-6 flex items-center justify-between w-full">
              <p className="text-base font-semibold" style={{ color: answer === q.correct ? '#4a7a5e' : '#7a2a1a' }}>
                {answer === q.correct ? '✅ ¡Correcto!' : `❌ La respuesta correcta era: ${q.correct ? 'SÍ' : 'NO'}`}
              </p>
              <button onClick={nextQuestion} className="px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity"
                style={{ background: '#3E8FA8', color: 'white' }}>
                {qIdx + 1 >= VELOCIDAD_Q.length ? 'Ver resultados →' : 'Siguiente →'}
              </button>
            </div>
          )}
        </div>
      )}
      {phase === 'results' && (
        <ExerciseResults correct={correct} incorrect={incorrect} totalMs={totalMs} color="#3E8FA8" onBack={onBack} onRetry={reset} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELP SCREEN
// ═══════════════════════════════════════════════════════════════

const FAQ = [
  {
    q: '¿Qué es MenteClear?',
    a: 'MenteClear es una plataforma web diseñada para ayudarte a realizar actividades de estimulación cognitiva y hacer un seguimiento de tu rendimiento a lo largo del tiempo. Puedes practicar diferentes tipos de ejercicios mentales —memoria, lenguaje, cálculo, atención y velocidad— de forma sencilla, segura y agradable desde tu ordenador.',
  },
  {
    q: '¿Cómo comienzo un ejercicio?',
    a: 'Haz clic en "Ejercicios" en el menú de la izquierda. Verás cinco categorías cognitivas. Haz clic en la que quieras trabajar y, a continuación, elige uno de los ejercicios disponibles. Antes de empezar, aparecerán instrucciones claras que te explicarán qué debes hacer.',
  },
  {
    q: '¿Qué capacidades puedo trabajar?',
    a: 'Puedes trabajar cinco áreas cognitivas: Memoria (recordar imágenes, palabras y secuencias), Lenguaje (vocabulario, sinónimos, antónimos), Cálculo (operaciones matemáticas sencillas), Atención y reconocimiento (concentración y observación visual), y Velocidad (rapidez de respuesta y procesamiento).',
  },
  {
    q: '¿Cómo funciona la dificultad?',
    a: 'Cada ejercicio puede realizarse en nivel Suave, Normal o Desafío. Puedes elegir el nivel desde la sección de Perfil o directamente al iniciar ciertos ejercicios. El nivel puede ajustarse de forma progresiva según tus resultados anteriores para que siempre encuentres el punto adecuado entre reto y comodidad.',
  },
  {
    q: '¿Dónde puedo consultar mis resultados?',
    a: 'En la sección "Progreso", accesible desde el menú lateral, encontrarás el historial completo de tus sesiones con información detallada: precisión, respuestas correctas e incorrectas, tiempos de respuesta, nivel de dificultad y más. También podrás registrar manualmente el resultado de un ejercicio usando el botón "Registrar resultado".',
  },
  {
    q: '¿Qué significan los gráficos de progreso?',
    a: 'Los gráficos muestran cómo ha evolucionado tu rendimiento a lo largo del tiempo. La barra semanal indica cuántas sesiones realizaste cada día. La línea de precisión muestra el porcentaje de aciertos por día. Las barras horizontales comparan tu rendimiento entre categorías cognitivas. Así puedes ver fácilmente en qué áreas mejoras y cuáles puedes reforzar.',
  },
  {
    q: '¿Puedo cambiar mis datos o preferencias?',
    a: 'Sí. En la sección "Perfil" puedes modificar el nivel de dificultad general, el tamaño de la letra para mayor comodidad visual, y activar o desactivar los recordatorios diarios y los sonidos. También encontrarás opciones relacionadas con la privacidad de tus datos.',
  },
  {
    q: '¿Qué hago si olvidé mi contraseña?',
    a: 'En la pantalla de inicio de sesión, haz clic en el enlace "¿Olvidaste tu contraseña?". Introduce tu correo electrónico y recibirás un mensaje con instrucciones para restablecer tu contraseña. Si no encuentras el correo, revisa la carpeta de correo no deseado o spam.',
  },
  {
    q: '¿La plataforma realiza diagnósticos médicos?',
    a: 'No. MenteClear es una herramienta de apoyo para la estimulación cognitiva y el seguimiento del rendimiento en ejercicios. No realiza diagnósticos médicos ni sustituye la evaluación de profesionales de la salud. Si tienes dudas sobre tu salud cognitiva, consulta siempre a tu médico o especialista.',
  },
]

function HelpScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Ayuda y preguntas frecuentes</h1>
          <p className="text-base mt-2" style={{ color: 'var(--muted-foreground)' }}>Encuentra respuestas a las dudas más comunes sobre MenteClear</p>
        </div>
        <button onClick={() => onNavigate('home')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-base font-bold transition-all hover:opacity-80"
          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
          <IconBack /> Volver al inicio
        </button>
      </div>

      {/* Quick help banner */}
      <div className="rounded-3xl p-6 mb-8 flex items-center gap-5" style={{ background: '#FDE8D8' }}>
        <span className="text-4xl flex-shrink-0">💬</span>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>¿Necesitas ayuda adicional?</p>
          <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
            Si no encuentras la respuesta que buscas, consulta con tu centro de salud o con la persona que te ayudó a configurar la aplicación.
          </p>
        </div>
      </div>

      {/* FAQ accordion */}
      <div className="space-y-3">
        {FAQ.map((item, i) => (
          <div key={i} className="rounded-3xl overflow-hidden" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-7 py-5 text-left transition-colors hover:opacity-80"
              style={{ background: open === i ? 'var(--primary)' : 'transparent' }}>
              <span className="text-lg font-bold pr-4" style={{ color: open === i ? 'white' : 'var(--foreground)' }}>
                {item.q}
              </span>
              <span style={{ color: open === i ? 'white' : 'var(--muted-foreground)', flexShrink: 0 }}>
                <IconChevron open={open === i} />
              </span>
            </button>
            {open === i && (
              <div className="px-7 py-5" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  {item.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div className="mt-10 rounded-3xl p-6" style={{ background: 'var(--muted)' }}>
        <p className="text-base text-center leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          <strong style={{ color: 'var(--foreground)' }}>Recuerda:</strong> MenteClear es un apoyo para tu bienestar cognitivo, no un diagnóstico médico.
          Siempre consulta a un profesional de la salud ante cualquier duda sobre tu salud.
        </p>
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => onNavigate('home')} className="px-10 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          ← Volver al inicio
        </button>
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
  const catColors: Record<string, string> = { Memoria: '#C96A2E', Lenguaje: '#6A9B7E', 'Cálculo': '#8B7EC8', Atención: '#B86A5A' }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="rounded-3xl px-10 py-8 mb-8 flex items-center justify-between" style={{ background: 'var(--primary)' }}>
        <div>
          <p className="text-base font-semibold mb-1" style={{ color: 'rgba(255,251,245,0.8)' }}>Sábado, 26 de septiembre de 2026</p>
          <h1 className="text-5xl font-bold leading-tight" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>
            Buenos días, Rosa 👋
          </h1>
          <p className="text-lg mt-2" style={{ color: 'rgba(255,251,245,0.85)' }}>Llevas 12 días activa. ¡Sigue así!</p>
        </div>
        <div className="flex items-center gap-4 px-8 py-5 rounded-2xl" style={{ background: 'rgba(255,251,245,0.18)' }}>
          <span style={{ fontSize: '2.5rem' }}>🔥</span>
          <div>
            <p className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>12</p>
            <p className="text-base" style={{ color: 'rgba(255,251,245,0.8)' }}>días seguidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Progreso de hoy</h2>
              <span className="text-3xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Fraunces, serif' }}>{pct}%</span>
            </div>
            <div className="h-5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--muted)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            </div>
            <p className="text-base mb-5" style={{ color: 'var(--muted-foreground)' }}>{completed} de {todayActivities.length} ejercicios completados</p>
            <div className="space-y-3">
              {todayActivities.map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl" style={{ background: a.done ? 'var(--muted)' : 'transparent', opacity: a.done ? 0.75 : 1 }}>
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
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Continuar con</h2>
            <button onClick={() => onNavigate('calculo-game')}
              className="w-full flex items-center gap-5 p-6 rounded-3xl text-left transition-all hover:scale-[1.01] active:scale-98"
              style={{ background: 'linear-gradient(135deg, var(--secondary), #4d8a68)', color: 'white' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <IconNumbers />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">Cálculo: Suma mental</p>
                <p className="text-base" style={{ color: 'rgba(255,255,255,0.85)' }}>Siguiente ejercicio del día · 8 min</p>
              </div>
              <IconArrow />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Esta semana</h2>
            <div className="space-y-4">
              {[{ emoji: '🧩', label: 'Sesiones', value: '17' }, { emoji: '✅', label: 'Ejercicios', value: '58' }, { emoji: '⏱️', label: 'Tiempo total', value: '4h 20m' }, { emoji: '🎯', label: 'Precisión media', value: '83%' }].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-3 text-base font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="text-xl">{s.emoji}</span>{s.label}
                  </span>
                  <span className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Fraunces, serif' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl p-6" style={{ background: 'var(--accent)' }}>
            <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--accent-foreground)', opacity: 0.65 }}>Consejo del día</p>
            <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--accent-foreground)' }}>
              "Practicar 20 minutos cada día mejora la memoria significativamente. ¡Pequeños pasos, grandes resultados!"
            </p>
          </div>
          <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Logros recientes</h2>
            <div className="space-y-3">
              {[{ icon: '🌟', label: '12 días seguidos', sub: '26 sep' }, { icon: '🏆', label: '50 ejercicios', sub: '20 sep' }, { icon: '🧠', label: 'Primera semana', sub: '14 sep' }].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div><p className="text-sm font-bold leading-tight">{b.label}</p><p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{b.sub}</p></div>
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
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 0px)' }}>
      <div className="w-80 flex-shrink-0 p-6 overflow-y-auto" style={{ borderRight: '1.5px solid var(--border)', background: 'var(--card)' }}>
        <h2 className="text-2xl font-bold mb-5 px-2" style={{ fontFamily: 'Fraunces, serif' }}>Categorías</h2>
        <div className="space-y-2">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setSelected(cat)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
              style={{ background: selected.id === cat.id ? cat.bg : 'transparent', border: selected.id === cat.id ? `2px solid ${cat.color}` : '2px solid transparent' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: selected.id === cat.id ? cat.color : cat.bg, color: selected.id === cat.id ? 'white' : cat.color }}>
                {cat.icon}
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: selected.id === cat.id ? cat.color : 'var(--foreground)' }}>{cat.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{cat.activities.length} ejercicios</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="flex items-center gap-5 mb-8 p-6 rounded-3xl" style={{ background: selected.bg }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: selected.color, color: 'white' }}>
              {selected.icon}
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: selected.color }}>{selected.label}</h2>
              <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>{selected.description}</p>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Ejercicios disponibles</h3>
          <div className="grid grid-cols-2 gap-4">
            {selected.activities.map((act, i) => (
              <button key={i} onClick={() => onNavigate(selected.demoScreen)}
                className="flex flex-col p-6 rounded-3xl text-left transition-all hover:scale-[1.02] active:scale-98"
                style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: selected.bg, color: selected.color }}>
                    {i === 0 ? '★' : i === 1 ? '●' : i === 2 ? '◆' : '▲'}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full" style={{ background: selected.bg, color: selected.color }}>
                    <IconClock />{act.time}
                  </div>
                </div>
                <p className="text-lg font-bold mb-1">{act.name}</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {i === 0 ? 'Recomendado para hoy' : `Ejercicio de ${selected.label.toLowerCase()}`}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    {i % 3 === 0 ? 'Normal' : i % 3 === 1 ? 'Suave' : 'Desafío'}
                  </span>
                  <div className="flex items-center gap-1 font-bold" style={{ color: selected.color }}>
                    <span className="text-sm">Jugar</span><IconArrow />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-8 p-6 rounded-3xl" style={{ background: 'var(--muted)' }}>
            <p className="text-base font-bold mb-3">Niveles de dificultad</p>
            <div className="grid grid-cols-3 gap-4">
              {[{ level: 'Suave', desc: 'Ideal para empezar o días tranquilos', color: '#6A9B7E' }, { level: 'Normal', desc: 'El nivel recomendado para la mayoría', color: '#C96A2E' }, { level: 'Desafío', desc: 'Para quienes buscan un reto mayor', color: '#8B7EC8' }].map(d => (
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

interface LogForm { activity: string; exercise: string; duration: string; correct: string; incorrect: string; difficulty: 'Suave' | 'Normal' | 'Desafío' }
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
    'Lenguaje': ['Asociación de palabras', 'Crucigrama simple', 'Completar la frase', 'Sinónimos y antónimos'],
    'Cálculo': ['Cálculo mental', 'Secuencias numéricas', 'Ordenar números', 'Resta y diferencia'],
    'Atención y reconocimiento': ['Identificar elementos', 'Seguir el objeto', 'Reconoce el patrón', 'Figura oculta'],
    'Velocidad': ['Respuesta rápida', 'Toca el color correcto', 'Clasificar rápido', 'Reacción visual'],
  }

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
    { label: 'Lun', value: 78 }, { label: 'Mar', value: 72 }, { label: 'Mié', value: 85 },
    { label: 'Jue', value: 80 }, { label: 'Vie', value: 88 }, { label: 'Sáb', value: 83 },
  ]
  const catAccuracy = [
    { label: 'Lenguaje', pct: 86, color: '#6A9B7E' }, { label: 'Memoria', pct: 81, color: '#C96A2E' },
    { label: 'Atención', pct: 77, color: '#B86A5A' }, { label: 'Cálculo', pct: 70, color: '#8B7EC8' },
    { label: 'Velocidad', pct: 64, color: '#3E8FA8' },
  ]
  const catAvgTime = [
    { label: 'Velocidad', time: 1.9, color: '#3E8FA8' }, { label: 'Memoria', time: 3.7, color: '#C96A2E' },
    { label: 'Cálculo', time: 4.5, color: '#8B7EC8' }, { label: 'Lenguaje', time: 5.7, color: '#6A9B7E' },
    { label: 'Atención', time: 7.0, color: '#B86A5A' },
  ]
  const maxTime = Math.max(...catAvgTime.map(c => c.time))
  const diffCount = { Suave: 0, Normal: 0, Desafío: 0 }
  sessions.forEach(s => { diffCount[s.difficulty]++ })

  function submitLog() {
    if (!form.exercise || !form.duration || !form.correct || !form.incorrect) { setFormError('Por favor completa todos los campos.'); return }
    const total = parseInt(form.correct) + parseInt(form.incorrect)
    const newSession: Session = {
      id: Date.now(), date: '26 sep 2026', activity: form.activity, exercise: form.exercise,
      duration: parseInt(form.duration), correct: parseInt(form.correct), incorrect: parseInt(form.incorrect),
      difficulty: form.difficulty,
      avgTime: total > 0 ? parseFloat((parseInt(form.duration) * 60 / total).toFixed(1)) : 0,
    }
    setSessions(prev => [newSession, ...prev])
    setShowLog(false); setForm(BLANK_FORM); setFormError('')
    setSuccessMsg('¡Resultado registrado con éxito!')
    setTimeout(() => setSuccessMsg(''), 3500)
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Mi Progreso</h1>
          <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>Septiembre 2026 · {sessions.length} sesiones registradas</p>
        </div>
        <button onClick={() => setShowLog(true)} className="flex items-center gap-2 px-6 py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <IconPlus /> Registrar resultado
        </button>
      </div>
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 px-6 py-4 rounded-2xl" style={{ background: '#D8EDE3', border: '2px solid #6A9B7E', color: '#2A4A35' }}>
          <span className="text-xl">✅</span><span className="text-base font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-5 gap-4 mb-8">
        {[{ emoji: '📅', label: 'Sesiones', value: `${sessions.length}` }, { emoji: '✅', label: 'Respuestas correctas', value: `${totalCorrect}` }, { emoji: '❌', label: 'Respuestas incorrectas', value: `${totalIncorrect}` }, { emoji: '🎯', label: 'Precisión media', value: `${avgAccuracy}%` }, { emoji: '⏱️', label: 'Tiempo de respuesta', value: `${avgResponseTime}s` }].map((s, i) => (
          <div key={i} className="rounded-3xl p-5" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <div className="text-2xl mb-2">{s.emoji}</div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary)' }}>{s.value}</p>
            <p className="text-sm mt-1 leading-tight" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Sesiones por día</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Semana del 21 al 27 de septiembre</p>
          <BarChart data={weeklyData} height={150} />
        </div>
        <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Precisión por categoría</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Porcentaje de aciertos</p>
          <div className="space-y-4">
            {catAccuracy.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold">{cat.label}</span>
                  <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.pct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Evolución de la precisión</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Porcentaje de aciertos en los últimos 6 días</p>
          <LineChart data={accuracyTrend} color="var(--primary)" height={140} />
        </div>
        <div className="space-y-5">
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
                    <div className="h-full rounded-full" style={{ width: `${(cat.time / maxTime) * 100}%`, background: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Distribución de dificultad</h2>
            <div className="space-y-3">
              {(['Suave', 'Normal', 'Desafío'] as const).map(diff => {
                const count = diffCount[diff]; const pct = Math.round((count / sessions.length) * 100)
                return (
                  <div key={diff}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold">{diff}</span>
                      <span className="text-sm font-bold" style={{ color: DIFF_COLORS[diff] }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DIFF_COLORS[diff] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
        <div className="px-7 py-5" style={{ borderBottom: '1.5px solid var(--border)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Historial de sesiones</h2>
        </div>
        <div className="grid px-7 py-3 text-sm font-bold uppercase tracking-wide"
          style={{ gridTemplateColumns: '1.1fr 1.5fr 0.9fr 0.5fr 0.5fr 0.7fr 0.8fr auto', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
          <span>Fecha</span><span>Ejercicio</span><span>Categoría</span><span>Correct.</span><span>Incorrect.</span><span>Precisión</span><span>Dificultad</span><span></span>
        </div>
        {sessions.map((s, i) => {
          const acc = Math.round((s.correct / (s.correct + s.incorrect)) * 100)
          const catCol = CAT_COLOR[s.activity] ?? 'var(--primary)'
          return (
            <div key={s.id} className="grid items-center px-7 py-4 transition-colors hover:opacity-90"
              style={{ gridTemplateColumns: '1.1fr 1.5fr 0.9fr 0.5fr 0.5fr 0.7fr 0.8fr auto', borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{s.date}</span>
              <div><p className="text-base font-semibold leading-tight">{s.exercise}</p><p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.duration} min · {s.avgTime}s/resp.</p></div>
              <span className="text-sm font-semibold" style={{ color: catCol }}>{s.activity}</span>
              <span className="text-base font-bold" style={{ color: '#6A9B7E' }}>{s.correct}</span>
              <span className="text-base font-bold" style={{ color: '#B86A5A' }}>{s.incorrect}</span>
              <span className="text-base font-bold" style={{ color: acc >= 80 ? '#6A9B7E' : acc >= 60 ? '#C96A2E' : '#B86A5A' }}>{acc}%</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full inline-block" style={{ background: DIFF_BG[s.difficulty], color: DIFF_COLORS[s.difficulty] }}>{s.difficulty}</span>
              <button onClick={() => setShowDetail(s)} className="text-sm font-bold px-3 py-2 rounded-xl hover:opacity-80 transition-opacity" style={{ color: 'var(--primary)', background: '#FDE8D8' }}>Detalles</button>
            </div>
          )
        })}
      </div>
      <div className="mt-6 text-center">
        <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
          Tiempo total: <strong style={{ color: 'var(--foreground)' }}>{totalMinutes} minutos</strong> · Promedio por sesión: <strong style={{ color: 'var(--foreground)' }}>{Math.round(totalMinutes / sessions.length)} min</strong>
        </p>
      </div>

      {/* Log modal */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(42,26,10,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: 'var(--card)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between px-8 py-6" style={{ background: 'var(--primary)' }}>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'white' }}>Registrar resultado</h2>
              <button onClick={() => { setShowLog(false); setFormError('') }} className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80" style={{ background: 'rgba(255,251,245,0.2)', color: 'white' }}><IconX /></button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-base font-bold mb-2">Categoría</label>
                <select value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value, exercise: '' })}
                  className="w-full px-4 py-3 rounded-2xl text-base font-medium" style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
                  {Object.keys(catExercises).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-base font-bold mb-2">Ejercicio</label>
                <select value={form.exercise} onChange={e => setForm({ ...form, exercise: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-base font-medium" style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
                  <option value="">Selecciona un ejercicio</option>
                  {catExercises[form.activity].map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: 'Duración (min)', key: 'duration', ph: 'Ej: 10' }, { label: 'Correctas', key: 'correct', ph: 'Ej: 12' }, { label: 'Incorrectas', key: 'incorrect', ph: 'Ej: 3' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-bold mb-2">{f.label}</label>
                    <input type="number" min="0" placeholder={f.ph} value={form[f.key as keyof LogForm]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl text-base font-medium outline-none" style={{ border: '2px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-base font-bold mb-2">Nivel de dificultad</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Suave', 'Normal', 'Desafío'] as const).map(diff => (
                    <button key={diff} onClick={() => setForm({ ...form, difficulty: diff })}
                      className="py-3 rounded-2xl text-base font-bold transition-all"
                      style={{ background: form.difficulty === diff ? DIFF_COLORS[diff] : 'var(--muted)', color: form.difficulty === diff ? 'white' : 'var(--muted-foreground)' }}>
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className="text-base font-semibold" style={{ color: '#B86A5A' }}>{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowLog(false); setFormError('') }} className="flex-1 py-4 rounded-2xl text-base font-bold" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>Cancelar</button>
                <button onClick={submitLog} className="flex-1 py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-opacity" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Guardar resultado</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {showDetail && (() => {
        const s = showDetail
        const acc = Math.round((s.correct / (s.correct + s.incorrect)) * 100)
        const color = CAT_COLOR[s.activity] ?? 'var(--primary)'
        const bg = CAT_BG[s.activity] ?? 'var(--muted)'
        const catRef = catAccuracy.find(c => s.activity.includes(c.label) || c.label.includes(s.activity))
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(42,26,10,0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: 'var(--card)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <div className="flex items-center justify-between px-8 py-6" style={{ background: color }}>
                <div><p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.date}</p><h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'white' }}>{s.exercise}</h2></div>
                <button onClick={() => setShowDetail(null)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}><IconX /></button>
              </div>
              <div className="p-8">
                <div className="text-center mb-7 p-5 rounded-2xl" style={{ background: bg }}>
                  <p className="text-6xl font-bold" style={{ fontFamily: 'Fraunces, serif', color }}>{acc}%</p>
                  <p className="text-base mt-1 font-semibold" style={{ color: 'var(--muted-foreground)' }}>Precisión en este ejercicio</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[{ emoji: '✅', label: 'Respuestas correctas', value: `${s.correct}`, color: '#6A9B7E' }, { emoji: '❌', label: 'Respuestas incorrectas', value: `${s.incorrect}`, color: '#B86A5A' }, { emoji: '⏱️', label: 'Tiempo de respuesta', value: `${s.avgTime}s`, color }, { emoji: '⏳', label: 'Duración total', value: `${s.duration} min`, color: 'var(--foreground)' }].map((d, i) => (
                    <div key={i} className="p-4 rounded-2xl" style={{ background: 'var(--muted)' }}>
                      <span className="text-lg">{d.emoji}</span>
                      <p className="text-xl font-bold mt-1" style={{ color: d.color, fontFamily: 'Fraunces, serif' }}>{d.value}</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{d.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mb-6">
                  <div><p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Categoría</p><p className="text-base font-bold" style={{ color }}>{s.activity}</p></div>
                  <div className="text-right"><p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Dificultad</p><span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: bg, color }}>{s.difficulty}</span></div>
                </div>
                <div className="p-4 rounded-2xl mb-5" style={{ background: 'var(--muted)' }}>
                  <p className="text-sm font-bold mb-1">Comparación con tu promedio</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Tu media en <strong>{s.activity}</strong> es <strong style={{ color }}>{catRef?.pct ?? acc}%</strong>
                    {acc >= (catRef?.pct ?? acc) ? ' · Esta sesión estuvo por encima 🎉' : ' · Sigue practicando, ¡mejorarás!'}
                  </p>
                </div>
                <button onClick={() => setShowDetail(null)} className="w-full py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-opacity" style={{ background: color, color: 'white' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════

function ProfileScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [fontSize, setFontSize] = useState<'normal' | 'grande' | 'extra'>('grande')
  const [reminders, setReminders] = useState(true)
  const [sound, setSound] = useState(true)

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="rounded-3xl px-10 py-8 mb-8 flex items-center justify-between" style={{ background: 'var(--primary)' }}>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl flex-shrink-0" style={{ background: 'rgba(255,251,245,0.25)', border: '3px solid rgba(255,251,245,0.5)' }}>👵</div>
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>Rosa Martínez</h1>
            <p className="text-base mt-1" style={{ color: 'rgba(255,251,245,0.85)' }}>72 años · Nivel: Intermedio</p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,251,245,0.7)' }}>Miembro desde marzo 2026</p>
          </div>
        </div>
        <div className="flex gap-8 text-center">
          {[{ value: '12', label: 'Días seguidos' }, { value: '58', label: 'Ejercicios' }, { value: '14h', label: 'Tiempo total' }].map((s, i) => (
            <div key={i} className="px-6 py-4 rounded-2xl" style={{ background: 'rgba(255,251,245,0.18)' }}>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--primary-foreground)' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,251,245,0.8)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Fraunces, serif' }}>Nivel de dificultad</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['Suave', 'Normal', 'Desafío'] as const).map(level => (
                <button key={level} className="py-4 px-2 rounded-2xl text-base font-bold hover:opacity-80 transition-opacity"
                  style={{ background: level === 'Normal' ? 'var(--primary)' : 'var(--muted)', color: level === 'Normal' ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Fraunces, serif' }}>Tamaño de letra</h2>
            <div className="grid grid-cols-3 gap-3">
              {([['normal', 'Normal'], ['grande', 'Grande'], ['extra', 'Extra grande']] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setFontSize(val)} className="py-4 px-2 rounded-2xl text-sm font-bold hover:opacity-80 transition-opacity"
                  style={{ background: fontSize === val ? 'var(--primary)' : 'var(--muted)', color: fontSize === val ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => onNavigate('help')} className="w-full py-5 rounded-3xl text-xl font-bold text-center hover:opacity-80 transition-opacity"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
            ❓ Ayuda y preguntas frecuentes
          </button>
          <button className="w-full py-5 rounded-3xl text-xl font-bold text-center hover:opacity-80 transition-opacity" style={{ background: '#FDE8D8', color: 'var(--primary)' }}>
            🚪 Cerrar sesión
          </button>
        </div>
        <div className="space-y-5">
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold p-7 pb-4" style={{ fontFamily: 'Fraunces, serif' }}>Configuración</h2>
            {[{ label: 'Recordatorios diarios', sub: 'Recibe un aviso cada día a las 10:00', val: reminders, set: setReminders }, { label: 'Sonidos del juego', sub: 'Efectos de sonido durante los ejercicios', val: sound, set: setSound }].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-7 py-5" style={{ borderTop: '1px solid var(--border)' }}>
                <div><p className="text-base font-semibold">{item.label}</p><p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.sub}</p></div>
                <button onClick={() => item.set(!item.val)} className="w-14 h-8 rounded-full transition-all duration-300 relative flex-shrink-0" style={{ background: item.val ? 'var(--secondary)' : 'var(--muted)' }}>
                  <span className="w-6 h-6 rounded-full absolute top-1 transition-all duration-300" style={{ background: 'white', left: item.val ? '30px' : '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-3xl p-7" style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Fraunces, serif' }}>Datos y privacidad</h2>
            <div className="space-y-3">
              {[{ icon: '📤', label: 'Exportar mis datos' }, { icon: '🔒', label: 'Política de privacidad' }, { icon: '🗑️', label: 'Eliminar mi cuenta' }].map((item, i) => (
                <button key={i} className="w-full flex items-center gap-4 p-4 rounded-2xl text-left hover:opacity-80 transition-opacity" style={{ background: 'var(--muted)' }}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-base font-semibold flex-1">{item.label}</span>
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
// SIDEBAR & NAVIGATION
// ═══════════════════════════════════════════════════════════════

const NAV_ITEMS: { id: Screen; label: string; icon: (active: boolean) => ReactElement }[] = [
  { id: 'home', label: 'Inicio', icon: (a) => <IconHome active={a} /> },
  { id: 'activities', label: 'Ejercicios', icon: (a) => <IconBrain active={a} /> },
  { id: 'progress', label: 'Progreso', icon: (a) => <IconChart active={a} /> },
  { id: 'profile', label: 'Perfil', icon: (a) => <IconUser active={a} /> },
  { id: 'help', label: 'Ayuda', icon: (a) => <IconHelp active={a} /> },
]

function Sidebar({ current, onNavigate }: { current: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <aside className="flex flex-col w-64 flex-shrink-0 h-screen sticky top-0" style={{ background: 'var(--card)', borderRight: '1.5px solid var(--border)' }}>
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--primary)' }}>🧠</div>
          <div>
            <p className="text-base font-bold leading-tight" style={{ fontFamily: 'Fraunces, serif' }}>Prototipo</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Estimulación cognitiva</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = current === item.id
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all"
              style={{ background: active ? 'var(--primary)' : 'transparent', color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
              {item.icon(active)}
              <span className="text-base font-bold">{item.label}</span>
            </button>
          )
        })}
      </nav>
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

const FULLSCREEN_SCREENS: Screen[] = ['game', 'lenguaje-game', 'calculo-game', 'atencion-game', 'velocidad-game']

export default function App() {
  const [appState, setAppState] = useState<AppState>('login')
  const [screen, setScreen] = useState<Screen>('home')

  function navigate(s: Screen) {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (appState === 'login') return <LoginScreen onLogin={() => setAppState('app')} onForgot={() => setAppState('forgot')} />
  if (appState === 'forgot') return <ForgotPasswordScreen onBack={() => setAppState('login')} />

  // Full-screen exercise views (no sidebar)
  if (FULLSCREEN_SCREENS.includes(screen)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        {screen === 'game' && <MemoryGame onBack={() => navigate('activities')} />}
        {screen === 'lenguaje-game' && <LenguajeGame onBack={() => navigate('activities')} />}
        {screen === 'calculo-game' && <CalculoGame onBack={() => navigate('activities')} />}
        {screen === 'atencion-game' && <AtencionGame onBack={() => navigate('activities')} />}
        {screen === 'velocidad-game' && <VelocidadGame onBack={() => navigate('activities')} />}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar current={screen} onNavigate={navigate} />
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {screen === 'home' && <HomeScreen onNavigate={navigate} />}
        {screen === 'activities' && <ActivitiesScreen onNavigate={navigate} />}
        {screen === 'progress' && <ProgressScreen />}
        {screen === 'profile' && <ProfileScreen onNavigate={navigate} />}
        {screen === 'help' && <HelpScreen onNavigate={navigate} />}
      </main>
    </div>
  )
}
