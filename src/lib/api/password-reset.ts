import { API_BASE } from "@/lib/api/config";

/**
 * Password reset calls. They are public by design (the person is signed out), so they are plain POSTs with no
 * session, no refresh and no cookies. The backend owns every rule; this only carries the request and maps
 * the outcome to something safe to show. Server-only: used from server actions and server components.
 */
const AUDIENCE = "psychologist";

export type ResetOutcome = { ok: true } | { ok: false; reason: "invalid" | "rate_limited" | "validation" | "unavailable"; message: string };

const MESSAGES = {
  invalid: "This reset link is invalid or has expired. Request a new one.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
  unavailable: "We could not reach the server. Please try again in a moment.",
} as const;

async function post(path: string, body: Record<string, string>): Promise<ResetOutcome> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/v1/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, audience: AUDIENCE }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, reason: "unavailable", message: MESSAGES.unavailable };
  }
  if (response.ok) return { ok: true };
  if (response.status === 429) return { ok: false, reason: "rate_limited", message: MESSAGES.rate_limited };
  if (response.status === 400) {
    // The backend's 400 texts are deliberate and safe (invalid link, passwords do not match, too short).
    const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const text = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
    const invalidLink = !text || /invalid or has expired/i.test(text);
    return invalidLink ? { ok: false, reason: "invalid", message: MESSAGES.invalid } : { ok: false, reason: "validation", message: text };
  }
  return { ok: false, reason: "unavailable", message: MESSAGES.unavailable };
}

export const passwordResetApi = {
  forgot: (email: string) => post("forgot-password", { email }),
  verify: (token: string) => post("verify-reset-token", { token }),
  reset: (token: string, password: string, confirmPassword: string) => post("reset-password", { token, password, confirmPassword }),
};
