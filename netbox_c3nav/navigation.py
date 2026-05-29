from netbox.choices import ButtonColorChoices
from netbox.plugins import PluginMenuButton, PluginMenuItem, PluginMenu

item1 = PluginMenuItem(
    link='home',
    link_text='Some text',
    buttons=(
        PluginMenuButton('home', 'Button A', 'mdi mdi-info', ButtonColorChoices.BLUE),
        PluginMenuButton('home', 'Button B', 'mdi mdi-warning', ButtonColorChoices.GREEN),
    )
)

menu = PluginMenu(
    label='c3nav',
    icon_class='mdi mdi-map',
    groups=(
        ('MAP', (
            PluginMenuItem(
                link='plugins:netbox_c3nav:map',
                link_text='Map',
            ),
        )),
        ('PREFERENCES', (
            PluginMenuItem(
                link='home',
                link_text='Icons',
            ),
            PluginMenuItem(
                link='plugins:netbox_c3nav:overlay_list',
                link_text='Overlays',
                buttons=[
                    PluginMenuButton(
                        link='plugins:netbox_c3nav:overlay_add',
                        title='Add',
                        icon_class='mdi mdi-plus-thick',
                    )
                ]
            )
        ))
    )
)