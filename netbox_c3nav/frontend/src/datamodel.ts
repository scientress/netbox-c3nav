import {C3navOverlayBrief, C3navPosition} from "./netbox_c3nav_types";
import * as L from "leaflet";
import {DCIM} from "./netbox_types";
import {C3navApiTypes} from "./c3nav_types";
import {ErrorResponse, ExceptionResponse, IdempotencyErrorResponse, ListResponse, netBoxApi} from "./netbox_api";
import {Map} from "./c3nav_map";
import {MdiIcon, MdiIconMarkerStyles, MdiIconOptions} from "./leaflet_icons";

class FeedbackClearingTimerHandle {
  resolveFunc: (value: void | PromiseLike<void>) => void
  rejectFunc: (value: void | PromiseLike<void>) => void
  timeoutId: number

  constructor(resolveFunc: (value: void | PromiseLike<void>) => void,
              rejectFunc: (value: void | PromiseLike<void>) => void,
              timeoutHandle: number) {
    this.resolveFunc = resolveFunc
    this.rejectFunc = rejectFunc
    this.timeoutId = timeoutHandle
  }

}

export class DeviceMarker {
  id: number | null = null
  position: C3navPosition | null = null
  leafletMarker: L.Marker | null = null
  device: DCIM.DeviceBrief | DCIM.Device | null = null
  unlocked: boolean = false
  draggingStyleElement?: HTMLStyleElement
  private uiFeedbackActive: boolean = false
  private inErrorState: boolean = false
  private uiFeedbackClearingTimeoutHandle: FeedbackClearingTimerHandle
  private errorStateClearingTimeoutHandle: FeedbackClearingTimerHandle


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
    if (!this.id) {
      this.id = pos.id
    }
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

  private attachPopup(): void {
    let popupBody = ""
    const displayURL = this.getDeviceDisplayURL()
    if (displayURL) {
      popupBody += `<a href="${displayURL}" target="_blank">${this.device.display || this.device.name}</a>`
    } else {
      popupBody += this.device.display || this.device.name
    }
    if (this.device.description) {
      popupBody += `<br><span class="text-secondary">${this.device.description}</span>`
    }
    this.leafletMarker.bindPopup(popupBody)
  }

  private createMarker() {
    if (this.leafletMarker !== null) {
      throw new Error('leaflet marker already created')
    }
    this.leafletMarker = L.marker(L.GeoJSON.coordsToLatLng([this.position.x, this.position.y]), {
      title: this.device.display || this.device.name,
      icon: this.createLeafletIcon(this.getMarkerConfig()),
    })
    this.attachPopup()
    this.leafletMarker.on("dragstart", (e) => {
      if (!this.unlocked) {
        console.warn('marker dragged but not unlocked??? - ignoring')
        return
      }
      if (this.inErrorState) {
        this.clearError()
      } else if (this.uiFeedbackActive) {
        this.clearUiFeedback()
      }
      this.injectDraggingStyle()
      // needs to be permanente because leaflet re-creates the marker icon
      this.setMarkerStyle('marker', false)
      this.leafletMarker.getElement().style.setProperty('--leaflet-icon-mdi-animation-duration', '0.25s');
    })

    this.leafletMarker.on('dragend', e => {
      this.removeDraggingStyle()
      if (!this.unlocked) {
        console.warn('marker dragged but not unlocked??? - ignoring')
        return
      }
      this.leafletMarker.getElement().addEventListener('transitionend', e => {
        this.leafletMarker.getElement().style.removeProperty('--leaflet-icon-mdi-animation-duration')
      }, {once: true})
      const previousPosition: [number, number] = [this.position.x, this.position.y]
      this.updatePositionFromMarker()
      this.save().catch((error: Error) => {
        if (error.cause !== 'idempotency-error') {
          [this.position.x, this.position.y] = previousPosition
          this.leafletMarker.setLatLng([this.position.y, this.position.x])
        }
      })
    })

  }

  private createLeafletIcon(options?: MdiIconOptions) {
    const iconOptions: MdiIconOptions = {
      icon: this.getIcon(),
      className: 'default-device',
      markerStyle: 'round',
      markerStyleChangeAnimated: true,
    }
    if (!!options) {
      // filter null values so we don't override the defaults
      options = Object.fromEntries(Object.entries(options).filter(([_, v]) => v != null));
      Object.assign(iconOptions, options)
      // devices with a configured style get the configured-device class
      iconOptions['className'] = 'configured-device'
    }
    return new MdiIcon(iconOptions);
  }

