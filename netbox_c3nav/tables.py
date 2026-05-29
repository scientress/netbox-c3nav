import django_tables2 as tables
from netbox.tables import NetBoxTable

from .models import Overlay

class OverlayTable(NetBoxTable):
    name = tables.Column(linkify=True)
    # description = tables.Column()
    file = tables.Column(linkify=lambda record: record.file.url)
    # external_url = tables.Column()


    class Meta(NetBoxTable.Meta):
        model = Overlay
        fields = ("pk", "id", "name", "description", "file", "external_url", "c3nav_source_id", "level_index", "bounds",
                  "actions")
        default_columns = ("name", "description", "file", "external_url", "level_index")
