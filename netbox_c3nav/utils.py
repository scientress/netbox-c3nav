def file_upload_path(instance, filename):
    """
    Return a path for uploading overlays.
    Adapted from netbox/extras/utils.py
    """
    path = 'netbox-c3nav/'

    return f'{path}{filename}'