from django import forms
from django.utils.translation import gettext_lazy as _

from dcim.models import DeviceType, DeviceRole
from netbox.forms import NetBoxModelForm
from utilities.forms import BOOLEAN_WITH_BLANK_CHOICES
from utilities.forms.rendering import FieldSet, InlineFields
from utilities.forms.fields import CommentField, DynamicModelMultipleChoiceField

from ..models import *

__all__ = (
    'MarkerStyleForm',
    'OverlayForm',
)

class OverlayForm(NetBoxModelForm):
    opacity = forms.FloatField(required=False, min_value=0.0, max_value=1.0, step_size=0.01)

    fieldsets = (
        FieldSet('name', 'description', 'file', 'external_url', 'level_index', name='Overlay'),
        FieldSet(InlineFields('top', 'right'), InlineFields('bottom', 'left'), name='Bounds'),
        FieldSet('is_background', 'opacity', 'zindex', name='Customization'),
        FieldSet('tags', name=''),
    )

    class Meta:
        model = Overlay
        fields = ('name', 'description', 'file', 'external_url', 'level_index', 'bottom', 'left', 'top', 'right',
                  'is_background', 'opacity', 'zindex', 'tags')
        widgets = {
            'zindex': forms.NumberInput(attrs={'step': '10'}),
        }


class MarkerStyleForm(NetBoxModelForm):
    device_roles = DynamicModelMultipleChoiceField(
        label=_('Device Roles'),
        required=False,
        # we can't simply limit it to un-bound objects, because it breaks the edit form
        # queryset=DeviceRole.objects.all().filter(marker_style__isnull=True),
        queryset=DeviceRole.objects.all(),
    )
    device_types = DynamicModelMultipleChoiceField(
        label=_('Device Types'),
        required=False,
        queryset=DeviceType.objects.all(),
    )
    icon_is_rotating = forms.NullBooleanField(
        label=_('Icon Is Rotating'),
        required=False,
        widget=forms.Select(
            choices=BOOLEAN_WITH_BLANK_CHOICES
        ),
    )
    add_background = forms.NullBooleanField(
        label=_('Add background below icon'),
        required=False,
        widget=forms.Select(
            choices=BOOLEAN_WITH_BLANK_CHOICES
        ),
    )

    fieldsets = (
        FieldSet('name', 'description', 'device_roles', 'device_types'),
        FieldSet('icon', 'icon_size', 'icon_rotation', 'icon_is_rotating', 'icon_color', name=_('Icon')),
        FieldSet('marker_style', 'marker_size', 'marker_color', 'add_background', 'background_color',
                 name=_('Marker')),
    )

    class Meta:
        model = MarkerStyle
        fields = ('name', 'description', 'device_roles', 'device_types', 'icon', 'icon_size', 'icon_rotation',
                  'icon_is_rotating', 'icon_color', 'marker_style', 'marker_size', 'marker_color', 'add_background',
                  'background_color')