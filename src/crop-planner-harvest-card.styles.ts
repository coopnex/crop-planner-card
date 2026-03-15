import { css } from 'lit';

export const harvestCardStyles = css`
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
    top: 50%;
    bottom: auto;
    height: 12px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 2px;
    overflow: visible;
    transform: translateY(-50%);
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
