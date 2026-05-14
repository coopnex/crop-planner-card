import { LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from './types';
import { renderAddDialog } from './crop-planner-add-dialog.template';

@customElement('crop-planner-add-dialog')
export class CropPlannerAddDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean }) open = false;

  @state() private _name = '';
  @state() private _quantity = 1;
  @state() private _species = '';
  @state() private _submitting = false;

  // Called when ha-dialog fires @closed (after animation), but only acts if
  // parent hasn't already set open=false (submit path). This prevents double dispatch.
  private _onHaDialogClosed() {
    if (!this.open) return;
    this._resetForm();
    this.dispatchEvent(new CustomEvent('dialog-closed', { bubbles: true, composed: true }));
  }

  private _resetForm() {
    this._name = '';
    this._quantity = 1;
    this._species = '';
    this._submitting = false;
  }

  private async _submit() {
    if (!this._name.trim()) return;
    this._submitting = true;
    const data: Record<string, unknown> = { name: this._name.trim(), quantity: this._quantity };
    if (this._species.trim()) data.species = this._species.trim();
    await this.hass.callService('crop', 'create_crop', data);
    // Notify parent to set open=false; Lit will then set ha-dialog ?open=false
    // which triggers ha-dialog's close animation. The @closed guard above
    // will see open=false by then and skip the second dispatch.
    this._resetForm();
    this.dispatchEvent(new CustomEvent('dialog-closed', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.hass) return nothing;
    // Always render ha-dialog (never remove from DOM abruptly).
    // Use ?open to let ha-dialog animate open/close naturally.
    return renderAddDialog({
      open: this.open,
      lang: this.hass.language,
      name: this._name,
      quantity: this._quantity,
      species: this._species,
      submitting: this._submitting,
      onNameInput: (e) => {
        this._name = (e.target as HTMLInputElement).value;
      },
      onQuantityInput: (e) => {
        this._quantity = Number((e.target as HTMLInputElement).value) || 1;
      },
      onSpeciesInput: (e) => {
        this._species = (e.target as HTMLInputElement).value;
      },
      onSubmit: () => this._submit(),
      onClose: () => this._onHaDialogClosed(),
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-add-dialog': CropPlannerAddDialog;
  }
}
