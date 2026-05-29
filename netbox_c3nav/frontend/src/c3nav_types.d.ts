export namespace C3navApiTypes {

  export interface DjangoModelSchema {
    id: number
  }

  export interface TranslatedStringSchema {
    [lang: string]: string
  }

  export type BoundsSchema = [[number, number], [number, number]]

  export interface GridSchema {
    rows: number[]
    cols: number[]
    invert_x: boolean
    invert_y: boolean
  }

  export interface MapSettingsSchema {
    initial_bounds: BoundsSchema
    initial_level: number | null
    grid: GridSchema | null
    tile_server: string | null
  }

  export interface LabelSettingsSchema {
    min_zoom: number
    max_zoom: number
    font_size: number
  }

  export interface LocationSlugSchema {
    slug: string | null
    effective_slug: string
  }

  export interface TitledSchema {
    titles: TranslatedStringSchema
    title: string
  }

  export interface WithAccessRestrictionSchema {
    access_restriction?: number | null
  }

  export interface LocationSchema extends LocationSlugSchema, TitledSchema, WithAccessRestrictionSchema {
    subtitle: string
    icon: string | null
    effective_icon: string | null
    can_search: boolean
    can_describe: boolean
    add_search: boolean
  }

  export interface SpecificLocationSchema extends LocationSchema {
    grid_square?: string | null
    groups: number[]
    groups_by_category: {
      [x: string]: number[] | null
    }
    label_settings?: number | null
    effective_label_settings?: LabelSettingsSchema | null
    label_override?: string | null
    load_group_display?: number | null
  }

  export interface LevelSchema extends SpecificLocationSchema, DjangoModelSchema {
    short_label: string
    level_index: string
    on_top_of: number | null
    base_altitude: number
    default_height: number
    door_height: number
  }
}

export interface C3navPoisition {
  x: number
  y: number
  level: string | null
}
