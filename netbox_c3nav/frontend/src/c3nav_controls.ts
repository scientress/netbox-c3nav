import * as L from "leaflet"

export interface LevelControlOptions extends L.ControlOptions {
  baseUrl: string
  addClasses?: string
  initialTheme?: number
}

export class LevelControl extends L.Control {
  public options: LevelControlOptions
  private _container: HTMLElement
  private _tileLayers: {[key: string]: L.TileLayer}
  private _overlayLayers: {[key: string]: L.LayerGroup}
  private _levelButtons: {[key: string]: HTMLAnchorElement}
  private _map: L.Map
  protected currentLevel: string
  protected initialTheme: number


  constructor(options: LevelControlOptions) {
    super(options)
  }

  onAdd(map: L.Map): HTMLElement {
    this._container = L.DomUtil.create('div', 'leaflet-control-levels leaflet-bar ' + this.options.addClasses)
    this._tileLayers = {}
    this._overlayLayers = {}
    this._levelButtons = {}
    this.currentLevel = null
    // this.currentTheme = this.options.initialTheme
    return this._container
  }

  createTileLayer(id: string): L.TileLayer {
      const urlPattern= this.options.baseUrl +  `/${id}/{z}/{x}/{y}/0.webp`
      return L.tileLayer(urlPattern, {
          minZoom: -2,
          maxNativeZoom: 5,
          // bounds: L.GeoJSON.coordsToLatLngs(c3nav.bounds)
      })
  }
    
  addLevel(id: string, title: string): L.LayerGroup {
    this._tileLayers[id] = this.createTileLayer(id)
    const overlay = L.layerGroup()
    this._overlayLayers[id] = overlay

    const link = L.DomUtil.create('a', '', this._container)
    link.innerHTML = title
    link.dataset.level = id
    link.href = '#'

    L.DomEvent
        .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
        .on(link, 'click', this._levelClick, this)

    this._levelButtons[id] = link
    return overlay
  }
    
  setLevel(id: string): boolean {
    if (id === this.currentLevel) return true
    if (id !== null && this._tileLayers[id] === undefined) return false

    if (this.currentLevel !== null) {
        this._tileLayers[this.currentLevel].remove()
        this._overlayLayers[this.currentLevel].remove()
        L.DomUtil.removeClass(this._levelButtons[this.currentLevel], 'current')
    }
    if (id !== null) {
        this._tileLayers[id].addTo(this._map)
        this._overlayLayers[id].addTo(this._map)
        L.DomUtil.addClass(this._levelButtons[id], 'current')
    }
    this.currentLevel = id
    return true
  }

  _levelClick(e: MouseEvent): void {
      e.preventDefault()
      e.stopPropagation()
      this.setLevel((e.target as HTMLElement).dataset.level)
      // c3nav.update_map_state()
      // c3nav.update_location_labels()
      // c3nav._update_loadinfo_labels()
  }

  finalize(): void {
      const buttons: HTMLAnchorElement = this._container.querySelector('a')
      buttons.classList.add('current')
      buttons.style.width = `${buttons.getBoundingClientRect().width}px`
      buttons.classList.remove('current')
  }

  reloadMap(): void { // TODO: create fresh tile layers
      if (this.currentLevel === null) return
      const old_tile_layer = this._tileLayers[this.currentLevel]
      const new_tile_layer = this.createTileLayer(this.currentLevel)
      this._tileLayers[this.currentLevel] = new_tile_layer
      new_tile_layer.addTo(this._map)
      window.setTimeout(function () {
          old_tile_layer.remove()
      }, 2000)
  }
}

LevelControl.prototype.options = {
  baseUrl: '',
  position: 'bottomright',
  addClasses: '',
  initialTheme: 0,
}