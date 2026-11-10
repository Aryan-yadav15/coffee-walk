import { useEffect, useRef, useState } from 'react'
import { PROJECTS } from '../projects'
import { openProject, set, useStore } from '../state'

/** The retro TV that shows a project in full. Knobs flip channels, ⏻ turns it off. */
export function Tv() {
  const id = useStore((s) => s.tv)
  const [off, setOff] = useState(false)
  const [flip, setFlip] = useState(0)
  const scroll = useRef<HTMLDivElement>(null)
  const i = id ? PROJECTS.findIndex((p) => p.id === id) : -1
  const p = i >= 0 ? PROJECTS[i] : null

  const close = () => {
    setOff(true)
    setTimeout(() => (set({ tv: null }), setOff(false)), 260)
  }
  const go = (d: number) => openProject(PROJECTS[(i + d + PROJECTS.length) % PROJECTS.length].id)

  useEffect(() => {
    if (!id) return
    setFlip((f) => f + 1)
    scroll.current?.scrollTo(0, 0)
  }, [id])

  // While it's on: the walk holds still, and the keyboard drives the TV.
  useEffect(() => {
    if (!id) return
    const html = document.documentElement
    const before = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = before
      window.removeEventListener('keydown', onKey)
    }
  })

  if (!p) return null
  const ch = String(i + 1).padStart(2, '0')

  return (
    <div className={off ? 'tv-room off' : 'tv-room'} onClick={close}>
      <div className="tv" role="dialog" aria-modal="true" aria-label={p.title} onClick={(e) => e.stopPropagation()}>
        <div className="tv-antenna" aria-hidden><i /><i /></div>
        <div className="tv-body">
          <div className="tv-screen">
            <div className="tv-scroll" ref={scroll} key={p.id}>
              <div className="tv-ch">CH {ch} · {p.context}</div>
              <h2>{p.title}</h2>
              <p className="tv-tag">{p.tagline}</p>
              {p.highlights && (
                <ul className="tv-hl">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
              )}
              <h3>what it is</h3>
              <p>{p.about}</p>
              <h3>how it works</h3>
              <ol>{p.how.map((h) => <li key={h}>{h}</li>)}</ol>
              <h3>tech stack</h3>
              <ul className="tv-stack">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
              {p.links && (
                <div className="tv-links">
                  {p.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
                </div>
              )}
              {p.note && <p className="tv-note">{p.note}</p>}
            </div>
            <div className="tv-static" key={flip} aria-hidden />
            <div className="tv-glass" aria-hidden />
          </div>
          <div className="tv-panel">
            <div className="tv-brand">ARYAN<b>VISION</b></div>
            <div className="tv-dial" aria-live="polite">{ch}</div>
            <div className="tv-knobs">
              <button className="tv-knob" onClick={() => go(-1)} aria-label="Previous channel">◀</button>
              <button className="tv-knob" onClick={() => go(1)} aria-label="Next channel">▶</button>
            </div>
            <div className="tv-grille" aria-hidden />
            <button className="tv-power" onClick={close} aria-label="Turn the TV off">⏻</button>
          </div>
        </div>
        <div className="tv-legs" aria-hidden><i /><i /></div>
      </div>
    </div>
  )
}
