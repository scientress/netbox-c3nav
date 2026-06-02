import {C3navOverlayBrief, C3navPosition, ErrorResponse} from "./netbox_c3nav_types";
import * as L from "leaflet";
import {DCIM} from "./netbox_types";
import {C3navApiTypes} from "./c3nav_types";
import {ListResponse, netBoxApi} from "./netbox_api";
import {Map} from "./c3nav_map";
import {MdiIcon, MdiIconOptions} from "./leaflet_icons";

export class DeviceMarker {
  id: number | null = null
  position: C3navPosition | null = null
  leafletMarker: L.Marker | null = null
  device: DCIM.DeviceBrief | DCIM.Device | null = null
  unlocked: boolean = false
  draggingStyleElement?: HTMLStyleElement

  constructor(idOrDevicePosition?: number | C3navPosition, marker?: L.Marker) {
    if (typeof idOrDevicePosition === "number") {
      this.id = idOrDevicePosition
    } else if (typeof idOrDevicePosition === "object") {
      this.id = idOrDevicePosition.id
      this.setDevicePosition(idOrDevicePosition)
    } else {
      this.id = null
    }
    if (marker) {
      this.leafletMarker = marker
    }
  }

  setPosition(pos: L.LatLng, level: number | C3navApiTypes.LevelSchema, skipMarkerUpdate?: boolean) {
    if (this.position === null || typeof this.position === "undefined") {
      this.position = {
        x: pos.lng,
        y: pos.lat,
        level_id: (typeof level === 'number') ? level : level.id,
        level_index: (typeof level === 'number') ? undefined : level.level_index,
      }
    } else {
      this.position.x = pos.lng;
      this.position.y = pos.lat;
      this.position.level_id = (typeof level === 'number') ? level : level.id
      this.position.level_index = (typeof level === 'number') ? undefined : level.level_index
    }

    if (this.leafletMarker && !skipMarkerUpdate) {
      this.leafletMarker.setLatLng(pos)
    }
  }

  setDevicePosition(pos: C3navPosition, skipMarkerUpdate?: boolean) {
    this.position = pos
    this.device = this.position.device
    if (this.leafletMarker && ! skipMarkerUpdate) {
      this.leafletMarker.setLatLng(L.GeoJSON.coordsToLatLng([this.position.x, this.position.y]))
    }
  }

  updatePositionFromMarker() {
    const latlng = this.leafletMarker.getLatLng()
    this.position.x = latlng.lng;
    this.position.y = latlng.lat;
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
      icon: this.getIcon(),
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

    this.leafletMarker.on("dragstart", (e) => {
      if (!this.unlocked) {
        console.warn('marker dragged but not unlocked??? - ignoring')
        return
      }
      this.injectDraggingStyle()
      this.leafletMarker.getElement().classList.remove('leaflet-icon-mdi-round')
      this.leafletMarker.getElement().style.setProperty('--leaflet-icon-mdi-animation-duration', '0.25s');
      (this.leafletMarker.getIcon().options as MdiIconOptions).markerStyle = 'marker'
    })

    this.leafletMarker.on('dragend', e => {
      this.removeDraggingStyle()
      if (!this.unlocked) {
        console.warn('marker dragged but not unlocked??? - ignoring')
        return
      }
      window.setTimeout(() => {
        (this.leafletMarker.getIcon().options as MdiIconOptions).markerStyle = 'round'
        this.leafletMarker.getElement().addEventListener('transitionend', e => {
          this.leafletMarker.getElement().style.removeProperty('--leaflet-icon-mdi-animation-duration')
        }, {once: true})
        this.leafletMarker.getElement().classList.add('leaflet-icon-mdi-round')
      }, 250)
      this.updatePositionFromMarker()
      this.save().catch(error => {
        alert(`Can't update position: ${error.message}`)
      })
    })

  }

  private getIcon() {
    return new MdiIcon({
      icon: 'hexagon-multiple',
      className: 'default-device',
      markerStyle: 'round',
      markerStyleChangeAnimated: true,
    });
  }

  public attach(overlay: L.LayerGroup) {
    if (this.leafletMarker === null) {
      this.createMarker()
    }
    this.leafletMarker.addTo(overlay)
  }

