import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from './types';
import { localize } from './localize';

@customElement('crop-planner-add-crop-dialog')
export class CropPlannerAddCropDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean }) open = false;

  @state() private _name = '';
  @state() private _quantity = 1;
  @state() private _submitting = false;

  // Called when ha-adaptive-dialog fires @closed (after animation), but only acts if
  // parent hasn't already set open=false (submit path). This prevents double dispatch.
  private _onHaDialogClosed() {
    if (!this.open) return;
    this._resetForm();
    this.dispatchEvent(new CustomEvent('dialog-closed', { bubbles: true, composed: true }));
  }

  private _resetForm() {
    this._name = '';
    this._quantity = 1;
    this._submitting = false;
  }

  private async _submit() {
    if (!this._name.trim()) return;
    this._submitting = true;
    const data: Record<string, unknown> = { name: this._name.trim(), quantity: this._quantity };
    await this.hass.callService('crop', 'create_crop', data);
    // Notify parent to set open=false; Lit will then set ha-adaptive-dialog ?open=false
    // which triggers the close animation. The @closed guard above
    // will see open=false by then and skip the second dispatch.
    this._resetForm();
    this.dispatchEvent(new CustomEvent('dialog-closed', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.hass) return nothing;
    const lang = this.hass.language;
    // Always render ha-adaptive-dialog (never remove from DOM abruptly).
    // Use ?open to let it animate open/close naturally.
    return html`
      <ha-adaptive-dialog
        ?open=${this.open}
        header-title=${localize('popup.add_crop_title', lang)}
        prevent-scrim-close
        @closed=${this._onHaDialogClosed}
      >
        <div>
          <ha-input
            .label=${localize('popup.field_name', lang)}
            .value=${this._name}
            @input=${(e: InputEvent) => {
              this._name = (e.target as HTMLInputElement).value;
            }}
            autofocus
          ></ha-input>
          <ha-input
            .label=${localize('popup.field_quantity', lang)}
            type="number"
            min="1"
            .value=${String(this._quantity)}
            @input=${(e: InputEvent) => {
              this._quantity = Number((e.target as HTMLInputElement).value) || 1;
            }}
          ></ha-input>
        </div>
        <ha-dialog-footer slot="footer">
          <ha-button slot="primaryAction" ?disabled=${!this._name.trim() || this._submitting} @click=${this._submit}
            >${localize('popup.add_crop_submit', lang)}</ha-button
          >
        </ha-dialog-footer>
      </ha-adaptive-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-add-crop-dialog': CropPlannerAddCropDialog;
  }
}
