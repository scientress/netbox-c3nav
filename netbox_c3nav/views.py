from dcim.models import Device
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import render
from django.views import View


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
