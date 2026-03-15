import { LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CropPlannerCardConfig, HomeAssistant } from './types';

const CROP_DOMAIN = 'crop';
const TODO_ENTITY_ID = 'todo.crop_chores';

@customElement('crop-planner-card')
export class CropPlannerCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  private _config!: CropPlannerCardConfig;
  private _stack?: any;

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

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-card': CropPlannerCard;
  }
}
