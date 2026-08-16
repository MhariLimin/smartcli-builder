import { useState } from 'react';
import { Sparkles, Copy, BookMarked, AlertTriangle, Clock } from 'lucide-react';
import { cn, copyToClipboard, formatRelativeTime } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Textarea, SegmentedControl } from '../components/ui/Input';
import { ProGate, DestructiveWarning, UsageMeter } from '../components/ui/Gates';
import { Modal } from '../components/ui/Modal';
import { TextInput } from '../components/ui/Input';
import { useAuth, useToast } from '../context/AppContext';
import { AI_GENERATIONS, AI_USAGE } from '../mock/data';
import type { AITool, AIGenerationResult } from '../mock-types';

const TOOLS: { value: AITool; label: string }[] = [
  { value: 'kubectl', label: 'kubectl' },
  { value: 'docker', label: 'docker' },
  { value: 'git', label: 'git' },
  { value: 'aws', label: 'aws' },
  { value: 'shell', label: 'shell' },
];

const MOCK_RESPONSES: Record<AITool, Partial<AIGenerationResult>> = {
  kubectl: {
    command: 'kubectl rollout restart deployment/{{service}} -n {{namespace}}',
    explanation: 'Triggers a rolling restart of the specified deployment. Kubernetes replaces pods one at a time to maintain availability.',
    warnings: [],
    isDestructive: false,
  },
  docker: {
    command: 'docker build -t {{image}}:{{tag}} --platform linux/amd64 .',
    explanation: 'Builds a Docker image targeting the linux/amd64 architecture, useful for multi-platform setups or CI pipelines running on Apple Silicon.',
    warnings: [],
    isDestructive: false,
  },
  git: {
    command: 'git log --oneline --graph --decorate --all',
    explanation: 'Shows a compact visual graph of all branches and their commits in a tree layout.',
    warnings: [],
    isDestructive: false,
  },
  aws: {
    command: 'aws s3 sync ./dist s3://{{bucket}} --delete --cache-control max-age=31536000',
    explanation: 'Syncs local build artifacts to S3, removing files that no longer exist locally and setting long-lived cache headers for static assets.',
    warnings: [],
    isDestructive: false,
  },
  shell: {
    command: 'find . -name "*.log" -mtime +7 -delete',
    explanation: 'Finds and deletes log files older than 7 days under the current directory.',
    warnings: ['This deletes files permanently. Make sure you are in the correct directory.'],
    isDestructive: true,
  },
};

