import {DragDropManager, Draggable, Droppable, Feedback} from '@dnd-kit/dom';
import {pointerIntersection} from '@dnd-kit/collision';
import { gsap } from "gsap";
import * as L from 'leaflet';
import {Map} from "./c3nav_map";
import {MapCursor} from "./dnd-plugins";
import {DeviceMarker, loadMarkers, loadOverlays} from "./datamodel";
import {netBoxApi} from "./netbox_api";
import {MdiIcon} from "./leaflet_icons";

// @ts-ignore
window.netBoxApi = netBoxApi

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

const feedback: Feedback = manager.registry.plugins.get(Feedback)
const dragOverlayMarker = new MdiIcon({
  icon: 'plus-thick',
})
const overlayElement = document.createElement('div')
overlayElement.classList.add('netbox-c3nav-dnd-overlay')
const overlayOffsetElement = document.createElement('div')
overlayElement.appendChild(overlayOffsetElement)
overlayOffsetElement.classList.add('netbox-c3nav-dnd-overlay-origin-offset')
overlayOffsetElement.appendChild(dragOverlayMarker.createIcon())
document.body.appendChild(overlayElement)
feedback.overlay = overlayElement

const droppable = new Droppable({
  element: document.getElementById('map'),
  id: 'map', // Required - must be unique
  collisionDetector: pointerIntersection,
  effects(){
    return [
      () => droppable.isDropTarget
        ? overlayElement.classList.add('over-map')
        : overlayElement.classList.remove('over-map')
    ];
  }
  }, manager);

manager.monitor.addEventListener('dragstart', (event) => {
  const {operation} = event;
  const {source} = operation;

  // if there is a error message active for the device clear it
  if ('clearError' in source.data) {
    source.data.clearError();
  }
})

manager.monitor.addEventListener('dragend', (event) => {
  const {operation, canceled} = event;
  const {source, target} = operation;
  const srcElement = source.element as HTMLElement

  console.log('dragend fired', operation)

  // Skip if drag operation was canceled (e.g. if escape key was pressed)
  if (canceled) {
    return;
  }

  // Save device position if device was dropped on map
  if (target && target.id === droppable.id) {
    console.log('dropped onto map')
    srcElement.classList.add('saving')
    // disable the source draggable to prevent it being added a 2nd time while we are saving the position
    source.disabled = true

    let dropPos = operation.position.current
    let mapPos = map.map.mouseEventToLatLng(event.nativeEvent as MouseEvent)
    console.log('drop pos:', dropPos)
    console.log('map pos:', mapPos)
    const droppedMarkerLayer = map.getCurrentOverlayGroup()
    const droppedMarker = L.marker(mapPos, {
        interactive: false,
        keyboard: false,
        icon: new MdiIcon({
          icon: 'plus-thick',
          markerStyleChangeAnimated: !prefersReducedMotion,
          markerStyleChangeAnimationDuration: '0.3s',
        }),
      }).addTo(droppedMarkerLayer)
    const marker = new DeviceMarker(undefined, droppedMarker)

    marker.setDeviceFromDOM(srcElement)
    marker.setPosition(mapPos, map.getCurrentLevel(), true)
    console.log('created new device marker, saving marker...', marker)

    marker.save().then((success) =>{
      markers.push(marker)
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
      const messageAnimation = gsap.to(srcElement, {
        delay: 2,
        duration: 0.5,
        '--map-item-list-message-opacity': 0,
      })
      messageAnimation.then((result) => {
        srcElement.classList.remove('saving-failed')
        srcElement.style.removeProperty('--map-item-list-message-opacity')
      })
      window.setTimeout(() => {
        droppedMarker.removeFrom(droppedMarkerLayer as any as L.Map)
      }, 10000)

      // re-enable the draggable and add clear error function
      source.data['clearError'] = () => {
        droppedMarker.removeFrom(droppedMarkerLayer as any as L.Map)
        messageAnimation.revert()
        srcElement.classList.remove('saving-failed')
        delete source.data['clearError']
      }
      source.disabled = false
    })
  }
});