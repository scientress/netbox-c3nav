from dcim.models import Device
from django.contrib.auth.decorators import permission_required
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import render
from django.views import View
from netbox.views import generic

from . import filtersets, forms, models, tables


class MapView(PermissionRequiredMixin, View):
    permission_required = ("dcim.view_site", "dcim.view_device", 'netbox_c3nav.view_deviceposition')
    edit = False

    def get_permission_required(self):
        perms = super().get_permission_required()
        if self.edit:
            perms = (*perms, 'netbox_c3nav.edit_deviceposition')
        return perms

    def get(self, request):
        if self.edit:
            unpositioned_devices = (Device.objects.all().filter(rack__isnull=True, c3nav_position__isnull=True).
                                    restrict(request.user, 'view'))
        else:
            unpositioned_devices = []
        return render(
            request,
            'netbox_c3nav/map.html',
            context={
                'edit': self.edit,
                'unpositioned_items': unpositioned_devices,
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
