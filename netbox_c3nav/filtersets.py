from django.db.models import Q
from netbox.filtersets import ChangeLoggedModelFilterSet, NetBoxModelFilterSet
from .models import DevicePosition, Overlay


class DevicePositionFilterSet(ChangeLoggedModelFilterSet):
    class Meta:
        model = DevicePosition
        fields = ['id', 'device', 'level_id', 'level_index']

class OverlayFilterSet(NetBoxModelFilterSet):
    class Meta:
        model = Overlay
        fields = ['id', 'name']

        def search(self, queryset, name, value):
            return queryset.filter(Q(name__icontains=value) or Q(description__icontains=value))