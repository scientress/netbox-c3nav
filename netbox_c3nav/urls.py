from django.urls import include, path
from django.views.generic import RedirectView
from netbox.views.generic import ObjectChangeLogView
from utilities.urls import get_model_urls

from . import models, views

urlpatterns = (
    path("", RedirectView.as_view(url="map/", permanent=False)),
    path("map/", views.MapView.as_view(), name="map"),
    path("map/edit", views.MapView.as_view(edit=True), name="map_edit"),
    path("overlays/", include(get_model_urls('netbox_c3nav', 'overlay', detail=False))),
    path("overlays/<int:pk>/", include(get_model_urls('netbox_c3nav', 'overlay'))),
)