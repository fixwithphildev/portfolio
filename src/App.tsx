import { useEffect, useRef, useState } from 'react'

// ─── Responsive helper ───────────────────────────────────────────
function useIsMobile(breakpoint = 760) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

// ─── Custom cursor ───────────────────────────────────────────────
function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })
  const raf = useRef<number>(0)
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || !window.matchMedia('(pointer: fine)').matches)
  )

  useEffect(() => {
    if (isTouch) return
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', move)
    const tick = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.11
      ring.current.y += (pos.current.y - ring.current.y) * 0.11
      if (dotRef.current) dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.current.x - 20}px, ${ring.current.y - 20}px)`
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf.current) }
  }, [isTouch])

  if (isTouch) return null

  return (
    <>
      <div ref={dotRef} style={{ position: 'fixed', top: 0, left: 0, width: 8, height: 8, borderRadius: '50%', background: '#c8f135', pointerEvents: 'none', zIndex: 9999, willChange: 'transform' }} />
      <div ref={ringRef} style={{ position: 'fixed', top: 0, left: 0, width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(200,241,53,0.45)', pointerEvents: 'none', zIndex: 9998, willChange: 'transform' }} />
    </>
  )
}

// ─── Magnetic wrapper ────────────────────────────────────────────
function Magnetic({ children, strength = 0.4, radius = 160, className = '', style = {} }: {
  children: React.ReactNode; strength?: number; radius?: number; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const raf = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current; if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2
      const dx = e.clientX - cx, dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      target.current = dist < radius ? { x: dx * strength * (1 - dist / radius), y: dy * strength * (1 - dist / radius) } : { x: 0, y: 0 }
    }
    const tick = () => {
      const el = ref.current; if (el) {
        current.current.x += (target.current.x - current.current.x) * 0.1
        current.current.y += (target.current.y - current.current.y) * 0.1
        el.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`
      }
      raf.current = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove)
    raf.current = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current) }
  }, [strength, radius])

  return <div ref={ref} style={{ willChange: 'transform', ...style }} className={className}>{children}</div>
}

// ─── Floating orbit tag ──────────────────────────────────────────
function OrbitTag({ label, baseX, baseY, color = '#c8f135', small = false }: { label: string; baseX: number; baseY: number; color?: string; small?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const cur = useRef({ x: baseX, y: baseY })
  const raf = useRef<number>(0)

  useEffect(() => {
    const tick = () => {
      const el = ref.current
      if (!el) { raf.current = requestAnimationFrame(tick); return }
      let tx = baseX, ty = baseY
      if (!small) {
        const mx = (window as any).__mx ?? 0, my = (window as any).__my ?? 0
        const rect = el.closest('[data-hero]')?.getBoundingClientRect()
        if (rect) {
          const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2
          const dx = mx - cx, dy = my - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 300) {
            const pull = Math.pow(1 - dist / 300, 1.6) * 1.1
            tx = baseX + (dx * 0.3 - baseX) * pull
            ty = baseY + (dy * 0.3 - baseY) * pull
          }
        }
      }
      cur.current.x += (tx - cur.current.x) * 0.07
      cur.current.y += (ty - cur.current.y) * 0.07
      el.style.transform = `translate(${cur.current.x}px, ${cur.current.y}px)`
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [baseX, baseY, small])

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '50%', left: '50%',
      marginTop: small ? -10 : -14, marginLeft: small ? -30 : -44,
      transform: `translate(${baseX}px,${baseY}px)`,
      willChange: 'transform',
      fontFamily: 'Space Mono, monospace', fontSize: small ? 8 : 10, letterSpacing: '0.1em',
      padding: small ? '3px 8px' : '5px 12px', border: `1px solid ${color}44`, color, background: `${color}0c`,
      borderRadius: 2, whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
    }}>
      {label}
    </div>
  )
}

