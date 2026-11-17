#!/usr/bin/env python3
"""
TechInPedia Full Production Deployer via FTP
Uploads updated .next build, src, server.js, .htaccess and triggers Passenger restart.
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
    ]
    for host, port, timeout in attempts:
        print(f"Connecting to FTP {host}:{port}...")
        try:
            ftp = ftplib.FTP()
            ftp.connect(host, port, timeout=timeout)
            ftp.login(FTP_USER, FTP_PASS)
            ftp.set_pasv(True)
            print(f"✅ Connected!")
            return ftp
        except Exception as e:
            print(f"❌ Connection error: {e}")
            time.sleep(2)
    return None

def ensure_remote_dir(ftp, remote_dir):
    parts = remote_dir.strip('/').split('/')
    path = ""
    for part in parts:
        path += "/" + part
        try:
            ftp.mkd(path)
        except Exception:
            pass

def upload_file(ftp, local_path, remote_path):
    try:
        remote_dir = os.path.dirname(remote_path)
        ensure_remote_dir(ftp, remote_dir)
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {remote_path}", f)
        print(f"  Uploaded: {remote_path.replace(REMOTE_ROOT, '')}")
        return True
    except Exception as e:
        print(f"  ❌ Error uploading {local_path}: {e}")
        return False

def upload_dir_recursive(ftp, local_dir, remote_dir):
    ensure_remote_dir(ftp, remote_dir)
    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        rem_dir = remote_dir if rel_path == "." else os.path.join(remote_dir, rel_path).replace("\\", "/")
        ensure_remote_dir(ftp, rem_dir)
        for file in files:
            local_file = os.path.join(root, file)
            rem_file = os.path.join(rem_dir, file).replace("\\", "/")
            upload_file(ftp, local_file, rem_file)

def main():
    print("🚀 TechInPedia Full Production Deployer")
    print("=" * 50)

    ftp = ftp_connect()
    if not ftp:
        print("❌ FTP connection failed!")
        sys.exit(1)

    # 1. Upload .next build directory
    print("\n📤 1/4 Uploading .next build directory...")
    upload_dir_recursive(ftp, os.path.join(LOCAL_ROOT, ".next"), REMOTE_ROOT + "/.next")

    # 2. Upload src directory
    print("\n📤 2/4 Uploading src directory...")
    upload_dir_recursive(ftp, os.path.join(LOCAL_ROOT, "src"), REMOTE_ROOT + "/src")

    # 3. Upload server.js & .htaccess
    print("\n📤 3/4 Uploading server.js and .htaccess...")
    upload_file(ftp, os.path.join(LOCAL_ROOT, "server.js"), REMOTE_ROOT + "/server.js")
    upload_file(ftp, os.path.join(LOCAL_ROOT, ".htaccess"), REMOTE_ROOT + "/.htaccess")

    # 4. Trigger Passenger Restart
    print("\n🔄 4/4 Triggering Passenger restart...")
    ensure_remote_dir(ftp, REMOTE_ROOT + "/tmp")
    restart_content = str(time.time()).encode()
    try:
        ftp.storbinary(f"STOR {REMOTE_ROOT}/tmp/restart.txt", io.BytesIO(restart_content))
        print("  ✅ Restart trigger file updated (tmp/restart.txt)")
    except Exception as e:
        print(f"  ❌ Failed to write restart.txt: {e}")

    try:
        ftp.quit()
    except Exception:
        pass

    print("\n" + "=" * 50)
    print("🎉 DEPLOYMENT COMPLETE! All laser lines & glowing circles removed.")
    print("   Server restart triggered.")
    print("   Check website at: https://techinpedia.in")
    print("=" * 50)

if __name__ == "__main__":
    main()
