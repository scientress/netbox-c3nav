from dcim.models import Device
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import render
from django.views import View
from netbox.views import generic

from . import filtersets, forms, models, tables


class MapView(PermissionRequiredMixin, View):
    permission_required = ("dcim.view_site", "dcim.view_device")

    def get(self, request):
        return render(
            request,
            'netbox_c3nav/map.html',
            context={
                'unpositioned_items': Device.objects.all().filter(rack__isnull=True, c3nav_position__isnull=True),
            }
        )


class OverlayDetailView(generic.ObjectView):
    queryset = models.Overlay.objects.all()


class OverlayListView(generic.ObjectListView):
    queryset = models.Overlay.objects.all()
    table = tables.OverlayTable
    filterset = filtersets.OverlayFilterSet


class OverlayEditView(generic.ObjectEditView):
    queryset = models.Overlay.objects.all()
    form = forms.OverlayForm


class OverlayDeleteView(generic.ObjectDeleteView):
    queryset = models.Overlay.objects.all()