  public attach(overlay: L.LayerGroup) {
    if (this.leafletMarker === null) {
      this.createMarker()
    }
    this.leafletMarker.addTo(overlay)
  }

  public recreateMarker(map: Map) {
    if (this.leafletMarker === null) return
    console.log('recreating device marker', this)
    this.clearError().then(() => {
      //this.leafletMarker.remove()
      // because marker.remove() doesn't work properly
      this.leafletMarker.removeFrom(map.markerClusterGroups[this.position.level_id] as any as L.Map)
      this.leafletMarker.removeFrom(map.overlayGroups[this.position.level_id] as any as L.Map)
      this.leafletMarker = null
      this.attach(map.markerClusterGroups[this.position.level_id])
    })
  }

  public async save(noAutoCleanError: boolean = false): Promise<DeviceMarker|Error> {
    const creating:boolean = this.id === null
    // temporarily replace the icon with a sand timer icon while the position is saved
    this.uiFeedbackActive = true
    this.setIcon('timer-sand-full', creating)
    this.setRotating(true)
    const wasUnlocked: boolean = this.unlocked
    this.lock()

    const request = (creating) ?
      // new marker
      netBoxApi.post('plugins/c3nav/positions', {
        x: this.position.x,
        y: this.position.y,
        level_id: this.position.level_id,
        level_index: this.position.level_index,
        device: this.device.id
      })
      :
      netBoxApi.patch(`plugins/c3nav/positions/${this.id}/`, {
        x: this.position.x,
        y: this.position.y,
        last_updated: this.position.last_updated,
      })

    return request.then(async (response: C3navPosition|ErrorResponse|IdempotencyErrorResponse<C3navPosition>|ExceptionResponse) => {
      if ('id' in response) {
        this.resetMarkerStyle()
        this.setRotating(false)
        this.setIcon('check-bold', true)
        console.log(`marker with id:${response.id} ${creating ? 'created' : 'updated'}`, response)
        this.setDevicePosition(response, true)
        this.clearUiFeedback(2).then(() => {
          console.log('save ui feedback cleared')
        })
      } else {
        // probably an error then
        console.error(`error ${creating ? 'setting' : 'updating'} device position`, response)
        if ('status' in response && response.status === 'conflict') {
          this.setDevicePosition(response.object)
          return Promise.reject(new Error((response as IdempotencyErrorResponse).detail, {cause: 'idempotency-error'}))
        } else if ('detail' in response) {
          return Promise.reject(new Error((response as ErrorResponse).detail))
        } else if (creating && 'device' in response && typeof response.device === 'object') {
          const r = await netBoxApi.get(`plugins/c3nav/positions/?device=${this.device.id}`) as ListResponse<C3navPosition>
          if (r.results.length === 1) {
            this.setDevicePosition(r.results[0])
          }
          return Promise.reject(new Error((response.device as any as string[]).join('<br>'), {cause: 'already-exists'}))
        } else if ('error' in response) {
          return Promise.reject(new Error((response as ExceptionResponse).error))
        } else {
          return Promise.reject(new Error(`Can't parse server response: ${JSON.stringify(response)}`))
        }
      }
      return this
    }).catch((error: Error) => {
      this.inErrorState = true
      this.setRotating(false)
      this.setIcon('cloud-alert', false)
      this.setIconColor('var(--tblr-red-fg)', false)
      this.setMarkerColor('var(--tblr-red)', false)
      this.leafletMarker.bindPopup(`Error ${creating ? 'setting' : 'updating'} device position:<br>${error.message}`).openPopup()
      if (!noAutoCleanError) {
        this.clearError(5).then()
      }
      return Promise.reject(error)
    }).finally(()=>{
      if (wasUnlocked) this.unlock()
    })
  }

