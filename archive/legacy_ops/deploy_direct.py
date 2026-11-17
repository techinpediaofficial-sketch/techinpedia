#!/usr/bin/env python3
"""
TechInPedia Controlled FTP Deployer with Connection Retries & Public Sync
"""
import ftplib
import os
import io
import time
import sys
import shutil
import urllib.request
import ssl

FTP_HOSTS = ["103.102.234.161", "techinpedia.in"]
FTP_USER = "xxfeszkb"
FTP_PASS = "Newpass@12346"
REMOTE_ROOT = "/techinpedia.in"
LOCAL_ROOT = "/Users/adityaverma/Downloads/techinpedia"

def get_ftp():
    for attempt in range(5):
        for host in FTP_HOSTS:
            try:
                print(f"Connecting to FTP {host}...", flush=True)
                ftp = ftplib.FTP()
                ftp.connect(host, 21, timeout=15)
                ftp.login(FTP_USER, FTP_PASS)
                ftp.set_pasv(True)
                return ftp
            except Exception as e:
                print(f"FTP connect error on {host}: {e}", flush=True)
                time.sleep(2)
    raise Exception("Could not connect to FTP after retries")

def ensure_remote_dir(ftp, remote_dir):
    if not remote_dir or remote_dir == REMOTE_ROOT:
        return
    rel = remote_dir.replace(REMOTE_ROOT, '').strip('/')
    if not rel:
        return
    parts = rel.split('/')
    curr = REMOTE_ROOT
    for part in parts:
        curr += '/' + part
        try:
            ftp.mkd(curr)
        except Exception:
            pass

def copy_next_static_to_public():
    print("📁 Copying .next/static into public/_next/static...")
    src_static = os.path.join(LOCAL_ROOT, ".next", "static")
    dst_static = os.path.join(LOCAL_ROOT, "public", "_next", "static")
    if os.path.exists(src_static):
        if os.path.exists(dst_static):
            shutil.rmtree(dst_static)
        shutil.copytree(src_static, dst_static)
        print("  ✅ Static assets synchronized into public/_next/static!")

def sync_files():
    print("🚀 TechInPedia Direct FTP Sync")
    print("=" * 50)

    copy_next_static_to_public()

    ftp = get_ftp()
    print("✅ FTP Connected!")

    file_pairs = []
    file_pairs.append((os.path.join(LOCAL_ROOT, "server.js"), REMOTE_ROOT + "/server.js"))
    file_pairs.append((os.path.join(LOCAL_ROOT, ".htaccess"), REMOTE_ROOT + "/.htaccess"))
    if os.path.exists(os.path.join(LOCAL_ROOT, ".env")):
        file_pairs.append((os.path.join(LOCAL_ROOT, ".env"), REMOTE_ROOT + "/.env"))

    for folder in [".next", "src", "public"]:
        full_dir = os.path.join(LOCAL_ROOT, folder)
        if os.path.exists(full_dir):
            for root, dirs, files in os.walk(full_dir):
                norm_root = root.replace("\\", "/")
                if "/cache" in norm_root or "/types" in norm_root:
                    continue
                for file in files:
                    if file.endswith(".nft.json"):
                        continue
                    local_file = os.path.join(root, file)
                    rel = os.path.relpath(local_file, LOCAL_ROOT)
                    remote_file = os.path.join(REMOTE_ROOT, rel).replace("\\", "/")
                    file_pairs.append((local_file, remote_file))

    print(f"📦 Uploading {len(file_pairs)} files...")

    created_dirs = set()
    success = 0

    for idx, (lp, rp) in enumerate(file_pairs):
        remote_dir = os.path.dirname(rp)
        if remote_dir not in created_dirs:
            ensure_remote_dir(ftp, remote_dir)
            created_dirs.add(remote_dir)

        uploaded = False
        for retry in range(3):
            try:
                with open(lp, "rb") as f:
                    ftp.storbinary(f"STOR {rp}", f)
                success += 1
                uploaded = True
                if idx % 20 == 0 or idx == len(file_pairs) - 1:
                    print(f"  [{idx+1}/{len(file_pairs)}] Synced: {rp.replace(REMOTE_ROOT, '')}", flush=True)
                break
            except Exception as e:
                time.sleep(1)
                try:
                    ftp.quit()
                except Exception:
                    pass
                try:
                    ftp = get_ftp()
                    ensure_remote_dir(ftp, remote_dir)
                except Exception:
                    pass

    # Trigger restart
    print("\n🔄 Triggering Passenger server restart...")
    try:
        ensure_remote_dir(ftp, REMOTE_ROOT + "/tmp")
        restart_data = str(time.time()).encode()
        ftp.storbinary(f"STOR {REMOTE_ROOT}/tmp/restart.txt", io.BytesIO(restart_data))
        print("  ✅ Server restart triggered via tmp/restart.txt!")
    except Exception as e:
        print(f"  Restart notice: {e}")

    try:
        ftp.quit()
    except Exception:
        pass

    # Force process restart via API secret URL
    print("\n⚡ Invoking force process exit endpoint...")
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request("https://techinpedia.in/api/restart-techlynk-node-process-secret-99", headers={'User-Agent': 'Deployer'})
        with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
            print(f"  API Response: {resp.read().decode()}")
    except Exception as e:
        print(f"  API Notice: {e}")

    print("\n" + "=" * 50)
    print(f"🎉 SUCCESS! {success}/{len(file_pairs)} files deployed.")
    print("   Check live site at: https://techinpedia.in")
    print("=" * 50)

if __name__ == "__main__":
    sync_files()
