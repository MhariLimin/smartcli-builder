import { useState } from 'react';
import { Terminal, Server, Plus, Copy } from 'lucide-react';
import { cn, copyToClipboard } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/PageHeader';
import { ProGate } from '../components/ui/Gates';
import { WorkflowStepper } from '../components/features/WorkflowStepper';
import { Modal } from '../components/ui/Modal';
import { TextInput } from '../components/ui/Input';
import { useAuth, useToast } from '../context/AppContext';
import { SSH_HOSTS, SSH_WORKFLOWS } from '../mock/data';
import type { SSHHost, SSHWorkflow } from '../mock-types';

export default function SSHWorkflows() {
  const { isPro } = useAuth();
  const { showToast } = useToast();

  const [selectedHost, setSelectedHost] = useState<SSHHost>(SSH_HOSTS[0]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<SSHWorkflow | null>(null);
  const [showAddHost, setShowAddHost] = useState(false);
  const [newHostLabel, setNewHostLabel] = useState('');

  if (!isPro) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="SSH Workflows"
          description="SSH host inventory and workflow builder."
          badge={<Badge variant="violet" size="xs">Pro</Badge>}
        />
        <ProGate feature="SSH Workflows" />
      </div>
    );
  }

  const sshCommand = `ssh ${selectedHost.username}@${selectedHost.hostname} -p ${selectedHost.port}${selectedHost.identityFilePath ? ` -i ${selectedHost.identityFilePath}` : ''}${selectedHost.jumpHost ? ` -J ${selectedHost.jumpHost}` : ''}`;

  const sshConfigSnippet = `Host ${selectedHost.label.toLowerCase().replace(/\s+/g, '-')}
  HostName ${selectedHost.hostname}
  User ${selectedHost.username}
  Port ${selectedHost.port}${selectedHost.identityFilePath ? `\n  IdentityFile ${selectedHost.identityFilePath}` : ''}${selectedHost.jumpHost ? `\n  ProxyJump ${selectedHost.jumpHost}` : ''}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="SSH Workflows"
        description="SSH host inventory and multi-step workflow runner. Commands are for copy — no connections opened here."
        badge={<Badge variant="violet" size="xs">Pro</Badge>}
        actions={
          <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddHost(true)}>
            Add host
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Host inventory */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader title="Hosts" />
          {SSH_HOSTS.map((host) => (
            <button
              key={host.id}
              onClick={() => setSelectedHost(host)}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-colors',
                selectedHost.id === host.id
                  ? 'border-cyan-500/30 bg-cyan-500/10'
                  : 'border-navy-700 bg-navy-850 hover:border-navy-600 hover:bg-navy-800'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Server className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', selectedHost.id === host.id ? 'text-cyan-400' : 'text-slate-200')}>
                  {host.label}
                </p>
                <p className="text-xs text-slate-500 truncate">{host.username}@{host.hostname}:{host.port}</p>
                {host.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {host.tags.map((t) => (
                      <span key={t} className="text-2xs text-slate-600 bg-navy-800 px-1 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Connection details + workflows */}
        <div className="lg:col-span-3 space-y-4">
          <SectionHeader title="Connection" />

          <Card className="p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">SSH command</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-slate-300 bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 break-all">
                  {sshCommand}
                </code>
                <button
                  onClick={() => { copyToClipboard(sshCommand); showToast('SSH command copied', 'success', 2000); }}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-navy-800 transition-colors flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">~/.ssh/config snippet</p>
              <div className="relative group">
                <pre className="text-xs font-mono text-slate-400 bg-navy-950 border border-navy-800 rounded-lg px-3 py-3 overflow-x-auto whitespace-pre">
                  {sshConfigSnippet}
                </pre>
                <button
                  onClick={() => { copyToClipboard(sshConfigSnippet); showToast('SSH config copied', 'success', 2000); }}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-navy-800 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {selectedHost.jumpHost && (
              <div className="text-xs text-slate-500 bg-navy-900 border border-navy-800 rounded-lg px-3 py-2">
                <span className="text-slate-400">Jump host:</span> {selectedHost.jumpHost}
              </div>
            )}
          </Card>

          {/* Workflows */}
          <SectionHeader
            title="Workflows"
            actions={
              <Button variant="ghost" size="xs" leftIcon={<Plus className="w-3 h-3" />}>
                New workflow
              </Button>
            }
          />

          <div className="space-y-2">
            {SSH_WORKFLOWS.filter((w) => !w.hostId || w.hostId === selectedHost.id).map((workflow) => (
              <div key={workflow.id} className="border border-navy-700 bg-navy-850 rounded-xl overflow-hidden">
                <button
                  onClick={() => setSelectedWorkflow(selectedWorkflow?.id === workflow.id ? null : workflow)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-800 transition-colors"
                >
                  <Terminal className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{workflow.name}</p>
                    {workflow.description && (
                      <p className="text-xs text-slate-500">{workflow.description}</p>
                    )}
                  </div>
                  <Badge variant="muted" size="xs">{workflow.steps.length} steps</Badge>
                </button>

                {selectedWorkflow?.id === workflow.id && (
                  <div className="px-4 pb-4 border-t border-navy-800">
                    <WorkflowStepper
                      steps={workflow.steps}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showAddHost}
        onClose={() => setShowAddHost(false)}
        title="Add SSH host"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddHost(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => { showToast('Host added (demo)', 'success'); setShowAddHost(false); }}>
              Add host
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <TextInput label="Label" value={newHostLabel} onChange={(e) => setNewHostLabel(e.target.value)} placeholder="e.g. Prod web server" required />
          <TextInput label="Hostname" placeholder="e.g. prod-01.example.com" />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Username" placeholder="ubuntu" />
            <TextInput label="Port" type="number" placeholder="22" />
          </div>
          <TextInput label="Identity file path (optional)" placeholder="~/.ssh/id_rsa" />
          <TextInput label="Jump host (optional)" placeholder="bastion.example.com" />
          <p className="text-xs text-slate-500">
            Private key content is never stored here. Only the file path is saved.
          </p>
        </div>
      </Modal>
    </div>
  );
}
