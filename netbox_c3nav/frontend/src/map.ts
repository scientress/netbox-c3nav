import {DragDropManager, Draggable, Droppable} from '@dnd-kit/dom';
import {pointerIntersection} from '@dnd-kit/collision';
import {Map} from "./c3nav_map";
import {MapCursor} from "./dnd-plugins";
import {DragDropMarker} from "./dnd-utils";
import {DeviceMarker, loadMarkers, loadOverlays} from "./datamodel";
import {ListResponse, netBoxApi} from "./netbox_api";
import {C3navPosition} from "./netbox_c3nav_types";

// @ts-ignore
window.netBoxApi = netBoxApi

const netbox_c3nav_settings = JSON.parse(document.getElementById('map').dataset.settings);
const map = new Map(netbox_c3nav_settings.c3nav_url, netbox_c3nav_settings.c3nav_api_key)
const unlockMarkersButton = document.getElementById('unlockMarkers');
const markers: DeviceMarker[] = []
map.bind(document.getElementById('map') as HTMLDivElement).then(async () => {
  console.log('loading overlays')
  await loadOverlays(map)
  console.log('loading markers')

  markers.push(...await loadMarkers(map));
  if (unlockMarkersButton) {
    unlockMarkersButton.addEventListener('click', (event) => {
      if (unlockMarkersButton.classList.contains('active')) {
        unlockMarkersButton.classList.remove('active')
        unlockMarkersButton.innerHTML = unlockMarkersButton.innerHTML.replace('Lock', 'Unlock');
        unlockMarkersButton.title = 'Make markers moveable'
        markers.forEach(marker => {
          marker.lock()
        })
      } else {
        unlockMarkersButton.classList.add('active')
        unlockMarkersButton.innerHTML = unlockMarkersButton.innerHTML.replace('Unlock', 'Lock');
        unlockMarkersButton.title = 'Fix markers is position'
        markers.forEach(marker => {
          marker.unlock()
        })
      }
    })
  }

  map.addEventListener('levelchange', (event) => {
    if (unlockMarkersButton.classList.contains('active')) {
      markers.forEach(marker => {
        marker.unlock()
      })
    }
  })
})

// @ts-ignore
window.map = map

// drang and drop stuff

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
    marker.attach(map.getCurrentMarkerLayer())
    marker.save()
    markers.push(marker)
    if (unlockMarkersButton.classList.contains('active')) {
      marker.unlock()
    }
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