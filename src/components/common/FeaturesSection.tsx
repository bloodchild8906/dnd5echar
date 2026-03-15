import { ActionEntry, Character, TraitEntry } from '../../domain/models';

interface FeaturesSectionProps {
  character: Character;
  onAddFeature: () => void;
  onUpdateFeature: (id: string, updater: (f: TraitEntry) => TraitEntry) => void;
  onRemoveFeature: (id: string) => void;
  onAddAction: () => void;
  onUpdateAction: (id: string, updater: (a: ActionEntry) => ActionEntry) => void;
  onRemoveAction: (id: string) => void;
}

const FeatureRow = ({
  feature,
  onUpdate,
  onRemove,
}: {
  feature: TraitEntry;
  onUpdate: (updater: (f: TraitEntry) => TraitEntry) => void;
  onRemove: () => void;
}) => (
  <div className="stacked-editor">
    <input
      className="input"
      value={feature.name}
      placeholder="Feature name"
      onChange={(e) => onUpdate((f) => ({ ...f, name: e.target.value }))}
    />
    <textarea
      className="textarea"
      rows={2}
      value={feature.description}
      placeholder="Description"
      onChange={(e) => onUpdate((f) => ({ ...f, description: e.target.value }))}
    />
    <button type="button" className="button button--ghost" onClick={onRemove}>
      Remove
    </button>
  </div>
);

const ActionRow = ({
  action,
  onUpdate,
  onRemove,
}: {
  action: ActionEntry;
  onUpdate: (updater: (a: ActionEntry) => ActionEntry) => void;
  onRemove: () => void;
}) => (
  <div className="stacked-editor">
    <input
      className="input"
      value={action.name}
      placeholder="Action name"
      onChange={(e) => onUpdate((a) => ({ ...a, name: e.target.value }))}
    />
    <textarea
      className="textarea"
      rows={2}
      value={action.description}
      placeholder="Description"
      onChange={(e) => onUpdate((a) => ({ ...a, description: e.target.value }))}
    />
    <div className="form-grid form-grid--three">
      <label>
        Attack Bonus
        <input
          className="input"
          type="number"
          value={action.attackBonus ?? ''}
          placeholder="—"
          onChange={(e) =>
            onUpdate((a) => ({
              ...a,
              attackBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
            }))
          }
        />
      </label>
      <label>
        Damage
        <input
          className="input"
          value={action.damage ?? ''}
          placeholder="e.g. 1d6+2"
          onChange={(e) => onUpdate((a) => ({ ...a, damage: e.target.value || undefined }))}
        />
      </label>
      <label>
        Notes
        <input
          className="input"
          value={action.notes ?? ''}
          onChange={(e) => onUpdate((a) => ({ ...a, notes: e.target.value || undefined }))}
        />
      </label>
    </div>
    <button type="button" className="button button--ghost" onClick={onRemove}>
      Remove
    </button>
  </div>
);

export const FeaturesSection = ({
  character,
  onAddFeature,
  onUpdateFeature,
  onRemoveFeature,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
}: FeaturesSectionProps) => (
  <div className="features-section">
    <div className="split-layout">
      <div>
        <div className="section-card__actions">
          <h4>Features &amp; Traits</h4>
          <button type="button" className="button" onClick={onAddFeature}>
            + Add Feature
          </button>
        </div>
        <div className="stack-list">
          {character.features.map((feature) => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              onUpdate={(updater) => onUpdateFeature(feature.id, updater)}
              onRemove={() => onRemoveFeature(feature.id)}
            />
          ))}
          {character.features.length === 0 && <p className="empty-hint">No features.</p>}
        </div>
      </div>
      <div>
        <div className="section-card__actions">
          <h4>Actions</h4>
          <button type="button" className="button" onClick={onAddAction}>
            + Add Action
          </button>
        </div>
        <div className="stack-list">
          {character.actions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              onUpdate={(updater) => onUpdateAction(action.id, updater)}
              onRemove={() => onRemoveAction(action.id)}
            />
          ))}
          {character.actions.length === 0 && <p className="empty-hint">No actions.</p>}
        </div>
      </div>
    </div>
  </div>
);
