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
                permissions=('netbox_c3nav.view_deviceposition',),
                buttons=[
                    PluginMenuButton(
                        link='plugins:netbox_c3nav:map_edit',
                        title='Edit Device Positions',
                        icon_class='mdi mdi-pencil',
                        permissions=('netbox_c3nav.add_deviceposition', 'netbox_c3nav.change_deviceposition'),
                    )
                ]
            ),
        )),
        ('PREFERENCES', (
            # PluginMenuItem(
            #     link='home',
            #     link_text='Icons',
            # ),
            PluginMenuItem(
                link='plugins:netbox_c3nav:markerstyle_list',
                link_text='Marker Styles',
                permissions=('netbox_c3nav.view_markerstyle',),
                buttons=[
                    PluginMenuButton(
                        link='plugins:netbox_c3nav:markerstyle_add',
                        title='Add',
                        icon_class='mdi mdi-plus-thick',
                        permissions=('netbox_c3nav.add_markerstyle', 'netbox_c3nav.change_markerstyle'),
                    ),
                    PluginMenuButton(
                        link='plugins:netbox_c3nav:markerstyle_bulk_import',
                        title='Import',
                        icon_class='mdi mdi-upload',
                        permissions=('netbox_c3nav.add_markerstyle', 'netbox_c3nav.change_markerstyle'),
                    )
                ]
            ),
            PluginMenuItem(
                link='plugins:netbox_c3nav:overlay_list',
                link_text='Overlays',
                permissions=('netbox_c3nav.view_overlay',),
                buttons=[
                    PluginMenuButton(
                        link='plugins:netbox_c3nav:overlay_add',
                        title='Add',
                        icon_class='mdi mdi-plus-thick',
                        permissions=('netbox_c3nav.add_overlay', 'netbox_c3nav.change_overlay'),
                    ),
                    PluginMenuButton(
                        link='plugins:netbox_c3nav:overlay_bulk_import',
                        title='Import',
                        icon_class='mdi mdi-upload',
                        permissions=('netbox_c3nav.add_overlay', 'netbox_c3nav.change_overlay'),
                    )
                ]
            ),
        ))
    )
)