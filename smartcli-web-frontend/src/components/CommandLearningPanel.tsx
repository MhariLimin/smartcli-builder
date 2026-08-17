import { AlertTriangle, BookOpen, CheckCircle2, ExternalLink, RotateCcw, ShieldCheck, Terminal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getCommandGuidance } from '../data/commandGuidance';

export function CommandLearningPanel({ template, command, category }: { template: string; command: string; category: string }) {
  const result = template ? getCommandGuidance(template, category) : null;
  const guidance = result?.guidance ?? null;
  const tokens = useMemo(() => (template || command).trim().split(/\s+/).filter(Boolean), [template, command]);
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [template]);

  if (!command.trim()) {
    return <div className="surface-card p-5 text-center text-sm text-slate-500"><BookOpen className="mx-auto mb-2 h-5 w-5" />Select a trusted template to inspect how it works.</div>;
  }

  if (!guidance) {
    return (
      <div className="surface-card border-amber-500/30 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100"><AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />Unverified explanation</p>
        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">This free-form or uncatalogued command has no reviewed guidance yet. SmartCLI will not invent an explanation or imply that it is safe.</p>
        <code className="mt-3 block break-all rounded-lg bg-slate-100 p-3 font-mono text-xs text-slate-800 dark:bg-navy-950 dark:text-slate-200">{command}</code>
      </div>
    );
  }

  const explainedTokens = tokens.filter((token) => Boolean(guidance.tokenDescriptions[token]));
  const activeToken = explainedTokens[Math.min(selected, explainedTokens.length - 1)];
  const tokenDescription = guidance.tokenDescriptions[activeToken];

  return (
    <section aria-labelledby="learn-title" className="surface-card overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-navy-700">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">{result?.coverage === 'reviewed' ? 'Reviewed guidance' : 'Catalog-derived guidance'}</p>
          {result?.coverage === 'catalog-derived' && <span className="rounded border border-slate-300 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:border-navy-700">Verify tool-specific details</span>}
        </div>
        <h2 id="learn-title" className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Understand before you copy</h2>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{guidance.summary}</p>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="border-b border-slate-200 p-4 dark:border-navy-700 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Token inspector</p>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Command tokens">
            {explainedTokens.map((token, index) => (
              <button key={`${token}-${index}`} type="button" onClick={() => setSelected(index)} className={`focus-brand rounded-md border px-2 py-1.5 font-mono text-xs transition ${selected === index ? 'border-cyan-600 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300' : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-500/50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'}`} aria-pressed={selected === index}>{token}</button>
            ))}
          </div>
          {explainedTokens.length < tokens.length && <p className="mt-2 text-[10px] leading-4 text-slate-500">Only tokens with concrete catalog semantics are interactive; SmartCLI does not fill gaps with guessed option meanings.</p>}
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-navy-700 dark:bg-navy-950">
            <code className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-400">{activeToken}</code>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{tokenDescription}</p>
            {guidance.sensitiveSlots?.includes(activeToken) && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300"><ShieldCheck className="h-3.5 w-3.5" />May identify infrastructure; do not place credentials here.</p>}
          </div>
          <Info title="Effect" icon={<Terminal />} text={guidance.effect} />
          <Info title="Expected output" icon={<CheckCircle2 />} text={guidance.expectedOutput} />
        </div>

        <div className="space-y-4 p-4">
          <List title="Assumptions" items={guidance.assumptions} />
          <List title="Common errors" items={guidance.commonErrors} warning />
          <Info title="Verify first" icon={<ShieldCheck />} text={guidance.verification} code />
          {guidance.recovery && <Info title="Recovery" icon={<RotateCcw />} text={guidance.recovery} />}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sources</p>
            <div className="mt-2 flex flex-wrap gap-2">{guidance.sources.map((source) => source.url ? <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="focus-brand inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-cyan-700 hover:bg-cyan-500/10 dark:border-navy-700 dark:text-cyan-400">{source.label}<ExternalLink className="h-3 w-3" /></a> : <span key={source.label} className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-500 dark:border-navy-700">{source.label}</span>)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ title, icon, text, code = false }: { title: string; icon: React.ReactNode; text: string; code?: boolean }) {
  return <div className="mt-4"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><span className="h-3.5 w-3.5">{icon}</span>{title}</p>{code ? <code className="mt-1 block rounded bg-slate-100 px-2 py-1.5 font-mono text-xs text-slate-800 dark:bg-navy-950 dark:text-slate-200">{text}</code> : <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{text}</p>}</div>;
}
function List({ title, items, warning = false }: { title: string; items: string[]; warning?: boolean }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p><ul className="mt-1.5 space-y-1.5">{items.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600 dark:text-slate-400"><span className={warning ? 'text-amber-600' : 'text-cyan-600'}>›</span>{item}</li>)}</ul></div>;
}
