#!/usr/bin/env python3
import subprocess
import os
import time

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_DIR = "/Users/adityaverma/Downloads/techinpedia/public/projects/screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

SITES = [
    {"slug": "admiless-web", "url": "https://admiless.com/", "file": "admiless.png"},
    {"slug": "vijaya-bharna-web", "url": "https://vijayabharnajewellers.com/", "file": "vijayabharnajewellers.png"},
    {"slug": "realestate-vijayabharna", "url": "https://realestate.vijayabharnajewellers.com/", "file": "realestate-vijayabharna.png"},
    {"slug": "velora-jewels", "url": "https://velorajewels.co.in/", "file": "velorajewels.png"},
    {"slug": "trucraft-modular", "url": "https://trucraftmodular.com/", "file": "trucraftmodular.png"},
    {"slug": "vinfexo-tech", "url": "https://vinfexotech.com/", "file": "vinfexotech.png"},
    {"slug": "hello-mam", "url": "https://hellomam.co.in/", "file": "hellomam.png"},
    {"slug": "abdiel-aircon", "url": "https://abdielaircon.info/", "file": "abdielaircon.png"},
    {"slug": "shivalik-finadvisor", "url": "https://shivaliksalesfinadvisor.com/", "file": "shivaliksalesfinadvisor.png"},
    {"slug": "bm-naveen-movies-web", "url": "https://movie.bmnaveens.com/", "file": "movie-bmnaveens.png"},
    {"slug": "kcn-sons-web", "url": "https://kcnsons.in/", "file": "kcnsons.png"},
    {"slug": "book-my-hotel", "url": "https://book-myhotel.com/", "file": "book-myhotel.png"},
    {"slug": "anytime-salon", "url": "https://anytimesalon.com/", "file": "anytimesalon.png"},
    {"slug": "makeuptym", "url": "http://makeuptym.com/", "file": "makeuptym.png"},
]

for idx, site in enumerate(SITES):
    out_path = os.path.join(OUT_DIR, site["file"])
    print(f"[{idx+1}/{len(SITES)}] Capturing {site['url']} -> {site['file']}...")
    cmd = [
        CHROME_BIN,
        "--headless",
        "--disable-gpu",
        "--window-size=1366,768",
        "--virtual-time-budget=3500",
        "--hide-scrollbars",
        f"--screenshot={out_path}",
        site["url"]
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
            print(f"  ✅ SUCCESS: {site['file']} ({os.path.getsize(out_path):,} bytes)")
        else:
            print(f"  ⚠️ Retrying without virtual time budget...")
            cmd2 = [
                CHROME_BIN,
                "--headless",
                "--disable-gpu",
                "--window-size=1366,768",
                "--hide-scrollbars",
                f"--screenshot={out_path}",
                site["url"]
            ]
            subprocess.run(cmd2, capture_output=True, text=True, timeout=20)
            if os.path.exists(out_path):
                print(f"  ✅ SUCCESS on retry: {site['file']} ({os.path.getsize(out_path):,} bytes)")
            else:
                print(f"  ❌ FAILED: {site['file']}")
    except Exception as e:
        print(f"  ❌ ERROR on {site['url']}: {e}")

print("Done capturing all website screenshots!")
