"""Trace the approved mark out of the brand board into a smoothed SVG."""
from PIL import Image, ImageDraw

BOARD = r"D:\kharcha\Cashweft Fintech Brand System Board.png"
OUT_SVG = r"D:\kharcha\docs\brand\_inspect\traced.svg"
OUT_PNG = r"D:\kharcha\docs\brand\_inspect\traced.png"


def smooth_mask(mask, scale=8, radius=6, cutoff=140):
    from PIL import ImageFilter
    height = len(mask)
    width = len(mask[0])
    image = Image.new("L", (width, height))
    image.putdata([255 if cell else 0 for row in mask for cell in row])
    image = image.resize((width * scale, height * scale), Image.Resampling.NEAREST)
    image = image.filter(ImageFilter.GaussianBlur(radius))
    pixels = list(image.getdata())
    out_w, out_h = image.size
    rows = []
    for y in range(out_h):
        rows.append([1 if pixels[y * out_w + x] >= cutoff else 0 for x in range(out_w)])
    return rows


def masks(image):
    emerald = []
    mint = []
    pixels = image.load()
    for y in range(image.height):
        erow = []
        mrow = []
        for x in range(image.width):
            r, g, b = pixels[x, y]
            if r > 210 and g > 200 and b > 185:
                erow.append(0)
                mrow.append(0)
            elif g > r + 25 and g > 80:
                erow.append(0)
                mrow.append(1)
            else:
                erow.append(1)
                mrow.append(0)
        emerald.append(erow)
        mint.append(mrow)
    return smooth_mask(emerald), smooth_mask(mint)


def components(mask):
    h = len(mask)
    w = len(mask[0])
    seen = [[0] * w for _ in range(h)]
    found = []
    for y in range(h):
        for x in range(w):
            if not mask[y][x] or seen[y][x]:
                continue
            stack = [(x, y)]
            seen[y][x] = 1
            cells = []
            while stack:
                cx, cy = stack.pop()
                cells.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = 1
                        stack.append((nx, ny))
            if len(cells) > 800:
                found.append(cells)
    return found


def trace(cells):
    occupied = set(cells)
    start = min(cells, key=lambda p: (p[1], p[0]))
    dirs = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
    x, y = start
    direction = 0
    contour = []
    for _ in range(len(cells) * 8):
        contour.append((x, y))
        turned = False
        for turn in range(8):
            index = (direction + turn - 2) % 8
            dx, dy = dirs[index]
            nx, ny = x + dx, y + dy
            if (nx, ny) in occupied:
                x, y = nx, ny
                direction = index
                turned = True
                break
        if not turned or (x, y) == start:
            break
    return contour


def rdp(points, epsilon):
    if len(points) < 3:
        return points
    start, end = points[0], points[-1]
    sx, sy = start
    ex, ey = end
    length = ((ex - sx) ** 2 + (ey - sy) ** 2) ** 0.5 or 1
    index = 0
    farthest = 0
    for i, (x, y) in enumerate(points[1:-1], 1):
        distance = abs((ey - sy) * x - (ex - sx) * y + ex * sy - ey * sx) / length
        if distance > farthest:
            farthest = distance
            index = i
    if farthest > epsilon:
        left = rdp(points[: index + 1], epsilon)
        right = rdp(points[index:], epsilon)
        return left[:-1] + right
    return [start, end]


def chaikin(points, iterations):
    ring = points[:]
    for _ in range(iterations):
        nxt = []
        count = len(ring)
        for i in range(count):
            x0, y0 = ring[i]
            x1, y1 = ring[(i + 1) % count]
            nxt.append((0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1))
            nxt.append((0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1))
        ring = nxt
    return ring


def path(points, scale, ox, oy):
    parts = []
    for index, (x, y) in enumerate(points):
        command = "M" if index == 0 else "L"
        parts.append(f"{command}{(x + ox) * scale:.2f} {(y + oy) * scale:.2f}")
    return " ".join(parts) + " Z"


def main():
    image = Image.open(BOARD).convert("RGB").crop((52, 78, 198, 242))
    emerald, mint = masks(image)
    shapes = []
    for mask, color in ((emerald, "#0F5132"), (mint, "#6EE7B7")):
        for cells in components(mask):
            contour = trace(cells)
            if len(contour) < 8:
                continue
            simple = rdp(contour, 10)
            smooth = chaikin(simple, 2)
            shapes.append((color, smooth))
    scale = 1
    pad = 48
    width = len(emerald[0]) + pad * 2
    height = len(emerald) + pad * 2
    body = []
    for color, points in shapes:
        body.append(f'<path fill="{color}" d="{path(points, scale, pad, pad)}"/>')
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="Cashweft">'
        + "".join(body)
        + "</svg>"
    )
    open(OUT_SVG, "w", encoding="utf-8").write(svg)
    plate = Image.new("RGBA", (width, height), (248, 250, 247, 255))
    draw = ImageDraw.Draw(plate)
    for color, points in shapes:
        draw.polygon([((x + pad) * scale, (y + pad) * scale) for x, y in points], fill=color)
    plate.save(OUT_PNG)
    print("shapes", len(shapes), "size", width, height)


if __name__ == "__main__":
    main()
