from netbox.api.viewsets import NetBoxModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response

from .. import filtersets, models
from .serializers import DevicePositionSerializer, OverlaySerializer


class DevicePositionViewSet(NetBoxModelViewSet):
    queryset = models.DevicePosition.objects.prefetch_related('device')
    serializer_class = DevicePositionSerializer
    filterset_class = filtersets.DevicePositionFilterSet

    @action(detail=False, methods=['get'])
    def as_geojson(self, request):
        qs = self.filterset_class(request.GET, self.get_queryset(), request=request).qs
        return Response({
            'type': 'FeatureCollection',
            'features': [dp.geojson for dp in qs],
        })


class OverlayViewSet(NetBoxModelViewSet):
    queryset = models.Overlay.objects.prefetch_related('tags')
    serializer_class = OverlaySerializer