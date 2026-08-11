export async function verifyTurnstile(
  token: string | undefined,
  secret: string | undefined,
  ip?: string | null
): Promise<{ ok: boolean; reason?: string }> {
  if (!secret) return { ok: true }; // optional when not configured
  if (!token) return { ok: false, reason: 'missing_turnstile' };
  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body
    });
    const data = (await res.json()) as { success?: boolean };
    if (!data.success) return { ok: false, reason: 'turnstile_failed' };
    return { ok: true };
  } catch (err) {
    console.error('Turnstile verify error', err);
    // Fail closed when Turnstile is configured but unreachable
    return { ok: false, reason: 'turnstile_unavailable' };
  }
}
