from django import forms
from django.utils.translation import gettext_lazy as _

from netbox.forms import NetBoxModelFilterSetForm
from utilities.forms import BOOLEAN_WITH_BLANK_CHOICES
from utilities.forms.fields import TagFilterField
from utilities.forms.rendering import FieldSet

from ..models import *

__all__ = (
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
