from django.urls import path
from django.views.generic import RedirectView
from netbox.views.generic import ObjectChangeLogView

from . import models, views

urlpatterns = (
    path("", RedirectView.as_view(url="map/", permanent=False)),
    path("map/", views.MapView.as_view(), name="map"),
    path("overlays/", views.OverlayListView.as_view(), name="overlay_list"),
    path("overlays/add/", views.OverlayEditView.as_view(), name="overlay_add"),
    path("overlays/<int:pk>/", views.OverlayDetailView.as_view(), name="overlay"),
    path("overlays/<int:pk>/edit/", views.OverlayEditView.as_view(), name="overlay_edit"),
    path("overlays/<int:pk>/delete/", views.OverlayDeleteView.as_view(), name="overlay_delete"),
    path(
        "overlays/<int:pk>/changelog/",
        ObjectChangeLogView.as_view(),
        name="overlay_changelog",
        kwargs={"model": models.Overlay},
    ),
)