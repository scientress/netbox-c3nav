from netbox.api.viewsets import NetBoxModelViewSet

from .. import filtersets, models
from .serializers import DevicePositionSerializer, OverlaySerializer


class DevicePositionViewSet(NetBoxModelViewSet):
    queryset = models.DevicePosition.objects.prefetch_related('device')
    serializer_class = DevicePositionSerializer
    filterset_class = filtersets.DevicePositionFilterSet


class OverlayViewSet(NetBoxModelViewSet):
    queryset = models.Overlay.objects.prefetch_related('tags')
    serializer_class = OverlaySerializer