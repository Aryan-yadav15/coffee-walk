import { useEffect, useRef, useState } from 'react'
import { BEATS, CHAPTERS, HIGHLIGHTS, ME, MEMES, type MemeId, type Stat } from '../story'
import { EGGS, EGG_TOTAL, get, jumpTo, live, say, set, useStore } from '../state'
import { ahead, smooth } from '../world/path'
import { SKIP_TO, STEPS, roomAt } from '../engine'
import { Tv } from './Tv'
import { ClawHud } from './Claw'

// Scenery comes into view a few steps before you reach it, so the story runs this far ahead.
const LOOKAHEAD = 6
/** How far into the walk (in `t`) the hero frame has fully opened. */
const HERO_END = 0.02

function Meme({ id }: { id: MemeId }) {
  const m = MEMES[id]
  const [missing, setMissing] = useState(false)
  return (
    <figure className="meme" key={id} onClick={() => set({ meme: null })}>
      {missing ? (
        <div className="meme-art">
          {m.top && <span className="meme-top">{m.top}</span>}
          <span className="meme-emoji">{m.emoji}</span>
        </div>
      ) : (
        <img src={`${import.meta.env.BASE_URL}memes/${m.file}`} alt={m.bottom} onError={() => setMissing(true)} />
      )}
      <figcaption>{m.bottom}</figcaption>
    </figure>
  )
}

