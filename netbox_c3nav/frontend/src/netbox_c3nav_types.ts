import {DCIM} from "./netbox_types";
import {MdiIconMarkerStyles, MdiIconOptions} from "./leaflet_icons";

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
  marker_config?: MdiIconOptions
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

export interface MarkerStyleBrief {
  id?: number
  url?: string
  name: string
  device_roles: string[]
  device_types: string[]
  marker_config: MdiIconOptions
}

export interface MarkerStyle extends MarkerStyleBrief {
  icon?: string
  icon_size?: number
  icon_rotation?: number
  icon_is_rotating?: boolean
  icon_color?: string
  marker_style?: MdiIconMarkerStyles
  marker_size?: number
  marker_color?: string
  add_background?: boolean
  background_color?: string
  custom_fields?: {[key: string]: any}
  created?: string
  last_updated?: string
}

export interface IndexMarkerStyleResponse {
  'device_roles': {[slug: string]: MdiIconMarkerStyles}
  'device_types': {[slug: string]: MdiIconMarkerStyles}
}