// ─── Section label ───────────────────────────────────────────────
function SectionLabel({ n, text }: { n: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 56 }}>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#c8f135', letterSpacing: '0.2em' }}>{n}</span>
      <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#444', letterSpacing: '0.2em' }}>{text}</span>
    </div>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useIsMobile()
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = ['About', 'Skills', 'Projects', 'Certifications', 'Contact']
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: isMobile ? '14px 16px' : '16px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: isMobile ? 12 : 0,
      background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #1a1a1a' : '1px solid transparent',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: isMobile ? 14 : 16, color: '#c8f135', letterSpacing: '-0.02em', cursor: 'none', flexShrink: 0 }}>
        atabo.philip
      </div>
      {!isMobile && (
        <div style={{ display: 'flex', gap: 32 }}>
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#666',
              textDecoration: 'none', cursor: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f0f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#666')}
            >{l}</a>
          ))}
        </div>
      )}
      {isMobile ? (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, justifyContent: 'flex-end', scrollbarWidth: 'none' }}>
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#888',
              textDecoration: 'none', cursor: 'none', whiteSpace: 'nowrap',
              padding: '4px 0', flexShrink: 0,
            }}>{l}</a>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#3FB8A6', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3FB8A6', display: 'inline-block', boxShadow: '0 0 8px #3FB8A6' }} />
          OPEN TO WORK
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────
function Hero() {
  const isMobile = useIsMobile()
  const scale = isMobile ? 0.42 : 1
  const tags = [
    { label: 'REACT', baseX: -230 * scale, baseY: -90 * scale, color: '#7DF9FF' },
    { label: 'NODE.JS', baseX: 200 * scale, baseY: -110 * scale, color: '#c8f135' },
    { label: 'LINUX', baseX: -190 * scale, baseY: 100 * scale, color: '#FF6FD8' },
    { label: 'DOCKER', baseX: 220 * scale, baseY: isMobile ? 60 * scale : 80 * scale, color: '#c8f135' },
    { label: 'DNS', baseX: -50 * scale, baseY: -150 * scale, color: '#FF6FD8' },
    { label: 'WORDPRESS', baseX: 60 * scale, baseY: isMobile ? 110 * scale : 150 * scale, color: '#7DF9FF' },
  ]

  return (
    <section data-hero id="hero" style={{
      minHeight: isMobile ? '860px' : '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #0c1800 0%, #080808 70%)',
      paddingTop: isMobile ? 72 : 0,
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(200,241,53,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(200,241,53,0.035) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      {/* Scan line */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,241,53,0.12), transparent)', animation: 'scan 9s linear infinite', pointerEvents: 'none' }} />

      {/* Main text */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 24px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: isMobile ? 9 : 11, letterSpacing: '0.3em', color: '#c8f135', marginBottom: 28, opacity: 0.8 }}>
          FULL STACK · IT INFRASTRUCTURE · ABUJA, NIGERIA
        </div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(40px, 12vw, 120px)', lineHeight: 0.88, letterSpacing: '-0.03em', color: '#f0f0f0', margin: '0 0 16px' }}>
          ATABO
          <br />
          <span style={{ color: '#c8f135', textShadow: '0 0 60px rgba(200,241,53,0.35)' }}>PHILIP</span>
          <br />
          ISAAC
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#666', marginTop: 28, maxWidth: 420, margin: '28px auto 0', lineHeight: 1.75 }}>
          Building reliable web applications and keeping systems running — from code to infrastructure.
        </p>
      </div>

      {/* Magnetic button with orbit tags */}
      <div style={{ position: 'relative', zIndex: 2, width: 1, height: 1, marginTop: isMobile ? 56 : 80 }} data-hero>
        {tags.map((t, i) => <OrbitTag key={i} {...t} small={isMobile} />)}
        <Magnetic strength={0.55} radius={210}>
          <a
            href="https://mail.google.com/mail/?view=cm&to=philipdeveloper96@gmail.com"
            target="_blank" rel="noopener noreferrer"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'block',
              background: '#c8f135', color: '#080808',
              padding: isMobile ? '16px 32px' : '20px 48px',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: isMobile ? 13 : 15, letterSpacing: '0.15em',
              textDecoration: 'none', cursor: 'none', borderRadius: 2, whiteSpace: 'nowrap',
              boxShadow: '0 0 40px rgba(200,241,53,0.35), 0 0 80px rgba(200,241,53,0.12)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d4f94a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#c8f135')}
          >
            GET IN TOUCH
          </a>
        </Magnetic>
      </div>

      {/* Sidebar stats */}
      <div style={{
        position: isMobile ? 'static' : 'absolute', left: 32, bottom: 40,
        display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 16 : 16,
        marginTop: isMobile ? 64 : 0, justifyContent: isMobile ? 'space-between' : 'flex-start',
        width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? 340 : 'none',
        padding: isMobile ? '0 24px' : 0, boxSizing: 'border-box',
      }}>
        {[['6+', 'years combined'], ['250+', 'users supported'], ['4', 'platforms shipped']].map(([v, l]) => (
          <div key={l} style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, color: '#c8f135' }}>{v}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#444', letterSpacing: '0.1em' }}>{l}</div>
          </div>
        ))}
      </div>
      {!isMobile && (
        <div style={{ position: 'absolute', bottom: 24, right: 32, fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a2a2a', letterSpacing: '0.12em' }}>
          philipdeveloper96@gmail.com
        </div>
      )}
    </section>
  )
}

