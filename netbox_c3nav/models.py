from typing import Optional

from dcim.models import DeviceType, DeviceRole
from django.core.cache import cache
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import Q
from django.urls import reverse
from django.utils.functional import cached_property
from django.utils.safestring import mark_safe
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _

from netbox.choices import ColorChoices
from netbox.models import ChangeLoggedModel, NetBoxModel
from netbox.plugins import get_plugin_config
from utilities.fields import ColorField

from .choices import *
from .utils import file_upload_path

__all__ = (
    'DevicePosition',
    'MarkerStyle',
    'MarkerStyleBinding',
    'Overlay',
)


class DevicePosition(ChangeLoggedModel):
    device = models.OneToOneField('dcim.Device', on_delete=models.CASCADE, verbose_name=_('device'))
    x = models.FloatField(verbose_name=_('x/Longitude'))
    y = models.FloatField(verbose_name=_('y/Latitude'))
    level_id = models.PositiveIntegerField(verbose_name=_('level id'))
    level_index = models.CharField(max_length=20, verbose_name=_('level index'), help_text=_('used for coordinates'))

    @property
    def c3nav_cords(self) -> str:
        return f'c:{self.level_index}:{self.x:.02f}:{self.y:.02f}'

    @property
    def c3nav_url(self) -> str:
        return f'{get_plugin_config('netbox_c3nav', 'c3nav_url').rstrip('/')}/l/{self.c3nav_cords}'

    @property
    def geojson(self) -> dict:
        return {
            'type': 'Feature',
            'id': self.pk,
            'geometry': {
                'type': 'Point',
                'coordinates': [self.x, self.y, self.level_id]
            },
            'properties': {
                'device': self.device.name,
                'device_id': self.device.pk,
                'level_index': self.level_index,
            }
        }

    @cached_property
    def marker_config(self) -> Optional[dict]:
        if style := (self.device.device_type.marker_style.first() or self.device.role.marker_style.first()):
            return style.get_marker_config()
        return None

    class Meta:
        ordering = ('id',)
        verbose_name = _('Device Position')
        verbose_name_plural = _('Device Positions')
        default_related_name = 'c3nav_position'


class Overlay(NetBoxModel):
    name = models.CharField(_('name'), max_length=50)
    description = models.CharField(_('description'), max_length=200, blank=True)

    file = models.FileField(_('overlay file'), upload_to=file_upload_path, blank=True, null=True)
    external_url = models.URLField(max_length=255, blank=True, null=True)
    c3nav_source_id = models.PositiveIntegerField(verbose_name=_('c3nav source id'), blank=True, null=True, unique=True)

    level_index = models.CharField(max_length=20, verbose_name=_('level index'), blank=True, null=True,
                                   help_text=_('Limits the overlay to a specific level.'))

    bottom = models.DecimalField(_('bottom coordinate'), max_digits=6, decimal_places=2)
    left = models.DecimalField(_('left coordinate'), max_digits=6, decimal_places=2)
    top = models.DecimalField(_('top coordinate'), max_digits=6, decimal_places=2)
    right = models.DecimalField(_('right coordinate'), max_digits=6, decimal_places=2)

    is_background = models.BooleanField(_('background'), default=False,
                                        help_text=_('Render the overlay as map background behind the c3nav tiles.'))
    opacity = models.FloatField(_('opacity'), default=None, blank=True, null=True,
                                help_text=_('Custom opacity for the overlay. Leave blank to use the default.'),
                                validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],)
    zindex = models.IntegerField(_('z-index'), blank=True, null=True,
                                help_text=_('Custom z-index for the overlay. Leave blank to use the default (400).'))

    class Meta:
        ordering = ('level_index', 'name')
        verbose_name = _('Overlay')
        verbose_name_plural = _('Overlays')
        constraints = [
            models.CheckConstraint(
                name='file-or-external_url-or-c3nav_source_id',
                condition=(
                        ~Q(file='') & Q(external_url__isnull=True, c3nav_source_id__isnull=True) |
                        Q(file='', external_url__isnull=False, c3nav_source_id__isnull=True) |
                        Q(file='', external_url__isnull=True, c3nav_source_id__isnull=False)
                ),
                violation_error_message=_('Can either use a file, external URL or c3nav source id'),
            ),
            models.CheckConstraint(
                name='opacity-limits',
                condition=Q(opacity__isnull=True) | Q(opacity__gte=0.0) & Q(opacity__lte=1.0),
                violation_error_message=_('Opacity must be between 0 and 1 or null'),
            )
        ]

    def delete(self, using=None, keep_parents=False):
        if self.file:
            self.file.delete()
        return super().delete(using=using, keep_parents=keep_parents)

    def get_absolute_url(self):
        return reverse('plugins:netbox_c3nav:overlay', args=[self.pk])

    def __str__(self):
        return f'{self.name}'

    @classmethod
    def max_bounds(cls) -> tuple[tuple[float, float], tuple[float, float]]:
        cache_key = f'netbox_c3nav:max_bounds:{cls.__name__}'
        result = cache.get(cache_key, None)
        if result is not None:
            return result
        result = cls.objects.all().aggregate(models.Min('left'), models.Min('bottom'),
                                             models.Max('right'), models.Max('top'))
        result = ((float(result['left__min'] or 0), float(result['bottom__min'] or 0)),
                  (float(result['right__max'] or 10), float(result['top__max'] or 10)))
        cache.set(cache_key, result, 900)
        return result

    @property
    def bounds(self) -> tuple[tuple[float, float], tuple[float, float]]:
        return (float(self.left), float(self.bottom)), (float(self.right), float(self.top))


