import { useState } from 'react';
import { Zap, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PlanBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { TextInput } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/PageHeader';
import { GuestGate, UsageMeter, UpsellCard } from '../components/ui/Gates';
import { ConfirmDialog } from '../components/ui/Modal';
import { useAuth, useToast } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function WorkspaceSettings() {
  const { isAuthenticated, currentWorkspace, authState, isPro } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isOwner = authState.type === 'authenticated' && authState.role === 'owner';

  const [wsName, setWsName] = useState(currentWorkspace?.name ?? '');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated || !currentWorkspace) {
    return (
      <div className="space-y-5">
        <PageHeader title="Workspace settings" />
        <GuestGate title="Sign in to manage settings" description="Access and configure your workspace." />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    showToast('Settings saved', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace settings"
        description={currentWorkspace.name}
        badge={<PlanBadge plan={currentWorkspace.plan} />}
      />

      {/* General */}
      <section>
        <SectionHeader title="General" className="mb-3" />
        <Card className="p-4 space-y-4">
          <TextInput
            label="Workspace name"
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            disabled={!isOwner}
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={!isOwner}>
              Save changes
            </Button>
          </div>
        </Card>
      </section>

      {/* Plan */}
      <section>
        <SectionHeader title="Plan" className="mb-3" />
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-200">SmartCLI {isPro ? 'Pro' : 'Free'}</span>
                <PlanBadge plan={currentWorkspace.plan} />
              </div>
              {isPro ? (
                <p className="text-sm text-slate-400">
                  Full access to AI generation, Kubernetes helpers, SSH workflows, and workspace templates.
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Builder, saved commands, history, and built-in catalog. Upgrade for AI and team features.
                </p>
              )}
            </div>
            {!isPro && isOwner && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Zap className="w-4 h-4" />}
                onClick={() => navigate('/billing/return?demo=upgrade')}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 border-0 text-white flex-shrink-0"
              >
                Upgrade to Pro
              </Button>
            )}
          </div>

          {isPro && (
            <div className="mt-4 pt-4 border-t border-navy-800 space-y-3">
              <UsageMeter used={18} limit={50} label="AI generations this month" />
              <UsageMeter used={8} limit={20} label="Workspace templates" />
              <UsageMeter used={4} limit={10} label="Team members" />
            </div>
          )}
        </Card>

        {!isPro && (
          <div className="mt-4">
            <UpsellCard feature="Upgrade to SmartCLI Pro" />
          </div>
        )}
      </section>

      {/* Danger zone */}
      {isOwner && (
        <section>
          <SectionHeader title="Danger zone" className="mb-3" />
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-200">Delete workspace</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanently delete "{currentWorkspace.name}" and all its data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setDeleteConfirm(true)}
                className="flex-shrink-0"
              >
                Delete workspace
              </Button>
            </div>
          </Card>
        </section>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => { showToast('Workspace deletion is disabled in demo', 'info'); setDeleteConfirm(false); }}
        title="Delete workspace"
        message={`This will permanently delete "${currentWorkspace.name}" and all saved commands, templates, and history. This action cannot be undone.`}
        confirmLabel="Delete workspace"
        danger
      />
    </div>
  );
}
