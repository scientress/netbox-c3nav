from netbox.api.routers import NetBoxRouter
from . import views

app_name = 'netbox_c3nav'

router = NetBoxRouter()
router.register('positions', views.DevicePositionViewSet)
router.register('overlays', views.OverlayViewSet)
urlpatterns = router.urls