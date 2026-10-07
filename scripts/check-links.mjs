/**
 * Crawls the public pages of a running Prime 60 and reports broken links,
 * images and assets. Signed-in routes are expected to redirect to /sign-in.
 *
 *   node scripts/check-links.mjs http://localhost:3100
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const start = ["/", "/letter", "/scorecard", "/sign-in", "/sign-up", "/install", "/privacy", "/terms", "/magic-link", "/reset-password"];
const appPrefixes = ["/today", "/progress", "/plan", "/vision", "/more", "/welcome", "/update-password"];

const seen = new Map();
const queue = [...start];

function absolute(href, from) {
  try {
    return new URL(href, from).toString();
  } catch {
    return null;
  }
}

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  const url = base + path;
  let res;
  try {
    res = await fetch(url, { redirect: "manual" });
  } catch (e) {
    seen.set(path, { status: "ERR " + e.message });
    continue;
  }
  const isApp = appPrefixes.some((p) => path === p || path.startsWith(p + "/"));
  const location = res.headers.get("location") ?? "";
  const ok = res.status === 200 || (isApp && res.status === 307 && location.includes("/sign-in"));
  seen.set(path, { status: res.status + (location ? " -> " + location : ""), ok });
  if (res.status !== 200 || !(res.headers.get("content-type") ?? "").includes("text/html")) continue;

  const html = await res.text();
  for (const m of html.matchAll(/\b(?:href|src)="([^"#]+)"/g)) {
    const abs = absolute(m[1], url);
    if (!abs || !abs.startsWith(base)) continue;
    const next = abs.slice(base.length).split("?")[0] || "/";
    if (next.startsWith("/_next/") || next.startsWith("/auth/")) continue;
    if (!seen.has(next) && !queue.includes(next)) queue.push(next);
  }
}

let broken = 0;
for (const [path, info] of [...seen.entries()].sort()) {
  const flag = info.ok ? "ok    " : "BROKEN";
  if (!info.ok) broken++;
  console.log(flag, path, info.status);
}
console.log(`\n${seen.size} URLs checked, ${broken} broken.`);
process.exit(broken ? 1 : 0);
