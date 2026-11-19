import { useEffect, useRef } from 'react'
import { HIGHLIGHTS, ME } from '../story'
import { projectById } from '../projects'
import { set } from '../state'
import { Logo, logoFor } from './logos'

// The "read it in 2 minutes" version: the same story as the walk, laid out like a résumé.
// Copy comes from story.ts and projects.ts, so edit it there.

const JOBS = [
  {
    when: 'Founder & CTO',
    now: true,
    title: 'KhaooGully',
    mark: 'KG',
    tone: 'kg',
    href: 'https://khaoo-gully-customer-web.vercel.app',
    role: 'campus food delivery, pooled',
    about: projectById('khaogully').about,
    points: [
      'Built all five products in production: customer app, restaurant dashboard, rider navigator, inventory and an economics dashboard.',
      'Designed and ran one FastAPI + Supabase Postgres backend serving every app, with Razorpay payments and idempotent money flows.',
      'Took 20 concurrent requests from 12.3 s to 1.4 s by moving blocking database calls off the event loop.',
      'Root-caused a charged-but-no-order payment bug, then made the server refuse to boot if code and database ever disagree.',
    ],
    tools: ['React', 'FastAPI', 'Supabase', 'PostgreSQL', 'React Native', 'Razorpay'],
  },
  {
    when: 'Internship',
    title: 'Deloitte',
    mark: 'D',
    tone: 'dl',
    role: 'won through the hackathon',
    about: 'MailMesh, a visual canvas for processing email orders, took 1st place at the Deloitte hackathon. The win turned into an internship.',
    points: ['1st place, Deloitte hackathon, with MailMesh.'],
    tools: ['Next.js', 'Tailwind'],
  },
  {
    when: '2022 onwards',
    title: 'BitsToBugs',
    mark: 'B',
    tone: 'bb',
    role: 'UI/UX designer → full-stack developer',
    about: projectById('bitstobugs').about,
    points: projectById('bitstobugs').how,
    tools: projectById('bitstobugs').stack,
  },
  {
    when: 'KIIT · B.Tech',
    title: 'Konnexions',
    mark: 'K',
    tone: 'kx',
    role: 'graphic design lead',
    about: "Led graphic design at KIIT's tech society: posters, brands and event visuals. It's why everything I ship still gets a design pass.",
    points: [],
    tools: ['Figma', 'Illustrator'],
  },
]

const FEATURED = projectById('engine')
const WORK = ['mailmesh', 'docrag', 'formfiller', 'nlpsql', 'stocksmart', 'campusbuzz', 'thrift', '3d'].map(projectById)

const STACK = projectById('toolkit').how.map((line) => {
  const [group, items] = line.split(': ')
  return { group, items: items.replace(/\.$/, '').split(', ') }
})

// The logo strip under the hero: every tool that has a logo, once.
const STRIP = [...new Set(['TypeScript', 'React', 'Next.js', 'Python', 'FastAPI', 'PostgreSQL', 'Supabase', 'AWS', ...STACK.flatMap((s) => s.items)])]
  .filter(logoFor)

const KG_PRODUCTS = ['Customer app', 'Restaurant dashboard', 'Delivery navigator', 'Inventory', 'Economics dashboard']

const NAV = [
  ['about', 'About'],
  ['experience', 'Experience'],
  ['work', 'Work'],
  ['stack', 'Stack'],
  ['contact', 'Contact'],
]

const SOCIAL = [
  ['GitHub', ME.github],
  ['LinkedIn', ME.linkedin],
  ['X', ME.x],
  ['Instagram', ME.instagram],
]

const out = { target: '_blank', rel: 'noreferrer' }

function Tools({ names, max = 5 }: { names: string[]; max?: number }) {
  const shown = names.filter(logoFor).slice(0, max)
  return (
    <p className="pv-tools">
      {shown.map((n) => <span key={n} className="pv-tool"><Logo name={n} />{n.replace(/ \d+$/, '')}</span>)}
    </p>
  )
}

function Head({ n, title, note, children }: { n: string; title: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="pv-head">
      <div>
        <p className="pv-num">{n}</p>
        <h2 className="pv-h2">{title}</h2>
        {note && <p className="pv-hand pv-head-note">{note}</p>}
      </div>
      {children}
    </div>
  )
}

