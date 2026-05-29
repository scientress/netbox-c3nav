import {Draggable, DragDropManager, Droppable} from '@dnd-kit/dom';
import {pointerIntersection} from '@dnd-kit/collision';
import * as L from 'leaflet'
import {Map} from "./c3nav_map";
import {MapCursor} from "./dnd-plugins";
import {Marker} from "leaflet";
import {DCIM} from "./netbox_types";
import {C3navApiTypes} from "./c3nav_types";
import {C3navPosition} from "./netbox_c3nav_types";

const netbox_c3nav_settings = JSON.parse(document.getElementById('map').dataset.settings);
const c3nav_api_key = netbox_c3nav_settings.c3nav_api_key;
const map = new Map(netbox_c3nav_settings.c3nav_url, c3nav_api_key)
map.bind(document.getElementById('map') as HTMLDivElement)
  
// drang and drop stuff

class DragDropMarker {
  private map: Map
  protected marker: Marker = null

  constructor(map: Map) {
    this.map = map
  }

  moved(pos: L.LatLng) {
    if (this.marker === null) {
      this.marker = L.marker(pos, {}).addTo(map.getCurrentOverlayGroup())
      console.log('created drop marker', this.marker)
    } else {
      this.marker.setLatLng(pos)
      console.log('moved drop marker', this.marker)
    }
  }

  remove() {
    if (this.marker !== null) {
      this.marker.removeFrom(this.map.getCurrentOverlayGroup() as unknown as L.Map)
      this.marker = null
      console.log('removed drop marker', this.marker)
    }
  }
}

class DeviceMarker {
  id: number | null = null
  position: C3navPosition | null = null
  leafletMarker: Marker | null = null
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
      display_url: `/dcim/devices/${element.dataset.id}`
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
      popupBody += `<a href="${this.device.display_url || ""}" target="_blank">${this.device.name}</a>`
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

const manager = new DragDropManager({
  plugins: (defaults) => [
    ...defaults,
    MapCursor.configure({}),
    // Cursor.configure({cursor: 'crosshair'}),
    ]
});
const unpositionedItems: NodeListOf<HTMLLIElement> = document.querySelectorAll('ul.map-unpositioned-items li')
unpositionedItems.forEach(unpositionedItem => {
  new Draggable({
    id: `device:${ unpositionedItem.dataset.id }`,
    element: unpositionedItem,
  }, manager)
})

const droppable = new Droppable({
  element: document.getElementById('map'),
  id: 'map', // Required - must be unique
  collisionDetector: pointerIntersection
  // effects(){
  //   return [
  //     () => droppable.isDropTarget
  //       ? element.classList.add('active')
  //       : element.classList.remove('active')
  //   ];
  // }
  }, manager);

const drangDropMarker = new DragDropMarker(map)

manager.monitor.addEventListener('dragend', (event) => {
  const {operation, canceled} = event;
  const {source, target} = operation;
  const srcElement = source.element as HTMLElement

  console.log('dragend fired', operation)

  // remove drang and drop marker if still there
  drangDropMarker.remove()

  // Skip if drag operation was canceled (e.g. if escape key was pressed)
  if (canceled) {
    srcElement.style.removeProperty('filter')
    return;
  }

  // Move element to drop target if dropped on droppable
  if (target && target.id === droppable.id) {
    console.log('dropped onto map')
    let dropPos = operation.position.current
    let mapPos = map.map.mouseEventToLatLng(event.nativeEvent as MouseEvent)
    console.log('drop pos:', dropPos)
    console.log('map pos:', mapPos)
    const marker = new DeviceMarker()
    marker.setDeviceFromDOM(srcElement)
    marker.setPosition(mapPos, map.getCurrentLevel())
    marker.attach(map.getCurrentOverlayGroup())
    source.element.remove()
    console.log('added marker', marker)
    console.log(
      'c3nav position',
      `${netbox_c3nav_settings.c3nav_url}/l/c:${map.getCurrentLevel().level_index}:${mapPos.lng.toFixed(2)}:${mapPos.lat.toFixed(2)}`
    )
  } else {
    console.log('dropped somewhere else', target)
  }
});

manager.monitor.addEventListener('dragover', (event) => {
  const {operation} = event;
  const srcElement = operation.source.element as HTMLElement
  console.log('dragover', event)

  if (operation.target?.id === droppable.id) {
    console.log('moved over map')
    srcElement.style.filter = 'opacity(0)'
  } else if (operation.target === null) {
    console.log('moved out of map')
    srcElement.style.removeProperty('filter')
    drangDropMarker.remove()
  }
})

manager.monitor.addEventListener('dragmove', (event) => {
  const {operation} = event;
  if (operation.target?.id === droppable.id) {
    let mapPos = map.map.mouseEventToLatLng(event.nativeEvent as MouseEvent)
    drangDropMarker.moved(mapPos)
  }
})