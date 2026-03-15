import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CropPlannerCardConfig, HomeAssistant, CropAttributes, HassEntity } from './types';

const CROP_DOMAIN = 'crop';
const TODO_ENTITY_ID = 'todo.crop_chores';

const PHASE_ICONS: Record<string, string> = {
  sowing: '🌱',
  germination: '🌿',
  flowering: '🌸',
  harvest: '🍂',
};

function getCurrentPhase(
  phases: Record<string, { start?: string; end?: string }> | undefined,
  defaultState: string,
): string {
  if (!phases) return defaultState;
  const today = new Date().toISOString().split('T')[0];
  for (const [phase, range] of Object.entries(phases)) {
    const start = range.start;
    const end = range.end;
    if (start && start <= today && (!end || end >= today)) {
      return phase;
    }
  }
  return defaultState;
}

// ---------------------------------------------------------------------------
// Inner card: crop grid only
// ---------------------------------------------------------------------------

@customElement('crop-planner-crops-card')
export class CropPlannerCropsCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  private _config!: CropPlannerCardConfig;

  setConfig(config: CropPlannerCardConfig) {
    this._config = config;
  }

  get _crops(): HassEntity[] {
    return Object.values(this.hass.states).filter((e) => e.entity_id.startsWith(`${CROP_DOMAIN}.`));
  }

  static styles = css`
    :host {
      --crop-card-padding: 16px;
    }
    ha-card {
      padding: var(--crop-card-padding);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 12px;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .card-header .icon {
      font-size: 1.3em;
    }
    .empty {
      text-align: center;
      padding: 24px 0;
      color: var(--secondary-text-color);
      font-style: italic;
    }
    .crop-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
    .crop-item {
      border-radius: 12px;
      overflow: hidden;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.2s;
    }
    .crop-item:hover {
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.15));
    }
    .crop-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      background: var(--secondary-background-color);
    }
    .crop-image-placeholder {
      width: 100%;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3em;
      background: var(--secondary-background-color);
    }
    .crop-info {
      padding: 10px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .crop-name {
      font-weight: 600;
      font-size: 0.95em;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .crop-species {
      font-size: 0.78em;
      color: var(--secondary-text-color);
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .crop-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }
    .crop-quantity {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .crop-phase {
      font-size: 0.78em;
      padding: 2px 6px;
      border-radius: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      white-space: nowrap;
      text-transform: capitalize;
    }
    .phase-sowing { background: #6d9e6a; }
    .phase-germination { background: #5a9e7e; }
    .phase-flowering { background: #c97ab2; }
    .phase-harvest { background: #c0804a; }
    .phase-ok { background: var(--state-ok-color, #4caf50); }
  `;

  render() {
    if (!this.hass || !this._config) return nothing;

    const title = this._config.title ?? 'Crops';
    const showImages = this._config.show_images !== false;
    const crops = this._crops;

    return html`
      <ha-card>
        <div class="card-header">
          <span class="icon">🌱</span>
          <span>${title}</span>
        </div>
        ${crops.length === 0
          ? html`<div class="empty">No crops found. Add crops via the integration.</div>`
          : html`<div class="crop-list">${crops.map((e) => this._renderCrop(e, showImages))}</div>`}
      </ha-card>
    `;
  }

  private _renderCrop(entity: HassEntity, showImages: boolean) {
    const attrs = entity.attributes as CropAttributes;
    const name = attrs.friendly_name ?? entity.entity_id.split('.')[1];
    const quantity = attrs.quantity;
    const species = attrs.species;
    const picture = attrs.entity_picture;
    const phase = getCurrentPhase(attrs.phases, entity.state);
    const phaseIcon = PHASE_ICONS[phase] ?? '🌱';

    return html`
      <div class="crop-item">
        ${showImages
          ? picture
            ? html`<img class="crop-image" src="${picture}" alt="${name}" />`
            : html`<div class="crop-image-placeholder">${phaseIcon}</div>`
          : nothing}
        <div class="crop-info">
          <div class="crop-name">${name}</div>
          ${species ? html`<div class="crop-species">${species}</div>` : nothing}
          <div class="crop-meta">
            ${quantity !== undefined ? html`<span class="crop-quantity">×${quantity}</span>` : html`<span></span>`}
            <span class="crop-phase phase-${phase}">${phaseIcon} ${phase}</span>
          </div>
        </div>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// Outer card: composes crop grid + todo list via vertical-stack
// ---------------------------------------------------------------------------

@customElement('crop-planner-card')
export class CropPlannerCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  private _config!: CropPlannerCardConfig;
  private _stack?: any;

  static getConfigElement() {
    return document.createElement('crop-planner-card-editor');
  }

  static getStubConfig(): CropPlannerCardConfig {
    return { type: 'custom:crop-planner-card', title: 'My Crops' };
  }

  setConfig(config: CropPlannerCardConfig) {
    this._config = config;
  }

  async firstUpdated() {
    const helpers = await (window as any).loadCardHelpers();
    this._stack = helpers.createCardElement({
      type: 'vertical-stack',
      cards: [
        { type: 'custom:crop-planner-crops-card', title: this._config.title, show_images: this._config.show_images },
        { type: 'todo-list', entity: TODO_ENTITY_ID },
      ],
    });
    this._stack.hass = this.hass;
    this.shadowRoot!.appendChild(this._stack);
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('hass') && this._stack) {
      this._stack.hass = this.hass;
    }
  }

  // No shadow DOM template needed — the stack is appended directly.
  render() {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-crops-card': CropPlannerCropsCard;
    'crop-planner-card': CropPlannerCard;
  }
}
