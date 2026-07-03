from dcim.api.serializers_.devices import DeviceSerializer
from rest_framework import serializers
from netbox.api.serializers import ChangeLogMessageSerializer, NetBoxModelSerializer, ValidatedModelSerializer
from ..models import *


class DevicePositionSerializer(ChangeLogMessageSerializer, ValidatedModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_c3nav-api:deviceposition-detail')
    device = DeviceSerializer(nested=True)

    class Meta:
        model = DevicePosition
        fields = ['id', 'url', 'x', 'y', 'level_id', 'level_index', 'device', 'c3nav_cords', 'c3nav_url', 'geojson',
                  'markerConfig', 'created', 'last_updated']
        brief_fields = ['id', 'url', 'x', 'y', 'level_id', 'device_id']
        read_only_fields = ['c3nav_cords', 'c3nav_url', 'geojson', 'markerConfig']

    def validate_x(self, value: float):
        return round(value, 2)

    def validate_y(self, value: float):
        return round(value, 2)


class OverlaySerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_c3nav-api:overlay-detail')

    class Meta:
        model = Overlay
        fields = ['id', 'url', 'name', 'description', 'file', 'external_url', 'c3nav_source_id', 'level_index',
                  'bottom', 'left', 'top', 'right', 'bounds', 'is_background', 'opacity', 'zindex', 'tags',
                  'custom_fields', 'created', 'last_updated']
        brief_fields = ['id', 'url', 'name', 'description', 'file', 'external_url', 'level_index', 'bounds',
                        'is_background', 'opacity', 'zindex']
        read_only_fields = ['bounds']


class MarkerStyleSerializer(NetBoxModelSerializer):
    class Meta:
        model = MarkerStyle
        fields = ['id', 'url', 'name', 'description', 'device_roles', 'device_types', 'icon', 'icon_size',
                  'icon_rotation', 'icon_is_rotating', 'icon_color', 'marker_style', 'marker_size', 'marker_color',
                  'add_background', 'background_color']
        # brief_fields = ['id', 'url', 'name', 'description', 'device_types']
