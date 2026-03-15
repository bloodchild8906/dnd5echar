import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import { useAuth } from '../../context/AuthContext';
import {
  CharacterBundleRecord,
  GameMembership,
  GamePermissionSet,
  GameRole,
} from '../../domain/collaboration';
import { collaborationService } from '../../services/supabase/collaborationService';

const roleTone = (role: GameRole): 'accent' | 'warning' | 'success' | 'neutral' => {
  if (role === 'gm') return 'accent';
  if (role === 'assistant_gm') return 'warning';
  if (role === 'player') return 'success';
  return 'neutral';
};

interface PermissionEditorProps {
  membership: GameMembership;
  onSave: (membershipId: string, role: GameRole, permissions: GamePermissionSet) => Promise<void>;
}

const PermissionEditor = ({ membership, onSave }: PermissionEditorProps) => {
  const [role, setRole] = useState<GameRole>(membership.role);
  const [perms, setPerms] = useState<GamePermissionSet>(membership.permissions);
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof GamePermissionSet) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="form-grid">
      <label>
        Role
        <select
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value as GameRole)}
        >
          <option value="gm">GM</option>
          <option value="assistant_gm">Assistant GM</option>
          <option value="player">Player</option>
          <option value="viewer">Viewer</option>
        </select>
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={perms.canViewCharacters}
          onChange={() => toggle('canViewCharacters')}
        />
        Can view characters
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={perms.canEditCharacters}
          onChange={() => toggle('canEditCharacters')}
        />
        Can edit characters
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={perms.canManagePlayers}
          onChange={() => toggle('canManagePlayers')}
        />
        Can manage players
      </label>
      <button
        type="button"
        className="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(membership.id, role, perms);
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
};

export const GameDetailPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { configured, user } = useAuth();

  const [memberships, setMemberships] = useState<GameMembership[]>([]);
  const [bundles, setBundles] = useState<CharacterBundleRecord[]>([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [message, setMessage] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !user) return;

    collaborationService
      .listMemberships(gameId)
      .then(setMemberships)
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : 'Unable to load members.');
      });

    collaborationService
      .listCharacterBundles(gameId)
      .then(setBundles)
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : 'Unable to load character bundles.');
      });
  }, [gameId, user]);

  if (!configured) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Game Detail</p>
            <h1>Supabase not configured</h1>
            <p>Configure Supabase environment variables to use campaign collaboration.</p>
          </div>
          <button type="button" className="button" onClick={() => navigate('/settings')}>
            Open Settings
          </button>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Game Detail</p>
            <h1>Sign in required</h1>
            <p>You must be signed in to view game details.</p>
          </div>
          <button type="button" className="button" onClick={() => navigate('/auth')}>
            Go to Auth
          </button>
        </section>
      </div>
    );
  }

  const handleUpdateMembership = async (
    membershipId: string,
    role: GameRole,
    permissions: GamePermissionSet
  ) => {
    await collaborationService.updateMembership(membershipId, role, permissions);
    setMemberships((prev) =>
      prev.map((m) => (m.id === membershipId ? { ...m, role, permissions } : m))
    );
    setMessage('Membership updated.');
  };

  const handleGenerateInvite = async () => {
    if (!gameId) return;
    try {
      const tokenRecord = await collaborationService.generateInviteToken(gameId, user.id);
      setInviteUrl(`${window.location.origin}/games/join/${tokenRecord.token}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to generate invite link.');
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Games</p>
          <h1>Game Detail</h1>
          <p>Manage members, permissions, and character bundles for this game.</p>
        </div>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => navigate('/games')}
        >
          Back to Games
        </button>
      </section>

      {message ? <p className="callout">{message}</p> : null}

      <div className="split-layout">
        <SectionCard title="Members">
          {memberships.length === 0 ? (
            <EmptyState title="No members yet" description="Invite players to join this game." />
          ) : (
            <div className="stack-list">
              {memberships.map((m) => (
                <div key={m.id}>
                  <button
                    type="button"
                    className={
                      expandedMemberId === m.id
                        ? 'list-button list-button--active'
                        : 'list-button'
                    }
                    onClick={() =>
                      setExpandedMemberId((prev) => (prev === m.id ? null : m.id))
                    }
                  >
                    <strong>{m.userId}</strong>
                    <Badge tone={roleTone(m.role)}>{m.role}</Badge>
                  </button>
                  {expandedMemberId === m.id ? (
                    <PermissionEditor membership={m} onSave={handleUpdateMembership} />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Invite Players">
          <div className="form-grid">
            <button type="button" className="button" onClick={handleGenerateInvite}>
              Generate Invite Link
            </button>
            {inviteUrl ? (
              <div>
                <p>Share this link:</p>
                <input className="input" readOnly value={inviteUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Character Bundles">
        {bundles.length === 0 ? (
          <EmptyState
            title="No character bundles"
            description="Players can publish their characters to this game from the Games page."
          />
        ) : (
          <div className="stack-list">
            {bundles.map((bundle) => (
              <article key={bundle.id} className="spell-card spell-card--compact">
                <div>
                  <h3>{bundle.name}</h3>
                  <p>
                    Owner: {bundle.ownerUserId} &mdash; Updated:{' '}
                    {new Date(bundle.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
