import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import type { HomeAssistant } from './types';
import { localize } from './localize';

@customElement('crop-planner-add-crop-form')
export class CropPlannerAddCropForm extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  setConfig(_config: Record<string, unknown>) {}

  @state() private _busy = false;
  @state() private _submitted = false;
  @state() private _error = '';

  static styles = css`
    .card {
      padding: 16px;
    }
    h2 {
      margin: 0 0 16px;
      font-size: 1.2em;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    ha-textfield {
      width: 100%;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .success {
      color: var(--success-color, green);
      font-weight: bold;
      text-align: center;
      padding: 16px 0;
    }
    .error {
      color: var(--error-color, red);
      font-size: 0.9em;
    }
  `;

  private _field(id: string): string {
    return (this.shadowRoot?.getElementById(id) as any)?.value?.trim() ?? '';
  }

  private _closePopup() {
    this.dispatchEvent(
      new CustomEvent('ll-custom', {
        bubbles: true,
        composed: true,
        detail: { browser_mod: { service: 'browser_mod.close_popup', data: {} } },
      }),
    );
  }

  private async _submit() {
    const name = this._field('name');
    if (!name) return;
    this._busy = true;
    this._error = '';
    try {
      const data: Record<string, unknown> = { name };
      const species = this._field('species');
      if (species) data['species'] = species;
      const quantity = parseInt(this._field('quantity'));
      if (quantity > 1) data['quantity'] = quantity;
      await this.hass.callService('crop', 'create_crop', data);
      this._submitted = true;
      setTimeout(() => this._closePopup(), 1500);
    } catch (e: unknown) {
      this._error = e instanceof Error ? e.message : String(e);
    } finally {
      this._busy = false;
    }
  }

  render() {
    if (this._submitted) {
      return html`<div class="card">
        <div class="success">✓ ${localize('popup.add_crop_success', this.hass?.language)}</div>
      </div>`;
    }
    return html`
      <div class="card">
        <h2>${localize('popup.add_crop_title', this.hass?.language)}</h2>
        <div class="form">
          <ha-textfield id="name" label=${localize('popup.field_name', this.hass?.language)} required></ha-textfield>
          <ha-textfield id="species" label=${localize('popup.field_species', this.hass?.language)}></ha-textfield>
          <ha-textfield
            id="quantity"
            label=${localize('popup.field_quantity', this.hass?.language)}
            type="number"
            min="1"
            value="1"
          ></ha-textfield>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
          <div class="actions">
            <ha-button unelevated .disabled=${this._busy} @click=${this._submit}>
              ${localize('popup.add_crop_submit', this.hass?.language)}
            </ha-button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-add-crop-form': CropPlannerAddCropForm;
  }
}