class MarkerStyle(NetBoxModel):
    _icon_library_url = 'https://pictogrammers.com/library/mdi/'
    _empty_for_default = _('Leave empty to use theme default')

    name = models.CharField(_('name'), max_length=50)
    description = models.CharField(_('description'), max_length=200, blank=True)

    device_roles = models.ManyToManyField(
        to=DeviceRole,
        # limit_choices_to={marker_style__isnull: True},
        through='MarkerStyleBinding',
        verbose_name=_('Device Roles'),
    )
    device_types = models.ManyToManyField(
        to=DeviceType,
        # limit_choices_to={marker_style__isnull: True},
        through='MarkerStyleBinding',
        verbose_name=_('Device Types'),
    )

    icon = models.CharField(
        verbose_name=('Icon'),
        max_length=100,
        help_text=mark_safe(format_lazy(
            _('The Material Design Icon to use. Check {mdi_url} for a list'),
            mdi_url=f'<a href="{_icon_library_url}" target="_blank">{_icon_library_url}</a>'
        )),
    )
    icon_size = models.PositiveIntegerField(_('Icon Size'), blank=True, null=True, help_text=_empty_for_default)
    icon_rotation = models.FloatField(_('Icon Rotation'), blank=True, null=True, help_text=_empty_for_default)
    icon_is_rotating = models.BooleanField(_('Icon Is Rotating'), blank=True, null=True, help_text=_empty_for_default)
    icon_color = ColorField(_('Icon Color'), blank=True, null=True, help_text=_empty_for_default)

    marker_style = models.CharField(_('Marker Style'), max_length=32, choices=MarkerStyleChoices, blank=True, null=True,
                                    help_text=_empty_for_default)
    marker_size = models.PositiveIntegerField(_('Marker Size'), blank=True, null=True, help_text=_empty_for_default)
    marker_color = ColorField(_('Marker Color'), blank=True, null=True, help_text=_empty_for_default)

    add_background = models.BooleanField(_('Add background below icon'), blank=True, null=True,
                                         help_text=_empty_for_default)
    background_color = ColorField(_('Background Color'), blank=True, null=True, help_text=_empty_for_default)

    class Meta:
        ordering = ('name',)
        verbose_name = _('MarkerStyle')
        verbose_name_plural = _('MarkerStyles')
        default_related_name = 'marker_style'

    def get_absolute_url(self):
        return reverse('plugins:netbox_c3nav:markerstyle', args=[self.pk])

    def __str__(self):
        return f'{self.name}'
    
    def get_marker_config(self) -> dict:
        config = {
            'icon': self.icon,
            'mdiIconSize': self.icon_size,
            'iconRotation': self.icon_rotation,
            'iconRotating': self.icon_is_rotating,
            'color': f'#{self.icon_color}' if self.icon_color else None,
            'markerSize': self.marker_size,
            'markerColor': f'#{self.marker_color}' if self.marker_color else None,
            'markerStyle': self.marker_style,
            'background': self.add_background,
            'backgroundColor': f'#{self.background_color}' if self.background_color else None,
        }
        return {k: v for k, v in config.items() if v is not None}


class MarkerStyleBinding(models.Model):
    marker_style = models.ForeignKey(MarkerStyle, on_delete=models.CASCADE, related_name='marker_style_bindings')
    device_role = models.OneToOneField(DeviceRole, on_delete=models.CASCADE, null=True)
    device_type = models.OneToOneField(DeviceType, on_delete=models.CASCADE, null=True)

    class Meta:
        verbose_name = _('Marker Style Binding')
        verbose_name_plural = _('Marker Style Bindings')
        default_related_name = 'marker_style_binding'
        constraints = [
            models.CheckConstraint(
                name='device-role-or-type',
                condition=(
                        Q(device_role__isnull=False, device_type__isnull=True) |
                        Q(device_role__isnull=True, device_type__isnull=False)
                ),
                violation_error_message=_('Binding can either be for a device role or a device type'),
            ),
        ]
