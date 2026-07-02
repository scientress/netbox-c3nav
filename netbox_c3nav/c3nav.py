import requests
from django.core.cache import cache
from netbox.plugins import get_plugin_config



def get_tile_server() -> str:
    tile_server = get_plugin_config('netbox_c3nav', 'tileserver_url')

    if not tile_server:
        tile_server = cache.get('netbox_c3nav:tile_server')
        if tile_server is None:
            url = f'{get_plugin_config('netbox_c3nav', 'c3nav_url').rstrip('/')}/api/v2/map/settings/'
            r = requests.get(url, headers={'X-Api-Key': get_plugin_config('netbox_c3nav', 'api_key')})
            r.raise_for_status()
            tile_server = r.json()['tile_server']
            if tile_server is None:
                tile_server = f'{get_plugin_config('netbox_c3nav', 'c3nav_url').rstrip('/')}/map/'
            cache.set('netbox_c3nav:tile_server', tile_server, timeout=1800)

    return tile_server


def get_tile_access_token() -> str:
    api_key = get_plugin_config('netbox_c3nav', 'api_key')
    if not api_key or api_key == 'anonymous':
        return ''

    tile_access_token = cache.get('netbox_c3nav:tile_access_token')

    if tile_access_token is None:
        url = f'{get_plugin_config('netbox_c3nav', 'c3nav_url').rstrip('/')}/api/v2/updates/fetch/'
        r = requests.get(url, headers={'X-Api-Key': api_key})
        r.raise_for_status()
        tile_access_token = r.cookies.get('c3nav_tile_access')
        if tile_access_token is None:
            tile_access_token = ''
        cache.set('netbox_c3nav:tile_access_token', tile_access_token, timeout=30)

    return tile_access_token

def build_tile_url(level: int, zoom: int, x: int, y: int, theme:int, ext:str, path_only: bool = False) -> str:
    tile_server = '' if path_only else get_tile_server()
    return f'{tile_server}/{level}/{zoom}/{x}/{y}/{theme}.{ext}'