import {DragDropManager, Draggable, Droppable, Feedback} from '@dnd-kit/dom';
import {pointerIntersection} from '@dnd-kit/collision';
import { gsap } from "gsap";
import {Map} from "./c3nav_map";
import {MapCursor} from "./dnd-plugins";
import {DragDropMarker} from "./dnd-utils";
import {DeviceMarker, loadMarkers, loadOverlays} from "./datamodel";
import {netBoxApi} from "./netbox_api";
import {MdiIcon} from "./leaflet_icons";

// @ts-ignore
window.netBoxApi = netBoxApi

const netbox_c3nav_settings = JSON.parse(document.getElementById('map').dataset.settings);
const map = new Map(netbox_c3nav_settings.c3nav_url, netbox_c3nav_settings.api_key, netbox_c3nav_settings.tileserver_url)
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
    Feedback.configure({
      dropAnimation: null,
    }),
    ]
});
const unpositionedItems: NodeListOf<HTMLLIElement> = document.querySelectorAll('ul.map-unpositioned-items li')
unpositionedItems.forEach(unpositionedItem => {
  new Draggable({
    id: `device:${ unpositionedItem.dataset.id }`,
    element: unpositionedItem,
  }, manager)
})


// setup custom drag overlay

const feedback = manager.plugins.find(
  (plugin): plugin is Feedback => plugin instanceof Feedback
)
const dragOverlayMarker = new MdiIcon({
  icon: 'plus-thick',
})
const overlayElement = document.createElement('div')
overlayElement.classList.add('netbox-c3nav-dnd-overlay')
const overlayOffsetElement = document.createElement('div')
overlayElement.appendChild(overlayOffsetElement)
overlayOffsetElement.classList.add('netbox-c3nav-dnd-overlay-origin-offset')
overlayOffsetElement.appendChild(dragOverlayMarker.createIcon())
document.getElementById('page-content').appendChild(overlayElement)

feedback.overlay = overlayElement

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

  // Skip if drag operation was canceled (e.g. if escape key was pressed)
  if (canceled) {
    // remove drang and drop marker if still there
    drangDropMarker.remove()
    return;
  }

  // Move element to drop target if dropped on droppable
  if (target && target.id === droppable.id) {
    console.log('dropped onto map')
    let dropPos = operation.position.current
    let mapPos = map.map.mouseEventToLatLng(event.nativeEvent as MouseEvent)
    console.log('drop pos:', dropPos)
    console.log('map pos:', mapPos)
    const droppedMarker = drangDropMarker.popMarker()
    const droppedMarkerLayer = map.getCurrentOverlayGroup()
    const markerIconSpan = droppedMarker.getElement().querySelector('span.mdi')
    const marker = new DeviceMarker(undefined, droppedMarker)

    srcElement.classList.add('saving')

    marker.setDeviceFromDOM(srcElement)
    marker.setPosition(mapPos, map.getCurrentLevel())
    markerIconSpan.classList.replace('mdi-plus-thick', 'mdi-timer-sand-full')
    marker.leafletMarker.getElement().classList.add('leaflet-icon-mdi-icon-rotating')
    marker.save().then((success) =>{
      markers.push(marker)
      marker.leafletMarker.getElement().classList.add('leaflet-icon-mdi-round')
      marker.leafletMarker.getElement().classList.remove('leaflet-icon-mdi-icon-rotating')
      markerIconSpan.classList.replace('mdi-timer-sand-full', 'mdi-check-bold')
      srcElement.classList.replace('saving', 'saved')
      gsap.to(srcElement, {
        delay: 2.5,
        duration: 0.5,
        height: '0',
        'padding-top': '0',
        'padding-bottom': '0',
        display: 'none',
        overflow: 'hidden',
      }).then((result) => {
        srcElement.remove()
        marker.recreateMarker(map)
      })
    }).catch((error: Error) => {
      srcElement.classList.replace('saving', 'saving-failed')
      gsap.to(srcElement, {
        delay: 2,
        duration: 0.5,
        '--map-item-list-message-opacity': 0,
      }).then((result) => {
        srcElement.classList.remove('saving-failed')
        srcElement.style.removeProperty('--map-item-list-message-opacity')
      })
      droppedMarker.getElement().classList.remove('leaflet-icon-mdi-icon-rotating')
      markerIconSpan.classList.replace('mdi-timer-sand-full', 'mdi-cloud-alert')
      droppedMarker.getElement().style.setProperty('--leaflet-icon-mdi-marker-color', 'var(--tblr-red)')
      droppedMarker.getElement().style.setProperty('--leaflet-icon-mdi-icon-color', 'var(--tblr-red-fg)')
      window.setTimeout(() => {
        droppedMarker.removeFrom(droppedMarkerLayer as any as L.Map)
      }, 10000)
      droppedMarker.bindPopup(`Can't save device position: ${error.message}`).openPopup()
    })
    if (unlockMarkersButton.classList.contains('active')) {
      marker.unlock()
    }
    console.log('added marker', marker)
    console.log(
      'c3nav position',
      `${netbox_c3nav_settings.c3nav_url}/l/c:${map.getCurrentLevel().level_index}:${mapPos.lng.toFixed(2)}:${mapPos.lat.toFixed(2)}`
    )
  } else {
    console.log('dropped somewhere else', target)
    // remove drang and drop marker if still there
    drangDropMarker.remove()
  }
});

manager.monitor.addEventListener('dragover', (event) => {
  const {operation} = event;
  const srcElement = operation.source.element as HTMLElement
  console.log('dragover', event)

  if (operation.target?.id === droppable.id) {
    console.log('moved over map')
  } else {
    console.log('moved out of map')
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