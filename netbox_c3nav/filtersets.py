from dcim.models import DeviceType, DeviceRole
from django.db import models
from django.db.models import Q
from django_filters import BooleanFilter, CharFilter, ModelMultipleChoiceFilter
from django.utils.translation import gettext_lazy as _

from netbox.filtersets import ChangeLoggedModelFilterSet, NetBoxModelFilterSet
from utilities.filters import NullableCharFieldFilter, TreeNodeMultipleChoiceFilter

from .models import *

__all__ = (
    'DevicePositionFilterSet',
    'MarkerStyleFilterSet',
    'OverlayFilterSet',
)


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


class MarkerStyleFilterSet(NetBoxModelFilterSet):
    name = CharFilter(lookup_expr='icontains')
    description = CharFilter(lookup_expr='icontains')

    device_types = ModelMultipleChoiceFilter(
        field_name='device_types__slug',
        queryset=DeviceType.objects.all(),
        to_field_name='slug',
        label=_('Device type (slug)'),
    )
    device_type_id = ModelMultipleChoiceFilter(
        field_name='device_types',
        queryset=DeviceType.objects.all(),
        label=_('Device type (ID)'),
    )
    device_roles_id = TreeNodeMultipleChoiceFilter(
        field_name='device_roles',
        queryset=DeviceRole.objects.all(),
        lookup_expr='in',
        label=_('Role (ID)'),
    )
    device_roles = TreeNodeMultipleChoiceFilter(
        queryset=DeviceRole.objects.all(),
        field_name='device_roles',
        lookup_expr='in',
        to_field_name='slug',
        label=_('Role (slug)'),
    )

    class Meta:
        model = MarkerStyle
        fields = ['name', 'description', 'icon', 'icon_size', 'icon_rotation',
                  'icon_is_rotating', 'icon_color', 'marker_style', 'marker_size', 'marker_color', 'add_background',
                  'background_color']
        filter_overrides = {
            models.CharField: {
                'filter_class': NullableCharFieldFilter,
            },
        }

        def search(self, queryset, name, value):
            return queryset.filter(Q(name__icontains=value) or Q(description__icontains=value))
