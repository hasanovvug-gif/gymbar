#!/usr/bin/env python3
"""Сборка ассетов приложения из selected-icon.svg (K6f — гриф в ромбе).

Геометрия продублирована из design/icon-concepts/selected-icon.svg в координатах 1024.
Рисуем через PIL с 4× суперсэмплингом — конвертера SVG на машине нет.
"""
from PIL import Image, ImageDraw

S = 4                      # суперсэмплинг
BG_DARK = "#0B0C0E"
ACCENT = "#C8F031"
WHITE = "#FFFFFF"

DIAMOND = [(512, 171), (853, 512), (512, 853), (171, 512)]
DIAMOND_W = 96
BAR = [(290, 512), (734, 512)]
BAR_W = 44
PLATES = [(350, 408, 92, 208, 38), (582, 408, 92, 208, 38)]


def art(size, stroke, scale=1.0, bg=None, radius=None):
    """Рисует иконку в квадрат size. scale<1 — ужать арт к центру (safe zone Android)."""
    n = size * S
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if bg:
        if radius:
            d.rounded_rectangle([0, 0, n - 1, n - 1], radius=radius / 1024 * n, fill=bg)
        else:
            d.rectangle([0, 0, n, n], fill=bg)

    k = n / 1024 * scale
    off = n * (1 - scale) / 2

    def P(x, y):
        return (x * k + off, y * k + off)

    def dot(p, w):
        r = w * k / 2
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=stroke)

    # ромб — контур с круглыми стыками
    pts = [P(*p) for p in DIAMOND]
    d.line(pts + [pts[0]], fill=stroke, width=int(DIAMOND_W * k))
    for p in pts:
        dot(p, DIAMOND_W)

    # гриф — линия с круглыми торцами
    bar = [P(*p) for p in BAR]
    d.line(bar, fill=ACCENT, width=int(BAR_W * k))
    for p in bar:
        dot_p, r = p, BAR_W * k / 2
        d.ellipse([dot_p[0] - r, dot_p[1] - r, dot_p[0] + r, dot_p[1] + r], fill=ACCENT)

    # блины
    for x, y, w, h, r in PLATES:
        x0, y0 = P(x, y)
        x1, y1 = P(x + w, y + h)
        d.rounded_rectangle([x0, y0, x1, y1], radius=r * k, fill=ACCENT)

    return img.resize((size, size), Image.LANCZOS)


OUT = "mobile/assets/images/"
art(1024, WHITE, bg=BG_DARK).save(OUT + "icon.png")
art(1024, WHITE, scale=0.66).save(OUT + "adaptive-icon.png")
art(512, WHITE).save(OUT + "splash-icon.png")
art(196, WHITE, bg=BG_DARK, radius=42).save(OUT + "favicon.png")
print("ok")
