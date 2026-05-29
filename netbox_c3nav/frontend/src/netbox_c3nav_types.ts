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
