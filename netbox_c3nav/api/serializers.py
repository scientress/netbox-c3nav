from rest_framework import serializers
from netbox.api.serializers import NetBoxModelSerializer
from ..models import DevicePosition, Overlay


class DevicePositionSerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_c3nav-api:deviceposition-detail')

    class Meta:
        model = DevicePosition
        fields = ['id', 'url', 'x', 'y', 'level_id', 'level_index', 'device', 'created', 'last_updated']
        brief_fields = ['id', 'url', 'x', 'y', 'level_id', 'device_id']



class OverlaySerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_c3nav-api:overlay-detail')

    class Meta:
        model = Overlay
        fields = ['id', 'url', 'name', 'file', 'external_url', 'bounds', 'comments', 'tags', 'custom_fields', 'created',
                  'last_updated']
        brief_fields = ['id', 'url', 'name', 'file', 'external_url', 'bounds']