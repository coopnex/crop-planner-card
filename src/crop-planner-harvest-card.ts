import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import type { HomeAssistant, CropAttributes } from './types';
import { harvestCardStyles } from './crop-planner-harvest-card.styles';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Reference year for normalising dates to a single calendar year (leap year for safety)
const REF_YEAR = 2024;
const YEAR_START = new Date(REF_YEAR, 0, 1).getTime();
const YEAR_END = new Date(REF_YEAR + 1, 0, 1).getTime();
const YEAR_MS = YEAR_END - YEAR_START;

const PHASE_COLORS: Record<string, string> = {
  sowing: '#6d9e6a',
  germination: '#5a9e7e',
  flowering: '#c97ab2',
  harvest: '#c0804a',
};

const PHASE_ICONS: Record<string, string> = {
  sowing: '🌱',
  germination: '🌿',
  flowering: '🌸',
  harvest: '🍂',
};

interface ResolvedPhase {
  name: string;
  startPct: number;
  endPct: number;
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

  return sorted.map((p, i) => {
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
}

@customElement('crop-planner-harvest-card')
export class CropPlannerHarvestCard extends LitElement {
  private _hass!: HomeAssistant;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.requestUpdate();
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _config: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setConfig(config: any) {
    this._config = config;
  }

  getCardSize(): number {
    const cropCount = this._hass ? Object.keys(this._hass.states).filter((id) => id.startsWith('crop.')).length : 0;
    // 32px card padding + 28px header row + cropCount * 30px (28px row + 2px gap)
    return Math.ceil((32 + 28 + cropCount * 30) / 50);
  }
  getGridOptions() {
    const rows = this.getCardSize();
    return { columns: 'full', rows, min_rows: 4 };
  }

  static styles = harvestCardStyles;

  render() {
    if (!this.hass) return nothing;

    const currentMonth = new Date().getMonth(); // 0-indexed
    const crops = Object.values(this.hass.states).filter((e) => e.entity_id.startsWith('crop.'));

    return html`
      <ha-card>
        ${crops.length === 0
          ? html`<div class="empty">No crops found.</div>`
          : html`
              <div class="calendar">
                <!-- Header row -->
                <div class="row">
                  <div class="crop-label"></div>
                  <div class="months-header">
                    ${MONTHS.map(
                      (m, i) => html`<div class="month-label ${i === currentMonth ? 'current' : ''}">${m}</div>`,
                    )}
                  </div>
                </div>

                <!-- One row per crop -->
                ${crops.map((entity) => {
                  const attrs = entity.attributes as CropAttributes;
                  const name = attrs.friendly_name ?? entity.entity_id.split('.')[1];
                  const phases = resolvePhases(attrs.phases);
                  const picture = attrs.entity_picture;

                  return html`
                    <div class="row">
                      ${picture
                        ? html`
                            <div class="crop-label" title="${name}">
                              <img class="crop-thumb" src="${picture}" alt="${name}" />
                              <span class="crop-label-text">${name}</span>
                            </div>
                          `
                        : html`
                            <div class="crop-label-no-img" title="${name}">
                              <span>${name}</span>
                            </div>
                          `}
                      ${keyed(
                        entity.last_updated,
                        html`<div class="bar-track">
                          ${MONTHS.map((_, i) => html`<div class="month-tick" style="left:${(i / 12) * 100}%"></div>`)}
                          ${phases.map(
                            (phase) => html`
                              <div
                                class="phase-segment"
                                title="${phase.name}"
                                style="left:${phase.startPct}%;width:${phase.endPct -
                                phase.startPct}%;background:${PHASE_COLORS[phase.name] ?? '#888'}"
                              >
                                <span class="phase-icon">${PHASE_ICONS[phase.name] ?? ''}</span>
                              </div>
                            `,
                          )}
                        </div>`,
                      )}
                    </div>
                  `;
                })}
              </div>
            `}
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crop-planner-harvest-card': CropPlannerHarvestCard;
  }
}
