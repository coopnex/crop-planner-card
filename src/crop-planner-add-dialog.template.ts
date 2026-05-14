import { html } from 'lit';
import type { TemplateResult } from 'lit';
import { localize } from './localize';

export interface AddDialogContext {
  open: boolean;
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
    <ha-dialog
      ?open=${ctx.open}
      header-title=${localize('popup.add_crop_title', ctx.lang)}
      prevent-scrim-close
      @closed=${ctx.onClose}
    >
      <div>
        <ha-input
          .label=${localize('popup.field_name', ctx.lang)}
          .value=${ctx.name}
          @input=${ctx.onNameInput}
          autofocus
        ></ha-input>
        <ha-input
          .label=${localize('popup.field_quantity', ctx.lang)}
          type="number"
          min="1"
          .value=${String(ctx.quantity)}
          @input=${ctx.onQuantityInput}
        ></ha-input>
        <ha-input
          .label=${localize('popup.field_species', ctx.lang)}
          .value=${ctx.species}
          @input=${ctx.onSpeciesInput}
        ></ha-input>
      </div>
      <ha-dialog-footer slot="footer">
        <ha-button slot="primaryAction" ?disabled=${!ctx.name.trim() || ctx.submitting} @click=${ctx.onSubmit}
          >${localize('popup.add_crop_submit', ctx.lang)}</ha-button
        >
      </ha-dialog-footer>
    </ha-dialog>
  `;
}
