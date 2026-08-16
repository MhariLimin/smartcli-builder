import { ArrowRight, BookOpen, Check, ClipboardCheck, Code2, Database, Moon, ShieldCheck, Sun, Terminal, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTheme } from '../context/AppContext';

const flow = [
  { label: 'Intent', value: 'List pods in a namespace' },
  { label: 'Reviewed template', value: 'kubectl get pods -n <namespace>' },
  { label: 'Typed input', value: 'namespace = default' },
  { label: 'Review', value: 'kubectl get pods -n default' },
];

export default function Landing() {
  const { resolvedTheme, setMode } = useTheme();
  const [heroComplete, setHeroComplete] = useState(false);
  const handleHeroComplete = useCallback(() => setHeroComplete(true), []);

  return (
    <div className="landing-font min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-black dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl dark:border-navy-800 dark:bg-black/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="SmartCLI home" className="focus-brand rounded-md">
            <img src="/brand/smartcli-wordmark-light.svg" alt="SmartCLI" className="h-8 w-[142px] object-contain object-left dark:hidden" />
            <img src="/brand/smartcli-wordmark.svg" alt="" className="hidden h-8 w-[142px] object-contain object-left dark:block" />
          </Link>
          <nav aria-label="Public navigation" className="flex items-center gap-1.5">
            <Link to="/catalog" className="focus-brand hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-navy-800 dark:hover:text-slate-100 sm:inline-flex">
              Catalog
            </Link>
            <button
              type="button"
              onClick={() => setMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="focus-brand rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-navy-800 dark:hover:text-slate-100"
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/builder" className="focus-brand inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
              Try Builder <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-navy-800">
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[52rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
            <div className="landing-enter max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-700/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Review first. Copy when ready.
              </div>
              <div className="relative">
                <span aria-hidden className="cli-display absolute right-full top-0 mr-3 hidden text-4xl font-semibold text-cyan-600 dark:text-cyan-400 sm:block">$</span>
                <TypewriterHeading onComplete={handleHeroComplete} />
              </div>
              <AnimatedHeroCopy active={heroComplete} />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/builder" className="focus-brand inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500">
                  Build a command <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/catalog" className="focus-brand inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800">
                  <BookOpen className="h-4 w-4" /> Browse catalog
                </Link>
              </div>
            </div>

            <div className="terminal-panel landing-enter-delay rounded-2xl border border-slate-300 bg-white p-2 shadow-xl shadow-slate-300/40 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-2xl dark:border-navy-700 dark:bg-navy-900 dark:shadow-black/50">
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-navy-800">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono text-[11px] text-slate-500">smartcli — builder</span>
              </div>
              <div className="space-y-2 p-3 sm:p-4">
                {flow.map((item, index) => (
                  <div key={item.label} style={{ animationDelay: `${520 + index * 180}ms` }} className="cli-output grid grid-cols-[24px_1fr] gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 transition duration-200 hover:border-cyan-500/50 hover:bg-cyan-500/5 dark:border-navy-700 dark:bg-navy-850">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-[11px] font-bold text-white">{index + 1}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                      <code className="mt-1 block overflow-x-auto text-xs text-slate-800 dark:text-slate-200">{item.value}</code>
                    </div>
                  </div>
                ))}
                <div style={{ animationDelay: '1.28s' }} className="cli-output flex items-center justify-between rounded-lg border border-emerald-600/30 bg-emerald-500/10 px-3 py-2 font-mono text-xs text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Values resolved; ready for review</span>
                  <ClipboardCheck className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <Reveal id="audiences" variant="scan" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-5 md:grid-cols-2">
            <AudienceCard
              icon={<BookOpen className="h-5 w-5" />}
              eyebrow="For newcomers"
              title="Learn the command while building it"
              current="Named inputs, contextual hints, and a full preview make substitutions visible before copy."
              direction="Planned explanations will cover flags, expected output, common errors, verification, and rollback guidance."
            />
            <AudienceCard
              icon={<Users className="h-5 w-5" />}
              eyebrow="For operations teams"
              title="Turn one-off commands into repeatable knowledge"
              current="A reviewed catalog, saved commands, folders, tags, and history make useful commands easier to recover."
              direction="Planned workspaces add approved runbooks, environment profiles, versioning, policy checks, and audit history."
            />
          </div>
        </Reveal>

        <Reveal id="safety" variant="left" className="border-y border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-950">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Focused by design</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">A structured layer between discovery and the terminal</h2>
            </div>
            <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-navy-700 dark:bg-navy-700 md:grid-cols-3">
              <Comparison icon={<Terminal />} title="SmartCLI" text="Catalog-backed templates, explicit inputs, visible output, and reusable local knowledge." />
              <Comparison icon={<Code2 />} title="Chat assistants" text="Excellent for open-ended discovery; answers still benefit from validation and team context." />
              <Comparison icon={<BookOpen />} title="Cheat sheets" text="Fast static references; less suited to guided substitution, personalization, and reuse." />
            </div>
          </div>
        </Reveal>

        <Reveal id="roadmap" variant="right" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Architecture and direction</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Small, reviewable boundaries</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">The React client composes commands. A Spring API searches a versioned catalog and persists local history. Neither layer runs shell commands.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <RoadmapItem icon={<Code2 />} label="Shipped" text="Guided Builder, catalog, saved commands, and history." />
              <RoadmapItem icon={<Database />} label="Next" text="Supabase authentication, persistence, and role policies." />
              <RoadmapItem icon={<ShieldCheck />} label="Direction" text="Explanations, provenance, safety checks, and governed runbooks." />
            </div>
          </div>
        </Reveal>

        <Reveal variant="scan" className="border-t border-slate-200 px-4 py-14 text-center dark:border-navy-800">
          <h2 className="text-2xl font-bold tracking-tight">Build the command. Understand every value.</h2>
          <Link to="/builder" className="focus-brand mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500">
            Try the Builder <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </main>
      <footer className="border-t border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-950">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
          <div className="max-w-sm">
            <img src="/brand/smartcli-wordmark-light.svg" alt="SmartCLI" className="h-8 w-[142px] object-contain object-left dark:hidden" />
            <img src="/brand/smartcli-wordmark.svg" alt="" className="hidden h-8 w-[142px] object-contain object-left dark:block" />
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">Guided, inspectable command authoring for people who operate real systems.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500"><ShieldCheck className="h-4 w-4 text-cyan-700 dark:text-cyan-400" /> Copy-only by design</div>
          </div>
          <FooterGroup title="Product" links={[['Builder', '/builder'], ['Command catalog', '/catalog'], ['Roadmap', '#roadmap']]} />
          <FooterGroup title="Principles" links={[['Safety boundary', '#safety'], ['For newcomers', '#audiences'], ['Architecture', '#roadmap']]} />
        </div>
        <div className="border-t border-slate-200 dark:border-navy-800">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {new Date().getFullYear()} SmartCLI. Built for deliberate operations.</p>
            <p>No command execution. No credential storage.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const HERO_TEXT = 'Validated commands,\nbuilt with intent.';

function TypewriterHeading({ onComplete }: { onComplete: () => void }) {
  const [visibleText, setVisibleText] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleText(HERO_TEXT);
      setComplete(true);
      onComplete();
      return;
    }

    let index = 0;
    let timer = 0;
    const typeNext = () => {
      index += 1;
      setVisibleText(HERO_TEXT.slice(0, index));
      if (index < HERO_TEXT.length) {
        const character = HERO_TEXT[index - 1];
        const delay = character === ',' ? 210 : character === '\n' ? 260 : 42 + Math.random() * 34;
        timer = window.setTimeout(typeNext, delay);
      } else {
        setComplete(true);
        onComplete();
      }
    };

    timer = window.setTimeout(typeNext, 320);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <h1 className="cli-display min-h-[3.8rem] w-full whitespace-pre-line text-2xl font-semibold leading-[1.18] tracking-[-0.045em] text-slate-950 dark:text-white sm:min-h-[7.2rem] sm:text-5xl lg:text-[3.15rem]">
      <span className="sr-only">{HERO_TEXT}</span>
      <span aria-hidden>
        <span className="block whitespace-nowrap">
          {visibleText.split('\n')[0]}
          {!visibleText.includes('\n') && <span className="cli-cursor text-cyan-600 dark:text-cyan-400" />}
        </span>
        {visibleText.includes('\n') && (
          <span className="block whitespace-nowrap text-cyan-600 dark:text-cyan-400">
            {visibleText.split('\n')[1]}
            <span className={`cli-cursor ${complete ? 'opacity-80' : ''}`} />
          </span>
        )}
      </span>
    </h1>
  );
}

const HERO_COPY = 'SmartCLI guides you from a reviewed template to an inspectable command—without hiding flags or inventing syntax in a chat response.';

function AnimatedHeroCopy({ active }: { active: boolean }) {
  const words = HERO_COPY.split(' ');
  return (
    <div className="mt-6 w-full">
      <p className="min-h-[5.25rem] text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
        {active ? words.map((word, index) => (
          <span key={`${word}-${index}`} className="cli-word" style={{ animationDelay: `${index * 36}ms` }}>{word}{index < words.length - 1 ? '\u00a0' : ''}</span>
        )) : <span className="sr-only">{HERO_COPY}</span>}
      </p>
      <p className={`cli-display mt-3 text-sm font-medium text-slate-700 transition-all duration-500 dark:text-slate-300 ${active ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'}`} style={{ transitionDelay: `${words.length * 36 + 120}ms` }}>
        <span className="mr-2 text-cyan-700 dark:text-cyan-400" aria-hidden>✓</span>SmartCLI never executes commands or stores credentials.
      </p>
    </div>
  );
}

function AudienceCard({ icon, eyebrow, title, current, direction }: { icon: ReactNode; eyebrow: string; title: string; current: string; direction: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg dark:border-navy-700 dark:bg-navy-900">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">{icon}</div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{current}</p>
      <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500 dark:border-navy-700"><strong className="text-slate-700 dark:text-slate-300">Roadmap:</strong> {direction}</p>
    </article>
  );
}

function Comparison({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article className="bg-white p-5 transition duration-200 hover:bg-slate-50 dark:bg-navy-900 dark:hover:bg-navy-850"><div className="h-5 w-5 text-cyan-700 dark:text-cyan-400">{icon}</div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p></article>;
}

function RoadmapItem({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/40 dark:border-navy-700 dark:bg-navy-900"><div className="h-5 w-5 text-cyan-700 dark:text-cyan-400">{icon}</div><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{text}</p></article>;
}

function Reveal({ children, className, id, variant = 'scan' }: { children: ReactNode; className?: string; id?: string; variant?: 'scan' | 'left' | 'right' }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add('is-visible');
        observer.disconnect();
      }
    }, { threshold: 0.04, rootMargin: '-8% 0px -30% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <section ref={ref} id={id} data-reveal={variant} className={`reveal-section ${className ?? ''}`}>{children}</section>;
}

function FooterGroup({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith('/') ? <Link to={href} className="text-sm text-slate-600 transition hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-400">{label}</Link> : <a href={href} className="text-sm text-slate-600 transition hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-400">{label}</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
