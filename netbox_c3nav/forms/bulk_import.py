from django import forms
from django.utils.translation import gettext_lazy as _
from netbox.forms import NetBoxModelImportForm

from ..models import *

__all__ = (
    'OverlayBulkImportForm',
)

class OverlayBulkImportForm(NetBoxModelImportForm):
    class Meta:
        model = Overlay
        fields = ('name', 'description', 'file', 'external_url', 'level_index', 'bottom', 'left', 'top', 'right',
                  'is_background', 'opacity', 'zindex', 'tags')