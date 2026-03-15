import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CropPlannerCardConfig, HomeAssistant } from './types';

const CROP_DOMAIN = 'crop';
const TODO_ENTITY_ID = 'todo.crop_chores';

@customElement('crop-planner-card')
export class CropPlannerCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  private _config!: CropPlannerCardConfig;
  private _cards: any[] = [];

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

    const cropsCard = helpers.createCardElement({
      type: 'entities',
      title: this._config.title ?? 'Crops',
      entities: cropEntityIds,
    });

    const todoCard = helpers.createCardElement({
      type: 'todo-list',
      entity: TODO_ENTITY_ID,
    });

    this._cards = [cropsCard, todoCard];
    this._cards.forEach((c) => (c.hass = this.hass));

    cropsCard.style.cssText = 'flex: 0 0 50%; min-width: 0;';

    const todoWrapper = document.createElement('div');
    todoWrapper.style.cssText = 'flex: 0 0 50%; min-width: 0; overflow-y: auto; min-height: 0;';
    todoWrapper.appendChild(todoCard);

    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: row; max-height: 100vh; gap: 8px;';
    container.appendChild(cropsCard);
    container.appendChild(todoWrapper);

    this.shadowRoot!.appendChild(container);
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('hass')) {
      this._cards.forEach((c) => (c.hass = this.hass));
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
