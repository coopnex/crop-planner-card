import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CropPlannerCardConfig, HomeAssistant } from './types';
import './crop-planner-harvest-card';

const CROP_DOMAIN = 'crop';
const TODO_ENTITY_ID = 'todo.crop_chores';
const AI_BUTTON_ENTITY_ID = 'button.crop_generate_chores';
const ENRICH_BUTTON_ENTITY_ID = 'button.enrich_crops_data';

@customElement('crop-planner-card')
export class CropPlannerCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  private _config!: CropPlannerCardConfig;
  private _cards: any[] = [];

  static getConfigElement() {
    return document.createElement('crop-planner-card-editor');
  }

  getGridOptions() {
    return { columns: 'full', rows: 4, max_rows: 2 };
  }

  getStubConfig(): CropPlannerCardConfig {
    return { type: 'custom:crop-planner-card', title: 'Crop Planner' };
  }

  setConfig(config: CropPlannerCardConfig) {
    this._config = config;
  }

  async firstUpdated() {
    const cropEntityIds = Object.keys(this.hass.states).filter((id) => id.startsWith(`${CROP_DOMAIN}.`));
    const helpers = await (window as any).loadCardHelpers();

    this._cards = [
      helpers.createCardElement({
        type: 'vertical-stack',
        title: '',
        cards: [
          {
            type: 'heading',
            heading: this._config.title ?? 'Crop Planner',
            icon: 'mdi:sprout',
            heading_style: 'title',
            badges: [
              {
                type: 'entity',
                show_state: true,
                show_icon: true,
                entity: AI_BUTTON_ENTITY_ID,
                icon: 'mdi:assistant',
                state_content: 'name',
                name: { type: 'entity' },
                tap_action: {
                  action: 'perform-action',
                  perform_action: 'button.press',
                  target: { entity_id: AI_BUTTON_ENTITY_ID },
                },
              },
              {
                type: 'entity',
                show_state: true,
                show_icon: true,
                entity: ENRICH_BUTTON_ENTITY_ID,
                icon: 'mdi:database-refresh',
                state_content: 'name',
                name: { type: 'entity' },
                tap_action: {
                  action: 'perform-action',
                  perform_action: 'button.press',
                  target: { entity_id: ENRICH_BUTTON_ENTITY_ID },
                },
              },
            ],
          },
          { type: 'custom:crop-planner-harvest-card' },
          { type: 'entities', title: '', entities: cropEntityIds },
          { type: 'todo-list', entity: TODO_ENTITY_ID, hide_completed: true },
        ],
      }),
    ];
    this._cards[0].hass = this.hass;

    this.shadowRoot!.appendChild(this._cards[0]);
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

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'crop-planner-card',
  name: 'Crop Planner',
  preview: false, // Optional - defaults to false
  description: 'A Lovelace card for the Crop Planner Home Assistant integration', // Optional
  documentationURL: 'https://github.com/coopnex/crop-planner-card', // Adds a help link in the frontend card editor
});

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
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config: newConfig }, bubbles: true, composed: true }),
    );
  }

  render() {
    if (!this._config) return nothing;
    return html`
      <ha-form
        .schema=${[{ name: 'title', selector: { text: {} } }]}
        .data=${this._config}
        .computeLabel=${(s: { name: string }) => (s.name === 'title' ? 'Title' : s.name)}
        @value-changed=${(e: CustomEvent) =>
          this.dispatchEvent(
            new CustomEvent('config-changed', {
              detail: { config: { ...this._config, ...e.detail.value } },
              bubbles: true,
              composed: true,
            }),
          )}
      ></ha-form>
    `;
  }
}

declare global {
  interface Window {
    customCards: Array<Record<string, unknown>>;
  }
  interface HTMLElementTagNameMap {
    'crop-planner-card': CropPlannerCard;
    'crop-planner-card-editor': CropPlannerCardEditor;
  }
}