  public async clearUiFeedback(delay?: number): Promise<void> {
    if (!this.uiFeedbackActive) return Promise.resolve()
    const timeoutHandle: FeedbackClearingTimerHandle = this.uiFeedbackClearingTimeoutHandle
    if (timeoutHandle) {
      this.uiFeedbackClearingTimeoutHandle = undefined
      window.clearTimeout(timeoutHandle.timeoutId)
      console.log('canceling timeout of previously scheduled ui feedback clearing')
    }
    const clearUiFeedback = (resolve: (value: void | PromiseLike<void>) => void): void => {
      this.uiFeedbackClearingTimeoutHandle = undefined
      if (!this.uiFeedbackActive) return resolve()
      console.log('clearing ui feedback')
      this.uiFeedbackActive = false
      this.resetIcon()
      this.resetIconColor()
      this.resetMarkerColor()
      this.resetMarkerStyle()
      resolve()
    }
    const promise: Promise<void> = (typeof delay === 'number' && delay > 0) ?
      new Promise((resolve, reject) => {
        console.log(`scheduling ui feedback clearing in ${delay}s`)
        this.uiFeedbackClearingTimeoutHandle = new FeedbackClearingTimerHandle(
          resolve,
          reject,
          setTimeout(() => {
            clearUiFeedback(resolve)
          }, delay * 1000)
        )
      })
    :
      new Promise(resolve => {
        console.log('immediately clearing ui feedback')
        clearUiFeedback(resolve)
      })

    if (timeoutHandle) {
      promise.then(() => {
        console.log('resolving promise of previously scheduled ui feedback clearing')
        timeoutHandle.resolveFunc()
      })
    }
    return promise
  }

  public async clearError(delay?: number): Promise<void> {
    if (!this.inErrorState) return Promise.resolve()
    const timeoutHandle: FeedbackClearingTimerHandle = this.errorStateClearingTimeoutHandle
    if (timeoutHandle) {
      this.errorStateClearingTimeoutHandle = undefined
      window.clearTimeout(timeoutHandle.timeoutId)
      console.log('canceling timeout of previously scheduled error state clearing')
    }
    const clearError = (resolve: (value: void | PromiseLike<void>) => void): void => {
      if (!this.inErrorState) return resolve()
      this.inErrorState = false
      console.log('clearing error on device marker', this)

      const markerPos: L.LatLng = this.leafletMarker.getLatLng()
      if (this.position.x !== markerPos.lng || this.position.y !== markerPos.lat) {
        //this.leafletMarker.getElement().style.transition = 'transform3d 1s ease-in-out'
        let isPositionReset = false
        const fallBackTimeout = window.setTimeout(() => {
          if (isPositionReset) return
          isPositionReset = true
          this.leafletMarker.setLatLng([this.position.y, this.position.x])
        }, 2000)
        this.leafletMarker.getElement().addEventListener('transitionend', e => {
          if (isPositionReset) return
          clearTimeout(fallBackTimeout)
          isPositionReset = true
          console.log('marker appearance reset', e)
          this.leafletMarker.setLatLng([this.position.y, this.position.x])
        }, {once: true})
      }
      this.leafletMarker.closePopup()
      this.attachPopup()
      resolve(this.clearUiFeedback())
    }

    const promise: Promise<void> = (typeof delay === 'number' && delay > 0) ?
      new Promise((resolve, reject) => {
        console.log(`scheduling error state clearing in ${delay}s`)
        this.errorStateClearingTimeoutHandle = new FeedbackClearingTimerHandle(
          resolve,
          reject,
          setTimeout(() => {
            clearError(resolve)
          }, delay * 1000)
        )
      })
    :
      new Promise(resolve => {
        console.log('immediately clearing error state')
        clearError(resolve)
      })

    if (timeoutHandle) {
      promise.then(() => {
        console.log('resolving promise of previously scheduled error state clearing')
        timeoutHandle.resolveFunc()
      })
    }
    return promise
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

  public getMarkerConfig(): MdiIconOptions | null {
    return this.position?.markerConfig?? null
  }

  public getIcon(): string {
    // ToDo: get icon for device-role
    return this.getMarkerConfig()?.icon ?? 'hexagon-multiple'
  }

  public setIcon(iconName: string, temporary: boolean = false): void {
    if (!this.leafletMarker) return
    if (!temporary) {
      (this.leafletMarker.getIcon() as MdiIcon).options.icon = iconName
    }
    const markerIconSpan = this.leafletMarker.getElement()?.querySelector('span.mdi')
    if (!markerIconSpan) return
    Array.from(markerIconSpan.classList.values()).forEach(className => {
      if (className.match(/^mdi-.*/)) markerIconSpan.classList.remove(className)
    })
    markerIconSpan.classList.add(`mdi-${iconName}`)
  }

  public resetIcon(temporary: boolean = false): void {
    this.setIcon(this.getIcon(), temporary)
  }

  public getIconRotation(): string {
    // ToDo: get icon rotation for device-role
    return this.getMarkerConfig()?.iconRotation ??
      ((this.leafletMarker?.getIcon() as MdiIcon).options.iconRotation || '')
  }

  public setIconRotation(rotation: number|string, temporary: boolean = false): void {
    if (!this.leafletMarker) return
    if (typeof rotation !== 'string') {
      rotation = `${rotation}deg`
    }
    if (!temporary) {
      (this.leafletMarker.getIcon() as MdiIcon).options.iconRotation = rotation || undefined
    }
    const markerIconSpan: HTMLSpanElement = this.leafletMarker.getElement()?.querySelector('span.mdi')
    if (markerIconSpan) {
      let existingTransform = L.DomUtil.getStyle(markerIconSpan, 'transform') || ''
      existingTransform.replace(/rotate([^)]*?)/, '')
      markerIconSpan.style.transform = rotation ? `rotate(${rotation}) ${existingTransform}` : existingTransform
    }
  }