// ─── Marquee ──────────────────────────────────────────────────────
function Marquee() {
  const items = ['REACT', 'NODE.JS', 'EXPRESS', 'MONGODB', 'MYSQL', 'WORDPRESS', 'LINUX', 'DOCKER', 'AWS', 'DNS', 'REST API', 'GITHUB ACTIONS']
  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid #161616', borderBottom: '1px solid #161616', padding: '13px 0', background: '#0a0a0a' }}>
      <div style={{ display: 'flex', animation: 'marquee 22s linear infinite', width: 'max-content' }}>
        {doubled.map((t, i) => (
          <span key={i} style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.22em', color: i % 4 === 0 ? '#c8f135' : '#222', padding: '0 32px', whiteSpace: 'nowrap' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── About ────────────────────────────────────────────────────────
function About() {
  const isMobile = useIsMobile()
  return (
    <section id="about" style={{ padding: isMobile ? '72px 20px' : '120px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionLabel n="01" text="ABOUT" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'start' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.0, letterSpacing: '-0.03em', color: '#f0f0f0', margin: '0 0 32px' }}>
            Two sides of<br />
            <span style={{ color: '#c8f135' }}>the same</span><br />
            discipline
          </h2>
        </div>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#888', lineHeight: 1.85, margin: '0 0 20px' }}>
            I've spent over six years split between building web applications and keeping the infrastructure underneath them running — a combination that's less common than it sounds, and more useful than it looks on paper.
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#888', lineHeight: 1.85, margin: '0 0 20px' }}>
            Day to day, I develop with React, Node.js, Express, and RESTful APIs, work across MongoDB and MySQL, and build and maintain WordPress sites end-to-end — domains, hosting, DNS, and the maintenance that keeps a site fast and online.
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#666', lineHeight: 1.85 }}>
            The result: I don't just ship code and hand it off. I understand what happens to it once it's live — and I'm usually the one who gets the call when something breaks.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            {[['React · Node · Express', '#c8f135'], ['WordPress', '#7DF9FF'], ['Linux · DNS · Hosting', '#FF6FD8']].map(([t, c]) => (
              <span key={t} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, padding: '6px 14px', border: `1px solid ${c}33`, color: c as string, background: `${c}0d`, letterSpacing: '0.08em', borderRadius: 2 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Skills ───────────────────────────────────────────────────────
function Skills() {
  const isMobile = useIsMobile()
  const groups = [
    {
      cat: 'frontend', color: '#c8f135',
      items: ['JavaScript', 'React', 'HTML5', 'CSS3', 'Responsive design'],
    },
    {
      cat: 'backend & devops', color: '#7DF9FF',
      items: ['Node.js & Express.js', 'REST APIs', 'Docker', 'GitHub Actions', 'AWS (basic) & Linux'],
    },
    {
      cat: 'it & infrastructure', color: '#FF6FD8',
      items: ['WordPress development', 'DNS, domain & hosting mgmt', 'cPanel & GoDaddy', 'Networking & troubleshooting', 'ServiceNow / incident mgmt'],
    },
  ]
  return (
    <section id="skills" style={{ padding: isMobile ? '0 20px 64px' : '0 40px 120px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionLabel n="02" text="SKILLS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 1, background: '#151515' }}>
        {groups.map(g => (
          <Magnetic key={g.cat} strength={0.12} radius={180}>
            <div style={{ background: '#080808', padding: '40px 32px', borderBottom: `2px solid ${g.color}1a`, cursor: 'none' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: g.color, letterSpacing: '0.2em', marginBottom: 28, textTransform: 'uppercase' }}>{g.cat}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {g.items.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#b0b0b0' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Magnetic>
        ))}
      </div>
    </section>
  )
}

// ─── Projects ─────────────────────────────────────────────────────
function Projects() {
  const isMobile = useIsMobile()
  const projects = [
    {
      n: '01',
      title: 'FixWithPhil',
      tags: ['IT Support', 'Web Services', 'Firebase Hosting'],
      desc: 'Personal technology services site covering IT support, web development, and hosting/DNS management. Originally on a custom domain; currently deployed on Firebase Hosting while the domain is renewed.',
      link: true,
      href: 'https://fixwithphil-dev.web.app/',
      accent: '#c8f135',
    },
    {
      n: '02',
      title: 'Consultation Booking Website',
      tags: ['Full Stack', 'Responsive', 'Contact Form'],
      desc: 'A responsive consultation booking site with an integrated enquiry form, built and optimized for mobile users end to end.',
      link: false,
      accent: '#7DF9FF',
    },
    {
      n: '03',
      title: 'Real Estate Listing Platform',
      tags: ['Web Development', 'Search & Filtering'],
      desc: 'A property listing platform with search and filtering, focused on a fast, usable browsing experience across devices.',
      link: false,
      accent: '#FF6FD8',
    },
    {
      n: '04',
      title: 'Operations Portal',
      tags: ['Multi-department', 'Access Control', 'Live Operations'],
      desc: 'A unified operations system for a multi-branch residence covering Duty Desk, Gatehouse Security, and Maintenance — three departments under one portal, each with separate login and access controls.',
      link: true,
      href: 'https://duty-desk-gatehouse-9d2v.vercel.app/',
      accent: '#c8f135',
    },
  ]

  return (
    <section id="projects" style={{ padding: isMobile ? '0 20px 64px' : '0 40px 120px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionLabel n="03" text="PROJECTS" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#151515' }}>
        {projects.map(p => (
          <div key={p.n} style={{ background: '#080808', padding: isMobile ? '28px 20px' : '40px 40px', display: 'grid', gridTemplateColumns: isMobile ? '28px 1fr' : '64px 1fr auto', gap: isMobile ? 16 : 32, alignItems: 'start', cursor: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0c0c0c')}
            onMouseLeave={e => (e.currentTarget.style.background = '#080808')}
          >
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: p.accent, letterSpacing: '0.15em', paddingTop: 4 }}>{p.n}</div>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: isMobile ? 19 : 24, color: '#f0f0f0', margin: '0 0 12px', lineHeight: 1.1 }}>{p.title}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {p.tags.map(t => (
                  <span key={t} style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '3px 10px', border: `1px solid ${p.accent}33`, color: p.accent, background: `${p.accent}0c`, borderRadius: 2, letterSpacing: '0.08em' }}>{t}</span>
                ))}
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666', lineHeight: 1.8, margin: 0, maxWidth: 560 }}>{p.desc}</p>
              {isMobile && p.link && (
                (p as any).href ? (
                  <a href={(p as any).href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 16, fontFamily: 'Space Mono, monospace', fontSize: 11, color: p.accent, whiteSpace: 'nowrap', textDecoration: 'none' }}>View live ↗</a>
                ) : (
                  <span style={{ display: 'inline-block', marginTop: 16, fontFamily: 'Space Mono, monospace', fontSize: 11, color: p.accent, whiteSpace: 'nowrap' }}>View live ↗</span>
                )
              )}
            </div>
            {!isMobile && (
              <div>
                {p.link && (
                  <Magnetic strength={0.5} radius={80}>
                    {(p as any).href ? (
                      <a href={(p as any).href} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: p.accent, whiteSpace: 'nowrap', cursor: 'none', textDecoration: 'none' }}>View live ↗</a>
                    ) : (
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: p.accent, whiteSpace: 'nowrap', cursor: 'none' }}>View live ↗</span>
                    )}
                  </Magnetic>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Certifications ───────────────────────────────────────────────
function Certifications() {
  const isMobile = useIsMobile()
  const certs = [
    { title: 'WordPress & SEO Masterclass with Generative AI', status: 'completed', color: '#c8f135' },
    { title: 'Google IT Support Professional Certificate', status: 'in progress', color: '#E2A33D' },
    { title: 'Google Technical Support Fundamentals', status: 'completed', color: '#c8f135' },
    { title: 'Introduction to Linux — Linux Foundation', status: 'completed', color: '#c8f135' },
  ]
  return (
    <section id="certifications" style={{ padding: isMobile ? '0 20px 64px' : '0 40px 120px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionLabel n="04" text="CERTIFICATIONS" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #1a1a1a' }}>
        {certs.map((c, i) => (
          <div key={i} style={{ padding: isMobile ? '18px 18px' : '28px 36px', borderBottom: i < certs.length - 1 ? '1px solid #161616' : 'none', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 10 : 24, cursor: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#333', letterSpacing: '0.1em', width: 24 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#ccc' }}>{c.title}</span>
            </div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '4px 12px', border: `1px solid ${c.color}44`, color: c.color, background: `${c.color}0c`, borderRadius: 2, letterSpacing: '0.12em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Contact ──────────────────────────────────────────────────────
function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const isMobile = useIsMobile()

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0f0f0f', border: '1px solid #1e1e1e',
    borderRadius: 2, padding: '14px 16px', color: '#f0f0f0',
    fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s', cursor: 'none',
  }

  const links = [
    { label: 'email', value: 'philipdeveloper96@gmail.com', href: 'https://mail.google.com/mail/?view=cm&to=philipdeveloper96@gmail.com' },
    { label: 'phone', value: '+234 902 680 0344', href: 'tel:+2349026800344' },
    { label: 'linkedin', value: 'philip-atabo', href: 'https://linkedin.com/in/philip-atabo' },
    { label: 'github', value: 'Philipdev-techy', href: 'https://github.com/Philipdev-techy' },
  ]

  return (
    <section id="contact" style={{ padding: isMobile ? '0 20px 64px' : '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionLabel n="05" text="CONTACT" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 80 }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.0, letterSpacing: '-0.03em', color: '#f0f0f0', margin: '0 0 20px' }}>
            Let's<br /><span style={{ color: '#c8f135' }}>talk.</span>
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666', lineHeight: 1.8, marginBottom: 40 }}>
            Open to remote roles in web development and IT infrastructure. Fastest way to reach me is email.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {links.map(l => (
              <div key={l.label}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#444', letterSpacing: '0.2em', marginBottom: 4, textTransform: 'uppercase' }}>{l.label}</div>
                <a href={l.href} style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#c8f135', textDecoration: 'none', cursor: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#d4f94a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c8f135')}
                >{l.value}</a>
              </div>
            ))}
          </div>
        </div>
        <div>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            onSubmit={e => {
              e.preventDefault()
              const subject = encodeURIComponent(`Hello from ${name}`)
              const body = encodeURIComponent(`${msg}\n\nFrom: ${name}\nEmail: ${email}`)
              window.open(`https://mail.google.com/mail/?view=cm&to=philipdeveloper96@gmail.com&su=${subject}&body=${body}`, '_blank')
            }}
          >
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#c8f13566')}
              onBlur={e => (e.target.style.borderColor = '#1e1e1e')}
            />
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#c8f13566')}
              onBlur={e => (e.target.style.borderColor = '#1e1e1e')}
            />
            <textarea placeholder="Message" value={msg} onChange={e => setMsg(e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = '#c8f13566')}
              onBlur={e => (e.target.style.borderColor = '#1e1e1e')}
            />
            <Magnetic strength={0.3} radius={100}>
              <button type="submit" style={{
                width: '100%', background: '#c8f135', color: '#080808', border: 'none',
                padding: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                fontSize: 14, letterSpacing: '0.12em', borderRadius: 2, cursor: 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#d4f94a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#c8f135')}
              >
                SEND MESSAGE
              </button>
            </Magnetic>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#333', lineHeight: 1.6, letterSpacing: '0.05em', margin: 0 }}>
              Opens your email app with this message pre-filled — nothing is stored or sent from this page.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #141414', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 18, color: '#c8f135', letterSpacing: '-0.02em' }}>atabo.philip</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a2a2a', letterSpacing: '0.12em' }}>© 2026 ATABO PHILIP ISAAC</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a2a2a', letterSpacing: '0.12em' }}>ABUJA, NIGERIA — REMOTE-READY</div>
    </footer>
  )
}

// ─── Root ─────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const track = (e: MouseEvent) => { (window as any).__mx = e.clientX; (window as any).__my = e.clientY }
    window.addEventListener('mousemove', track)
    return () => window.removeEventListener('mousemove', track)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      <Cursor />
      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Skills />
      <Projects />
      <Certifications />
      <Contact />
      <Footer />
    </div>
  )
}
