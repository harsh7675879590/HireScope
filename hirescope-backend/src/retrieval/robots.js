/**
 * HireScope — Robots.txt Checker
 *
 * Lightweight per-host robots.txt cache and path disallow checker.
 */

const robotsCache = new Map();

/**
 * Check if a path on target host is allowed according to robots.txt.
 * Fails open if robots.txt cannot be fetched or parsed.
 *
 * @param {string} urlString
 * @returns {Promise<boolean>} true if allowed, false if explicitly disallowed
 */
export async function isRobotsAllowed(urlString) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.origin;

    if (robotsCache.has(host)) {
      const disallowedPaths = robotsCache.get(host);
      return !disallowedPaths.some((p) => parsed.pathname.startsWith(p));
    }

    const robotsUrl = `${host}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "HireScopeBot/1.0" }
    }).catch(() => null);

    clearTimeout(timeout);

    if (!res || !res.ok) {
      robotsCache.set(host, []);
      return true;
    }

    const text = await res.text();
    const lines = text.split("\n");
    let appliesToAll = false;
    const disallowed = [];

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#")) continue;

      if (/^User-agent:\s*\*/i.test(line)) {
        appliesToAll = true;
      } else if (/^User-agent:/i.test(line)) {
        appliesToAll = false;
      } else if (appliesToAll && /^Disallow:\s*/i.test(line)) {
        const path = line.replace(/^Disallow:\s*/i, "").trim();
        if (path) disallowed.push(path);
      }
    }

    robotsCache.set(host, disallowed);
    return !disallowed.some((p) => parsed.pathname.startsWith(p));
  } catch {
    return true; // Fail open
  }
}
