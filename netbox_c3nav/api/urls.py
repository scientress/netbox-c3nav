from django.urls import path, register_converter
from netbox.api.routers import NetBoxRouter
from . import views
from .. import converters

app_name = 'netbox_c3nav'

register_converter(converters.SignedIntConverter, 'c3nav_sint')
register_converter(converters.TileFileExtConverter, 'c3nav_img_ext')

urlpatterns = [
    path('tiles/<int:level>/<c3nav_sint:zoom>/<c3nav_sint:x>/<c3nav_sint:y>/<c3nav_sint:theme>.<c3nav_img_ext:ext>',
         views.TileProxyView.as_view(), name='tiles-proxy'),
]

router = NetBoxRouter()
router.register('positions', views.DevicePositionViewSet)
router.register('overlays', views.OverlayViewSet)
urlpatterns += router.urls
