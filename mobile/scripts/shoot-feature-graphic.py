#!/usr/bin/env python3
"""Feature graphic 1024x500 для Google Play.

    python3 scripts/shoot-feature-graphic.py

Рендерит scripts/feature-graphic.html и кладёт непрозрачный PNG в
docs/appstore/play-graphics/. Дев-сервер не нужен — страница открывается как file://,
шрифты и иконка берутся прямо из проекта.
"""

import pathlib

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "scripts" / "feature-graphic.html"
OUT = ROOT.parent / "docs" / "appstore" / "play-graphics" / "feature-graphic-1024x500.png"

WIDTH, HEIGHT = 1024, 500


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            device_scale_factor=1,
        ).new_page()
        page.goto(PAGE.as_uri())
        page.wait_for_timeout(600)  # дождаться @font-face
        page.screenshot(path=str(OUT))
        browser.close()

    # Play не принимает прозрачность в feature graphic — гарантируем плоский фон.
    img = Image.open(OUT).convert("RGB")
    assert img.size == (WIDTH, HEIGHT), img.size
    img.save(OUT, "PNG")
    print("✓", OUT.name, img.size, img.mode)


if __name__ == "__main__":
    main()
