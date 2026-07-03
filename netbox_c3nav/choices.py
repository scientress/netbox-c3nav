from django.utils.translation import gettext_lazy as _

from utilities.choices import ChoiceSet

__all__ = (
    'MarkerStyleChoices',
)

class MarkerStyleChoices(ChoiceSet):
    STYLE_MARKER = 'marker'
    STYLE_ROUND = 'round'
    STYLE_ICON_ONLY = 'icon-only'

    CHOICES = (
        (STYLE_MARKER, _('Marker')),
        (STYLE_ROUND, _('Round')),
        (STYLE_ICON_ONLY, _('Icon Only')),
    )
