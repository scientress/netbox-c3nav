import {NetBoxApi} from "./netbox_api";
import {Map} from "./c3nav_map";

declare global {
  interface Window {
    netBoxApi?: NetBoxApi
    map?: Map 
  }
}