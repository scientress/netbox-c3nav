from django.core.cache import cache
from django.db import models
from django.db.models import Q
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from netbox.models import ChangeLoggedModel, NetBoxModel
from netbox.plugins import get_plugin_config

from netbox_c3nav.utils import file_upload_path


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
                                   help_text=_('limits the overlay to a specific level'))

    bottom = models.DecimalField(_('bottom coordinate'), max_digits=6, decimal_places=2)
    left = models.DecimalField(_('left coordinate'), max_digits=6, decimal_places=2)
    top = models.DecimalField(_('top coordinate'), max_digits=6, decimal_places=2)
    right = models.DecimalField(_('right coordinate'), max_digits=6, decimal_places=2)

    class Meta:
        ordering = ('name',)
        verbose_name = _('Overlay')
        verbose_name_plural = _('Overlays')
        constraints = [
            models.CheckConstraint(
                name='file-or-external_url-or-c3nav_source_id',
                condition=(
                        Q(file__isnull=False, external_url__isnull=True, c3nav_source_id__isnull=True) |
                        Q(file__isnull=True, external_url__isnull=False, c3nav_source_id__isnull=True) |
                        Q(file__isnull=True, external_url__isnull=True, c3nav_source_id__isnull=False)
                ),
                violation_error_message=_('Can either use a file, external URL or c3nav source id'),
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