// The engine room's inspect drawer: a terminal that slides in with the real specs of
// whichever kitchen was tapped.
import { useEffect, useRef } from 'react'
import { SPECS } from '../engineSpecs'
import { roomAt } from '../engine'
import { live, openProject, set, useStore } from '../state'

export function Inspect() {
  const i = useStore((s) => s.inspect)
  const last = useRef(0)
  if (i !== null) last.current = i
  const spec = SPECS[last.current]
  const open = i !== null
  const close = () => set({ inspect: null })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    // walking out of the room closes it
    const away = setInterval(() => Math.abs(roomAt(live.t)) > 22 && close(), 300)
    window.addEventListener('keydown', onKey)
    return () => {
      clearInterval(away)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <aside className={open ? 'inspect on' : 'inspect'} aria-hidden={!open} aria-label="Backend details">
      <div className="inspect-top">
        <i />
        <span className="dim">$ inspect</span>
        <span className="amber">{spec.uri}</span>
        <button onClick={close} aria-label="Close">esc ✕</button>
      </div>
      <h2>{spec.title}</h2>
      <p className="dim2">{spec.role}</p>
      <h3>// core challenge</h3>
      <p>{spec.problem}</p>
      <h3>// the fix</h3>
      {spec.fix.map((f) => <p key={f} className="plus"><b>+</b>{f}</p>)}
      <h3>// schema · simplified</h3>
      <pre className="blue">{spec.schema}</pre>
      <h3>// {spec.code.lang} · simplified</h3>
      <pre>{spec.code.text}</pre>
      <div className="inspect-links">
        {last.current === 0 && <button onClick={() => openProject('kg-incident')}>read the ₹582 incident report →</button>}
        <button onClick={() => openProject('engine')}>the whole backend →</button>
      </div>
    </aside>
  )
}
