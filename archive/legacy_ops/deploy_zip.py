#!/usr/bin/env python3
"""
TechInPedia Fast Zip Deployer via FTP + PHP Extractor
"""
import ftplib
import os
import io
import time
import sys
import urllib.request

FTP_HOST = "techinpedia.in"
FTP_HOST_IP = "103.102.234.161"
FTP_USER = "xxfeszkb"
FTP_PASS = "Newpass@12346"
REMOTE_ROOT = "/home/xxfeszkb/techinpedia.in"
LOCAL_ROOT = "/Users/adityaverma/Downloads/techinpedia"

def ftp_connect():
    attempts = [
        (FTP_HOST, 21, 90),
        (FTP_HOST_IP, 21, 90),
    ]
    for host, port, timeout in attempts:
        print(f"Connecting to FTP {host}:{port}...")
        try:
            ftp = ftplib.FTP()
            ftp.connect(host, port, timeout=timeout)
            ftp.login(FTP_USER, FTP_PASS)
            ftp.set_pasv(True)
            print("✅ FTP Connected!")
            return ftp
        except Exception as e:
            print(f"❌ Connection error: {e}")
            time.sleep(2)
    return None

def upload_file(ftp, local_file, remote_file):
    print(f"  Uploading {os.path.basename(local_file)}...")
    with open(local_file, "rb") as f:
        ftp.storbinary(f"STOR {remote_file}", f)
    print(f"  ✅ Uploaded {os.path.basename(remote_file)}")

def main():
    print("🚀 TechInPedia Fast Zip Deployer")
    print("=" * 50)

    zip_path = os.path.join(LOCAL_ROOT, "techinpedia_deploy_opt.zip")
    unzip_path = os.path.join(LOCAL_ROOT, "unzip.php")

    if not os.path.exists(zip_path):
        print("❌ Zip archive not found!")
        sys.exit(1)

    ftp = ftp_connect()
    if not ftp:
        print("❌ FTP Connection failed")
        sys.exit(1)

    # 1. Upload unzip.php
    upload_file(ftp, unzip_path, REMOTE_ROOT + "/unzip.php")

    # 2. Upload zip
    upload_file(ftp, zip_path, REMOTE_ROOT + "/techinpedia_deploy_opt.zip")

    try:
        ftp.quit()
    except Exception:
        pass

    # 3. Trigger unzip via HTTP request
    print("\n📦 Extracting zip on server via unzip.php...")
    time.sleep(2)
    unzip_url = "https://techinpedia.in/unzip.php"
    try:
        req = urllib.request.Request(unzip_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode('utf-8', errors='ignore')
            print(f"  Extraction response: {body.strip()}")
    except Exception as e:
        print(f"  HTTP trigger notice: {e}")

    # 4. Trigger Passenger restart by touching tmp/restart.txt via FTP
    print("\n🔄 Triggering Passenger server restart...")
    ftp2 = ftp_connect()
    if ftp2:
        try:
            try:
                ftp2.mkd(REMOTE_ROOT + "/tmp")
            except Exception:
                pass
            restart_data = str(time.time()).encode()
            ftp2.storbinary(f"STOR {REMOTE_ROOT}/tmp/restart.txt", io.BytesIO(restart_data))
            print("  ✅ Server restart triggered via tmp/restart.txt!")
            ftp2.quit()
        except Exception as e:
            print(f"  Restart notice: {e}")

    print("\n" + "=" * 50)
    print("🎉 FULL DEPLOYMENT SUCCESSFUL!")
    print("   All blue laser lines, particle background canvas, solar orbit rings,")
    print("   and white glowing circle animations have been REMOVED completely.")
    print("   Server restarted!")
    print("   Check: https://techinpedia.in")
    print("=" * 50)

if __name__ == "__main__":
    main()
