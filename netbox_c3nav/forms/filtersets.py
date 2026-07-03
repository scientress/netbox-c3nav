from dcim.models import DeviceRole, DeviceType
from django import forms
from django.utils.translation import gettext_lazy as _

from netbox.forms import NetBoxModelFilterSetForm
from utilities.forms import BOOLEAN_WITH_BLANK_CHOICES, add_blank_choice
from utilities.forms.fields import TagFilterField, DynamicModelMultipleChoiceField, ColorField
from utilities.forms.rendering import FieldSet

from ..choices import MarkerStyleChoices
from ..models import *

__all__ = (
    'MarkerStyleFilterForm',
    'OverlayFilterForm',
)


class OverlayFilterForm(NetBoxModelFilterSetForm):
    model = Overlay
    tags = TagFilterField(model)
    fieldsets = (
        FieldSet('q', 'filter_id', 'tag'),
        FieldSet('name', 'description', 'external_url', 'external', 'level_index', name=_('Overlay')),
        FieldSet('is_background', 'opacity', 'zindex', name='Customization'),
    )

    name = forms.CharField(
        label=_('Name'),
        required=False,
    )
    description = forms.CharField(
        label=_('Description'),
        required=False,
    )
    external_url = forms.CharField(
        label=_('External URL'),
        required=False,
    )
    external = forms.NullBooleanField(
        label=_('External'),
        required=False,
        widget=forms.Select(
            choices=BOOLEAN_WITH_BLANK_CHOICES
        ),
        help_text=_('Has an external URL set instead of a file.')
    )
    level_index = forms.CharField(
        label=_('Level Index'),
        required=False,
    )
    is_background = forms.NullBooleanField(
        label=_('Background'),
        required=False,
        widget=forms.Select(
            choices=BOOLEAN_WITH_BLANK_CHOICES
        )
    )
    opacity = forms.FloatField(
        label=_('Opacity'),
        required=False,
        min_value=0,
        max_value=1,
        step_size=0.01,
    )
    zindex = forms.IntegerField(
        label=_('Z-Index'),
        required=False,
        widget=forms.NumberInput(attrs={'step': '10'}),
    )


class MarkerStyleFilterForm(NetBoxModelFilterSetForm):
    name = forms.CharField(label=_('Name'), max_length=50, required=False)
    description = forms.CharField(label=_('Description'), max_length=200, required=False)

    device_roles_id = DynamicModelMultipleChoiceField(
        label=_('Device Roles'),
        required=False,
        # we can't simply limit it to un-bound objects, because it breaks the edit form
        # queryset=DeviceRole.objects.all().filter(marker_style__isnull=True),
        queryset=DeviceRole.objects.all(),
    )
    device_types_id = DynamicModelMultipleChoiceField(
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
        widget=forms.Select(
            choices=BOOLEAN_WITH_BLANK_CHOICES
        )
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
        widget=forms.Select(
            choices=BOOLEAN_WITH_BLANK_CHOICES
        )
    )
    background_color = ColorField(label=_('Background Color'), required=False)

    model = MarkerStyle
    tags = TagFilterField(model)
    fieldsets = (
        FieldSet('q', 'filter_id', 'name', 'description', 'device_roles_id', 'device_types_id', 'tag'),
        FieldSet('icon', 'icon_size', 'icon_rotation', 'icon_is_rotating', 'icon_color', name=_('Icon')),
        FieldSet('marker_style', 'marker_size', 'marker_color', 'add_background', 'background_color',
                 name=_('Marker')),
    )