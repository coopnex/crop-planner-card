export interface CropPlannerCardConfig {
  type: string;
  title?: string;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface CropAttributes {
  friendly_name?: string;
  entity_picture?: string;
  phases?: Record<string, { start?: string; end?: string }>;
  name?: string;
  quantity?: number;
  species?: string | null;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language: string;
  locale: {
    language: string;
  };
  localize(key: string, ...args: unknown[]): string;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<void>;
  connection: {
    sendMessagePromise<T>(message: Record<string, unknown>): Promise<T>;
  };
}

export interface HaCard extends HTMLElement {
  hass: HomeAssistant;
  setConfig(config: Record<string, unknown>): void;
}

export interface CardHelpers {
  createCardElement(config: Record<string, unknown>): HaCard;
}
