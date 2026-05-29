import {Map} from "./c3nav_map";
import * as L from "leaflet";
import {Marker} from "leaflet";


class NoShadowDefaultIcon extends L.Icon.Default {
  _getIconUrl(name: string): string {
    if (name === 'shadow') {
      return null
    }
    // @ts-ignore
    return L.Icon.Default.prototype._getIconUrl.call(this, name);
  }
}

export class DragDropMarker {
  private map: Map
  protected marker: Marker = null
  icon = new NoShadowDefaultIcon()

  constructor(map: Map) {
    this.map = map
  }

  moved(pos: L.LatLng) {
    if (this.marker === null) {
      this.marker = L.marker(pos, {
        interactive: false,
        keyboard: false,
        icon: this.icon,
      }).addTo(this.map.getCurrentOverlayGroup())
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