/** Sticker on the caption's corner. Numbers in it count up from zero. */
function StatSticker({ stat }: { stat: Stat }) {
  const num = stat.big.match(/^([\d,]+)(.*)$/)
  const target = num ? Number(num[1].replace(/,/g, '')) : 0
  const [n, setN] = useState(num ? 0 : target)
  useEffect(() => {
    if (!num) return
    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / 1300)
      setN(Math.round(target * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stat])
  return (
    <div className="stat">
      <b>{num ? n.toLocaleString('en-US') + num[2] : stat.big}</b>
      <span>{stat.small}</span>
    </div>
  )
}

function Plain() {
  return (
    <div className="plain" role="dialog" aria-label="Plain version">
      <button className="chip" onClick={() => set({ plain: false })}>← back to the walk</button>
      <h1>{ME.name}</h1>
      <p className="plain-lede">The same story, without the walking.</p>
      {BEATS.map((b, i) => (
        <section key={i}>
          {(i === 0 || BEATS[i - 1].kicker !== b.kicker) && <h2>{b.kicker}</h2>}
          {b.stat && <p className="plain-stat"><b>{b.stat.big}</b> {b.stat.small}</p>}
          <p>{b.text}{b.meme ? ` (${MEMES[b.meme].bottom}.)` : ''}</p>
          {b.links && (
            <p className="links">
              {b.links.map((l) => <a key={l.href} className="chip" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>)}
            </p>
          )}
        </section>
      ))}
    </div>
  )
}

export function Hud() {
  const [beat, setBeat] = useState(0)
  const [chapter, setChapter] = useState(0)
  const eggs = useStore((s) => s.eggs)
  const toast = useStore((s) => s.toast)
  const tapped = useStore((s) => s.meme)
  const sound = useStore((s) => s.sound)
  const plain = useStore((s) => s.plain)
  const [showEggs, setShowEggs] = useState(false)
  const intro = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const [inRoom, setInRoom] = useState(false)
  const playing = useStore((s) => s.claw)

  // Follow the walk without re-rendering every frame.
  useEffect(() => {
    let raf = 0
    let lastMove = performance.now(), lastT = 0, nudged = false, hinted = false
    const tick = () => {
      const t = live.t
      const at = ahead(t, LOOKAHEAD)
      const b = BEATS.findIndex((x) => at >= x.from && at <= x.to)
      // the intro card does the talking until the walk starts
      setBeat(t < 0.012 ? -1 : b)
      live.talking = b !== -1
      let c = 0
      CHAPTERS.forEach((ch, i) => at >= ch.t - 0.01 && (c = i))
      setChapter(c)
      // The hero: the walk sits in a rounded frame on white, and the frame opens to fill the screen as you scroll.
      const e = smooth(0, HERO_END, t)
      if (intro.current && frame.current && hint.current) {
        const portrait = innerWidth < innerHeight
        const top = intro.current.offsetTop + intro.current.offsetHeight + (portrait ? 14 : 22)
        const side = portrait ? 12 : 24, bottom = portrait ? 64 : 58
        const f = frame.current.style
        f.top = `${top * (1 - e)}px`
        f.left = f.right = `${side * (1 - e)}px`
        f.bottom = `${bottom * (1 - e)}px`
        f.borderRadius = `${(portrait ? 26 : 34) * (1 - e)}px`
        f.visibility = e >= 1 ? 'hidden' : 'visible'
        // the text rides up with the frame's top edge, like a page scrolling away
        intro.current.style.opacity = String(Math.max(0, 1 - e * 1.2))
        intro.current.style.transform = `translateY(${-top * e}px)`
        intro.current.style.visibility = e >= 0.85 ? 'hidden' : 'visible'
        hint.current.style.opacity = String(Math.max(0, 1 - e * 3))
        document.documentElement.style.setProperty('--hero', String(e))
      }
      const r = roomAt(t)
      setInRoom(r > -19 && r < STEPS.done + 6)
      if (fill.current) fill.current.style.height = `${Math.min(1, Math.max(0, t)) * 100}%`

      const now = performance.now()
      if (Math.abs(t - lastT) > 0.0005 || get().claw) (lastMove = now), (lastT = t)
      if (!hinted && t > 0.03) {
        hinted = true
        say('psst: see a little 📺? tap that stall to see what I built.')
      }
      if (!nudged && now - lastMove > 30000 && t > 0.04 && t < 0.92) {
        nudged = true
        say("…you still there? your coffee's getting cold.")
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => set({ toast: null }), 4200)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!tapped) return
    const id = setTimeout(() => set({ meme: null }), 4500)
    return () => clearTimeout(id)
  }, [tapped])

  const b = beat === -1 ? null : BEATS[beat]
  const meme = tapped ?? b?.meme ?? null

  return (
    <div className={playing ? 'hud playing' : 'hud'}>
      <header className="top">
        <a className="brand" href={`mailto:${ME.email}`}>aryan yadav<span>.</span></a>
        <nav>
          <button className="chip" onClick={() => setShowEggs((v) => !v)} aria-expanded={showEggs}>
            🥚 {eggs.length}/{EGG_TOTAL}
          </button>
          <button className="chip" onClick={() => set({ sound: !sound })} aria-pressed={sound}>
            {sound ? '🔊 on' : '🔇 off'}
          </button>
          <button className="chip" onClick={() => set({ plain: true })}>plain version</button>
        </nav>
        {showEggs && (
          <ul className="eggs" onClick={() => setShowEggs(false)}>
            {(Object.keys(EGGS) as (keyof typeof EGGS)[]).map((id) => (
              <li key={id} className={eggs.includes(id) ? 'found' : ''}>
                {eggs.includes(id) ? `✓ ${EGGS[id]}` : '? ? ?'}
              </li>
            ))}
            <li className="hint">tap things (yourself too). scroll weirdly. type a drink. watch some TV.</li>
          </ul>
        )}
      </header>

      <div className="frame" ref={frame} aria-hidden>
        <span className="fig">fig. 1 · the coffee stall, 9:41 am</span>
        <svg className="badge" viewBox="0 0 120 120">
          <defs><path id="ring" d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0" /></defs>
          <circle cx="60" cy="60" r="58" />
          <g className="spin"><text><textPath href="#ring" textLength="280">scroll to walk · grab a coffee ·</textPath></text></g>
          <circle className="core" cx="60" cy="60" r="24" />
          <path className="arrow" d="M60 49 V71 M51 63 L60 72 L69 63" />
        </svg>
      </div>
      <section className="intro" ref={intro} aria-label="Introduction">
        <div className="intro-name">
          <p className="eyebrow"><i />{ME.role}</p>
          <h1>{ME.name}<span>.</span></h1>
          <p className="note" aria-hidden>
            that's me!
            <svg viewBox="0 0 60 90"><path d="M14 4 C 40 20, 46 50, 40 82" /><path d="M30 72 L40 84 L50 70" /></svg>
          </p>
        </div>
        <div className="intro-pitch">
          <p className="lede">{ME.pitch}</p>
          <ul className="stats">
            {HIGHLIGHTS.map((h) => (
              <li key={h.small}><b>{h.big}</b><span>{h.small}</span></li>
            ))}
          </ul>
          <div className="cta">
            <button className="chip go" onClick={() => jumpTo(0.03)}>Take the walk ↓</button>
            <button className="chip" onClick={() => set({ plain: true })}>Read it in 2 minutes</button>
          </div>
        </div>
      </section>
      <div className="scroll-hint" ref={hint}>
        <span className="mouse" aria-hidden><i /></span>
        <b>scroll to start the walk</b>
        <span className="sub">drag to look around · tap any stall 📺</span>
      </div>

      <aside className="rail" aria-label="Chapters">
        <div className="rail-line"><div className="rail-fill" ref={fill} /></div>
        {CHAPTERS.map((c, i) => (
          <button key={c.label} className={i === chapter ? 'on' : ''} style={{ top: `${c.t * 100}%` }} onClick={() => jumpTo(Math.max(0, ahead(c.t, 2.4 - LOOKAHEAD)))} aria-label={`Jump to ${c.label}`}>
            <span>{c.label}</span>
          </button>
        ))}
      </aside>

      <ClawHud />

      {inRoom && !playing && (
        <button className="skip" onClick={() => jumpTo(SKIP_TO)}>
          skip the engine room <b>↓</b>
        </button>
      )}

      {toast && <div className="toast" key={`toast-${toast.id}`}>{toast.text}</div>}
      {meme && <Meme id={meme} key={meme} />}

      {b && (
        <div className={b.stat ? 'caption has-stat' : 'caption'} key={`beat-${beat}`}>
          {b.stat && <StatSticker stat={b.stat} />}
          <div className="kicker"><i />aryan · {b.kicker}</div>
          <p>{b.text}</p>
          {b.links && (
            <div className="links">
              {b.links.map((l) => <a key={l.href} className="chip" href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
            </div>
          )}
        </div>
      )}

      <Tv />
      {plain && <Plain />}
    </div>
  )
}
