import { Check, ChevronRight, Circle, Container, GitBranch, Network, ShieldCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Suggestion } from '../types';

export interface StarterTask {
  id: string;
  title: string;
  outcome: string;
  explanation: string;
  verification: string;
  icon: ReactNode;
  suggestion: Suggestion;
}

export const STARTER_TASKS: StarterTask[] = [
  {
    id: 'inspect-deployment',
    title: 'Inspect a deployment',
    outcome: 'Read Kubernetes deployment state without changing it.',
    explanation: '`describe` reads configuration and recent events in one namespace.',
    verification: 'Confirm the deployment name and namespace before copying.',
    icon: <Network className="h-4 w-4" />,
    suggestion: {
      text: 'kubectl describe deployment <name> -n <namespace>',
      description: 'Describe a Kubernetes deployment', category: 'kubectl',
      placeholders: ['name', 'namespace'], kind: 'TEMPLATE'
    }
  },
  {
    id: 'recover-branch',
    title: 'Recover a Git branch',
    outcome: 'Inspect recent HEAD movements before choosing a recovery point.',
    explanation: '`reflog` is a local record of where HEAD and branches recently pointed.',
    verification: 'Review the commit hash before using it in a separate recovery command.',
    icon: <GitBranch className="h-4 w-4" />,
    suggestion: {
      text: 'git reflog', description: 'Show local ref history for recovery',
      category: 'git', placeholders: [], kind: 'TEMPLATE'
    }
  },
  {
    id: 'diagnose-container',
    title: 'Diagnose a container',
    outcome: 'Read recent container output without opening a shell.',
    explanation: '`logs --tail` prints only the requested number of recent lines.',
    verification: 'Confirm the container name and keep the line count small first.',
    icon: <Container className="h-4 w-4" />,
    suggestion: {
      text: 'docker logs --tail <lines> <container>', description: 'Show recent container logs',
      category: 'docker', placeholders: ['lines', 'container'], kind: 'TEMPLATE'
    }
  }
];

interface Props {
  selectedTask: StarterTask | null;
  hasUnfilled: boolean;
  completed: boolean;
  onSelect: (task: StarterTask) => void;
  onSkip: () => void;
  onFinish: () => void;
}

export function FirstRunGuide({ selectedTask, hasUnfilled, completed, onSelect, onSkip, onFinish }: Props) {
  return (
    <section aria-labelledby="first-run-title" className="surface-card overflow-hidden border-cyan-500/30">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-cyan-500/5 px-4 py-3 dark:border-navy-700">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Guided first run</p>
          <h2 id="first-run-title" className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {completed ? 'First command complete' : selectedTask ? selectedTask.title : 'What do you need to do?'}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {completed ? 'You reviewed and kept control of the final command.' : selectedTask ? selectedTask.outcome : 'Choose a safe, realistic task. You can leave the guide at any time.'}
          </p>
        </div>
        <button type="button" onClick={onSkip} className="focus-brand rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-navy-800 dark:hover:text-slate-100" aria-label="Skip guided first run" title="Skip guide">
          <X className="h-4 w-4" />
        </button>
      </div>

      {completed ? (
        <div className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Check className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ready for the next command</p><p className="mt-1 text-xs leading-5 text-slate-500">The command was copied or saved. SmartCLI did not execute it or store credentials.</p></div>
          </div>
          <button type="button" onClick={onFinish} className="focus-brand rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500">Finish guide</button>
        </div>
      ) : !selectedTask ? (
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {STARTER_TASKS.map((task) => (
            <button key={task.id} type="button" onClick={() => onSelect(task)} className="focus-brand group rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-sm dark:border-navy-700 dark:bg-navy-900 dark:hover:border-cyan-500/50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">{task.icon}</span>
              <span className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{task.title}<ChevronRight className="h-3.5 w-3.5 text-slate-500 transition group-hover:translate-x-0.5" /></span>
              <span className="mt-1 block text-[11px] leading-5 text-slate-500">{task.outcome}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 p-3 lg:grid-cols-[.8fr_1.2fr]">
          <ol className="space-y-2" aria-label="Guide progress">
            <GuideStep done label="Trusted template selected" />
            <GuideStep done={!hasUnfilled} active={hasUnfilled} label={hasUnfilled ? 'Fill the named parameters below' : 'Parameters resolved'} />
            <GuideStep active={!hasUnfilled} label="Review, then copy or save" />
          </ol>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-navy-700 dark:bg-navy-950">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400"><ShieldCheck className="h-3.5 w-3.5" /> Review before copy</p>
            <p className="mt-2 text-xs leading-5 text-slate-700 dark:text-slate-300">{selectedTask.explanation}</p>
            <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-5 text-slate-500 dark:border-navy-700"><strong className="text-slate-700 dark:text-slate-300">Verify:</strong> {selectedTask.verification}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function GuideStep({ label, done = false, active = false }: { label: string; done?: boolean; active?: boolean }) {
  return <li className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${active ? 'border-cyan-500/50 bg-cyan-500/10 text-slate-900 dark:text-slate-100' : 'border-slate-200 text-slate-500 dark:border-navy-700'}`}>{done ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Circle className={`h-3.5 w-3.5 ${active ? 'text-cyan-600 dark:text-cyan-400' : ''}`} />}{label}</li>;
}
