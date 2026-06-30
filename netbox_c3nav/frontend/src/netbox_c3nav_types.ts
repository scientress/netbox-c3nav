import {DCIM} from "./netbox_types";

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
  is_background: boolean
  opacity: number | null
  zindex: number | null
}

export interface C3navOverlay extends C3navOverlayBrief {
  c3nav_source_id: number|null
  bottom: number
  left: number
  top: number
  right: number
  tags: string[]
  custom_fields: {[key: string]: any}
  created?: string
  last_updated?: string
}