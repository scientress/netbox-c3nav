from dcim.models import Device
from netbox.plugins import PluginTemplateExtension

from .models import DevicePosition


class DevicePositionExtension(PluginTemplateExtension):

    models = ['dcim.device']

    def buttons(self):
        object: Device = self.context['object']

        #  ToDo: This causes an extra query, we need to figure out how to get netbox to prefetch it
        try:
            return self.render('netbox_c3nav/generic_link_button.html', extra_context={
                'title': 'Show in c3nav',
                'button_type': 'purple',
                'href': object.c3nav_position.c3nav_url,
                'target': '_blank',
                'icon': 'mdi-map-search-outline',
            })
        except DevicePosition.DoesNotExist:
            return self.render('netbox_c3nav/generic_link_button.html', extra_context={
                'title': 'Show in c3nav',
                'button_type': 'purple',
                'href': '',
                'target': '_blank',
                'icon': 'mdi-map-search-outline',
                'class_extra': 'disabled',
            })

template_extensions = [DevicePositionExtension]