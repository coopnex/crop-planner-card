export interface CropPlannerCardConfig {
  type: string;
  title?: string;
  show_images?: boolean;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language: string;
  locale: {
    language: string;
  };
}

export interface CropAttributes {
  friendly_name?: string;
  quantity?: number;
  species?: string;
  entity_picture?: string;
  phases?: Record<string, { start?: string; end?: string }>;
  icon?: string;
}
