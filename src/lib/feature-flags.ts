// Build-time flags read from Vercel project env vars — lets the same
// codebase/commit produce a reduced-feature deployment (a separate Vercel
// project pointed at this repo) alongside the full-featured production one,
// without forking the code or branching.
export const LITE_MODE = import.meta.env.VITE_LITE_MODE === "1";

/** The public-site deployment: a second Vercel project pointed at this same
 * repo, with VITE_PUBLIC_SITE=1 set on it. There, "/" is the company page
 * rather than the workspace, so the public domain never opens on a login
 * screen. The workspace project leaves the flag unset and is untouched. */
export const PUBLIC_SITE = import.meta.env.VITE_PUBLIC_SITE === "1";
