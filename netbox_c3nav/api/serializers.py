from dcim.api.serializers_.devices import DeviceSerializer
from rest_framework import serializers
from netbox.api.serializers import ChangeLogMessageSerializer, NetBoxModelSerializer, ValidatedModelSerializer
from ..models import DevicePosition, Overlay


class DevicePositionSerializer(ChangeLogMessageSerializer, ValidatedModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_c3nav-api:deviceposition-detail')
    device = DeviceSerializer(nested=True)

    class Meta:
        model = DevicePosition
        fields = ['id', 'url', 'x', 'y', 'level_id', 'level_index', 'device', 'c3nav_cords', 'c3nav_url', 'geojson',
                  'created', 'last_updated']
        brief_fields = ['id', 'url', 'x', 'y', 'level_id', 'device_id']
        read_only_fields = ['c3nav_cords', 'c3nav_url', 'geojson']

    def validate_x(self, value: float):
        return round(value, 2)

    def validate_y(self, value: float):
        return round(value, 2)


class OverlaySerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_c3nav-api:overlay-detail')

    class Meta:
        model = Overlay
        fields = ['id', 'url', 'name', 'description', 'file', 'external_url', 'c3nav_source_id', 'level_index',
                  'bottom', 'left', 'top', 'right', 'bounds', 'tags', 'custom_fields', 'created', 'last_updated']
        brief_fields = ['id', 'url', 'name', 'description', 'file', 'external_url', 'bounds']
        read_only_fields = ['bounds']