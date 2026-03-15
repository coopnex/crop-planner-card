import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CropPlannerCardConfig, HomeAssistant } from './types';

const CROP_DOMAIN = 'crop';
const TODO_ENTITY_ID = 'todo.crop_chores';

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
    const cropEntityIds = Object.keys(this.hass.states).filter((id) => id.startsWith(`${CROP_DOMAIN}.`));

    const helpers = await (window as any).loadCardHelpers();
    this._stack = helpers.createCardElement({
      type: 'horizontal-stack',
      title: this._config.title ?? 'Crop Planner',
      cards: [
        {
          type: 'entities',
          title: '',
          entities: cropEntityIds,
        },
        {
          type: 'todo-list',
          entity: TODO_ENTITY_ID,
        },
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

  render() {
    return nothing;
  }
}

// ---------------------------------------------------------------------------
// Visual editor
// ---------------------------------------------------------------------------

@customElement('crop-planner-card-editor')
export class CropPlannerCardEditor extends LitElement {
  @state() private _config!: CropPlannerCardConfig;

  setConfig(config: CropPlannerCardConfig) {
    this._config = config;
  }

  private _valueChanged(e: Event) {
    const target = e.target as HTMLInputElement;
    const newConfig = { ...this._config, [target.name]: target.value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: newConfig }, bubbles: true, composed: true }));
  }

  render() {
    if (!this._config) return nothing;
    return html`
      <ha-form
        .schema=${[{ name: 'title', selector: { text: {} } }]}
        .data=${this._config}
        .computeLabel=${(s: { name: string }) => (s.name === 'title' ? 'Title' : s.name)}
        @value-changed=${(e: CustomEvent) =>
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: { ...this._config, ...e.detail.value } }, bubbles: true, composed: true }))}
      ></ha-form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-card': CropPlannerCard;
    'crop-planner-card-editor': CropPlannerCardEditor;
  }
}
