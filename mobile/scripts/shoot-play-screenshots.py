#!/usr/bin/env python3
"""Скриншоты для листинга Google Play.

Снимает реальный интерфейс приложения (Expo Web) в размере телефона 1080x1920,
без рамки устройства и без iOS-статусбара. Перед запуском:

    cd mobile && npx expo start --web --port 8081

Затем:  python3 scripts/shoot-play-screenshots.py

Кладёт PNG в docs/appstore/screenshots-play/.
Демо-данные наливает scripts/screenshot-demo-data.js (тот же файл, что для консоли).
"""

import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT.parent / "docs" / "appstore" / "screenshots-play"
SEED = (ROOT / "scripts" / "screenshot-demo-data.js").read_text()
URL = "http://localhost:8081"

# Ширина телефона в CSS-пикселях; scale 2.5 даёт 1080x1920 — рекомендованный Play размер.
WIDTH, HEIGHT, SCALE = 432, 768, 2.5

TABS = ["Home", "Workouts", "Supplements", "History", "Settings"]


def shot(page, name):
    OUT.mkdir(parents=True, exist_ok=True)
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT / f"{name}.png"))
    print("✓", name)


def tab(page, label):
    page.get_by_text(label, exact=True).last.click()
    page.wait_for_timeout(600)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            device_scale_factor=SCALE,
            locale="en-US",
            color_scheme="dark",
        )
        page = ctx.new_page()
        page.goto(URL, wait_until="networkidle")
        page.evaluate(SEED)
        page.evaluate("(k)=>{const r=JSON.parse(localStorage[k]);r.data.settings.language='EN';localStorage[k]=JSON.stringify(r)}", "gym-tracker-mobile-v2")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1500)

        shot(page, "01-home")

        tab(page, "Workouts")
        shot(page, "02-workouts")

        tab(page, "Supplements")
        shot(page, "03-supplements-today")
        for sub, name in (("Stock", "04-supplements-stock"), ("Progress", "05-supplements-progress")):
            page.get_by_text(sub, exact=True).last.click()
            shot(page, name)

        tab(page, "History")
        shot(page, "06-history")

        tab(page, "Settings")
        shot(page, "07-settings")

        # Активная тренировка: старт с главной, затем экран подхода.
        tab(page, "Home")
        page.get_by_text("Start", exact=True).last.click()
        page.wait_for_timeout(1200)
        shot(page, "08-session")

        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print("ошибка:", exc, file=sys.stderr)
        sys.exit(1)
