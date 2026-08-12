// Build-time flags read from Vercel project env vars — lets the same
// codebase/commit produce a reduced-feature deployment (a separate Vercel
// project pointed at this repo) alongside the full-featured production one,
// without forking the code or branching.
export const LITE_MODE = import.meta.env.VITE_LITE_MODE === "1";
