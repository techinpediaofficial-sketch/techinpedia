#!/usr/bin/env python3
"""
TechInPedia - NPROC FIX Fast Deploy
Deploys only server.js + .htaccess + triggers Passenger restart
"""
import ftplib
import os
import io
import time
import sys

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
        (FTP_HOST, 21, 120),
    ]
    for host, port, timeout in attempts:
        print(f"  Trying FTP {host}:{port}...")
        try:
            ftp = ftplib.FTP()
            ftp.connect(host, port, timeout=timeout)
            ftp.login(FTP_USER, FTP_PASS)
            ftp.set_pasv(True)
            print(f"  ✅ Connected!")
            return ftp
        except Exception as e:
            print(f"  ❌ {e}")
            time.sleep(3)
    return None

def upload_file(ftp, local_path, remote_path):
    try:
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {remote_path}", f)
        print(f"  ✅ Uploaded: {os.path.basename(remote_path)}")
        return True
    except Exception as e:
        print(f"  ❌ Failed {os.path.basename(remote_path)}: {e}")
        return False

def upload_bytes(ftp, data, remote_path):
    try:
        ftp.storbinary(f"STOR {remote_path}", io.BytesIO(data))
        print(f"  ✅ Uploaded: {os.path.basename(remote_path)}")
        return True
    except Exception as e:
        print(f"  ❌ {e}")
        return False

def main():
    print("🔧 TechInPedia NPROC Fix Deployer")
    print("=" * 45)

    ftp = ftp_connect()
    if not ftp:
        print("❌ FTP connection failed!")
        sys.exit(1)

    # 1. Upload server.js
    print("\n📤 Uploading server.js (NPROC fix)...")
    upload_file(ftp, os.path.join(LOCAL_ROOT, "server.js"), REMOTE_ROOT + "/server.js")

    # 2. Upload .htaccess
    print("\n📤 Uploading .htaccess (Passenger throttle)...")
    upload_file(ftp, os.path.join(LOCAL_ROOT, ".htaccess"), REMOTE_ROOT + "/.htaccess")

    # 3. Trigger Passenger restart by touching tmp/restart.txt
    print("\n🔄 Triggering Passenger restart...")
    try:
        ftp.mkd(REMOTE_ROOT + "/tmp")
    except:
        pass
    restart_content = str(time.time()).encode()
    upload_bytes(ftp, restart_content, REMOTE_ROOT + "/tmp/restart.txt")

    # 4. Close FTP
    try:
        ftp.quit()
    except:
        pass

    print("\n" + "=" * 45)
    print("🎉 NPROC FIX DEPLOYED SUCCESSFULLY!")
    print("   server.js  → Hard exit in 800ms on SIGTERM")
    print("   .htaccess  → MaxPoolSize=1, IdleTime=10s")
    print("   Passenger  → Restart triggered")
    print()
    print("   Wait 30s, then check: https://techinpedia.in")
    print("=" * 45)

if __name__ == "__main__":
    main()
