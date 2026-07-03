import django_tables2 as tables
from django.utils.translation import gettext_lazy as _

from netbox.tables import NetBoxTable, columns

from .models import *

class OverlayTable(NetBoxTable):
    name = tables.Column(linkify=True)
    # description = tables.Column()
    file = tables.Column(linkify=lambda record: record.file.url)
    # external_url = tables.Column()


    class Meta(NetBoxTable.Meta):
        model = Overlay
        fields = ("pk", "id", "name", "description", "file", "external_url", "c3nav_source_id", "level_index", "bounds",
                  'is_background', 'opacity', 'zindex', "actions")
        default_columns = ("name", "description", "file", "external_url", "level_index", "is_background")


class MarkerStyleTable(NetBoxTable):
    name = tables.Column(linkify=True)
    device_roles = columns.ManyToManyColumn(linkify_item=True)
    device_types = columns.ManyToManyColumn(linkify_item=True)
    icon = tables.TemplateColumn(
        template_name='netbox_c3nav/tables/columns/marker_icon.html',
    )
    icon_name = tables.Column(
        accessor='icon',
        linkify=lambda record: f'https://pictogrammers.com/library/mdi/icon/{record.icon}/',
        verbose_name=_('Icon Name'),
    )
    icon_is_rotating = columns.BooleanColumn(verbose_name=_('Rotating'))
    icon_color = columns.ColorColumn(verbose_name=_('Icon Color'))
    marker_color = columns.ColorColumn(verbose_name=_('Marker Color'))
    add_background = columns.BooleanColumn(verbose_name=_('Background'))
    background_color = columns.ColorColumn(verbose_name=_('Background Color'))

    class Meta(NetBoxTable.Meta):
        model = MarkerStyle
        fields = ("pk", "id", 'name', 'description', 'device_types', 'icon', 'icon_name', 'icon_size', 'icon_rotation',
                  'icon_is_rotating', 'icon_color', 'marker_style', 'marker_size', 'marker_color', 'add_background',
                  'background_color')
        default_columns = ("name", "description", 'device_roles', "device_types", "icon", "icon_color", "marker_style", 'marker_color')
