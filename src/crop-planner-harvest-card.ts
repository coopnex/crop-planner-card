import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant, CropAttributes } from './types';

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
  @property({ attribute: false }) public hass!: HomeAssistant;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _config: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setConfig(config: any) {
    this._config = config;
  }

  static styles = css`
    ha-card {
      padding: 16px;
    }
    .title {
      font-size: 1em;
      font-weight: 500;
      color: var(--primary-text-color);
      margin-bottom: 12px;
    }
    .calendar {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 28px;
    }
    .crop-label {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 0 0 auto;
      width: 120px;
      font-size: 0.82em;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 8px;
    }
    .crop-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      background: var(--secondary-background-color);
    }
    /* Month header row */
    .months-header {
      display: flex;
      flex: 1;
    }
    .month-label {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7em;
      color: var(--secondary-text-color);
      font-weight: 500;
    }
    .month-label.current {
      color: var(--primary-color);
      font-weight: 700;
    }
    /* Phase bar */
    .bar-track {
      position: relative;
      flex: 1;
      height: 12px;
      border-radius: 4px;
      background: var(--secondary-background-color);
      overflow: visible;
    }
    /* Subtle month dividers */
    .month-tick {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(128, 128, 128, 0.15);
    }
    .phase-segment {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 2px;
      overflow: visible;
      transform: translateY(-50%);
      top: 50%;
      bottom: auto;
      height: 12px;
    }
    .phase-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #f5f0e8;
      font-size: 0.85em;
      flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
    }
    .empty {
      text-align: center;
      padding: 16px 0;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 0.9em;
    }
  `;

  render() {
    if (!this.hass) return nothing;

    const currentMonth = new Date().getMonth(); // 0-indexed
    const crops = Object.values(this.hass.states).filter((e) => e.entity_id.startsWith('crop.'));

    return html`
      <ha-card>
        <div class="title">Harvest calendar</div>
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
                      <div class="crop-label" title="${name}">
                        ${picture ? html`<img class="crop-thumb" src="${picture}" alt="${name}" />` : nothing} ${name}
                      </div>
                      <div class="bar-track">
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
                      </div>
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
