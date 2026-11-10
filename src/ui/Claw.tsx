// Arcade controls for the tech claw machine: a play button when you walk past,
// then a joystick, a big DROP button, a timer and the prize card.
import { useEffect, useState } from 'react'
import { live, openProject, useStore } from '../state'
import { AIM_TIME, MACHINE, TECH, again, claw, drop, startClaw, stopClaw, toys } from '../claw'
import { dist } from '../world/path'

type Dir = [number, number]
const DIRS: { label: string; d: Dir; cls: string }[] = [
  { label: '▲', d: [0, -1], cls: 'up' },
  { label: '◀', d: [-1, 0], cls: 'left' },
  { label: '▶', d: [1, 0], cls: 'right' },
  { label: '▼', d: [0, 1], cls: 'down' },
]
const KEYS: Record<string, Dir> = {
  ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
}

export function ClawHud() {
  const playing = useStore((s) => s.claw)
  const prize = useStore((s) => s.prize)
  const [near, setNear] = useState(false)
  const [timer, setTimer] = useState(AIM_TIME)
  const [aiming, setAiming] = useState(false)
  const [wins, setWins] = useState(0)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      setNear(Math.abs(dist(live.t) - dist(MACHINE.t)) < 9)
      setTimer(Math.ceil(claw.timer))
      setAiming(claw.phase === 'aim')
      setWins(claw.wins.length)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // While playing, the page stays put and the keyboard drives the claw.
  useEffect(() => {
    if (!playing) return
    const html = document.documentElement
    const before = html.style.overflow
    html.style.overflow = 'hidden'
    html.classList.add('claw-on')
    const held = new Set<string>()
    const apply = () => {
      claw.dx = claw.dz = 0
      held.forEach((k) => ((claw.dx += KEYS[k][0]), (claw.dz += KEYS[k][1])))
    }
    const down = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (KEYS[k]) (held.add(k), apply(), e.preventDefault())
      else if (k === ' ' || k === 'Enter') (e.preventDefault(), drop())
      else if (k === 'Escape') stopClaw()
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (held.delete(k)) apply()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      html.style.overflow = before
      html.classList.remove('claw-on')
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      claw.dx = claw.dz = 0
    }
  }, [playing])

  if (!playing) {
    return near ? (
      <button className="play-claw" onClick={startClaw}>
        <span>🕹</span> play the claw machine
      </button>
    ) : null
  }

  const hold = (d: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      claw.dx = d[0]
      claw.dz = d[1]
    },
    onPointerUp: () => (claw.dx = claw.dz = 0),
    onPointerCancel: () => (claw.dx = claw.dz = 0),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  const t = prize === null ? null : TECH[toys[prize].tech]
  return (
    <div className="arcade">
      <div className="arcade-top">
        <span className="arcade-chip">⏱ {aiming ? timer : '··'}</span>
        <span className="arcade-chip">🧸 {wins}/{toys.length}</span>
        <button className="arcade-chip exit" onClick={stopClaw}>✕ back to the walk</button>
      </div>

      <div className="arcade-pad">
        <div className="dpad" aria-label="Move the claw">
          {DIRS.map(({ label, d, cls }) => (
            <button key={cls} className={cls} aria-label={`Move ${cls}`} {...hold(d)}>{label}</button>
          ))}
        </div>
        <p className="arcade-help">{aiming ? 'line it up, then drop' : 'the claw is doing its thing…'}</p>
        <button className="drop" onClick={drop} disabled={!aiming}>DROP</button>
      </div>

      {t && (
        <div className="prize" role="dialog" aria-label={`You won ${t.name}`}>
          <div className="prize-card" style={{ ['--plush' as string]: t.body, ['--badge' as string]: t.badge, ['--tink' as string]: t.ink }}>
            <div className="prize-badge">{t.glyph}</div>
            <p className="prize-kicker">you won a plush!</p>
            <h2>{t.name}</h2>
            <p className="prize-used"><b>Where I used it:</b> {t.used}</p>
            <div className="prize-actions">
              <button className="chip go" onClick={again}>play again</button>
              <button className="chip" onClick={() => openProject(t.project)}>see it on TV 📺</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
