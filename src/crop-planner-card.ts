import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { CardHelpers, CropPlannerCardConfig, HaCard, HomeAssistant } from './types';
import { localize } from './localize';
import './crop-planner-harvest-card';
import './crop-planner-add-crop-dialog';
import './crop-planner-more-info-dialog';

const CROP_DOMAIN = 'crop';
const TODO_ENTITY_ID = 'todo.crop_chores';
const AI_BUTTON_ENTITY_ID = 'button.crop_generate_chores';

const AI_STATE_ENTITY_ID = 'sensor.crop_ai_state';

const AI_STATE_BADGES = [
  {
    state: 'idle',
    icon: 'mdi:robot-outline',
    color: 'grey',
  },
  {
    state: 'proposing_tasks',
    icon: 'mdi:head-cog',
    color: 'amber',
  },
  {
    state: 'filling_fields',
    icon: 'mdi:pencil-circle',
    color: 'blue',
  },
  {
    state: 'generating_image',
    icon: 'mdi:image-search',
    color: 'yellow',
  },
  {
    state: 'guessing_species',
    icon: 'mdi:book-open-page-variant-outline',
    color: 'green',
  },
];

@customElement('crop-planner-card')
export class CropPlannerCard extends LitElement {
  private _hass!: HomeAssistant;
  private _config!: CropPlannerCardConfig;
  private _card: HaCard | null = null;
  private _harvestCard: HaCard | null = null;
  private _cardsReady = false;
  private _lastAiState: string | undefined;
  private _cropEntityIds: string[] = [];

  @state() private _showAddCropDialog = false;
  @state() private _showMoreInfoDialog = false;
  @state() private _moreInfoEntityId = '';

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (!this._cardsReady) return;

    if (this._card) this._card.hass = hass;

    const aiState = hass.states[AI_STATE_ENTITY_ID]?.state;
    if (aiState !== this._lastAiState) {
      this._lastAiState = aiState;
      if (aiState === 'idle' && this._harvestCard) this._harvestCard.hass = hass;
    }

    const currentCropEntityIds = Object.keys(hass.states).filter((id) => id.startsWith(`${CROP_DOMAIN}.`));
    if (currentCropEntityIds.length !== this._cropEntityIds.length) {
      this._cropEntityIds = currentCropEntityIds;
      this._card?.setConfig(this._buildVerticalStackConfig());
    }
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  static getConfigElement() {
    return document.createElement('crop-planner-card-editor');
  }

  getGridOptions() {
    return { columns: 'full', min_rows: 6 };
  }

  getStubConfig(): CropPlannerCardConfig {
    return { type: 'custom:crop-planner-card', title: 'Crop Planner' };
  }

  setConfig(config: CropPlannerCardConfig) {
    this._config = config;
  }

  private _buildVerticalStackConfig() {
    return {
      type: 'vertical-stack',
      cards: [
        {
          type: 'heading',
          heading: this._config.title ?? 'Crop Planner',
          icon: 'mdi:sprout',
          heading_style: 'title',
          badges: AI_STATE_BADGES.map(({ state, icon, color }) => ({
            type: 'entity',
            entity: AI_STATE_ENTITY_ID,
            show_state: true,
            show_icon: true,
            icon,
            color,
            visibility: [{ condition: 'state', entity: AI_STATE_ENTITY_ID, state }],
          })),
        },
        {
          type: 'entities',
          title: '',
          entities: [
            {
              type: 'buttons',
              entities: [
                {
                  entity: 'script.add_crop',
                  icon: 'mdi:sprout',
                  name: localize('button.add_crop', this._hass.language),
                  show_name: true,
                  tap_action: { action: 'fire-dom-event', event_data: { type: 'show-add-crop-dialog' } },
                },
                {
                  entity: AI_BUTTON_ENTITY_ID,
                  icon: 'mdi:assistant',
                  name: localize('button.generate_chores', this._hass.language),
                  show_name: true,
                  tap_action: { action: 'toggle', target: { entity_id: AI_BUTTON_ENTITY_ID } },
                },
              ],
            },
          ],
        },
        { type: 'custom:crop-planner-harvest-card' },
        {
          type: 'entities',
          title: '',
          entities: this._cropEntityIds.map((entity_id) => ({
            entity: entity_id,
            tap_action: {
              action: 'fire-dom-event',
              event_data: { type: 'show-crop-more-info', entity_id },
            },
          })),
        },
        {
          type: 'todo-list',
          title: '',
          entity: TODO_ENTITY_ID,
          hide_completed: true,
          hide_section_headers: true,
          display_order: 'duedate_asc',
        },
      ],
    };
  }

  async firstUpdated() {
    this._cropEntityIds = Object.keys(this._hass.states).filter((id) => id.startsWith(`${CROP_DOMAIN}.`));
    const helpers = await (window as unknown as { loadCardHelpers: () => Promise<CardHelpers> }).loadCardHelpers();

    this._card = helpers.createCardElement(this._buildVerticalStackConfig());
    this._cardsReady = true;
    this._lastAiState = this._hass.states[AI_STATE_ENTITY_ID]?.state;

    const root = this.shadowRoot!.getElementById('root')!;
    this._card.hass = this._hass;
    root.appendChild(this._card);

    this.shadowRoot!.addEventListener('ll-custom', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.event_data?.type === 'show-add-crop-dialog') {
        this._showAddCropDialog = true;
      }
      if (detail?.event_data?.type === 'show-crop-more-info') {
        this._moreInfoEntityId = detail.event_data.entity_id;
        this._showMoreInfoDialog = true;
      }
    });

    // Wait for the vertical-stack to render its children before grabbing the reference
    await new Promise((resolve) => setTimeout(resolve, 0));
    this._harvestCard = this._card.shadowRoot?.querySelector('crop-planner-harvest-card') ?? null;
  }

  render() {
    return html`
      <div id="root"></div>
      <crop-planner-add-crop-dialog
        .hass=${this._hass}
        .open=${this._showAddCropDialog}
        @dialog-closed=${() => {
          this._showAddCropDialog = false;
        }}
      ></crop-planner-add-crop-dialog>
      <crop-planner-more-info-dialog
        .hass=${this._hass}
        .open=${this._showMoreInfoDialog}
        .entityId=${this._moreInfoEntityId}
        @dialog-closed=${() => {
          this._showMoreInfoDialog = false;
        }}
      ></crop-planner-more-info-dialog>
    `;
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
