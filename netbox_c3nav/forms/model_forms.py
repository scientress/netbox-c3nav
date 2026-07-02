from django import forms
from django.utils.translation import gettext_lazy as _

from netbox.forms import NetBoxModelForm
from utilities.forms.rendering import FieldSet, InlineFields
from utilities.forms.fields import CommentField

from ..models import Overlay

__all__ = (
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


