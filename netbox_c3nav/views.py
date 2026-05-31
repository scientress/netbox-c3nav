from dcim.models import Device
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import render
from django.urls import reverse
from django.views import View
from netbox.plugins import get_plugin_config
from netbox.views import generic

from . import filtersets, forms, models, tables


class MapView(PermissionRequiredMixin, View):
    permission_required = ("dcim.view_site", "dcim.view_device", 'netbox_c3nav.view_deviceposition')
    edit = False

    def get_permission_required(self):
        perms = super().get_permission_required()
        if self.edit:
            perms = (*perms, 'netbox_c3nav.change_deviceposition')
        return perms

    def get(self, request):
        if self.edit:
            unpositioned_devices = (Device.objects.all().filter(rack__isnull=True, c3nav_position__isnull=True).
                                    restrict(request.user, 'view'))
        else:
            unpositioned_devices = []

        api_key = get_plugin_config('netbox_c3nav', 'api_key')
        frontend_api_key = get_plugin_config('netbox_c3nav', 'frontend_api_key', None)
        tileserver_url = get_plugin_config('netbox_c3nav', 'tileserver_url', None),
        if get_plugin_config('netbox_c3nav', 'proxy_tiles', False):
            tileserver_url = reverse('plugins-api:netbox_c3nav-api:api-root') + 'tiles/'

        return render(
            request,
            'netbox_c3nav/map.html',
            context={
                'frontend_settings': {
                    'c3nav_url': get_plugin_config('netbox_c3nav', 'c3nav_url'),
                    'tileserver_url': tileserver_url,
                    'api_key': frontend_api_key if frontend_api_key is not None else api_key,
                },
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
