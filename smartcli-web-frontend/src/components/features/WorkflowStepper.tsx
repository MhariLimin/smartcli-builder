import { useState } from 'react';
import { Check, AlertTriangle, Copy } from 'lucide-react';
import { cn, copyToClipboard } from '../../lib/boltUtils';
import { useToast } from '../../context/AppContext';
import { DestructiveWarning } from '../ui/Gates';
import { ConfirmDialog } from '../ui/Modal';
import { Badge } from '../ui/Badge';

export interface WorkflowStep {
  id: string;
  label: string;
  command: string;
  description?: string;
  isDestructive: boolean;
  isDone: boolean;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  title?: string;
  onStepDone?: (stepId: string) => void;
  paramValues?: Record<string, string>;
}

export function WorkflowStepper({ steps, title, onStepDone, paramValues = {} }: WorkflowStepperProps) {
  const { showToast } = useToast();
  const [localDone, setLocalDone] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmStep, setConfirmStep] = useState<WorkflowStep | null>(null);
  const [copied, setCopied] = useState<Set<string>>(new Set());

  const resolvedSteps = steps.map((step) => ({
    ...step,
    command: step.command.replace(/\{\{([^}]+)\}\}/g, (_, name) => paramValues[name.trim()] ?? `{{${name}}}`),
  }));

  const isDone = (id: string) => localDone.has(id) || steps.find((s) => s.id === id)?.isDone;

  const markDone = (id: string) => {
    setLocalDone((prev) => new Set([...prev, id]));
    onStepDone?.(id);
    const idx = steps.findIndex((s) => s.id === id);
    if (idx < steps.length - 1) setCurrentStep(idx + 1);
  };

  const handleCopy = async (step: WorkflowStep) => {
    if (step.isDestructive) {
      setConfirmStep(step);
      return;
    }
    await performCopy(step);
  };

  const performCopy = async (step: WorkflowStep) => {
    const resolved = step.command.replace(/\{\{([^}]+)\}\}/g, (_, name) => paramValues[name.trim()] ?? `{{${name}}}`);
    await copyToClipboard(resolved);
    setCopied((prev) => new Set([...prev, step.id]));
    showToast('Command copied', 'success', 2000);
    setTimeout(() => setCopied((prev) => { const n = new Set(prev); n.delete(step.id); return n; }), 2500);
  };

  const completedCount = resolvedSteps.filter((s) => isDone(s.id)).length;

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <span className="text-xs text-slate-500">{completedCount}/{steps.length} steps done</span>
        </div>
      )}

      <div className="space-y-2">
        {resolvedSteps.map((step, index) => {
          const done = isDone(step.id);
          const active = index === currentStep && !done;

          return (
            <div
              key={step.id}
              className={cn(
                'border rounded-xl overflow-hidden transition-colors duration-150',
                done
                  ? 'border-green-500/20 bg-green-500/5'
                  : active
                  ? 'border-cyan-500/30 bg-navy-850'
                  : 'border-navy-700 bg-navy-900'
              )}
            >
              {/* Step header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                  done
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : active
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-navy-800 text-slate-500 border border-navy-700'
                )}>
                  {done ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-medium',
                      done ? 'text-green-400 line-through opacity-60' : 'text-slate-200'
                    )}>
                      {step.label}
                    </span>
                    {step.isDestructive && (
                      <Badge variant="warning" size="xs">
                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                        Destructive
                      </Badge>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Command + actions */}
              {(active || done) && (
                <div className="px-4 pb-3 space-y-2">
                  <pre className="font-mono text-xs text-slate-300 bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {step.command}
                  </pre>

                  {step.isDestructive && !done && (
                    <DestructiveWarning />
                  )}

                  {!done && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(step)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          copied.has(step.id)
                            ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                            : 'bg-navy-800 text-slate-300 border border-navy-700 hover:border-navy-600'
                        )}
                      >
                        {copied.has(step.id) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied.has(step.id) ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => markDone(step.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-800 text-slate-300 border border-navy-700 hover:border-green-500/40 hover:text-green-400 transition-all"
                      >
                        <Check className="w-3 h-3" />
                        Mark done
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completedCount === steps.length && steps.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
          <Check className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400 font-medium">All steps completed</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmStep}
        onClose={() => setConfirmStep(null)}
        onConfirm={async () => {
          if (confirmStep) {
            await performCopy(confirmStep);
            setConfirmStep(null);
          }
        }}
        title="Copy destructive command"
        message={`"${confirmStep?.label}" is marked as destructive. Review the command carefully before using it. Proceed to copy?`}
        confirmLabel="Copy command"
        danger
      />
    </div>
  );
}
