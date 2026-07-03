from dcim.models import DeviceRole, DeviceType
from django import forms
from django.utils.translation import gettext_lazy as _

from netbox.forms import NetBoxModelBulkEditForm
from utilities.forms import add_blank_choice
from utilities.forms.fields import DynamicModelMultipleChoiceField, ColorField
from utilities.forms.rendering import FieldSet, InlineFields
from utilities.forms.widgets import BulkEditNullBooleanSelect

from ..choices import MarkerStyleChoices
from ..models import *

__all__ = (
    'MarkerStyleBulkEditForm',
    'OverlayBulkEditForm',
)


class OverlayBulkEditForm(NetBoxModelBulkEditForm):
    name = forms.CharField(label=_('Name'), max_length=50, required=False)
    description = forms.CharField(label=_('Description'), max_length=200, required=False)
    level_index = forms.CharField(label=_('Level Index'), max_length=20, required=False)

    bottom = forms.DecimalField(label=_('Bottom Coordinate'), required=False, max_digits=6, decimal_places=2)
    left = forms.DecimalField(label=_('Left Coordinate'), required=False, max_digits=6, decimal_places=2)
    top = forms.DecimalField(label=_('Top Coordinate'), required=False, max_digits=6, decimal_places=2)
    right = forms.DecimalField(label=_('Right Coordinate'), required=False, max_digits=6, decimal_places=2)

    is_background = forms.NullBooleanField(label=_('Background'), required=False, widget=BulkEditNullBooleanSelect)
    opacity = forms.FloatField(label=_('Opacity'), required=False, min_value=0.0, max_value=1.0, step_size=0.01)
    zindex = forms.IntegerField(label=_('Z-Index'), required=False, widget=forms.NumberInput(attrs={'step': '10'}))

    model = Overlay
    fieldsets = (
        FieldSet('name', 'description', 'level_index', name='Overlay'),
        FieldSet(InlineFields('top', 'right'), InlineFields('bottom', 'left'), name='Bounds'),
        FieldSet('is_background', 'opacity', 'zindex', name='Customization'),
    )
    nullable_fields = ('description', 'level_index', 'opacity', 'zindex')


class MarkerStyleBulkEditForm(NetBoxModelBulkEditForm):
    name = forms.CharField(label=_('Name'), max_length=50, required=False)
    description = forms.CharField(label=_('Description'), max_length=200, required=False)

    add_device_roles = DynamicModelMultipleChoiceField(
        label=_('Add Device Roles'),
        required=False,
        # we can't simply limit it to un-bound objects, because it breaks the edit form
        # queryset=DeviceRole.objects.all().filter(marker_style__isnull=True),
        queryset=DeviceRole.objects.all(),
    )
    remove_device_roles = DynamicModelMultipleChoiceField(
        label=_('Remove Device Roles'),
        required=False,
        # we can't simply limit it to un-bound objects, because it breaks the edit form
        # queryset=DeviceRole.objects.all().filter(marker_style__isnull=True),
        queryset=DeviceRole.objects.all(),
    )

    add_device_types = DynamicModelMultipleChoiceField(
        label=_('Device Types'),
        required=False,
        queryset=DeviceType.objects.all(),
    )
    remove_device_types = DynamicModelMultipleChoiceField(
        label=_('Device Types'),
        required=False,
        queryset=DeviceType.objects.all(),
    )

    icon = forms.CharField(label=_('Icon'), max_length=100, required=False)
    icon_size = forms.IntegerField(label=_('Icon Size'), required=False, min_value=0)
    icon_rotation = forms.FloatField(label=_('Icon Rotation'), required=False)
    icon_is_rotating = forms.NullBooleanField(
        label=_('Icon Is Rotating'),
        required=False,
        widget=BulkEditNullBooleanSelect
    )
    icon_color = ColorField(label=_('Icon Color'), required=False)

    marker_style = forms.ChoiceField(
        label=_('Marker Style'),
        required=False,
        choices=add_blank_choice(MarkerStyleChoices)
    )
    marker_size = forms.IntegerField(label=_('Marker Size'), required=False, min_value=0)
    marker_color = ColorField(label=_('Marker Color'), required=False)

    add_background = forms.NullBooleanField(
        label=_('Add background below icon'),
        required=False,
        widget=BulkEditNullBooleanSelect
    )
    background_color = ColorField(label=_('Background Color'), required=False)

    model = MarkerStyle
    fieldsets = (
        FieldSet('name', 'description', 'add_device_roles', 'remove_device_roles', 'add_device_types',
                 'remove_device_types'),
        FieldSet('icon', 'icon_size', 'icon_rotation', 'icon_is_rotating', 'icon_color', name=_('Icon')),
        FieldSet('marker_style', 'marker_size', 'marker_color', 'add_background', 'background_color',
                 name=_('Marker')),
    )
    nullable_fields = ('icon', 'icon_size', 'icon_rotation', 'icon_is_rotating', 'icon_color', 'marker_style',
                       'marker_size', 'marker_color', 'add_background', 'background_color')
