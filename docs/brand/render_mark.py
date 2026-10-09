"""Draft the Cashweft woven mark and render it for visual checks."""
from PIL import Image, ImageDraw

EM = (15, 81, 50, 255)
MINT = (110, 231, 183, 255)
BG = (248, 250, 247, 255)


def capsule(draw, box, fill):
    x0, y0, x1, y1 = box
    radius = (y1 - y0) / 2
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_mark(size=640, background=None):
    image = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    s = size / 120

    def b(x0, y0, x1, y1):
        return (x0 * s, y0 * s, x1 * s, y1 * s)

    # Back ribbons (pass under the dark structure).
    capsule(draw, b(34, 28, 96, 44), MINT)
    capsule(draw, b(38, 50, 102, 66), MINT)
    capsule(draw, b(28, 74, 86, 90), MINT)

    # Dark emerald structure woven over the mint ribbons.
    capsule(draw, b(16, 16, 92, 36), EM)
    capsule(draw, b(14, 40, 62, 58), EM)
    capsule(draw, b(16, 64, 78, 82), EM)
    capsule(draw, b(14, 84, 98, 106), EM)

    # Mint pieces that pass back over the dark bands.
    capsule(draw, b(46, 34, 100, 48), MINT)
    capsule(draw, b(22, 58, 48, 74), MINT)
    return image


if __name__ == "__main__":
    mark = draw_mark()
    plate = Image.new("RGBA", mark.size, BG)
    plate.alpha_composite(mark)
    plate.save(r"D:\kharcha\docs\brand\_inspect\draft.png")
