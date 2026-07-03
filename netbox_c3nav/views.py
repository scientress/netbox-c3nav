from dcim.models import Device
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import render
from django.urls import reverse
from django.views import View
from netbox.plugins import get_plugin_config
from netbox.views import generic
from utilities.views import register_model_view, GetRelatedModelsMixin

from . import filtersets, forms, models, tables

__all__ = (
    'MapView',
    'OverlayDetailView',
    'OverlayListView',
    'OverlayEditView',
    'OverlayDeleteView',
    'OverlayBulkImportView',
    'OverlayBulkEditView',
)

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
            unpositioned_devices = (
                Device.objects.all().filter(rack__isnull=True, c3nav_position__isnull=True)
                .select_related('device_type', 'role')
                .restrict(request.user, 'view')
            )
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


@register_model_view(models.Overlay)
class OverlayDetailView(GetRelatedModelsMixin, generic.ObjectView):
    queryset = models.Overlay.objects.all()


@register_model_view(models.Overlay, 'list', path='', detail=False)
class OverlayListView(generic.ObjectListView):
    queryset = models.Overlay.objects.all()
    table = tables.OverlayTable
    filterset = filtersets.OverlayFilterSet
    filterset_form = forms.OverlayFilterForm


@register_model_view(models.Overlay, 'add', detail=False)
@register_model_view(models.Overlay, 'edit')
class OverlayEditView(generic.ObjectEditView):
    queryset = models.Overlay.objects.all()
    form = forms.OverlayForm


@register_model_view(models.Overlay, 'delete')
class OverlayDeleteView(generic.ObjectDeleteView):
    queryset = models.Overlay.objects.all()


@register_model_view(models.Overlay, 'bulk_import', path='import', detail=False)
class OverlayBulkImportView(generic.BulkImportView):
    queryset = models.Overlay.objects.all()
    model_form = forms.OverlayBulkImportForm


@register_model_view(models.Overlay, 'bulk_edit', path='edit', detail=False)
class OverlayBulkEditView(generic.BulkEditView):
    queryset = models.Overlay.objects.all()
    form = forms.OverlayBulkEditForm
    table = tables.OverlayTable
    filterset = filtersets.OverlayFilterSet


@register_model_view(models.Overlay, 'bulk_rename', path='rename', detail=False)
class OverlayBulkRenameView(generic.BulkRenameView):
    queryset = models.Overlay.objects.all()
    filterset = filtersets.OverlayFilterSet


@register_model_view(models.Overlay, 'bulk_delete', path='delete', detail=False)
class OverlayBulkDeleteView(generic.BulkDeleteView):
    queryset = models.Overlay.objects.all()
    filterset = filtersets.OverlayFilterSet
    table = tables.OverlayTable


@register_model_view(models.MarkerStyle)
class MarkerStyleDetailView(GetRelatedModelsMixin, generic.ObjectView):
    queryset = models.MarkerStyle.objects.all()


@register_model_view(models.MarkerStyle, 'list', path='', detail=False)
class MarkerStyleListView(generic.ObjectListView):
    queryset = models.MarkerStyle.objects.all()
    table = tables.MarkerStyleTable
#     filterset = filtersets.MarkerStyleFilterSet
#     filterset_form = forms.MarkerStyleFilterForm


@register_model_view(models.MarkerStyle, 'add', detail=False)
@register_model_view(models.MarkerStyle, 'edit')
class MarkerStyleEditView(generic.ObjectEditView):
    queryset = models.MarkerStyle.objects.all()
    form = forms.MarkerStyleForm


@register_model_view(models.MarkerStyle, 'delete')
class MarkerStyleDeleteView(generic.ObjectDeleteView):
    queryset = models.MarkerStyle.objects.all()


@register_model_view(models.MarkerStyle, 'bulk_import', path='import', detail=False)
class MarkerStyleBulkImportView(generic.BulkImportView):
    queryset = models.MarkerStyle.objects.all()
    model_form = forms.MarkerStyleBulkImportForm
#
#
# @register_model_view(models.MarkerStyle, 'bulk_edit', path='edit', detail=False)
# class MarkerStyleBulkEditView(generic.BulkEditView):
#     queryset = models.MarkerStyle.objects.all()
#     form = forms.MarkerStyleBulkEditForm
#     table = tables.MarkerStyleTable
#     filterset = filtersets.MarkerStyleFilterSet
#
#
# @register_model_view(models.MarkerStyle, 'bulk_rename', path='rename', detail=False)
# class MarkerStyleBulkRenameView(generic.BulkRenameView):
#     queryset = models.MarkerStyle.objects.all()
#     filterset = filtersets.MarkerStyleFilterSet
#
#
# @register_model_view(models.MarkerStyle, 'bulk_delete', path='delete', detail=False)
# class MarkerStyleBulkDeleteView(generic.BulkDeleteView):
#     queryset = models.MarkerStyle.objects.all()
#     filterset = filtersets.MarkerStyleFilterSet
#     table = tables.MarkerStyleTable
