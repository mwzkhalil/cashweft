"""Build production Cashweft assets from the traced brand-board mark."""
import re
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"D:\kharcha")
TRACE = ROOT / "docs" / "brand" / "_inspect" / "traced.svg"
BRAND = ROOT / "mobile" / "assets" / "brand"
ICONS = ROOT / "mobile" / "assets" / "icons"
SPLASH = ROOT / "mobile" / "assets" / "splash"
FONTS = Path(r"D:\g\brand-fonts")
RES = ROOT / "mobile" / "android" / "app" / "src" / "main" / "res"

EMERALD = (15, 81, 50, 255)
MINT = (110, 231, 183, 255)
CHARCOAL = (31, 41, 55, 255)
OFFWHITE = (248, 250, 247, 255)
DEEP = (6, 32, 22, 255)


def parse_svg(text):
    view = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', text)
    width, height = float(view.group(1)), float(view.group(2))
    shapes = []
    for fill, data in re.findall(r'fill="(#[0-9A-Fa-f]+)" d="([^"]+)"', text):
        nums = [float(n) for n in re.findall(r"[-+]?\d*\.?\d+", data)]
        points = list(zip(nums[0::2], nums[1::2]))
        shapes.append((fill, points))
    return width, height, shapes


def bounds(shapes):
    xs = [x for _, pts in shapes for x, _ in pts]
    ys = [y for _, pts in shapes for _, y in pts]
    return min(xs), min(ys), max(xs), max(ys)


def text_svg(font_path, text, size, color):
    font = TTFont(font_path)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    metrics = font["hmtx"]
    upem = font["head"].unitsPerEm
    scale = size / upem
    ascent = font["hhea"].ascent * scale
    cursor = 0
    parts = []
    for char in text:
        name = cmap[ord(char)]
        pen = SVGPathPen(glyph_set)
        glyph_set[name].draw(pen)
        commands = pen.getCommands()
        if commands:
            parts.append(
                f'<path fill="{color}" transform="translate({cursor * scale:.2f} {ascent:.2f}) scale({scale:.5f} {-scale:.5f})" d="{commands}"/>'
            )
        cursor += metrics[name][0]
    return "".join(parts), cursor * scale, (font["hhea"].ascent - font["hhea"].descent) * scale


def mark_svg(shapes, source_box, fill_map, width, height, pad=0):
    x0, y0, x1, y1 = source_box
    sx = (width - pad * 2) / (x1 - x0)
    sy = (height - pad * 2) / (y1 - y0)
    scale = min(sx, sy)
    used_w = (x1 - x0) * scale
    used_h = (y1 - y0) * scale
    ox = (width - used_w) / 2
    oy = (height - used_h) / 2
    body = []
    for fill, points in shapes:
        mapped = fill_map.get(fill, fill)
        data = []
        for index, (x, y) in enumerate(points):
            command = "M" if index == 0 else "L"
            data.append(f"{command}{(x - x0) * scale + ox:.2f} {(y - y0) * scale + oy:.2f}")
        body.append(f'<path fill="{mapped}" d="{" ".join(data)} Z"/>')
    return "".join(body)


