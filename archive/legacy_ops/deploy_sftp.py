#!/usr/bin/env python3
"""
TechInPedia SFTP Deployer (SSH port 22)
Falls back through common Hostinger SSH ports: 22, 2222, 65002
"""
import paramiko
import os
import io
import time
import shutil
import sys
import urllib.request
import ssl

SSH_HOST = "103.102.234.161"
SSH_PORTS = [22, 2222, 65002]
SSH_USER = "xxfeszkb"
SSH_PASS = "Newpass@12346"
REMOTE_ROOT = "/home/xxfeszkb/techinpedia.in"
LOCAL_ROOT = "/Users/adityaverma/Downloads/techinpedia"

SKIP_DIRS = ["/cache", "/types"]
SKIP_EXTS = [".nft.json"]

def get_sftp():
    for port in SSH_PORTS:
        try:
            print(f"  Trying SSH {SSH_HOST}:{port} ...", flush=True)
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(SSH_HOST, port=port, username=SSH_USER, password=SSH_PASS, timeout=15, banner_timeout=20)
            sftp = client.open_sftp()
            print(f"  ✅ SFTP Connected on port {port}!", flush=True)
            return client, sftp
        except Exception as e:
            print(f"  ✗ Port {port} failed: {e}", flush=True)
    raise Exception("❌ Could not connect via SFTP on any port.")

def ensure_remote_dir(sftp, remote_dir):
    """Recursively create remote directories."""
    if not remote_dir or remote_dir == "/":
        return
    parts = remote_dir.split("/")
    path = ""
    for part in parts:
        if not part:
            path = "/"
            continue
        path = path.rstrip("/") + "/" + part
        try:
            sftp.stat(path)
        except FileNotFoundError:
            try:
                sftp.mkdir(path)
            except Exception:
                pass

def copy_next_static_to_public():
    print("📁 Syncing .next/static → public/_next/static ...", flush=True)
    src = os.path.join(LOCAL_ROOT, ".next", "static")
    dst = os.path.join(LOCAL_ROOT, "public", "_next", "static")
    if os.path.exists(src):
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print("  ✅ Static assets synced!", flush=True)

def collect_files():
    file_pairs = []
    # Root files
    for f in ["server.js", ".htaccess", ".env", "package.json", "next.config.ts"]:
        lp = os.path.join(LOCAL_ROOT, f)
        if os.path.exists(lp):
            file_pairs.append((lp, REMOTE_ROOT + "/" + f))
    # Directories
    for folder in [".next", "public"]:
        full_dir = os.path.join(LOCAL_ROOT, folder)
        if not os.path.exists(full_dir):
            continue
        for root, dirs, files in os.walk(full_dir):
            norm_root = root.replace("\\", "/")
            if any(skip in norm_root for skip in SKIP_DIRS):
                continue
            for file in files:
                if any(file.endswith(ext) for ext in SKIP_EXTS):
                    continue
                local_file = os.path.join(root, file)
                rel = os.path.relpath(local_file, LOCAL_ROOT)
                remote_file = (REMOTE_ROOT + "/" + rel).replace("\\", "/")
                file_pairs.append((local_file, remote_file))
    return file_pairs

def deploy():
    print("🚀 TechInPedia SFTP Deploy")
    print("=" * 50)

    copy_next_static_to_public()

    print("\n🔌 Connecting via SFTP...", flush=True)
    client, sftp = get_sftp()

    file_pairs = collect_files()
    print(f"\n📦 Uploading {len(file_pairs)} files...", flush=True)

    created_dirs = set()
    success = 0
    failed = []

    for idx, (lp, rp) in enumerate(file_pairs):
        remote_dir = os.path.dirname(rp)
        if remote_dir not in created_dirs:
            ensure_remote_dir(sftp, remote_dir)
            created_dirs.add(remote_dir)

        for attempt in range(3):
            try:
                sftp.put(lp, rp)
                success += 1
                if idx % 25 == 0 or idx == len(file_pairs) - 1:
                    pct = int((idx + 1) / len(file_pairs) * 100)
                    print(f"  [{idx+1}/{len(file_pairs)}] ({pct}%) {rp.replace(REMOTE_ROOT, '')}", flush=True)
                break
            except Exception as e:
                if attempt == 2:
                    print(f"  ✗ FAILED: {rp} — {e}", flush=True)
                    failed.append(rp)
                else:
                    time.sleep(1)

    # Trigger Passenger restart
    print("\n🔄 Triggering Passenger restart...", flush=True)
    try:
        stdin, stdout, stderr = client.exec_command(f"mkdir -p {REMOTE_ROOT}/tmp && touch {REMOTE_ROOT}/tmp/restart.txt")
        stdout.channel.recv_exit_status()
        print("  ✅ restart.txt touched!", flush=True)
    except Exception as e:
        print(f"  Restart notice: {e}", flush=True)

    sftp.close()
    client.close()

    # Force process restart via secret API
    print("\n⚡ Hitting force-restart endpoint...", flush=True)
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(
            "https://techinpedia.in/api/restart-techlynk-node-process-secret-99",
            headers={"User-Agent": "Deployer"}
        )
        with urllib.request.urlopen(req, timeout=8, context=ctx) as resp:
            print(f"  API: {resp.read().decode()}", flush=True)
    except Exception as e:
        print(f"  API notice: {e}", flush=True)

    print("\n" + "=" * 50)
    print(f"🎉 Done! {success}/{len(file_pairs)} files uploaded.")
    if failed:
        print(f"⚠️  {len(failed)} failed files:")
        for f in failed[:10]:
            print(f"   {f}")
    print("   🌐 https://techinpedia.in")
    print("=" * 50)

if __name__ == "__main__":
    deploy()
