import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant, CropAttributes } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  startMonth: number;
  endMonth: number;
}

function resolvePhases(phases: Record<string, { start?: string; end?: string }> | undefined): ResolvedPhase[] {
  if (!phases) return [];

  const sorted = Object.entries(phases)
    .filter(([, r]) => r.start)
    .map(([name, r]) => ({ name, start: r.start!, end: r.end }))
    .sort((a, b) => a.start.localeCompare(b.start));

  return sorted.map((p, i) => {
    const startMonth = parseInt(p.start.split('-')[1], 10);
    let endMonth: number;
    if (p.end) {
      endMonth = parseInt(p.end.split('-')[1], 10);
    } else {
      const next = sorted[i + 1];
      endMonth = next ? parseInt(next.start.split('-')[1], 10) - 1 : 12;
    }
    return { name: p.name, startMonth, endMonth };
  });
}

function phaseForMonth(
  phases: Record<string, { start?: string; end?: string }> | undefined,
  month: number,
): ResolvedPhase | null {
  return resolvePhases(phases).find((p) => month >= p.startMonth && month <= p.endMonth) ?? null;
}

function phaseColorForMonth(
  phases: Record<string, { start?: string; end?: string }> | undefined,
  month: number,
): string | null {
  const phase = phaseForMonth(phases, month);
  return phase ? (PHASE_COLORS[phase.name] ?? '#888') : null;
}

function phaseNameForMonth(
  phases: Record<string, { start?: string; end?: string }> | undefined,
  month: number,
): string | null {
  return phaseForMonth(phases, month)?.name ?? null;
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
    .grid {
      display: grid;
      grid-template-columns: minmax(80px, auto) repeat(12, 1fr);
      gap: 2px;
    }
    .cell {
      height: 28px;
    }
    .month-label {
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
    .crop-label {
      display: flex;
      align-items: center;
      gap: 6px;
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
    .phase-cell {
      border-radius: 3px;
      background: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8em;
    }
    .phase-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3f2107;
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

    const currentMonth = new Date().getMonth() + 1; // 1-12
    const crops = Object.values(this.hass.states).filter((e) => e.entity_id.startsWith('crop.'));

    return html`
      <ha-card>
        <div class="title">Harvest calendar</div>
        ${crops.length === 0
          ? html`<div class="empty">No crops found.</div>`
          : html`
              <div class="grid">
                <!-- Header row -->
                <div class="cell"></div>
                ${MONTHS.map(
                  (m, i) => html` <div class="cell month-label ${i + 1 === currentMonth ? 'current' : ''}">${m}</div> `,
                )}

                <!-- One row per crop -->
                ${crops.map((entity) => {
                  const attrs = entity.attributes as CropAttributes;
                  const name = attrs.friendly_name ?? entity.entity_id.split('.')[1];
                  const phases = attrs.phases;
                  const picture = attrs.entity_picture;

                  return html`
                    <div class="cell crop-label" title="${name}">
                      ${picture ? html`<img class="crop-thumb" src="${picture}" alt="${name}" />` : nothing} ${name}
                    </div>
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                      const color = phaseColorForMonth(phases, month);
                      const phase = phaseNameForMonth(phases, month);
                      const prevPhase = month > 1 ? phaseNameForMonth(phases, month - 1) : null;
                      const isFirstOfPhase = phase && phase !== prevPhase;
                      return html`
                        <div
                          class="cell phase-cell"
                          title="${phase ?? ''}"
                          style="${color ? `background:${color}` : ''}"
                        >
                          ${isFirstOfPhase
                            ? html`<span class="phase-icon">${PHASE_ICONS[phase] ?? ''}</span>`
                            : nothing}
                        </div>
                      `;
                    })}
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
