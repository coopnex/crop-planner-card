import { html } from 'lit';
import type { TemplateResult } from 'lit';
import { localize } from './localize';

export interface AddDialogContext {
  lang: string;
  name: string;
  quantity: number;
  species: string;
  submitting: boolean;
  onNameInput: (e: InputEvent) => void;
  onQuantityInput: (e: InputEvent) => void;
  onSpeciesInput: (e: InputEvent) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function renderAddDialog(ctx: AddDialogContext): TemplateResult {
  return html`
    <ha-dialog open @closed=${ctx.onClose}>
      <span slot="heading">${localize('popup.add_crop_title', ctx.lang)}</span>
      <div>
        <ha-textfield
          label=${localize('popup.field_name', ctx.lang)}
          .value=${ctx.name}
          @input=${ctx.onNameInput}
          required
          dialogInitialFocus
        ></ha-textfield>
        <ha-textfield
          label=${localize('popup.field_quantity', ctx.lang)}
          type="number"
          min="1"
          .value=${String(ctx.quantity)}
          @input=${ctx.onQuantityInput}
        ></ha-textfield>
        <ha-textfield
          label=${localize('popup.field_species', ctx.lang)}
          .value=${ctx.species}
          @input=${ctx.onSpeciesInput}
        ></ha-textfield>
      </div>
      <mwc-button slot="primaryAction" ?disabled=${!ctx.name.trim() || ctx.submitting} @click=${ctx.onSubmit}
        >${localize('popup.add_crop_submit', ctx.lang)}</mwc-button
      >
      <mwc-button slot="secondaryAction" @click=${ctx.onClose}> ${localize('popup.back', ctx.lang)} </mwc-button>
    </ha-dialog>
  `;
}
