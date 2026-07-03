import * as L from "leaflet"

export class FullscreenControl extends L.Control {
  private container: HTMLDivElement;
  private icon: HTMLSpanElement;
  private map: L.Map;

  onAdd(map: L.Map): HTMLElement {
    this.map = map
    this.container = L.DomUtil.create('div', 'leaflet-control-fullscreen')
    this.icon = L.DomUtil.create('span', 'mdi mdi-fullscreen')
    this.container.appendChild(this.icon)

    this.icon.addEventListener('click', e => {
      this.toggleFullscreen()
    })

    return this.container
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error('Error exiting fullscreen', err)
      })
      return
    }

    this.map.getContainer().requestFullscreen().catch((err) => {
      console.error('Error enabling fullscreen:', err)
    })
  }
}

FullscreenControl.prototype.options = {
  position: 'topleft'
}
