import { useEffect, useState } from 'react';
import { UserPlus, MoreHorizontal, Mail, Copy, Trash2, Shield, Clock } from 'lucide-react';
import { cn, formatRelativeTime } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge, RoleBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { DropdownMenu } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import { TextInput, Select } from '../components/ui/Input';
import { GuestGate } from '../components/ui/Gates';
import { useAuth, useToast } from '../context/AppContext';
import type { Role, WorkspaceMember } from '../mock-types';
import { copyToClipboard } from '../lib/boltUtils';
import { workspaceDirectory, type WorkspaceInvite } from '../services/workspaceDirectory';

const ROLES: Role[] = ['admin', 'member', 'viewer'];

export default function WorkspaceMembers() {
  const { isAuthenticated, authState } = useAuth();
  const { showToast } = useToast();

  const currentUserId = authState.type === 'authenticated' ? authState.user.id : '';
  const isOwnerOrAdmin = authState.type === 'authenticated' && (authState.role === 'owner' || authState.role === 'admin');

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  useEffect(() => {
    workspaceDirectory.load().then((snapshot) => {
      setMembers(snapshot.members);
      setInvites(snapshot.invites);
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="space-y-5">
        <PageHeader title="Members" description="Manage workspace members." />
        <GuestGate title="Sign in to manage members" description="View and invite members of your workspace." />
      </div>
    );
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    const result = await workspaceDirectory.invite(inviteEmail, inviteRole);
    setInviteResult(result.inviteUrl);
    setInviteLoading(false);
  };

  const handleRoleChange = (memberId: string, role: Role) => {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
    showToast('Role updated', 'success');
  };

  const handleRemove = (member: WorkspaceMember) => {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    showToast(`${member.user.displayName} removed`, 'info');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members"
        description={`${members.length} active member${members.length !== 1 ? 's' : ''} in this workspace.`}
        actions={
          isOwnerOrAdmin && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => { setInviteResult(null); setInviteEmail(''); setInviteOpen(true); }}
            >
              Invite
            </Button>
          )
        }
      />

      {/* Active members */}
      <Card className="overflow-hidden">
        {members.map((member, i) => (
          <div
            key={member.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              i < members.length - 1 && 'border-b border-navy-800'
            )}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {member.user.avatarUrl ? (
                <img src={member.user.avatarUrl} alt={member.user.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">{member.user.displayName.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-200">{member.user.displayName}</span>
                {member.userId === currentUserId && (
                  <Badge variant="cyan" size="xs">You</Badge>
                )}
                <RoleBadge role={member.role} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {member.user.email}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Joined {formatRelativeTime(member.joinedAt)}
              </p>
            </div>

            {/* Actions */}
            {isOwnerOrAdmin && member.userId !== currentUserId && member.role !== 'owner' && (
              <DropdownMenu
                trigger={
                  <Button variant="icon" size="sm" aria-label="Member actions">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                }
                items={[
                  {
                    label: 'Change role',
                    icon: <Shield className="w-4 h-4" />,
                    onClick: () => {},
                  },
                  ...ROLES.filter((r) => r !== member.role).map((role) => ({
                    label: `Set as ${role}`,
                    onClick: () => handleRoleChange(member.id, role),
                  })),
                  {
                    label: 'Remove from workspace',
                    icon: <Trash2 className="w-4 h-4" />,
                    danger: true,
                    dividerBefore: true,
                    onClick: () => handleRemove(member),
                  },
                ]}
              />
            )}
          </div>
        ))}
      </Card>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending invites</h3>
          <Card className="overflow-hidden">
            {invites.map((invite, i) => (
              <div
                key={invite.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  i < invites.length - 1 && 'border-b border-navy-800'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{invite.email}</span>
                    <RoleBadge role={invite.role} />
                    <Badge variant="warning" size="xs">Pending</Badge>
                  </div>
                  <p className="text-xs text-slate-600">Invited {formatRelativeTime(invite.invitedAt)}</p>
                </div>
                <button
                  onClick={() => { copyToClipboard(invite.inviteLink); showToast('Invite link copied', 'success', 2000); }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-navy-800 transition-colors"
                  title="Copy invite link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Invite modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => { setInviteOpen(false); setInviteResult(null); }}
        title="Invite team member"
        size="sm"
        footer={
          inviteResult ? (
            <Button variant="primary" size="sm" onClick={() => { setInviteOpen(false); setInviteResult(null); }}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleInvite} loading={inviteLoading} disabled={!inviteEmail.trim()}>
                Send invite
              </Button>
            </>
          )
        }
      >
        {inviteResult ? (
          <div className="space-y-3">
            <p className="text-sm text-green-400 font-medium">Invite sent to {inviteEmail}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-slate-400 bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 truncate">
                {inviteResult}
              </code>
              <button
                onClick={() => { copyToClipboard(inviteResult); showToast('Link copied', 'success', 2000); }}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-navy-800"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <TextInput
              label="Email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              autoFocus
            />
            <Select
              label="Role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              options={[
                { value: 'admin', label: 'Admin — can manage templates and members' },
                { value: 'member', label: 'Member — can create and edit commands' },
                { value: 'viewer', label: 'Viewer — read-only access' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
