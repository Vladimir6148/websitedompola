#!/usr/bin/env python3
"""Publish apps/web/dist to Reg.ru via resumable SFTP (survives SSH drops).

  npm run publish          # fast: без images/ (~2–4 MB), картинки уже на сервере
  npm run publish:full     # полный архив с фото (~39 MB) — после импорта картинок
  python scripts/deploy-regru.py
  python scripts/deploy-regru.py --full
"""
from __future__ import annotations

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
CHUNK = 256 * 1024
MAX_UPLOAD_TRIES = 25

HTACCESS = """\
Options -MultiViews
RewriteEngine On
RewriteBase /

# Correct MIME for crawlers (avoids Google "Other error" on fonts/webp)
<IfModule mod_mime.c>
AddType font/woff2 .woff2
AddType font/woff .woff
AddType image/webp .webp
AddType image/svg+xml .svg
</IfModule>

# Long cache for static assets (build-id query busts after publish)
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/webp "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/gif "access plus 1 year"
ExpiresByType image/svg+xml "access plus 1 year"
ExpiresByType font/woff2 "access plus 1 year"
ExpiresByType font/woff "access plus 1 year"
ExpiresByType text/css "access plus 1 year"
ExpiresByType application/javascript "access plus 1 year"
ExpiresByType application/json "access plus 6 hours"
ExpiresByType text/html "access plus 0 seconds"
</IfModule>
<IfModule mod_headers.c>
<FilesMatch "\\.(?i:webp|jpe?g|png|gif|svg|woff2|woff|css|js)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
<FilesMatch "\\.(?i:woff2|woff)$">
  Header set Access-Control-Allow-Origin "*"
  Header set Timing-Allow-Origin "*"
</FilesMatch>
# Favicons / PWA: short cache so Google and browsers pick up brand icon updates
<FilesMatch "(?i)^(favicon|apple-touch-icon|site\\.webmanifest|manifest\\.webmanifest)">
  Header set Cache-Control "public, max-age=86400, must-revalidate"
</FilesMatch>
<FilesMatch "\\.(?i:ico|webmanifest)$">
  Header set Cache-Control "public, max-age=86400, must-revalidate"
</FilesMatch>
<FilesMatch "\\.(?i:json)$">
  Header set Cache-Control "public, max-age=21600"
</FilesMatch>
<FilesMatch "\\.(?i:html)$">
  Header set Cache-Control "no-cache"
</FilesMatch>
</IfModule>
# Never compress fonts/images (corruption risk for some crawlers)
<IfModule mod_deflate.c>
  SetEnvIfNoCase Request_URI "\\.(?:gif|jpe?g|png|webp|woff2?|ico)$" no-gzip dont-vary
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

# Preserve Bearer token for PHP (Apache CGI often drops Authorization)
RewriteCond %{HTTP:Authorization} .
RewriteRule ^ - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteCond %{HTTP:X-Dompola-Authorization} .
RewriteRule ^ - [E=HTTP_X_DOMPOLA_AUTHORIZATION:%{HTTP:X-Dompola-Authorization}]

# Same-origin API proxy → Render (fixes admin login CORS / Failed to fetch)
RewriteRule ^api/(.*)$ api-proxy.php?__path=$1 [QSA,L]

# Missing hashed assets must 404 (not SPA HTML) — Googlebot treats HTML-as-font as errors
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^assets/ - [R=404,L]

# Same for product images — do not SPA-fallback missing webp
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^images/ - [R=404,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
"""


def write_api_proxy() -> None:
    public_dir = Path(__file__).resolve().parents[1] / "apps" / "web" / "public"
    for name in ("api-proxy.php", "ops-api.php"):
        src = public_dir / name
        if src.is_file():
            (LOCAL / name).write_bytes(src.read_bytes())
            log(f"{name} → dist")
        else:
            log(f"WARN: {name} missing in public/")


def log(msg: str) -> None:
    print(msg, flush=True)