export default function AIGenerate() {
  const { isPro } = useAuth();
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [tool, setTool] = useState<AITool>('kubectl');
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [editedCommand, setEditedCommand] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [usage] = useState(AI_USAGE);
  const [history, setHistory] = useState<AIGenerationResult[]>(AI_GENERATIONS);

  const quotaExhausted = usage.used >= usage.limit;

  const handleGenerate = async () => {
    if (!prompt.trim() || quotaExhausted || !isPro) return;
    setGenerating(true);
    setResult(null);
    setStreamedText('');

    // Simulate streaming
    const mockRes = MOCK_RESPONSES[tool];
    const fullCommand = mockRes.command ?? 'echo "Generated command"';
    let streamed = '';
    for (let i = 0; i <= fullCommand.length; i++) {
      await new Promise((r) => setTimeout(r, 18));
      streamed = fullCommand.slice(0, i);
      setStreamedText(streamed);
    }

    const generated: AIGenerationResult = {
      id: `ag-${Date.now()}`,
      prompt,
      tool,
      command: fullCommand,
      explanation: mockRes.explanation ?? '',
      warnings: mockRes.warnings ?? [],
      isDestructive: mockRes.isDestructive ?? false,
      createdAt: new Date().toISOString(),
    };

    setResult(generated);
    setEditedCommand(fullCommand);
    setHistory((prev) => [generated, ...prev]);
    setGenerating(false);
  };

  const handleCopy = async () => {
    await copyToClipboard(editedCommand || result?.command || '');
    showToast('Command copied', 'success', 2000);
  };

  const handleSave = () => {
    showToast(`"${saveLabel}" saved as template`, 'success');
    setSaveModalOpen(false);
    setSaveLabel('');
  };

  if (!isPro) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="AI Generate"
          description="Generate commands from natural language."
          badge={<Badge variant="violet" size="xs"><Sparkles className="w-2.5 h-2.5 mr-1" />Pro</Badge>}
        />
        <ProGate feature="AI Command Generation" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Generate"
        description="Describe what you want to do. Receive a CLI command to review and copy."
        badge={<Badge variant="violet" size="xs"><Sparkles className="w-2.5 h-2.5 mr-1" />Pro</Badge>}
        actions={
          <UsageMeter
            used={usage.used}
            limit={usage.limit}
            label="AI quota"
            className="w-40"
          />
        }
      />

      <Card className="p-4 space-y-4">
        {/* Tool selector */}
        <SegmentedControl
          options={TOOLS}
          value={tool}
          onChange={setTool}
        />

        {/* Prompt */}
        <Textarea
          label="What do you want to do?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Restart the API deployment in the production namespace"
          rows={3}
        />

        {quotaExhausted && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300">Monthly quota reached</p>
              <p className="text-xs text-slate-400">
                Resets on {new Date(usage.resetsAt).toLocaleDateString()}. Upgrade for higher limits.
              </p>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          leftIcon={<Sparkles className="w-4 h-4" />}
          onClick={handleGenerate}
          loading={generating}
          disabled={!prompt.trim() || quotaExhausted}
          className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 border-0 text-white"
        >
          Generate command
        </Button>
      </Card>

      {/* Streaming result */}
      {(generating || result) && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-slate-200">Generated command</span>
            {generating && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Generating…
              </span>
            )}
          </div>

          {generating ? (
            <div className="bg-navy-950 border border-navy-700 rounded-lg px-4 py-3">
              <code className="font-mono text-sm text-slate-200">{streamedText}
                <span className="animate-pulse text-cyan-400">|</span>
              </code>
            </div>
          ) : result && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Command (editable)</label>
                <input
                  value={editedCommand}
                  onChange={(e) => setEditedCommand(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                />
              </div>

              {result.explanation && (
                <div className="bg-navy-900 border border-navy-800 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-slate-400 mb-1">Explanation</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                </div>
              )}

              {result.isDestructive && <DestructiveWarning warnings={result.warnings} />}
              {!result.isDestructive && result.warnings.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-slate-400 bg-navy-900 rounded-lg px-3 py-2.5 border border-navy-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-navy-800">
                <Button variant="primary" size="sm" leftIcon={<Copy className="w-4 h-4" />} onClick={handleCopy}>
                  Copy command
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<BookMarked className="w-4 h-4" />}
                  onClick={() => { setSaveLabel(result.prompt.slice(0, 40)); setSaveModalOpen(true); }}
                >
                  Save as template
                </Button>
                <span className="text-xs text-slate-600 ml-auto">Never execute directly from SmartCLI</span>
              </div>
            </>
          )}
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent generations</span>
          </div>
          <Card className="overflow-hidden">
            {history.slice(0, 5).map((h, i) => (
              <div
                key={h.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3',
                  i < Math.min(history.length, 5) - 1 && 'border-b border-navy-800'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 truncate">{h.prompt}</p>
                  <code className="text-xs font-mono text-slate-500 truncate block mt-0.5">{h.command}</code>
                  <p className="text-2xs text-slate-600 mt-1">{formatRelativeTime(h.createdAt)}</p>
                </div>
                <button
                  onClick={async () => { await copyToClipboard(h.command); showToast('Copied', 'success', 2000); }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-navy-800 transition-colors flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Save as template modal */}
      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save as template"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!saveLabel.trim()}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <TextInput
            label="Template name"
            value={saveLabel}
            onChange={(e) => setSaveLabel(e.target.value)}
            placeholder="Describe what this template does…"
            required
            autoFocus
          />
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <code className="text-xs font-mono text-slate-400 break-all">{editedCommand || result?.command}</code>
          </div>
        </div>
      </Modal>
    </div>
  );
}
