#!/usr/bin/env python3
"""
Create zip archive of fresh build and deploy to TechInPedia via FTP + unzip.php
"""
import os
import sys
import zipfile
import ftplib
import time
import urllib.request
import io

LOCAL_ROOT = "/Users/adityaverma/Downloads/techinpedia"
ZIP_OUT = os.path.join(LOCAL_ROOT, "techinpedia_deploy_opt.zip")

FTP_HOST = "techinpedia.in"
FTP_HOST_IP = "103.102.234.161"
FTP_USER = "xxfeszkb"
FTP_PASS = "Newpass@12346"
REMOTE_ROOT = "/home/xxfeszkb/techinpedia.in"

def log(msg):
    print(msg, flush=True)

def create_zip():
    log("📦 Creating deployment zip archive...")
    if os.path.exists(ZIP_OUT):
        os.remove(ZIP_OUT)

    files_and_dirs = [
        ".next",
        "public",
        "server.js",
        "package.json",
        ".htaccess",
        "kill.php",
    ]

    total_files = 0
    with zipfile.ZipFile(ZIP_OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for item in files_and_dirs:
            full_path = os.path.join(LOCAL_ROOT, item)
            if not os.path.exists(full_path):
                log(f"  ⚠️ Warning: {item} not found locally, skipping")
                continue
            
            if os.path.isfile(full_path):
                zf.write(full_path, arcname=item)
                total_files += 1
            elif os.path.isdir(full_path):
                for root, dirs, files in os.walk(full_path):
                    dirs[:] = [d for d in dirs if d != "cache"]
                    for f in files:
                        file_path = os.path.join(root, f)
                        arcname = os.path.relpath(file_path, LOCAL_ROOT)
                        zf.write(file_path, arcname=arcname)
                        total_files += 1

    size_mb = os.path.getsize(ZIP_OUT) / (1024 * 1024)
    log(f"✅ Zip created: {ZIP_OUT} ({size_mb:.2f} MB, {total_files} files)")

def ftp_connect():
    attempts = [
        (FTP_HOST_IP, 21, 10),
        (FTP_HOST, 21, 10),
    ]
    for host, port, timeout in attempts:
        log(f"Connecting to FTP {host}:{port}...")
        try:
            ftp = ftplib.FTP()
            ftp.connect(host, port, timeout=timeout)
            ftp.login(FTP_USER, FTP_PASS)
            ftp.set_pasv(True)
            log("✅ FTP Connected!")
            return ftp
        except Exception as e:
            log(f"❌ Connection error: {e}")
            time.sleep(2)
    return None

def upload_file(ftp, local_file, remote_file):
    log(f"  Uploading {os.path.basename(local_file)}...")
    with open(local_file, "rb") as f:
        ftp.storbinary(f"STOR {remote_file}", f)
    log(f"  ✅ Uploaded {os.path.basename(remote_file)}")

def deploy():
    ftp = ftp_connect()
    if not ftp:
        log("❌ FTP Connection failed")
        sys.exit(1)

    unzip_path = os.path.join(LOCAL_ROOT, "unzip.php")
    
    # 1. Upload unzip.php
    upload_file(ftp, unzip_path, REMOTE_ROOT + "/unzip.php")

    # 2. Upload zip
    upload_file(ftp, ZIP_OUT, REMOTE_ROOT + "/techinpedia_deploy_opt.zip")

    try:
        ftp.quit()
    except Exception:
        pass

    # 3. Trigger unzip via HTTP
    log("\n📦 Extracting zip on server via unzip.php...")
    time.sleep(2)
    unzip_url = "https://techinpedia.in/unzip.php"
    try:
        req = urllib.request.Request(unzip_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode('utf-8', errors='ignore')
            log(f"  Extraction response: {body.strip()}")
    except Exception as e:
        log(f"  HTTP trigger notice: {e}")

    # 4. Trigger kill.php to force kill old Node process immediately
    log("\n💀 Killing old Node process via kill.php...")
    try:
        kill_url = "https://techinpedia.in/kill.php"
        req = urllib.request.Request(kill_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            log(f"  Kill output: {resp.read().decode('utf-8', errors='ignore').strip()}")
    except Exception as e:
        log(f"  Kill notice: {e}")

    # 5. Trigger restart via FTP
    log("\n🔄 Triggering Passenger server restart...")
    ftp2 = ftp_connect()
    if ftp2:
        try:
            try:
                ftp2.mkd(REMOTE_ROOT + "/tmp")
            except Exception:
                pass
            restart_data = str(time.time()).encode()
            ftp2.storbinary(f"STOR {REMOTE_ROOT}/tmp/restart.txt", io.BytesIO(restart_data))
            log("  ✅ Server restart triggered via tmp/restart.txt!")
            ftp2.quit()
        except Exception as e:
            log(f"  Restart notice: {e}")

    log("\n" + "=" * 50)
    log("🎉 DEPLOYMENT COMPLETE!")

if __name__ == "__main__":
    if not os.path.exists(ZIP_OUT) or (time.time() - os.path.getmtime(ZIP_OUT) > 300):
        create_zip()
    else:
        log(f"Using existing zip: {ZIP_OUT}")
    deploy()
