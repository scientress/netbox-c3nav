import * as L from "leaflet"
import {C3navOverlayBrief} from "./netbox_c3nav_types";

export interface LevelControlOptions extends L.ControlOptions {
  baseUrl: string
  addClasses?: string
  initialTheme?: number
}

export class LevelControl extends L.Control {
  private _container: HTMLElement
  private _tileLayers: {[key: string]: L.TileLayer}
  private _overlayLayers: {[key: string]: L.LayerGroup}
  private _levelButtons: {[key: string]: HTMLAnchorElement}
  private _map: L.Map
  protected currentLevel: string
  protected initialTheme: number

  options: LevelControlOptions

  // this doesn't work we have to set it via prototype after class construction, otherwise options set will be ignored
  // options: LevelControlOptions = {
  //   baseUrl: '',
  //   position: 'bottomright',
  //   addClasses: '',
  //   initialTheme: 0,
  // }

  constructor(options: LevelControlOptions) {
    console.log('pre options:', options, LevelControl.prototype.options)
    super(options)
    console.log('post super options:', this.options)
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
    
  addLevel(id: number|string, title: string): L.LayerGroup {
    id = String(id)
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
    
  setLevel(id: number|string): boolean {
    id = String(id)
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

  getLevel(): string {
    return this.currentLevel
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


export interface OverlayControlOptions extends L.ControlOptions {
  addClasses?: string
  initialTheme?: number
}

export interface OverlayEntry {
  layer: L.Layer
  name: string
  group: string
  visible: boolean
}

export type CombinedOverlayEntry = OverlayEntry & C3navOverlayBrief

export interface OverlayGroup {
  expanded: boolean
  overlays: OverlayEntry[]
  el?: HTMLDivElement
}

export class OverlayControl extends L.Control {

  private _overlays: { [key: string]: OverlayEntry } = null
  private _groups: { [group: string]: OverlayGroup } = null
  private _initialActiveOverlays: string[] = null
  private _initialCollapsedGroups: string[] = null
  private _container: HTMLDivElement
  private _content: HTMLDivElement
  private _pin: HTMLDivElement
  private _pinned: boolean = false
  private _expanded: boolean = false
  private _map: L.Map

  options: OverlayControlOptions

  constructor(options: OverlayControlOptions) {
    super(options);
    this._overlays = {}
    this._groups = {}
    this._initialActiveOverlays = []
    this._initialCollapsedGroups = []
  }

  onAdd(map: L.Map): HTMLElement {
    this._initialActiveOverlays = JSON.parse(localStorage.getItem('c3nav.editor.overlays.active-overlays') ?? '[]');
    this._initialCollapsedGroups = JSON.parse(localStorage.getItem('c3nav.editor.overlays.collapsed-groups') ?? '[]');
    const pinned = JSON.parse(localStorage.getItem('c3nav.editor.overlays.pinned') ?? 'false');

    this._container = L.DomUtil.create('div', 'leaflet-control-overlays ' + this.options.addClasses);
    this._container.classList.toggle('leaflet-control-overlays-expanded', pinned);
    this._content = L.DomUtil.create('div', 'content');
    const collapsed = L.DomUtil.create('div', 'collapsed-toggle leaflet-control-layers-toggle');
    this._pin = L.DomUtil.create('div', 'pin-toggle mdi');
    this._pin.classList.toggle('active', pinned);
    // this._pin.innerText = '󰐃';
    this._container.append(this._pin, this._content, collapsed);
    this._expanded = pinned;
    this._pinned = pinned;

    if (!L.Browser.android) {
      L.DomEvent.on(this._container, {
        mouseenter: this.expand,
        mouseleave: this.collapse
      }, this);
    }

    if (!L.Browser.touch) {
      L.DomEvent.on(this._container, 'focus', this.expand, this);
      L.DomEvent.on(this._container, 'blur', this.collapse, this);
    }

    for (const overlay of this._initialActiveOverlays) {
      if (overlay in this._overlays) {
        this._overlays[overlay].visible = true;
        this._overlays[overlay].layer.addTo(this._map);
      }
    }

    for (const group of this._initialCollapsedGroups) {
      if (group in this._groups) {
        this._groups[group].expanded = false;
      }
    }

    this.render();

    this._container.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
      checkbox.addEventListener('change', e => {
        const checkbox: HTMLInputElement = e.target as HTMLInputElement
        this._overlays[checkbox.dataset.source].visible = checkbox.checked;
        this.updateOverlay(checkbox.dataset.source);
      })
    })
    this._container.querySelector('div.pin-toggle')?.addEventListener('click', e => {
      this.togglePinned();
    })
    this._container.querySelectorAll('.content h4').forEach(groupHeader => {
      groupHeader.addEventListener('click', e => {
        console.log('group clicked', e)
        this.toggleGroup((e.target as HTMLElement).parentElement.dataset.group);
      })
    })
    for (const eventType of ['mousedown', 'pointerdown', 'wheel']) {
      this._container.addEventListener(eventType, e => {
        e.stopPropagation();
      })
    }
    return this._container;
  }

  addOverlay(layer: L.Layer, name: string, group: string) {
    const l = {
      layer,
      name,
      group,
      visible: this._initialActiveOverlays !== null && this._initialActiveOverlays.includes(name),
    };
    this._overlays[name] = l;
    if (group in this._groups) {
      this._groups[group].overlays.push(l);
    } else {
      this._groups[group] = {
        expanded: this._initialCollapsedGroups === null || !this._initialCollapsedGroups.includes(group),
        overlays: [l],
      };
    }
    this.render();
  }

  updateOverlay(id: string) {
    const overlay = this._overlays[id];
    if (overlay.visible) {
      overlay.layer.addTo(this._map);
    } else {
      this._map.removeLayer(overlay.layer);
    }
    const activeOverlays: string[] = Object.keys(this._overlays).filter(k => this._overlays[k].visible);
    localStorage.setItem('c3nav.editor.overlays.active-overlays', JSON.stringify(activeOverlays));
  }

  render() {
    if (!this._content) return;
    const groups: DocumentFragment = document.createDocumentFragment();
    const groupsSorted = Object.keys(this._groups).sort((a, b) => {
      if (a == 'Global') return -1
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
    for (const group of groupsSorted) {
      const group_container = document.createElement('div');
      group_container.classList.add('overlay-group');
      if (this._groups[group].expanded) {
        group_container.classList.add('expanded');
      }
      this._groups[group].el = group_container;
      group_container.dataset.group = group;
      const title = document.createElement('h4');
      title.innerText = group;
      group_container.append(title);
      for (const overlay of this._groups[group].overlays) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.source = overlay.name;
        if (overlay.visible) {
          checkbox.checked = true;
        }
        label.append(checkbox, overlay.name);
        group_container.append(label);
      }
      groups.append(group_container);
    }
    this._content.replaceChildren(...Array.from(groups.children));
  }

  expand(): OverlayControl {
    if (this._pinned) return this
    this._expanded = true;
    this._container.classList.add('leaflet-control-overlays-expanded');
    return this;
  }

  collapse(): OverlayControl {
    if (this._pinned) return this
    this._expanded = false;
    this._container.classList.remove('leaflet-control-overlays-expanded');
    return this;
  }

  toggleGroup(name: string) {
    const group = this._groups[name];
    console.log('toggle group', group, this._groups);
    group.expanded = !group.expanded;
    group.el.classList.toggle('expanded', group.expanded);
    const collapsedGroups = Object.keys(this._groups).filter(k => !this._groups[k].expanded);
    localStorage.setItem('c3nav.editor.overlays.collapsed-groups', JSON.stringify(collapsedGroups));
  }

  togglePinned() {
    this._pinned = !this._pinned;
    if (this._pinned) {
      this._expanded = true;
    }
    this._pin.classList.toggle('active', this._pinned);
    localStorage.setItem('c3nav.editor.overlays.pinned', JSON.stringify(this._pinned));
  }
}

OverlayControl.prototype.options = {
  position: 'topright',
  addClasses: ''
}
