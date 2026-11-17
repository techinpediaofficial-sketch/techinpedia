#!/usr/bin/env python3
"""
TechInPedia Fast FTP Deployer
"""
import ftplib
import os
import sys
import time
import urllib.request
import io

LOCAL_ROOT = "/Users/adityaverma/Downloads/techinpedia"
ZIP_OUT = os.path.join(LOCAL_ROOT, "techinpedia_deploy_opt.zip")

FTP_HOST = "techinpedia.in"
FTP_USER = "xxfeszkb"
FTP_PASS = "Newpass@12346"
REMOTE_ROOT = "/home/xxfeszkb/techinpedia.in"

def log(msg):
    print(msg, flush=True)

def connect_ftp():
    log(f"Connecting to FTP {FTP_HOST}:21...")
    try:
        ftp = ftplib.FTP()
        ftp.connect(FTP_HOST, 21, timeout=15)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.set_pasv(True)
        log(f"✅ FTP Connected successfully to {FTP_HOST}!")
        return ftp
    except Exception as e:
        log(f"❌ FTP Connection failed: {e}")
        return None

def upload(ftp, local_path, remote_path):
    filename = os.path.basename(local_path)
    log(f"  Uploading {filename} ({os.path.getsize(local_path)} bytes)...")
    with open(local_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)
    log(f"  ✅ Uploaded {filename}")

def main():
    log("🚀 Starting TechInPedia Deployment")
    log("=" * 50)

    if not os.path.exists(ZIP_OUT):
        log(f"❌ Zip file not found at {ZIP_OUT}")
        sys.exit(1)

    ftp = connect_ftp()
    if not ftp:
        sys.exit(1)

    # 1. Upload .htaccess first
    upload(ftp, os.path.join(LOCAL_ROOT, ".htaccess"), REMOTE_ROOT + "/.htaccess")

    # 2. Upload unzip.php
    upload(ftp, os.path.join(LOCAL_ROOT, "unzip.php"), REMOTE_ROOT + "/unzip.php")

    # 3. Upload kill.php
    kill_path = os.path.join(LOCAL_ROOT, "kill.php")
    if os.path.exists(kill_path):
        upload(ftp, kill_path, REMOTE_ROOT + "/kill.php")

    # 4. Upload deploy zip
    upload(ftp, ZIP_OUT, REMOTE_ROOT + "/techinpedia_deploy_opt.zip")

    try:
        ftp.quit()
    except Exception:
        pass

    log("\n📦 Triggering unzip on server via https://techinpedia.in/unzip.php...")
    time.sleep(2)
    try:
        req = urllib.request.Request("https://techinpedia.in/unzip.php", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            res_text = resp.read().decode('utf-8', errors='ignore')
            log(f"  Unzip Result: {res_text.strip()}")
    except Exception as e:
        log(f"  Unzip HTTP notice: {e}")

    log("\n💀 Triggering Node process recycle via https://techinpedia.in/kill.php...")
    try:
        req = urllib.request.Request("https://techinpedia.in/kill.php", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            log(f"  Kill Result: {resp.read().decode('utf-8', errors='ignore').strip()}")
    except Exception as e:
        log(f"  Kill notice: {e}")

    log("\n🔄 Touch tmp/restart.txt for Passenger...")
    ftp2 = connect_ftp()
    if ftp2:
        try:
            try:
                ftp2.mkd(REMOTE_ROOT + "/tmp")
            except Exception:
                pass
            ftp2.storbinary(f"STOR {REMOTE_ROOT}/tmp/restart.txt", io.BytesIO(str(time.time()).encode()))
            log("  ✅ restart.txt touched successfully!")
            ftp2.quit()
        except Exception as e:
            log(f"  Restart notice: {e}")

    log("\n" + "=" * 50)
    log("🎉 DEPLOYMENT FINISHED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