def connect(retries: int = 10) -> paramiko.SSHClient:
    last: Exception | None = None
    for i in range(1, retries + 1):
        c = paramiko.SSHClient()
        c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            log(f"SSH {i}/{retries}...")
            c.connect(
                HOST,
                username=USER,
                password=PASS,
                timeout=45,
                banner_timeout=45,
                auth_timeout=45,
                allow_agent=False,
                look_for_keys=False,
            )
            t = c.get_transport()
            if t:
                t.set_keepalive(10)
                try:
                    t.default_window_size = paramiko.common.MAX_WINDOW_SIZE
                    t.packetizer.REKEY_BYTES = pow(2, 40)
                    t.packetizer.REKEY_PACKETS = pow(2, 40)
                except Exception:
                    pass
            log("SSH OK")
            return c
        except Exception as e:
            last = e
            log(f"  fail: {type(e).__name__}: {e}")
            time.sleep(min(2 * i, 12))
    raise RuntimeError(f"SSH failed: {last}")


def run(c: paramiko.SSHClient, cmd: str, timeout: int = 300) -> tuple[int, str]:
    _, out, err = c.exec_command(cmd, timeout=timeout)
    text = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    if e.strip():
        log("STDERR: " + e[:800])
    return code, text


def build_tar(path: Path, *, skip_images: bool = False) -> Path:
    (LOCAL / ".htaccess").write_text(HTACCESS, encoding="utf-8")
    write_api_proxy()
    idx = (LOCAL / "index.html").read_bytes()
    (LOCAL / "404.html").write_bytes(idx)
    log("Packing dist..." + (" [without images/]" if skip_images else ""))
    if path.exists():
        path.unlink()
    n_skip = 0
    with tarfile.open(path, mode="w:gz", compresslevel=6) as tar:
        for p in LOCAL.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix in {".map", ".DS_Store"}:
                continue
            rel = p.relative_to(LOCAL).as_posix()
            if skip_images and (rel == "images" or rel.startswith("images/")):
                n_skip += 1
                continue
            tar.add(p, arcname=rel)
    with tarfile.open(path, mode="r:gz") as tar:
        n = sum(1 for _ in tar)
    size = path.stat().st_size
    extra = f", skipped images={n_skip}" if skip_images else ""
    log(f"Archive {size / 1e6:.1f} MB, {n} files{extra}, OK")
    return path


def remote_size(sftp: paramiko.SFTPClient, path: str) -> int:
    try:
        return int(sftp.stat(path).st_size)
    except OSError:
        return 0


def upload_resumable(
    client: paramiko.SSHClient,
    local_tar: Path,
    *,
    fresh: bool = False,
) -> paramiko.SSHClient:
    total = local_tar.stat().st_size
    for attempt in range(1, MAX_UPLOAD_TRIES + 1):
        try:
            tr = client.get_transport()
            if tr is None or not tr.is_active():
                client = connect()
            run(client, f"mkdir -p /var/www/{USER}/data")
            sftp = client.open_sftp()
            try:
                if fresh and attempt == 1:
                    try:
                        sftp.remove(REMOTE_TAR)
                        log("Removed old remote tar")
                    except OSError:
                        pass
                    fresh = False

                offset = remote_size(sftp, REMOTE_TAR)
                if offset > total:
                    log("Remote partial too big - restart")
                    try:
                        sftp.remove(REMOTE_TAR)
                    except OSError:
                        pass
                    offset = 0
                if offset == total and total > 0:
                    log("Upload already complete on server")
                    return client

                mode = "ab" if offset else "wb"
                log(
                    f"Upload try {attempt}/{MAX_UPLOAD_TRIES}: "
                    f"{offset / 1e6:.1f}/{total / 1e6:.1f} MB "
                    f"({'resume' if offset else 'fresh'})"
                )
                t0 = time.time()
                started = offset
                last_log = offset
                with open(local_tar, "rb") as lf:
                    lf.seek(offset)
                    with sftp.file(REMOTE_TAR, mode) as rf:
                        rf.set_pipelined(True)
                        while True:
                            buf = lf.read(CHUNK)
                            if not buf:
                                break
                            rf.write(buf)
                            offset += len(buf)
                            if offset - last_log >= 2_000_000 or offset >= total:
                                last_log = offset
                                elapsed = max(time.time() - t0, 0.1)
                                speed = (offset - started) / elapsed / 1e6
                                log(
                                    f"  {offset / 1e6:.1f}/{total / 1e6:.1f} MB  "
                                    f"{speed:.1f} MB/s"
                                )

                final = remote_size(sftp, REMOTE_TAR)
                if final != total:
                    raise IOError(f"size mismatch remote={final} local={total}")
                log(f"Upload done ({final / 1e6:.1f} MB)")
                return client
            finally:
                sftp.close()
        except Exception as e:
            log(f"  upload break: {type(e).__name__}: {e}")
            try:
                client.close()
            except Exception:
                pass
            if attempt >= MAX_UPLOAD_TRIES:
                raise
            time.sleep(min(2 * attempt, 20))
            client = connect()
    raise RuntimeError("upload failed")


