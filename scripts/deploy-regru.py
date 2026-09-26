#!/usr/bin/env python3
"""Fast deploy: tar.gz local dist, SFTP one file, extract on Reg.ru host."""
from __future__ import annotations

import io
import os
import sys
import tarfile
import time
from pathlib import Path

import paramiko

HOST = os.environ.get("REGRU_HOST", "31.31.196.192")
USER = os.environ.get("REGRU_USER", "u3661520")
PASS = os.environ.get("REGRU_SSH_PASS", "")
LOCAL = Path(__file__).resolve().parents[1] / "apps" / "web" / "dist"
REMOTE_TAR = f"/var/www/{USER}/data/dompola-dist.tar.gz"
DOCROOT = f"/var/www/{USER}/data/www/dompola.com"

HTACCESS = """\
Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
"""


def log(msg: str) -> None:
    print(msg, flush=True)


def connect(retries: int = 10) -> paramiko.SSHClient:
    last = None
    for i in range(1, retries + 1):
        c = paramiko.SSHClient()
        c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            log(f"SSH {i}/{retries}...")
            c.connect(
                HOST,
                username=USER,
                password=PASS,
                timeout=25,
                banner_timeout=25,
                auth_timeout=25,
                allow_agent=False,
                look_for_keys=False,
            )
            log("SSH OK")
            return c
        except Exception as e:
            last = e
            log(f"  fail: {type(e).__name__}: {e}")
            time.sleep(2)
    raise RuntimeError(f"SSH failed: {last}")


def run(c: paramiko.SSHClient, cmd: str, timeout: int = 300) -> str:
    _, out, err = c.exec_command(cmd, timeout=timeout)
    text = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    if e.strip():
        log("STDERR: " + e[:800])
    return text


def build_tar() -> bytes:
    (LOCAL / ".htaccess").write_text(HTACCESS, encoding="utf-8")
    idx = (LOCAL / "index.html").read_bytes()
    (LOCAL / "404.html").write_bytes(idx)
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for p in LOCAL.rglob("*"):
            if p.is_file():
                tar.add(p, arcname=p.relative_to(LOCAL).as_posix())
    data = buf.getvalue()
    log(f"Archive {len(data) / 1e6:.1f} MB")
    return data


def main() -> int:
    if not PASS:
        log("Set REGRU_SSH_PASS")
        return 1
    if not LOCAL.is_dir():
        log(f"Missing {LOCAL}")
        return 1

    data = build_tar()
    c = connect()
    try:
        log(run(c, "pwd; ls -la; mkdir -p www/dompola.com"))
        sftp = c.open_sftp()
        try:
            log(f"Uploading tar -> {REMOTE_TAR}")
            with sftp.file(REMOTE_TAR, "wb") as rf:
                rf.write(data)
            log("Upload done")
        finally:
            sftp.close()

        extract = f"""
set -e
mkdir -p '{DOCROOT}'
# clear old site files but keep dir
find '{DOCROOT}' -mindepth 1 -maxdepth 1 -exec rm -rf {{}} +
tar -xzf '{REMOTE_TAR}' -C '{DOCROOT}'
rm -f '{REMOTE_TAR}'
ls -la '{DOCROOT}' | head -20
du -sh '{DOCROOT}'
test -f '{DOCROOT}/index.html' && echo INDEX_OK
"""
        log(run(c, extract, timeout=600))
        log("DONE")
    finally:
        c.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
