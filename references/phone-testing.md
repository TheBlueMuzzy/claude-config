# Phone Testing (Vite Projects)

**Primary — Local HTTPS:** `npx vite --host` exposes on LAN. Phone connects via `https://<PC-IP>:<port>/`.

**Backup — Cloudflare Tunnel:** Use when phone won't accept the self-signed cert (common). Gives a real HTTPS URL that works everywhere — required for DeviceMotion/accelerometer.
```bash
"/c/Program Files (x86)/cloudflared/cloudflared.exe" tunnel --url https://localhost:<port> --no-tls-verify
```
Prints a `https://random-words.trycloudflare.com` URL. Open on phone. URL changes each restart. Run AFTER Vite is up — match the port Vite is using.