export function Plain() {
  const root = useRef<HTMLDivElement>(null)
  const close = () => set({ plain: false })

  useEffect(() => {
    root.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Scroll inside the overlay instead of touching the page hash, which the walk doesn't expect.
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    root.current?.querySelector(`#pv-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="plain" role="dialog" aria-label="Plain version" ref={root} tabIndex={-1}>
      <header className="pv-top">
        <div className="pv-wrap pv-top-inner">
          <a className="pv-brand" href="#pv-hero" onClick={go('hero')}>
            aryan yadav<span>.</span>
          </a>
          <nav className="pv-nav">
            {NAV.map(([id, label]) => <a key={id} href={`#pv-${id}`} onClick={go(id)}>{label}</a>)}
          </nav>
          <button className="pv-btn pv-btn-sm" onClick={close}>← Back to the walk</button>
        </div>
      </header>

      <main className="pv-wrap">
        <section className="pv-hero" id="pv-hero">
          <div className="pv-hero-copy">
            <p className="pv-eyebrow"><i className="pv-dot" />{ME.role}</p>
            <h1 className="pv-name">{ME.name}<span>.</span></h1>
            <p className="pv-title">
              I build products <em>end to end</em>, from the first sketch to production.
            </p>
            <p className="pv-sub">Running KhaooGully · B.Tech at KIIT · Nagpur, India</p>
            <div className="pv-actions">
              <a className="pv-btn pv-btn-primary" href={`mailto:${ME.email}`}>Email me →</a>
              <button className="pv-btn" onClick={close}>☕ Take the 3D walk</button>
            </div>
            <p className="pv-socials">
              {SOCIAL.map(([label, href]) => (
                <a key={label} href={href} {...out} aria-label={label}><Logo name={label} mono />{label}</a>
              ))}
            </p>
          </div>

          <aside className="pv-now">
            <p className="pv-hand pv-now-note">what I'm building right now ↓</p>
            <div className="pv-now-card">
              <div className="pv-now-head">
                <span className="pv-mark pv-mark-kg">KG</span>
                <div>
                  <p className="pv-now-title">KhaooGully</p>
                  <p className="pv-now-sub">{projectById('khaogully').tagline}</p>
                </div>
                <span className="pv-live"><i />live</span>
              </div>
              <ul className="pv-now-list">
                {KG_PRODUCTS.map((p, i) => <li key={p}><b>{i + 1}</b>{p}</li>)}
              </ul>
              <a className="pv-now-link" href="https://khaoo-gully-customer-web.vercel.app" {...out}>Open KhaooGully ↗</a>
            </div>
          </aside>
        </section>

        <ul className="pv-stats">
          {HIGHLIGHTS.map((h) => <li key={h.small}><strong>{h.big}</strong><span>{h.small}</span></li>)}
          <li><strong>5</strong><span>products in production</span></li>
        </ul>

        <div className="pv-strip" aria-label="Tools I use">
          <div className="pv-strip-track">
            {[...STRIP, ...STRIP].map((n, i) => (
              <span key={i} className="pv-strip-item" aria-hidden={i >= STRIP.length}><Logo name={n} />{n}</span>
            ))}
          </div>
        </div>

        <section className="pv-section" id="pv-about">
          <Head n="01" title="About" />
          <div className="pv-about">
            <p className="pv-about-lead">{projectById('about').tagline}</p>
            <p>{projectById('about').about}</p>
          </div>
        </section>

        <section className="pv-section" id="pv-experience">
          <Head n="02" title="Experience" note="design guy turned founder" />
          <ol className="pv-jobs">
            {JOBS.map((j) => (
              <li className="pv-job" key={j.title}>
                <div className="pv-job-side">
                  <span className={`pv-mark pv-mark-${j.tone}`}>{j.mark}</span>
                  <p className="pv-when">{j.when}{j.now && <span className="pv-live"><i />now</span>}</p>
                </div>
                <div>
                  <h3 className="pv-job-title">
                    {j.href ? <a href={j.href} {...out}>{j.title}</a> : j.title}
                    <span> · {j.role}</span>
                  </h3>
                  <p className="pv-muted">{j.about}</p>
                  {j.points.length > 0 && <ul className="pv-points">{j.points.map((p) => <li key={p}>{p}</li>)}</ul>}
                  <Tools names={j.tools} max={6} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pv-section" id="pv-work">
          <Head n="03" title="Selected work" note="the ones I'm proudest of">
            <a className="pv-pill" href={ME.github} {...out}><Logo name="GitHub" mono />See all on GitHub ↗</a>
          </Head>
          <div className="pv-grid">
            <article className="pv-card pv-card-featured">
              <p className="pv-ctx">{FEATURED.context}</p>
              <h3 className="pv-card-title">{FEATURED.title}</h3>
              <p className="pv-muted">{FEATURED.about}</p>
              <ul className="pv-featured-stats">
                {FEATURED.highlights!.map((h) => <li key={h}>{h}</li>)}
              </ul>
              <Tools names={FEATURED.stack} max={6} />
              <p className="pv-note">{FEATURED.note}</p>
            </article>
            {WORK.map((p) => (
              <article className="pv-card" key={p.id}>
                <p className="pv-ctx">{p.context}</p>
                <h3 className="pv-card-title">{p.title}</h3>
                <p className="pv-muted">{p.tagline}</p>
                <Tools names={p.stack} max={3} />
                {p.links ? (
                  <p className="pv-card-links">
                    {p.links.map((l) => <a key={l.href} href={l.href} {...out}>{l.label} ↗</a>)}
                  </p>
                ) : (
                  <p className="pv-note">Private repo · happy to demo</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="pv-section" id="pv-stack">
          <Head n="04" title="Stack" note="frontend? backend? mobile? 3D? i guess bro" />
          <dl className="pv-stack">
            {STACK.map((s) => (
              <div key={s.group}>
                <dt>{s.group}</dt>
                <dd>{s.items.map((t) => <span className="pv-pill" key={t}><Logo name={t} />{t}</span>)}</dd>
              </div>
            ))}
            <div>
              <dt>Cloud</dt>
              <dd>{projectById('aws').stack.map((t, i) => <span className="pv-pill" key={t}>{i === 0 && <Logo name="AWS" />}AWS {t}</span>)}</dd>
            </div>
          </dl>
        </section>

        <section className="pv-contact" id="pv-contact">
          <p className="pv-hand pv-contact-note">psst, the coffee's on me</p>
          <h2 className="pv-contact-title">Building something?<br />I'd like to hear about it.</h2>
          <p className="pv-contact-sub">Email is the fastest way to reach me.</p>
          <div className="pv-actions">
            <a className="pv-btn pv-btn-light" href={`mailto:${ME.email}`}>{ME.email}</a>
            <a className="pv-btn pv-btn-ghost" href={ME.linkedin} {...out}><Logo name="LinkedIn" mono />LinkedIn</a>
          </div>
        </section>

        <footer className="pv-footer">
          © {new Date().getFullYear()} {ME.name} · Nagpur, India ·{' '}
          <button className="pv-linkish" onClick={close}>Take the walk instead</button>
        </footer>
      </main>
    </div>
  )
}
