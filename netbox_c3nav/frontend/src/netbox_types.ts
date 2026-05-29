export interface ChoiceField {
  value: string
  label: string
}

export namespace DCIM {
  export interface SiteRelated {
    id: number
    url: string
    display: string
    name: string
    slug: string
    description: string
  }

  export interface LocationRelated {
    id: number
    url: string
    display: string
    name: string
    slug: string
    description: string
    rack_count: number
    _depth: number
  }

  export interface RackRelated {
    id: number
    url: string
    display: string
    name: string
    description: string
  }

  export interface DeviceBrief {
    id: number
    url: string
    display: string
    name: string
    description: string
  }

  export interface Device extends DeviceBrief {
    display_url: string
    device_type: object
    role: object
    tenant: object | null
    platform: object | null
    serial: string
    asset_tag: string | null
    site: SiteRelated
    location: LocationRelated
    rack: RackRelated | null
    position: number | null
    face: null
    latitude: null
    longitude: null
    parent_device: null
    status: ChoiceField | null
    airflow: ChoiceField | null
    primary_ip: string | null
    primary_ip4: string | null
    primary_ip6: string | null
    oob_ip: string | null
    // more needed
    tags: Extras.TagRelated[]
    custom_fields: { [key: string]: any }
  }
}

export namespace Extras {
  export interface TagRelated {
    id: number
    url: string
    display_url: string
    display: string
    name: string
    slug: string
    color: string
  }
}