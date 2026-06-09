import { useState } from 'react';
import { Network, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn, applyPlaceholders } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Select, TextInput } from '../components/ui/Input';
import { ProGate, DestructiveWarning } from '../components/ui/Gates';
import { CommandCode } from '../components/ui/CommandCode';
import { WorkflowStepper } from '../components/features/WorkflowStepper';
import { SectionHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AppContext';
import { K8S_CONTEXTS, K8S_HELPERS } from '../mock/data';
import type { K8sContext, K8sHelper, K8sHelperParam } from '../mock-types';

export default function Kubernetes() {
  const { isPro } = useAuth();

  const [selectedContext, setSelectedContext] = useState<K8sContext>(K8S_CONTEXTS[0]);
  const [selectedHelper, setSelectedHelper] = useState<K8sHelper | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  if (!isPro) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Kubernetes"
          description="Kubectl helper gallery and workflow builder."
          badge={<Badge variant="violet" size="xs">Pro</Badge>}
        />
        <ProGate feature="Kubernetes Helpers" />
      </div>
    );
  }

  const renderedCommand = selectedHelper
    ? applyPlaceholders(selectedHelper.commandTemplate, {
        ...Object.fromEntries(Object.entries(paramValues).filter(([, v]) => v.trim())),
        namespace: paramValues.namespace || selectedContext.namespace,
      })
    : '';

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const selectHelper = (helper: K8sHelper) => {
    setSelectedHelper(helper);
    const defaults: Record<string, string> = {};
    helper.params.forEach((p) => {
      if (p.default) defaults[p.name] = p.default;
    });
    defaults.namespace = selectedContext.namespace;
    setParamValues(defaults);
  };

  // Group helpers
  const safeHelpers = K8S_HELPERS.filter((h) => !h.isDestructive);
  const destructiveHelpers = K8S_HELPERS.filter((h) => h.isDestructive);

  const workflowSteps = selectedHelper
    ? [
        {
          id: 'step-1',
          label: selectedHelper.label,
          command: renderedCommand,
          isDestructive: selectedHelper.isDestructive,
          isDone: false,
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kubernetes"
        description="Compose kubectl commands from helpers. Review and copy — never executed here."
        badge={<Badge variant="violet" size="xs">Pro</Badge>}
      />

      {/* Context selector */}
      <Card className="p-4">
        <Select
          label="Cluster context"
          value={selectedContext.name}
          onChange={(e) => {
            const ctx = K8S_CONTEXTS.find((c) => c.name === e.target.value) ?? K8S_CONTEXTS[0];
            setSelectedContext(ctx);
            if (paramValues.namespace) setParamValues((p) => ({ ...p, namespace: ctx.namespace }));
          }}
          options={K8S_CONTEXTS.map((c) => ({
            value: c.name,
            label: `${c.name} (${c.cluster} · ${c.namespace})`,
          }))}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Helper gallery */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Operations" />

          <div className="space-y-1">
            <p className="text-xs text-slate-600 mb-1">Safe operations</p>
            {safeHelpers.map((helper) => (
              <button
                key={helper.id}
                onClick={() => selectHelper(helper)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors',
                  selectedHelper?.id === helper.id
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                    : 'border-navy-700 bg-navy-850 text-slate-300 hover:border-navy-600 hover:bg-navy-800'
                )}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{helper.label}</p>
                  <p className="text-xs text-slate-500">{helper.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-600 mb-1">Destructive operations</p>
            {destructiveHelpers.map((helper) => (
              <button
                key={helper.id}
                onClick={() => selectHelper(helper)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors',
                  selectedHelper?.id === helper.id
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-navy-700 bg-navy-850 text-slate-300 hover:border-amber-500/20'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">{helper.label}</p>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-500">{helper.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Parameter controls + preview */}
        <div className="lg:col-span-3 space-y-4">
          {selectedHelper ? (
            <>
              <SectionHeader title={selectedHelper.label} />

              {/* Params */}
              <Card className="p-4 space-y-3">
                {selectedHelper.params.map((param) => (
                  <ParamControl
                    key={param.name}
                    param={param}
                    value={paramValues[param.name] ?? param.default ?? ''}
                    onChange={(v) => handleParamChange(param.name, v)}
                  />
                ))}
              </Card>

              {/* Preview */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Generated command</p>
                <CommandCode
                  command={selectedHelper.commandTemplate}
                  placeholderValues={paramValues}
                  showCopy
                />
              </div>

              {selectedHelper.isDestructive && <DestructiveWarning />}

              {selectedHelper.docsUrl && (
                <a
                  href={selectedHelper.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  View documentation
                </a>
              )}

              {/* Workflow view */}
              {workflowSteps.length > 0 && (
                <div className="pt-2 border-t border-navy-800">
                  <WorkflowStepper
                    steps={workflowSteps}
                    title="Workflow steps"
                    paramValues={paramValues}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center mb-4">
                <Network className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">Select an operation from the gallery</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: K8sHelperParam;
  value: string;
  onChange: (v: string) => void;
}) {
  if (param.type === 'enum' && param.options) {
    return (
      <Select
        label={param.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={param.required}
        options={param.options.map((o) => ({ value: o, label: o }))}
      />
    );
  }
  if (param.type === 'number') {
    return (
      <TextInput
        label={param.label}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={param.required}
        min={0}
      />
    );
  }
  return (
    <TextInput
      label={param.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={param.default ?? `Enter ${param.label}…`}
      required={param.required}
    />
  );
}
