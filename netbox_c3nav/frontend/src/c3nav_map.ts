import {Map as LeafletMap, map as leafletMap, CRS, GeoJSON, LatLng, LayerGroup} from "leaflet";
import * as L from 'leaflet'
import "leaflet.markercluster"
import {C3NavApi} from "./c3nav-api";
import {C3navApiTypes} from "./c3nav_types";
import {LevelControl, OverlayControl} from "./c3nav_controls"


// make vite include all images
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  imagePath: '',
});
L.Icon.Default.imagePath = ''


export class Map {
  instanceUrl: string
  api: C3NavApi
  apiKey: string | undefined
  tileserverUrl: string | undefined
  map: LeafletMap
  container: HTMLDivElement

  map_bounds: LatLng[];
  map_settings: C3navApiTypes.MapSettingsSchema
  levels: C3navApiTypes.LevelSchema[]
  levelsById: {[id: number]: C3navApiTypes.LevelSchema}

  levelControl: LevelControl
  overlayControl: OverlayControl
  overlayGroups: {[levelId: string]: L.LayerGroup}
  markerLayers: {[levelId: string]: L.LayerGroup}
  markerClusterGroups: {[levelId: string]: L.MarkerClusterGroup}
  overlayLayers: {[levelId: string]: L.LayerGroup}


  constructor(instanceUrl: string, apiKey?: string, tileserverUrl?: string) {
    this.instanceUrl = instanceUrl
    this.apiKey = apiKey
    this.tileserverUrl = tileserverUrl
    this.api = new C3NavApi(`${instanceUrl}/api/v2/`, apiKey)

    this.overlayGroups = {}
    this.markerLayers = {}
    this.markerClusterGroups = {}
    this.overlayLayers = {}

    console.log('map init', this, this.api)
  }

  public async bind(element: HTMLDivElement) {
    this.container = element;
    if (this.apiKey) {
      await this.api.get('updates/fetch/')
      window.setInterval(() => {
        this.api.get('updates/fetch')
      }, 20000)
    }
    this.map_settings = await this.api.get('map/settings/');
    const raw_bounds: C3navApiTypes.BoundsSchema = await this.api.get('map/bounds/')
    this.map_bounds = GeoJSON.coordsToLatLngs(raw_bounds)
    this.map = leafletMap(element, {
      // renderer: L.svg({padding: 2}),
      zoom: 0,
      maxZoom: 6,
      minZoom: -2,
      crs: CRS.Simple,
      // maxBounds: L.GeoJSON.coordsToLatLngs(c3nav._get_padded_max_bounds(minZoom)),
      zoomSnap: 0,
      zoomControl: false,
      attributionControl: true,
    });
    this.map.fitBounds(GeoJSON.coordsToLatLngs(this.map_settings.initial_bounds))

    if (!this.tileserverUrl) {
      this.tileserverUrl = (this.map_settings.tile_server || `${this.instanceUrl}/map`)
    }
    this.levelControl = new LevelControl({
      baseUrl: this.tileserverUrl.replace(/\/$/, ''),
    })
    this.levelControl.addTo(this.map)
    this.overlayControl = new OverlayControl(this.levelControl, {})

    this.levels = await this.api.get('mapdata/levels') as C3navApiTypes.LevelSchema[]
    this.levels.sort((a, b) => b.base_altitude - a.base_altitude)
    this.levelsById = {}

    for (const l of this.levels) {
      this.levelsById[l.id] = l
      if (l.on_top_of !== null) continue
      this.overlayGroups[l.id] = this.levelControl.addLevel(l)
      this.markerLayers[l.id] = L.layerGroup().addTo(this.overlayGroups[l.id])
      this.overlayLayers[l.id] = L.layerGroup().addTo(this.overlayGroups[l.id])
      this.markerClusterGroups[l.id] = window.L.markerClusterGroup({
        maxClusterRadius: 50,
        disableClusteringAtZoom: this.map.options.maxZoom - 1,
      }).addTo(this.markerLayers[l.id])
    }

    this.levelControl.setLevel(this.map_settings.initial_level)
  }

  public getCurrentLevel(): C3navApiTypes.LevelSchema {
    return this.levelsById[this.levelControl.getCurrentLevelId()]
  }

  public getCurrentOverlayGroup(): LayerGroup {
    return this.overlayGroups[this.levelControl.getCurrentLevelId()]
  }

  public getCurrentMarkerLayer(): LayerGroup {
    return this.markerLayers[this.levelControl.getCurrentLevelId()]
  }

  public getCurrentMarkerClusterGroup(): LayerGroup {
    return this.markerClusterGroups[this.levelControl.getCurrentLevelId()]
  }

  public getCurrentOverlayLayer(): LayerGroup {
    return this.overlayLayers[this.levelControl.getCurrentLevelId()]
  }

  public addEventListener(event: string, handler: (event: Event) => void) {
    this.container.addEventListener(event, handler)
  }
}