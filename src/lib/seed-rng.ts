/** A deterministic 32-bit PRNG (mulberry32).
 *
 * Seed data is generated on the server and again in the browser, and the two
 * have to come out byte-identical or hydration tears — so nothing that builds
 * it may reach for Math.random(). Same seed in, same sequence out, on both
 * sides and on every reload. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