def draw_shapes(draw, shapes, source_box, fill_map, width, height, pad):
    x0, y0, x1, y1 = source_box
    scale = min((width - pad * 2) / (x1 - x0), (height - pad * 2) / (y1 - y0))
    used_w = (x1 - x0) * scale
    used_h = (y1 - y0) * scale
    ox = (width - used_w) / 2
    oy = (height - used_h) / 2
    for fill, points in shapes:
        color = fill_map.get(fill, fill)
        rgb = tuple(int(color[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        draw.polygon([((x - x0) * scale + ox, (y - y0) * scale + oy) for x, y in points], fill=rgb)


def rounded_icon(size, background, shapes, source_box, fill_map, pad_ratio=0.22):
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    plate = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(plate)
    radius = int(size * 0.22)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=background)
    mark = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_shapes(ImageDraw.Draw(mark), shapes, source_box, fill_map, size, size, int(size * pad_ratio))
    plate.alpha_composite(mark)
    image.alpha_composite(plate)
    return image


def main():
    width, height, shapes = parse_svg(TRACE.read_text(encoding="utf-8"))
    box = bounds(shapes)
    BRAND.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)
    SPLASH.mkdir(parents=True, exist_ok=True)

    color = {"#0F5132": "#0F5132", "#6EE7B7": "#6EE7B7"}
    on_dark = {"#0F5132": "#34D399", "#6EE7B7": "#ECFDF5"}
    mono = {"#0F5132": "#1F2937", "#6EE7B7": "#1F2937"}
    mono_light = {"#0F5132": "#F8FAF7", "#6EE7B7": "#F8FAF7"}

    mark = mark_svg(shapes, box, color, 512, 512, 24)
    (BRAND / "cashweft-mark.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Cashweft">{mark}</svg>',
        encoding="utf-8",
    )
    (BRAND / "cashweft-monochrome.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Cashweft">{mark_svg(shapes, box, mono, 512, 512, 24)}</svg>',
        encoding="utf-8",
    )

    word, word_w, word_h = text_svg(FONTS / "Inter-Bold.ttf", "Cashweft", 168, "#1F2937")
    tag, tag_w, tag_h = text_svg(FONTS / "Inter-Medium.ttf", "Your Money. Your Patterns. Your Privacy.", 42, "#0F5132")
    word_light, _, _ = text_svg(FONTS / "Inter-Bold.ttf", "Cashweft", 168, "#F8FAF7")
    tag_light, _, _ = text_svg(FONTS / "Inter-Medium.ttf", "Your Money. Your Patterns. Your Privacy.", 42, "#6EE7B7")

    def lockup(mark_fill, word_paths, tag_paths, name):
        canvas_w, canvas_h = 1400, 360
        mark_size = 300
        body = mark_svg(shapes, box, mark_fill, mark_size, mark_size, 8)
        word_x, word_y = 340, 70
        tag_x, tag_y = 340, 250
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas_w} {canvas_h}" role="img" aria-label="Cashweft">'
            f'<g transform="translate(20 30)">{body}</g>'
            f'<g transform="translate({word_x} {word_y})">{word_paths}</g>'
            f'<g transform="translate({tag_x} {tag_y})">{tag_paths}</g>'
            "</svg>"
        )
        (BRAND / name).write_text(svg, encoding="utf-8")

    lockup(color, word, tag, "cashweft-lockup.svg")
    lockup(color, word, tag, "cashweft-lockup-light.svg")
    lockup(on_dark, word_light, tag_light, "cashweft-lockup-dark.svg")
    (BRAND / "cashweft-wordmark.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {word_w:.0f} {word_h:.0f}" role="img" aria-label="Cashweft">{word}</svg>',
        encoding="utf-8",
    )

    on_emerald = {"#0F5132": "#083526", "#6EE7B7": "#6EE7B7"}
    icon = rounded_icon(1024, (12, 92, 62, 255), shapes, box, on_emerald, 0.22)
    icon.save(ICONS / "icon.png")
    foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_shapes(ImageDraw.Draw(foreground), shapes, box, on_dark, 1024, 1024, 250)
    foreground.save(ICONS / "adaptive-icon-foreground.png")
    Image.new("RGBA", (1024, 1024), EMERALD).save(ICONS / "adaptive-icon-background.png")
    mono_icon = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_shapes(ImageDraw.Draw(mono_icon), shapes, box, mono_light, 1024, 1024, 250)
    mono_icon.save(ICONS / "monochrome-icon.png")
    rounded_icon(1024, OFFWHITE, shapes, box, color, 0.24).save(ICONS / "icon-light.png")
    rounded_icon(1024, DEEP, shapes, box, on_dark, 0.24).save(ICONS / "icon-dark.png")
    icon.resize((64, 64), Image.Resampling.LANCZOS).save(ROOT / "mobile" / "assets" / "favicon.png")

    bold = ImageFont.truetype(str(FONTS / "Inter-Bold.ttf"), 92)
    medium = ImageFont.truetype(str(FONTS / "Inter-Medium.ttf"), 28)
    for scale, name in ((1, "splash-logo.png"), (2, "splash-logo@2x.png"), (3, "splash-logo@3x.png")):
        w, h = 360 * scale, 520 * scale
        splash = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(splash)
        mark_size = 180 * scale
        mark_image = Image.new("RGBA", (mark_size, mark_size), (0, 0, 0, 0))
        draw_shapes(ImageDraw.Draw(mark_image), shapes, box, on_dark, mark_size, mark_size, int(mark_size * 0.08))
        splash.alpha_composite(mark_image, ((w - mark_size) // 2, 24 * scale))
        title = "Cashweft"
        tagline = "Your Money. Your Patterns. Your Privacy."
        title_font = ImageFont.truetype(str(FONTS / "Inter-Bold.ttf"), 54 * scale)
        tag_font = ImageFont.truetype(str(FONTS / "Inter-Medium.ttf"), 16 * scale)
        tw = draw.textlength(title, font=title_font)
        gw = draw.textlength(tagline, font=tag_font)
        draw.text(((w - tw) / 2, 220 * scale), title, font=title_font, fill=OFFWHITE)
        draw.text(((w - gw) / 2, 290 * scale), tagline, font=tag_font, fill=MINT)
        for index, amplitude in enumerate((10, 16, 22)):
            y_base = (390 + index * 28) * scale
            points = []
            step = max(4, 6 * scale)
            x = 0
            while x <= w:
                import math
                points.append((x, y_base + int(amplitude * scale * 0.35 * math.sin(x / (28 * scale)))))
                x += step
            if len(points) > 1:
                draw.line(points, fill=(110, 231, 183, 90), width=max(2, scale))
        splash.save(SPLASH / name)
        _ = bold, medium

    launcher = {"mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192}
    if RES.exists():
        for folder, size in launcher.items():
            dest = RES / folder
            dest.mkdir(parents=True, exist_ok=True)
            full = Image.new("RGBA", (1024, 1024), (12, 92, 62, 255))
            draw_shapes(ImageDraw.Draw(full), shapes, box, on_emerald, 1024, 1024, 230)
            full.resize((size, size), Image.Resampling.LANCZOS).save(dest / "ic_launcher.webp", "WEBP", quality=92)
            full.resize((size, size), Image.Resampling.LANCZOS).save(dest / "ic_launcher_round.webp", "WEBP", quality=92)
            foreground.resize((size, size), Image.Resampling.LANCZOS).save(dest / "ic_launcher_foreground.webp", "WEBP", quality=92)
            Image.new("RGB", (size, size), EMERALD[:3]).save(dest / "ic_launcher_background.webp", "WEBP", quality=92)
            mono_icon.resize((size, size), Image.Resampling.LANCZOS).save(dest / "ic_launcher_monochrome.webp", "WEBP", quality=92)
        for folder, size in {"drawable-mdpi": 200, "drawable-hdpi": 300, "drawable-xhdpi": 400, "drawable-xxhdpi": 600, "drawable-xxxhdpi": 800}.items():
            splash = Image.open(SPLASH / "splash-logo@3x.png")
            splash.resize((int(splash.width * size / 800), int(splash.height * size / 800)), Image.Resampling.LANCZOS).save(RES / folder / "splashscreen_brand.png")
            old = RES / folder / "splashscreen_logo.png"
            if old.exists():
                old.unlink()

    print("exported", BRAND, ICONS, SPLASH)


if __name__ == "__main__":
    main()
