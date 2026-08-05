#!/usr/bin/env python3
"""Заливка карточки Gymbar в Google Play через Play Developer API.

Тексты берутся из docs/appstore/metadata-play.md, графика — из docs/appstore/.
Скрипт идемпотентный: скриншоты перед заливкой сносятся и кладутся заново в порядке имён.
Ничего не публикует: сборка уходит в трек internal со статусом draft.

    pip install google-auth requests
    python mobile/scripts/play-listing.py [--aab путь/к/файлу.aab]

Ключ service account: ~/.secrets/play-eas-submit.json (SA eas-submit@asbestosguard-play).
⚠️ Код языка украинского в Play — «uk», не «uk-UA» (второй отдаётся 400).
⚠️ Вызовы к googleapis рвутся из песочницы Claude — звать с отключённой песочницей.
"""
import argparse, glob, json, os, sys, time

import requests
from google.oauth2 import service_account
import google.auth.transport.requests

PKG = "com.gymbar.app"
KEY = os.path.expanduser("~/.secrets/play-eas-submit.json")
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
META = os.path.join(ROOT, "docs/appstore/metadata-play.md")
GFX = os.path.join(ROOT, "docs/appstore/play-graphics")
SHOTS = os.path.join(ROOT, "docs/appstore/screenshots-play")

BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PKG}"
UP = f"https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/{PKG}"

CONTACT_EMAIL = "hello@smartsync.pro"
CONTACT_SITE = "https://hasanovvug-gif.github.io/gymbar/"

LIMITS = {"title": 30, "shortDescription": 80, "fullDescription": 4000}


def listings():
    md = open(META, encoding="utf-8").read()

    def full(header):
        return md.split(header, 1)[1].split("```")[1].strip()

    return {
        "en-US": dict(
            title="Gymbar: Workout Log & Timer",
            shortDescription="Plan your split, run the session, log every set. Rest timer, offline, no ads.",
            fullDescription=full("## English")),
        "ru-RU": dict(
            title="Gymbar: дневник тренировок",
            shortDescription="Сплит, тренировка, каждый подход. Таймер отдыха, офлайн, без рекламы.",
            fullDescription=full("## Русский")),
        "uk": dict(
            title="Gymbar: щоденник тренувань",
            shortDescription="Спліт, тренування, кожен підхід. Таймер відпочинку, офлайн, без реклами.",
            fullDescription=full("## Українська")),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--aab", help="путь к AAB; без него сборка не заливается")
    args = ap.parse_args()

    data = listings()
    for lang, d in data.items():
        for k, v in d.items():
            assert v and len(v) <= LIMITS[k], f"{lang}.{k}: {len(v)} > {LIMITS[k]}"
    print("тексты в лимитах Play: ok")

    creds = service_account.Credentials.from_service_account_file(
        KEY, scopes=["https://www.googleapis.com/auth/androidpublisher"])
    creds.refresh(google.auth.transport.requests.Request())
    s = requests.Session()
    s.headers["Authorization"] = "Bearer " + creds.token

    def call(method, path, **kw):
        r = s.request(method, BASE + path, **kw)
        if not r.ok:
            print(f"ERR {method} {path} -> {r.status_code} {r.text[:300]}", file=sys.stderr)
            return None
        return r.json() if r.text else {}

    eid = call("POST", "/edits")["id"]
    print("edit", eid, flush=True)

    def image(lang, itype, path, tries=3):
        for _ in range(tries):
            with open(path, "rb") as f:
                r = s.post(f"{UP}/edits/{eid}/listings/{lang}/{itype}?uploadType=media",
                           headers={"Content-Type": "image/png"}, data=f.read())
            if r.ok:
                print("  img", lang, itype, os.path.basename(path), flush=True)
                return True
            print("  retry", lang, itype, r.status_code, flush=True)
            time.sleep(3)
        return False

    call("PATCH", f"/edits/{eid}/details", json={
        "defaultLanguage": "en-US", "contactEmail": CONTACT_EMAIL, "contactWebsite": CONTACT_SITE})

    shots = sorted(glob.glob(os.path.join(SHOTS, "*.png")))
    for lang, d in data.items():
        call("PUT", f"/edits/{eid}/listings/{lang}", json={"language": lang, **d})
        image(lang, "icon", os.path.join(GFX, "icon-512.png"))
        image(lang, "featureGraphic", os.path.join(GFX, "feature-graphic-1024x500.png"))
        s.delete(f"{BASE}/edits/{eid}/listings/{lang}/phoneScreenshots")
        for sh in shots:
            image(lang, "phoneScreenshots", sh)

    if args.aab:
        with open(args.aab, "rb") as f:
            r = s.post(f"{UP}/edits/{eid}/bundles?uploadType=media",
                       headers={"Content-Type": "application/octet-stream"}, data=f.read())
        if not r.ok:
            print("bundle upload FAILED", r.status_code, r.text[:300], file=sys.stderr)
            s.delete(BASE + f"/edits/{eid}")
            return 1
        vc = r.json()["versionCode"]
        print("bundle versionCode", vc, flush=True)
        call("PUT", f"/edits/{eid}/tracks/internal", json={"track": "internal", "releases": [{
            "versionCodes": [str(vc)], "status": "draft",
            "releaseNotes": [
                {"language": "en-US", "text": "First Gymbar release on Android."},
                {"language": "ru-RU", "text": "Первый релиз Gymbar на Android."},
                {"language": "uk", "text": "Перший реліз Gymbar на Android."}]}]})

    if call("POST", f"/edits/{eid}:validate") is None:
        s.delete(BASE + f"/edits/{eid}")
        return 1
    print("commit:", json.dumps(call("POST", f"/edits/{eid}:commit")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
