from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = (
    path("", RedirectView.as_view(url="map/", permanent=False)),
    path("map/", views.MapView.as_view(), name="map"),
)