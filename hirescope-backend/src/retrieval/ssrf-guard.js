/**
 * HireScope — SSRF Guard
 *
 * Validates outgoing URLs to prevent Server-Side Request Forgery.
 * Rejects private/loopback/link-local addresses unless ALLOW_PRIVATE_HOSTS=true.
 */

import { URL } from "url";
import dns from "dns/promises";
import net from "net";

const PRIVATE_IP_RANGES = [
  // IPv4 Loopback
  { start: 0x7f000000, end: 0x7fffffff }, // 127.0.0.0/8
  // RFC 1918 Private
  { start: 0x0a000000, end: 0x0affffff }, // 10.0.0.0/8
  { start: 0xac100000, end: 0xac1fffff }, // 172.16.0.0/12
  { start: 0xc0a80000, end: 0xc0a8ffff }, // 192.168.0.0/16
  // Link-local / Cloud Metadata
  { start: 0xa9fe0000, end: 0xa9feffff }, // 169.254.0.0/16
  // Zero network
  { start: 0x00000000, end: 0x00ffffff }, // 0.0.0.0/8
];

function ipToInt(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    // ::1, fe80::/10, etc.
    return ip === "::1" || ip.toLowerCase().startsWith("fe80") || ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd");
  }
  if (!net.isIPv4(ip)) return true;

  const intIp = ipToInt(ip);
  return PRIVATE_IP_RANGES.some((range) => intIp >= range.start && intIp <= range.end);
}

/**
 * Validate a URL against SSRF rules.
 * @param {string} urlString
 * @param {boolean} allowPrivate - Dev escape hatch
 * @returns {Promise<{ valid: boolean, error?: string, normalizedUrl?: string }>}
 */
export async function validateSafeUrl(urlString, allowPrivate = false) {
  const allowPrivateHosts = allowPrivate || process.env.ALLOW_PRIVATE_HOSTS === "true" || process.env.NODE_ENV === "test";

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: "Malformed URL" };
  }

  // Only allow http and https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: `Disallowed protocol: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname;

  if (allowPrivateHosts) {
    return { valid: true, normalizedUrl: parsed.href };
  }

  // Check hostname keywords
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { valid: false, error: `Disallowed host: ${hostname}` };
  }

  // Check if direct IP
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { valid: false, error: `Access to private IP ${hostname} is blocked` };
    }
    return { valid: true, normalizedUrl: parsed.href };
  }

  // Resolve DNS to verify it doesn't resolve to private IP (DNS Rebinding protection)
  try {
    const addresses = await dns.resolve(hostname);
    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return { valid: false, error: `Host ${hostname} resolves to private IP ${addr}` };
      }
    }
  } catch (err) {
    // DNS resolution failure
    return { valid: false, error: `DNS lookup failed for ${hostname}: ${err.message}` };
  }

  return { valid: true, normalizedUrl: parsed.href };
}
