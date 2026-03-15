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
    overflow: visible;
  }
  .crop-label {
    position: relative;
    flex: 0 0 20px;
    width: 20px;
    height: 28px;
    flex-shrink: 0;
    overflow: visible;
    z-index: 1;
    display: flex;
    align-items: center;
    margin-left: -10px;
  }
  .crop-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    flex-shrink: 0;
    background: var(--secondary-background-color);
  }
  .crop-label-text {
    position: absolute;
    left: 6px;
    top: 48%;
    line-height: 1;
    transform: translateY(-50%);
    white-space: nowrap;
    color: var(--primary-text-color);
    text-shadow: 0 0 5px var(--card-background-color, #fff), 0 0 5px var(--card-background-color, #fff),
      0 0 7px var(--card-background-color, #fff), 0 0 7px var(--card-background-color, #fff);
    pointer-events: none;
    z-index: 2;
  }
  .crop-label-no-img {
    position: relative;
    flex: 0 0 20px;
    width: 20px;
    height: 28px;
    flex-shrink: 0;
    overflow: visible;
    z-index: 1;
    margin-left: -10px;
  }
  .crop-label-no-img span {
    position: absolute;
    left: 8px;
    top: 50%;
    line-height: 1;
    transform: translateY(-50%);
    color: var(--primary-text-color);
    text-shadow: 0 0 5px var(--card-background-color, #fff), 0 0 5px var(--card-background-color, #fff),
      0 0 7px var(--card-background-color, #fff), 0 0 7px var(--card-background-color, #fff);
    white-space: nowrap;
    z-index: 2;
  }
  /* Month header row */
  .months-header {
    display: flex;
    flex: 1;
    margin-left: 36px;
    margin-right: -10px;
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
    margin-left: 36px;
    margin-right: -10px;
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
    line-height: 1;
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
