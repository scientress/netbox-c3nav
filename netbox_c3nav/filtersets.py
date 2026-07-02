from django.db import models
from django.db.models import Q
from django_filters import BooleanFilter, CharFilter

from netbox.filtersets import ChangeLoggedModelFilterSet, NetBoxModelFilterSet

from .models import DevicePosition, Overlay


class DevicePositionFilterSet(ChangeLoggedModelFilterSet):
    class Meta:
        model = DevicePosition
        fields = ['id', 'device', 'level_id', 'level_index']


class OverlayFilterSet(NetBoxModelFilterSet):
    external = BooleanFilter(field_name='external_url', method='filter_external')

    def filter_external(self, queryset, name, value):
        return queryset.filter(external_url__isnull=False)

    class Meta:
        model = Overlay
        fields = ['id', 'name', 'description', 'external_url', 'external', 'level_index', 'is_background', 'opacity',
                  'zindex']
        filter_overrides = {
            models.CharField: {
                'filter_class': CharFilter,
                'extra': lambda f: {
                    'lookup_expr': 'icontains',
                },
            },
            models.FileField: {
                'filter_class': CharFilter,
                'extra': lambda f: {'lookup_expr': 'exact'},
            },
        }

        def search(self, queryset, name, value):
            return queryset.filter(Q(name__icontains=value) or Q(description__icontains=value))