import {C3navPosition} from "./netbox_c3nav_types";
import * as L from "leaflet";
import {DCIM} from "./netbox_types";
import {C3navApiTypes} from "./c3nav_types";

export class DeviceMarker {
  id: number | null = null
  position: C3navPosition | null = null
  leafletMarker: L.Marker | null = null
  device: DCIM.DeviceBrief | DCIM.Device | null = null

  constructor(id?: number) {
    this.id = id || null
  }

  setPosition(pos: L.LatLng, level: number | C3navApiTypes.LevelSchema) {
    this.position = {
      x: pos.lng,
      y: pos.lat,
      level_id: (typeof level === 'number') ? level : level.id,
      level_index: (typeof level === 'number') ? undefined : level.level_index,
    }
  }

  setDeviceFromDOM(element: HTMLElement) {
    this.device = {
      id: Number(element.dataset.id),
      url: `${document.location.protocol}//${document.location.host}/api/dcim/devices/${element.dataset.id}`,
      name: element.dataset.name,
      display: element.dataset.name,
      description: element.dataset.description,
      display_url: `${document.location.protocol}//${document.location.host}/dcim/devices/${element.dataset.id}`
    }
    console.log('set device from DOM', this.device)
  }

  private createMarker() {
    if (this.leafletMarker !== null) {
      throw new Error('leaflet marker already created')
    }
    this.leafletMarker = L.marker(L.GeoJSON.coordsToLatLng([this.position.x, this.position.y]), {
      title: this.device.display || this.device.name,
    })
    let popupBody = ""
    if ("display_url" in this.device) {
      popupBody += `<a href="${this.device.display_url}" target="_blank">${this.device.name}</a>`
    } else {
      popupBody += this.device.name
    }
    if (this.device.description) {
      popupBody += `<br><span class="text-secondary">${this.device.description}</span>`
    }
    this.leafletMarker.bindPopup(popupBody)

  }

  public attach(overlay: L.LayerGroup) {
    if (this.leafletMarker === null) {
      this.createMarker()
    }
    this.leafletMarker.addTo(overlay)
  }
}