def main() -> int:
    if not PASS:
        log("Set REGRU_SSH_PASS")
        return 1
    if not LOCAL.is_dir():
        log(f"Missing {LOCAL} - run: npm run build -w apps/web")
        return 1

    # По умолчанию без images/ (~2–4 MB). Полный архив: --full
    skip_images = "--full" not in sys.argv

    cache = Path(__file__).resolve().parents[1] / "scripts" / "catalog-images" / ".cache"
    cache.mkdir(parents=True, exist_ok=True)
    tar_path = cache / ("dompola-dist-code.tar.gz" if skip_images else "dompola-dist.tar.gz")

    build_tar(tar_path, skip_images=skip_images)
    client = connect()
    try:
        run(client, "mkdir -p www/dompola.com")
        client = upload_resumable(client, tar_path, fresh=True)

        code, out = run(
            client,
            f"gzip -t '{REMOTE_TAR}' && echo GZIP_OK && ls -la '{REMOTE_TAR}'",
            timeout=120,
        )
        log(out.strip())
        if code != 0:
            log("Remote archive corrupt - abort extract")
            return 1

        if skip_images:
            extract = f"""
set -e
mkdir -p '{DOCROOT}'
find '{DOCROOT}' -mindepth 1 -maxdepth 1 ! -name images -exec rm -rf {{}} +
tar -xzf '{REMOTE_TAR}' -C '{DOCROOT}'
rm -f '{REMOTE_TAR}'
test -d '{DOCROOT}/images' && echo IMAGES_OK || echo IMAGES_MISSING
ls -la '{DOCROOT}' | head -15
du -sh '{DOCROOT}'
test -f '{DOCROOT}/index.html' && echo INDEX_OK
"""
        else:
            extract = f"""
set -e
mkdir -p '{DOCROOT}'
find '{DOCROOT}' -mindepth 1 -maxdepth 1 -exec rm -rf {{}} +
tar -xzf '{REMOTE_TAR}' -C '{DOCROOT}'
rm -f '{REMOTE_TAR}'
ls -la '{DOCROOT}' | head -15
du -sh '{DOCROOT}'
test -f '{DOCROOT}/index.html' && echo INDEX_OK
"""
        code, out = run(client, extract, timeout=600)
        log(out.strip())
        if code != 0 or "INDEX_OK" not in out:
            log("Extract failed")
            return 1
        if skip_images and "IMAGES_MISSING" in out:
            log("WARN: images/ missing on server — run: npm run publish:full")
        log("DONE -> https://dompola.com" + (" [code-only]" if skip_images else " [full]"))
        try:
            tar_path.unlink(missing_ok=True)
        except OSError:
            pass
    finally:
        try:
            client.close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
