import {DCIM} from "./netbox_types";

export interface ErrorResponse {
  detail: string,
}

export interface C3navPosition {
  id?: number;
  url?: string;
  x: number
  y: number
  level_id: number
  level_index?: string | null
  device?: DCIM.DeviceBrief
  c3nav_cords?: string
  c3nav_url?: string
  geojson?: object
  created?: string
  last_updated?: string
}

export interface C3navOverlayBrief {
  id?: number
  url?: string
  name: string
  description: string
  file: string | null
  external_url: string | null
  level_index: string | null
  bounds: [[number, number], [number, number]]
}

export interface C3navOverlay {
  id?: number
  url?: string
  name: string
  description: string
  file: string|null
  external_url: string|null
  c3nav_source_id: number|null
  level_index: string | null
  bottom: number
  left: number
  top: number
  right: number
  tags: string[]
  custom_fields: {[key: string]: any}
  created?: string
  last_updated?: string
}