  public resetIconRotation(temporary: boolean = false): void {
    if (!this.leafletMarker) return
    this.setIconRotation(this.getIconRotation(), temporary)
  }

  public setRotating(rotating: boolean, temporary: boolean = false, force: boolean = false): void {
    if (!this.leafletMarker) return
    if (rotating && !force && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rotating = false
    }
    if (!temporary) {
      (this.leafletMarker.getIcon() as MdiIcon).options.iconRotating = rotating
    }
    if (rotating) {
      this.leafletMarker.getElement()?.classList.add('leaflet-icon-mdi-icon-rotating')
    } else {
      this.leafletMarker.getElement()?.classList.remove('leaflet-icon-mdi-icon-rotating')
    }
  }

  public getIconColor(): string {
    // ToDo: get icon color for device-role
    return this.getMarkerConfig()?.color ?? ''
  }

  public setIconColor(color: string, temporary: boolean = false): void {
    if (!this.leafletMarker) return
    if (!temporary) {
      (this.leafletMarker.getIcon() as MdiIcon).options.color = color || undefined
    }
    if (color) {
      this.leafletMarker.getElement()?.style.setProperty('--leaflet-icon-mdi-icon-color', color)
    } else {
      this.leafletMarker.getElement()?.style.removeProperty('--leaflet-icon-mdi-icon-color')
    }
  }

  public resetIconColor(temporary: boolean = false): void {
    if (!this.leafletMarker) return
    this.setIconColor(this.getIconColor(), temporary)
  }

  public getMarkerColor(): string {
    // ToDo: get marker color for device-role
    return this.getMarkerConfig()?.markerColor ?? ''
  }

  public setMarkerColor(color: string, temporary: boolean = false): void {
    if (!this.leafletMarker) return
    if (!temporary) {
      (this.leafletMarker.getIcon() as MdiIcon).options.markerColor = color || undefined
    }
    if (color) {
      this.leafletMarker.getElement()?.style.setProperty('--leaflet-icon-mdi-marker-color', color)
    } else {
      this.leafletMarker.getElement()?.style.removeProperty('--leaflet-icon-mdi-marker-color')
    }
    console.log('setMarkerColor', color, this.leafletMarker.getIcon().options)
  }

  public resetMarkerColor(temporary: boolean = false): void {
    if (!this.leafletMarker) return
    this.setMarkerColor(this.getMarkerColor(), temporary)
  }

  public getMarkerStyle(): MdiIconMarkerStyles {
    // ToDo: get marker style for device-role
    return this.getMarkerConfig()?.markerStyle ?? 'round'
  }

  public setMarkerStyle(style: MdiIconMarkerStyles, temporary: boolean = false): void {
    if (!this.leafletMarker) return
    if (!temporary) {
      (this.leafletMarker.getIcon() as MdiIcon).options.markerStyle = style
    }

    this.leafletMarker.getElement()?.classList.remove('leaflet-icon-mdi-round', 'leaflet-icon-mdi-icon-only')
    if (style !== 'marker') {
      this.leafletMarker.getElement()?.classList.add(`leaflet-icon-mdi-${style}`)
    }
  }

  public resetMarkerStyle(temporary: boolean = false): void {
    if (!this.leafletMarker) return
    this.setMarkerStyle(this.getMarkerStyle(), temporary)
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