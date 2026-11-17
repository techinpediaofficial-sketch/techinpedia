#!/usr/bin/env python3
"""
Clean old chunk files from Hostinger FTP server for techinpedia.in
"""
import ftplib
import os
import time

FTP_HOST = "103.102.234.161"
FTP_USER = "xxfeszkb"
FTP_PASS = "Newpass@12346"
REMOTE_ROOT = "/techinpedia.in"
LOCAL_ROOT = "/Users/adityaverma/Downloads/techinpedia"

# Get current valid chunk filenames from local build
valid_chunks = set()
for root, dirs, files in os.walk(os.path.join(LOCAL_ROOT, ".next", "static")):
    for file in files:
        valid_chunks.add(file)

print(f"Loaded {len(valid_chunks)} valid build files from local .next/static")

ftp = ftplib.FTP()
ftp.connect(FTP_HOST, 21, timeout=15)
ftp.login(FTP_USER, FTP_PASS)
ftp.set_pasv(True)
print("Connected to FTP!")

def clean_dir(remote_dir):
    try:
        ftp.cwd(remote_dir)
        items = ftp.nlst()
        deleted = 0
        for item in items:
            if item in ['.', '..']:
                continue
            # Check if file is a JS chunk that is no longer in valid_chunks
            if (item.endswith('.js') or item.endswith('.js.map')) and item not in valid_chunks:
                try:
                    ftp.delete(f"{remote_dir}/{item}")
                    print(f"  Deleted stale file: {remote_dir}/{item}")
                    deleted += 1
                except Exception as e:
                    print(f"  Error deleting {item}: {e}")
        print(f"Cleaned {deleted} stale files from {remote_dir}")
    except Exception as e:
        print(f"Notice cleaning {remote_dir}: {e}")

clean_dir(REMOTE_ROOT + "/.next/static/chunks")
clean_dir(REMOTE_ROOT + "/.next/static/chunks/app")
clean_dir(REMOTE_ROOT + "/public/_next/static/chunks")
clean_dir(REMOTE_ROOT + "/public/_next/static/chunks/app")

try:
    ftp.quit()
except Exception:
    pass

print("Finished cleaning remote stale chunk files!")
