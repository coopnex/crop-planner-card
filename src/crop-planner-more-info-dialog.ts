import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CropAttributes, HomeAssistant } from './types';
import { t } from './translations';

const PHASE_COLORS: Record<string, string> = {
  sowing: '#a8d4a5',
  germination: '#5db38a',
  flowering: '#d4607a',
  harvest: '#d4a06a',
  gap: '#7bc275',
};

const PHASE_ICONS: Record<string, string> = {
  sowing: '🌱',
  germination: '🌿',
  flowering: '🌸',
  harvest: '🍂',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REF_YEAR = 2024;
const YEAR_START = new Date(REF_YEAR, 0, 1).getTime();
const YEAR_END = new Date(REF_YEAR + 1, 0, 1).getTime();
const YEAR_MS = YEAR_END - YEAR_START;

interface ResolvedPhase {
  name: string;
  startPct: number;
  endPct: number;
  iconPct?: number | null;
}

function dateToYearPct(dateStr: string): number {
  const [, month, day] = dateStr.split('-').map(Number);
  const t = new Date(REF_YEAR, month - 1, day).getTime();
  return ((t - YEAR_START) / YEAR_MS) * 100;
}

function resolvePhases(phases: Record<string, { start?: string; end?: string }> | undefined): ResolvedPhase[] {
  if (!phases) return [];

  const sorted = Object.entries(phases)
    .filter(([, r]) => r.start)
    .map(([name, r]) => ({ name, start: r.start!, end: r.end }))
    .sort((a, b) => a.start.localeCompare(b.start));

  const raw = sorted.map((p, i) => {
    const startPct = dateToYearPct(p.start);
    let endPct: number;
    if (p.end) {
      endPct = dateToYearPct(p.end);
    } else {
      const next = sorted[i + 1];
      endPct = next ? dateToYearPct(next.start) : startPct + 100 / 12;
    }
    return { name: p.name, startPct, endPct };
  });

  const withGaps: { name: string; startPct: number; endPct: number }[] = [];
  raw.forEach((p, i) => {
    withGaps.push(p);
    if (i < raw.length - 1) {
      const gapStart = p.endPct;
      const gapEnd = raw[i + 1].startPct;
      if (gapEnd > gapStart) withGaps.push({ name: 'gap', startPct: gapStart, endPct: gapEnd });
    }
  });

  const result: ResolvedPhase[] = [];
  withGaps.forEach((seg) => {
    if (seg.endPct < seg.startPct) {
      const midPct = (seg.startPct + 100) / 2;
      result.push({ name: seg.name, startPct: seg.startPct, endPct: 100, iconPct: midPct });
      result.push({ name: seg.name, startPct: 0, endPct: seg.endPct, iconPct: null });
    } else {
      result.push({ name: seg.name, startPct: seg.startPct, endPct: seg.endPct });
    }
  });

  return result;
}

@customElement('crop-planner-more-info-dialog')
export class CropPlannerMoreInfoDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean }) open = false;
  @property() entityId = '';

  private _onHaDialogClosed() {
    if (!this.open) return;
    this.dispatchEvent(new CustomEvent('dialog-closed', { bubbles: true, composed: true }));
  }

  static styles = css`
    .hero {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      display: block;
      margin: -24px -24px 16px;
      width: calc(100% + 48px);
    }
    .state-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    .phase-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 500;
      background: var(--secondary-background-color);
    }
    .details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      margin-bottom: 16px;
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }
    .timeline-label {
      font-size: 0.75em;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary-text-color);
      margin-bottom: 6px;
    }
    .bar-track {
      position: relative;
      height: 28px;
      background: var(--secondary-background-color);
      border-radius: 6px;
      overflow: hidden;
    }
    .phase-segment {
      position: absolute;
      top: 0;
      height: 100%;
    }
    .phase-icon {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      font-size: 14px;
      pointer-events: none;
    }
    .month-tick {
      position: absolute;
      top: 0;
      height: 100%;
      width: 1px;
      background: rgba(0, 0, 0, 0.08);
    }
    .months-row {
      display: flex;
      margin-top: 2px;
    }
    .month-label {
      flex: 1;
      text-align: center;
      font-size: 0.65em;
      color: var(--secondary-text-color);
    }
    .month-label.current {
      font-weight: 700;
      color: var(--primary-color);
    }
  `;

  render() {
    if (!this.hass) return nothing;

    const entity = this.hass.states[this.entityId];
    const attrs = (entity?.attributes ?? {}) as CropAttributes;
    const name = attrs.name ?? attrs.friendly_name ?? this.entityId.split('.')[1] ?? '';
    const state = entity?.state ?? '';
    const phases = resolvePhases(attrs.phases);
    const currentMonth = new Date().getMonth();
    const phaseIcon = PHASE_ICONS[state] ?? '';
    const phaseLabel = state
      ? this.hass.localize(`component.crop.entity.crop.crop.state.${state}`) ||
        this.hass.localize(`state.default.${state}`) ||
        state
      : '';
    const lifecycleLabel = t(this.hass, 'lifecycle');

    return html`
      <ha-adaptive-dialog ?open=${this.open} header-title=${name} @closed=${this._onHaDialogClosed}>
        <div>
          ${attrs.entity_picture ? html`<img class="hero" src="${attrs.entity_picture}" alt="${name}" />` : nothing}
          ${phaseLabel
            ? html`<div class="state-row"><span class="phase-badge">${phaseIcon} ${phaseLabel}</span></div>`
            : nothing}
          <div class="details">
            ${attrs.species ? html`<span>🔬 ${attrs.species}</span>` : nothing}
            ${attrs.quantity != null ? html`<span>🌿 ${attrs.quantity}</span>` : nothing}
          </div>
          ${phases.length > 0
            ? html`
                <div class="timeline-label">${lifecycleLabel}</div>
                <div class="bar-track">
                  ${MONTHS.map((_, i) => html`<div class="month-tick" style="left:${(i / 12) * 100}%"></div>`)}
                  ${phases.map(
                    (phase) => html`
                      <div
                        class="phase-segment"
                        title="${this.hass.localize(`component.crop.entity.crop.crop.state.${phase.name}`) ||
                        phase.name}"
                        style="left:${phase.startPct}%;width:${phase.endPct -
                        phase.startPct}%;background:${PHASE_COLORS[phase.name] ?? '#888'}"
                      ></div>
                    `,
                  )}
                  ${phases
                    .filter((p) => p.name !== 'gap' && p.iconPct !== null)
                    .map((phase) => {
                      const pct = phase.iconPct ?? phase.startPct;
                      return html`<span class="phase-icon" style="left:${pct}%"
                        >${PHASE_ICONS[phase.name] ?? ''}</span
                      >`;
                    })}
                </div>
                <div class="months-row">
                  ${MONTHS.map(
                    (m, i) => html`<div class="month-label ${i === currentMonth ? 'current' : ''}">${m}</div>`,
                  )}
                </div>
              `
            : nothing}
          ${this.open && this.entityId
            ? html`
                <ha-logbook
                  .hass=${this.hass}
                  .entityIds=${[this.entityId]}
                  .time=${{ recent: 30 * 24 * 3600 }}
                ></ha-logbook>
              `
            : nothing}
        </div>
      </ha-adaptive-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-more-info-dialog': CropPlannerMoreInfoDialog;
  }
}
