from netbox.plugins import PluginConfig

class NetBoxC3navConfig(PluginConfig):
    name = 'netbox_c3nav'
    verbose_name = 'NetBox c3nav'
    description = 'Floor plans from c3nav for your netbox.'
    version = '0.1.0'
    author = 'Jenny Danzmayr'
    author_email = 'netbox@scientress.at'
    base_url = 'c3nav'
    min_version = '4.4.10'
    max_version = '4.5.99'
    required_settings = [
        'c3nav_url',
    ]
    default_settings = {
        'c3nav_url': None,
        'tileserver_url': None,
        'api_key': 'anonymous',
        'frontend_api_key': None,
        'proxy_tiles': False,
    }

config = NetBoxC3navConfig