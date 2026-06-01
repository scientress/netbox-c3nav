import * as L from "leaflet"

export interface MdiIconOptions extends L.DivIconOptions {
  icon?: string
  iconOffset?: [string, string]
  mdiIconSize?: string
  color?: string
  markerSize?: string
  markerColor?: string
  background?: boolean
  backgroundColor?: string
}

export class MdiIcon extends L.DivIcon {

  options: MdiIconOptions = {
    icon: 'star',
    iconSize: undefined,  // remove default from parent
  }

  constructor(options: MdiIconOptions) {
    // this probably will break stuff with leaflet 2.0
    super(options);
    L.setOptions(this, options);
  }

  createIcon(oldIcon?: HTMLElement): HTMLElement {
    const div: HTMLDivElement = (oldIcon && oldIcon.tagName === 'DIV') ?
      oldIcon as HTMLDivElement : document.createElement('div')
    div.classList.add('leaflet-marker-icon', 'leaflet-icon-mdi')

    if (this.options.mdiIconSize) {
      div.style.setProperty('--leaflet-icon-mdi-icon-size', this.options.mdiIconSize)
    } else if (this.options.iconSize) {
      if ('x' in this.options.iconSize) {
        const iconSize: number = Math.max(this.options.iconSize.x, this.options.iconSize.y)
        div.style.setProperty('--leaflet-icon-mdi-icon-size', `${iconSize}px`)
      } else if ('length' in this.options.iconSize) {
        div.style.setProperty('--leaflet-icon-mdi-icon-size', `${Math.max(...this.options.iconSize)}px`)
      } else {
        console.error('MdiIcon - Invalid value passed in iconSize option', this.options.iconSize)
      }
    }

    if (this.options.markerSize) {
      div.style.setProperty('--leaflet-icon-mdi-marker-size', this.options.markerSize)
    }

    if (this.options.background) {
      div.classList.add('leaflet-icon-mdi-marker-background')
    }

    if (this.options.backgroundColor) {
      div.style.setProperty('--leaflet-icon-mdi-marker-background-color', this.options.backgroundColor)
    }

    const markerDiv: HTMLDivElement = document.createElement('div');
    markerDiv.className = 'leaflet-icon-mdi-marker';
    if (this.options.markerColor) {
      markerDiv.style.backgroundColor = this.options.markerColor;
    }

    const iconSpan: HTMLSpanElement = document.createElement('span');
    iconSpan.classList.add('leaflet-icon-mdi-icon', 'mdi', `mdi-${this.options.icon}`);
    if (this.options.color){
      iconSpan.style.color = this.options.color;
    }
    if (this.options.iconOffset && this.options.iconOffset.length === 2) {
      iconSpan.style.left = this.options.iconOffset[0];
      iconSpan.style.right = this.options.iconOffset[1];
    }

    L.DomUtil.empty(div)
    div.appendChild(markerDiv)
    div.appendChild(iconSpan)
    return div
  }

}

// @ts-ignore
window.MdiIcon = MdiIcon;