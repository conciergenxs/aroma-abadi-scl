# Aroma Abadi SCL — Engineering Notes

## Three sites, one branch — the difference is an env var, not a branch

All three projects build from `main`. What makes them different is a single
build-time flag set on the Vercel project itself, read by
`src/lib/feature-flags.ts`:

| Site | Flag on the project | Result |
| --- | --- | --- |
| aroma-abadi-scl | *(none)* | full workspace |
| aroma-abadi-scl-lite | `VITE_LITE_MODE=1` | reduced features |
| aroma-abadi-company | `VITE_PUBLIC_SITE=1` | public company page |

There is no "lite branch" and no "company branch". A `lite` branch exists in
history and is kept level with `main`, but nothing deploys from it — the live
lite site is a CLI upload of `main` (`source: cli`, `gitRepo: null`).

This has already cost a developer a day: they pulled `lite`, got code ten days
stale and missing the legal pages, and reported the site "didn't match". If
someone needs to reproduce a variant locally, they pull `main` and set the
flag in `.env.local` — see `.env.example`. Point people at the flag, not at a
branch.

## Deployment

**One repo, three sites — and pushing deploys none of them.**

This repo feeds three separate Vercel projects in team `nxs-concierge`, all
from `main`:

| Site | Project | Project ID |
| --- | --- | --- |
| https://aroma-abadi-scl.vercel.app | `aroma-abadi-scl` | `prj_vHPf3WsIB4mUZ2s5Nwai2VhcHYLs` |
| https://aroma-abadi-scl-lite.vercel.app | `aroma-abadi-scl-lite` | `prj_Jn7B6g46ruiXCCl96oLUBAc3jTNU` |
| https://aroma-abadi-company.vercel.app | `aroma-abadi-company` | `prj_0lAIx5PFBEAB96uNRXyrpytGvUiK` |

Until 2026-11-03 every push built all three, so one commit cost three
deployments. With `autodeploy.sh` pushing up to once every five minutes that
is 36 deployments an hour against a 100-a-day plan — the cap was reachable
in under three hours of editing, and two of the three builds were usually
for a site nobody had touched.

`vercel.json` now sets `git.deploymentEnabled: false`, so no push on any
branch creates a deployment. `autodeploy.sh` still commits and pushes: that
is a backup and a sync, not a release.

Put one site live, and only that one:

```
# the main SCL app
VERCEL_ORG_ID=team_lH24RLcMGfB9xafDppcRbDHg \
VERCEL_PROJECT_ID=prj_vHPf3WsIB4mUZ2s5Nwai2VhcHYLs \
npx vercel --prod --yes

# lite
VERCEL_ORG_ID=team_lH24RLcMGfB9xafDppcRbDHg \
VERCEL_PROJECT_ID=prj_Jn7B6g46ruiXCCl96oLUBAc3jTNU \
npx vercel --prod --yes

# company
VERCEL_ORG_ID=team_lH24RLcMGfB9xafDppcRbDHg \
VERCEL_PROJECT_ID=prj_0lAIx5PFBEAB96uNRXyrpytGvUiK \
npx vercel --prod --yes
```

One command, one build, one deployment off the quota. Deploy only the site
the owner asked for, only when they ask — and never re-enable git
deployments to "make it easier".

- Vercel deploys use `vercel.json` at the project root: it runs `NITRO_PRESET=vercel vite build` so nitro emits the Vercel Build Output API (`.vercel/output`). Keep this; a plain `vite build` targets Cloudflare (Lovable's default) and cannot be served by Vercel.
- Framework packages are pinned to exact versions (`@tanstack/react-start` 1.168.60, `@tanstack/react-router` 1.170.41, `@tanstack/router-plugin` 1.168.42); react-start 1.169.x breaks the production build with "Could not resolve entry module index.html". Do not float `@tanstack/react-start` above 1.168.x without re-verifying both the sandbox build and `NITRO_PRESET=vercel vite build`.
