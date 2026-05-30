from django import forms
from netbox.forms import NetBoxModelForm
from utilities.forms.rendering import FieldSet, InlineFields
from utilities.forms.fields import CommentField

from .models import Overlay


class OverlayForm(NetBoxModelForm):

    fieldsets = (
        FieldSet('name', 'description', 'file', 'external_url', 'level_index', name='Overlay'),
        FieldSet(InlineFields('top', 'right'), InlineFields('bottom', 'left'), name='Bounds'),
        FieldSet('tags', name=''),
    )

    class Meta:
        model = Overlay
        fields = ('name', 'description', 'file', 'external_url', 'level_index', 'bottom', 'left', 'top', 'right',
                  'tags')
