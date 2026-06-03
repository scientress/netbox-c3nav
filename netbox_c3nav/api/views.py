import requests
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema
from netbox.api.viewsets import NetBoxModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import IdempotencyException
from .. import filtersets, models
from .serializers import DevicePositionSerializer, OverlaySerializer
from ..c3nav import build_tile_url, get_tile_access_token


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

    def update(self, request, *args, **kwargs):
        time.sleep(1.5)
        try:
            return super().update(request, *args, **kwargs)
        except IdempotencyException as e:
            return Response({
                'status': 'conflict',
                'detail': e.detail,
                'position': self.get_serializer(self.get_object()).data,
            },
            status=status.HTTP_409_CONFLICT,)

    def perform_update(self, serializer: DevicePositionSerializer):
        if 'last_updated' in self.request.data:
            current_obj: models.DevicePosition = self.get_object()
            current_obj_serializer = self.get_serializer(current_obj)
            if current_obj_serializer.data['last_updated'] != self.request.data['last_updated']:
                raise IdempotencyException('Device position was updated since it was last fetched from the server')
        super().perform_update(serializer)

class OverlayViewSet(NetBoxModelViewSet):
    queryset = models.Overlay.objects.prefetch_related('tags')
    serializer_class = OverlaySerializer


class TileProxyPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('netbox_c3nav.view_deviceposition')


@extend_schema(exclude=True)
class TileProxyView(APIView):
    _ignore_model_permissions = True
    schema = None
    permission_classes = (TileProxyPermission,)

    def get_view_name(self):
        return "TileProxy"

    def get(self, request: Request, level: int, zoom: int, x: int, y: int, theme:int, ext:str, format=None, **kwargs):
        r = requests.get(
            build_tile_url(level, zoom, x, y, theme, ext),
            headers={
                'If-None-Match': request.headers.get('If-None-Match', None),
                'User-Agent': 'netbox_c3nav',
            },
            cookies={
                'c3nav_tile_access': get_tile_access_token()
            }
        )
        return HttpResponse(r.content, status=r.status_code, headers={
            **r.headers,
            'X-Proxied-By': 'netbox_c3nav',
        })