  public recreateMarker(map: Map) {
    console.log('recreating device marker', this)
    if (this.leafletMarker === null) return
    //this.leafletMarker.remove()
    // because marker.remove() doesn't work properly
    this.leafletMarker.removeFrom(map.markerClusterGroups[this.position.level_id] as any as L.Map)
    this.leafletMarker = null
    this.attach(map.markerClusterGroups[this.position.level_id])
  }

  public async save(): Promise<DeviceMarker> {
    if (this.id === null) {
      // new marker
      return netBoxApi.post('plugins/c3nav/positions', {
        x: this.position.x,
        y: this.position.y,
        level_id: this.position.level_id,
        level_index: this.position.level_index,
        device: this.device.id
      }).then(async (response: C3navPosition|ErrorResponse) => {
        if ('id' in response) {
          console.log(`marker saved, id:${response.id}`)
          this.id = response.id
          this.setDevicePosition(response as C3navPosition, true)
        } else {
          // probably an error then
          console.error('error saving marker', response)
          return Promise.reject(new Error((response as ErrorResponse).detail))
        }
        return this
      })
    } else {
      return netBoxApi.patch(`plugins/c3nav/positions/${this.id}/`, {
        x: this.position.x,
        y: this.position.y,
      }).then(async (response: C3navPosition|ErrorResponse) => {
        if ('id' in response) {
          console.log(`marker with id:${response.id} updated`, response)
          this.setDevicePosition(response, true)
        } else {
          // probably an error then
          console.error('error updating marker position', response)
          return Promise.reject(new Error((response as ErrorResponse).detail))
        }
        return this
      })
    }
  }

  public unlock() {
    this.unlocked = true
    this.leafletMarker.dragging?.enable()
  }

  public lock() {
    this.unlocked = false
    this.leafletMarker.dragging?.disable()
  }

  private injectDraggingStyle() {
    const styleEl: HTMLStyleElement = this.draggingStyleElement || document.createElement('style')
    this.draggingStyleElement = styleEl

    styleEl.textContent = `
      #map { cursor: crosshair !important; }
      .leaflet-dragging .leaflet-grab,
      .leaflet-dragging .leaflet-grab .leaflet-interactive,
      .leaflet-dragging .leaflet-marker-draggable {
        cursor: crosshair !important;
      }
    `
    document.head.prepend(styleEl)
  }

  private removeDraggingStyle() {
    this.draggingStyleElement?.remove()
  }
}


export async function loadMarkers(map: Map) {
  const markers: DeviceMarker[] = []
  let r: ListResponse<C3navPosition> = null
  do {
    r = await netBoxApi.get(r?.next || 'plugins/c3nav/positions') as ListResponse<C3navPosition>
    for (const dp of r.results) {
      const savedMarker = new DeviceMarker(dp)
      savedMarker.attach(map.markerClusterGroups[dp.level_id])
      markers.push(savedMarker)
    }
  } while (r.next)
  console.log('fetched markers', markers)
  return markers
}


export async function fetchOverlays() {
  const overlays: C3navOverlayBrief[] = []
  let r: ListResponse<C3navOverlayBrief> = null
  do {
    r = await netBoxApi.get(r?.next || 'plugins/c3nav/overlays?brief=true') as ListResponse<C3navOverlayBrief>
    if (!('results' in r)) break
    overlays.push(...r.results)
  } while (r.next)
  console.log('fetched overlays', overlays)
  return overlays
}

export async function loadOverlays(map: Map) {
  const overlays: C3navOverlayBrief[] = await fetchOverlays()
  if (overlays.length === 0) {
    console.log('No overlays, not adding overlay control to map')
    return
  }
  const groupedOverlays= Object.groupBy(overlays, o => o.level_index ? `Level ${o.level_index}` : 'Global')
  for (const groupName in groupedOverlays) {
    groupedOverlays[groupName].forEach((overlay: C3navOverlayBrief) => {
      map.overlayControl.addOverlay(overlay, groupName)
    })
  }
  map.overlayControl.addTo(map.map)
}