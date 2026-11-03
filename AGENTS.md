# Aroma Abadi SCL — Engineering Notes

## Deployment
- Vercel deploys use `vercel.json` at the project root: it runs `NITRO_PRESET=vercel vite build` so nitro emits the Vercel Build Output API (`.vercel/output`). Keep this; a plain `vite build` targets Cloudflare (Lovable's default) and cannot be served by Vercel.
- Framework packages are pinned to exact versions (`@tanstack/react-start` 1.168.60, `@tanstack/react-router` 1.170.41, `@tanstack/router-plugin` 1.168.42); react-start 1.169.x breaks the production build with "Could not resolve entry module index.html". Do not float `@tanstack/react-start` above 1.168.x without re-verifying both the sandbox build and `NITRO_PRESET=vercel vite build`.
