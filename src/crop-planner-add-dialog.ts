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

  private _close() {
    this.dispatchEvent(new CustomEvent('dialog-closed', { bubbles: true, composed: true }));
  }

  private async _submit() {
    if (!this._name.trim()) return;
    this._submitting = true;
    const data: Record<string, unknown> = { name: this._name.trim(), quantity: this._quantity };
    if (this._species.trim()) data.species = this._species.trim();
    await this.hass.callService('crop', 'create_crop', data);
    this._submitting = false;
    this._close();
  }

  render() {
    if (!this.open) return nothing;
    return renderAddDialog({
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
      onClose: () => this._close(),
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-add-dialog': CropPlannerAddDialog;
  }
}
