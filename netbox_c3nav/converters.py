class SignedIntConverter:
    regex = r'-?\d+'

    def to_python(self, value):
        return int(value)

    def to_url(self, value):
        return str(value)

class TileFileExtConverter:
    regex = '(png|webp)'

    def to_python(self, value):
        return value

    def to_url(self, value):
        return value