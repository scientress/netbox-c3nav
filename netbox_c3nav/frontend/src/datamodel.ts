import {C3navPosition} from "./netbox_c3nav_types";
import * as L from "leaflet";
import {DCIM} from "./netbox_types";
import {C3navApiTypes} from "./c3nav_types";
import {ListResponse, netBoxApi} from "./netbox_api";
import {Map} from "./c3nav_map";

export class DeviceMarker {
  id: number | null = null
  position: C3navPosition | null = null
  leafletMarker: L.Marker | null = null
  device: DCIM.DeviceBrief | DCIM.Device | null = null

  constructor(idOrDevicePosition?: number | C3navPosition) {
    if (typeof idOrDevicePosition === "number") {
      this.id = idOrDevicePosition
    } else if (typeof idOrDevicePosition === "object") {
      this.id = idOrDevicePosition.id
      this.setDevicePosition(idOrDevicePosition)
    } else {
      this.id = null
    }
  }

  setPosition(pos: L.LatLng, level: number | C3navApiTypes.LevelSchema) {
    if (this.position === null || typeof this.position === "undefined") {
      this.position = {
        x: pos.lng,
        y: pos.lat,
        level_id: (typeof level === 'number') ? level : level.id,
        level_index: (typeof level === 'number') ? undefined : level.level_index,
      }
    } else {
      this.position.x = pos.lng;
      this.position.y = pos.lng;
      this.position.level_id = (typeof level === 'number') ? level : level.id
      this.position.level_index = (typeof level === 'number') ? undefined : level.level_index
    }

    if (this.leafletMarker) {
      this.leafletMarker.setLatLng(pos)
    }
  }

  setDevicePosition(pos: C3navPosition) {
    this.position = pos
    this.device = this.position.device
    if (this.leafletMarker) {
      this.leafletMarker.setLatLng(L.GeoJSON.coordsToLatLng([this.position.x, this.position.y]))
    }
  }

  setDeviceFromDOM(element: HTMLElement) {
    this.device = {
      id: Number(element.dataset.id),
      url: `${document.location.origin}/api/dcim/devices/${element.dataset.id}`,
      name: element.dataset.name,
      display: element.dataset.name,
      description: element.dataset.description,
    }
    console.log('set device from DOM', this.device)
  }

  getDeviceDisplayURL(): string {
    if (!this.device) {
      return null
    }
    if (this.device && "display_url" in this.device && this.device.display_url) {
      return this.device.display_url
    }
    return `${document.location.origin}/dcim/devices/${this.device?.id}`
  }

  private createMarker() {
    if (this.leafletMarker !== null) {
      throw new Error('leaflet marker already created')
    }
    this.leafletMarker = L.marker(L.GeoJSON.coordsToLatLng([this.position.x, this.position.y]), {
      title: this.device.display || this.device.name,
    })
    let popupBody = ""
    const displayURL = this.getDeviceDisplayURL()
    if (displayURL) {
      popupBody += `<a href="${displayURL}" target="_blank">${this.device.name}</a>`
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

  public save() {
    if (this.id === null) {
      // new marker
      netBoxApi.post('plugins/c3nav/positions', {
        x: this.position.x,
        y: this.position.y,
        level_id: this.position.level_id,
        level_index: this.position.level_index,
        device: this.device.id
      }).then((response: C3navPosition) => {
        console.log(`marker saved, id:${response.id}`)
        this.id = response.id
        this.setDevicePosition(response)
      })
    }
  }
}


export function loadMarkers(map: Map, next?: string) {
  netBoxApi.get(next || 'plugins/c3nav/positions').then((r: ListResponse)  => {
    for (const dp of r.results as C3navPosition[]) {
      const savedMarker = new DeviceMarker(dp)
      savedMarker.attach(map.markerLayers[dp.level_id])
    }
    if (r.next) {
      loadMarkers(map, r.next)
    }
  })
}