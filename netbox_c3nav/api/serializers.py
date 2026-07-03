from dcim.api.serializers_.devices import DeviceSerializer
from dcim.models import DeviceRole, DeviceType
from rest_framework import serializers
from netbox.api.serializers import ChangeLogMessageSerializer, NetBoxModelSerializer, ValidatedModelSerializer
from ..models import *


class DevicePositionSerializer(ChangeLogMessageSerializer, ValidatedModelSerializer):
    device = DeviceSerializer(nested=True)

    class Meta:
        model = DevicePosition
        fields = ['id', 'url', 'x', 'y', 'level_id', 'level_index', 'device', 'c3nav_cords', 'c3nav_url', 'geojson',
                  'marker_config', 'created', 'last_updated']
        brief_fields = ['id', 'url', 'x', 'y', 'level_id', 'device_id']
        read_only_fields = ['c3nav_cords', 'c3nav_url', 'geojson', 'marker_config']

    def validate_x(self, value: float):
        return round(value, 2)

    def validate_y(self, value: float):
        return round(value, 2)


class OverlaySerializer(NetBoxModelSerializer):

    class Meta:
        model = Overlay
        fields = ['id', 'url', 'name', 'description', 'file', 'external_url', 'c3nav_source_id', 'level_index',
                  'bottom', 'left', 'top', 'right', 'bounds', 'is_background', 'opacity', 'zindex', 'tags',
                  'custom_fields', 'created', 'last_updated']
        brief_fields = ['id', 'url', 'name', 'description', 'file', 'external_url', 'level_index', 'bounds',
                        'is_background', 'opacity', 'zindex']
        read_only_fields = ['bounds']


class MarkerStyleSerializer(NetBoxModelSerializer):
    device_roles = serializers.SlugRelatedField(
        queryset=DeviceRole.objects.all(),
        slug_field='slug',
        required=False,
        many=True,
    )
    device_types = serializers.SlugRelatedField(
        queryset=DeviceType.objects.all(),
        slug_field='slug',
        required=False,
        many=True,
    )
    marker_config = serializers.DictField(read_only=True, source='get_marker_config')

    class Meta:
        model = MarkerStyle
        fields = ['id', 'url', 'name', 'description', 'device_roles', 'device_types', 'icon', 'icon_size',
                  'icon_rotation', 'icon_is_rotating', 'icon_color', 'marker_style', 'marker_size', 'marker_color',
                  'add_background', 'background_color', 'marker_config', 'custom_fields', 'created', 'last_updated']
        brief_fields = ['id', 'url', 'name', 'device_roles', 'device_types', 'marker_config']
