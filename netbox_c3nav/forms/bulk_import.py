from dcim.models import DeviceRole, DeviceType
from django import forms
from django.utils.translation import gettext_lazy as _
from netbox.forms import NetBoxModelImportForm
from utilities.forms import fields

from ..models import *

__all__ = (
    'MarkerStyleBulkImportForm',
    'OverlayBulkImportForm',
)

class OverlayBulkImportForm(NetBoxModelImportForm):
    class Meta:
        model = Overlay
        fields = ('name', 'description', 'file', 'external_url', 'level_index', 'bottom', 'left', 'top', 'right',
                  'is_background', 'opacity', 'zindex', 'tags')


class MarkerStyleBulkImportForm(NetBoxModelImportForm):
    device_roles = fields.CSVModelMultipleChoiceField(
        label = _('Device Roles'),
        queryset=DeviceRole.objects.all(),
        required=False,
        to_field_name='slug',
        help_text=_('Device role slugs separated by commas, encased with double quotes')
    )
    device_types = fields.CSVModelMultipleChoiceField(
        label=_('Device Types'),
        queryset=DeviceType.objects.all(),
        required=False,
        to_field_name='slug',
        help_text=_('Device type slugs separated by commas, encased with double quotes')
    )
    class Meta:
        model = MarkerStyle
        fields = ('name', 'description', 'device_roles', 'device_types', 'icon', 'icon_size', 'icon_rotation',
                  'icon_is_rotating', 'icon_color', 'marker_style', 'marker_size', 'marker_color', 'add_background',
                  'background_color')