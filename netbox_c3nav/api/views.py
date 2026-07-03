import requests
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema
from netbox.api.viewsets import NetBoxModelViewSet
from netbox.plugins import get_plugin_config
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import IdempotencyException
from .. import filtersets, models
from .serializers import DevicePositionSerializer, MarkerStyleSerializer, OverlaySerializer
from ..c3nav import build_tile_url, get_tile_access_token


class IdempotencyViewSetMixin(NetBoxModelViewSet):
    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IdempotencyException as e:
            return Response({
                'status': 'conflict',
                'detail': e.detail,
                'object': self.get_serializer(self.get_object()).data,
            },
            status=status.HTTP_409_CONFLICT,)

    def perform_update(self, serializer: DevicePositionSerializer):
        if 'last_updated' in self.request.data:
            current_obj: models.DevicePosition = self.get_object()
            current_obj_serializer = self.get_serializer(current_obj)
            if current_obj_serializer.data['last_updated'] != self.request.data['last_updated']:
                raise IdempotencyException(f'{current_obj._meta.verbose_name} was updated since it was last fetched '
                                           f'from the server')
        super().perform_update(serializer)


class DevicePositionViewSet(IdempotencyViewSetMixin, NetBoxModelViewSet):
    queryset = (
        models.DevicePosition.objects.select_related(
            'device',
            'device__device_type',
            'device__device_type__manufacturer',
        )
        .prefetch_related(
            'device__device_type__marker_style',
        )
    )
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


class MarkerStyleViewSet(NetBoxModelViewSet):
    queryset = models.MarkerStyle.objects.prefetch_related('tags')
    serializer_class = MarkerStyleSerializer


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
        if get_plugin_config('netbox_c3nav', 'proxy_tiles_x_accel', False):
            x_accel_location = get_plugin_config('netbox_c3nav', 'proxy_tiles_x_accel_location', '')
            if x_accel_location and not x_accel_location.endswith('/'):
                x_accel_location = x_accel_location + '/'
            return HttpResponse('', status=status.HTTP_200_OK, headers={
                'X-Accel-Redirect': x_accel_location + build_tile_url(level, zoom, x, y, theme, ext, path_only=True),
                'X-C3nav-Tile-Access-Token': get_tile_access_token(),
            })
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
