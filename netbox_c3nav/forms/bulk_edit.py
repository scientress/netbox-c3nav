from django import forms
from django.utils.translation import gettext_lazy as _

from netbox.forms import NetBoxModelBulkEditForm
from utilities.forms.rendering import FieldSet, InlineFields
from utilities.forms.widgets import BulkEditNullBooleanSelect

from ..models import *

__all__ = (
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
