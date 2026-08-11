import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseApiKeys, requireApiKey, tenantIdFromKey, extractBearerToken } from '../src/lib/auth.ts';

describe('auth', () => {
  it('parses comma-separated and JSON API keys', () => {
    assert.equal(parseApiKeys('a,b c').has('a'), true);
    assert.equal(parseApiKeys('a,b c').has('b'), true);
    assert.equal(parseApiKeys('{"prod":"k1"}').has('k1'), true);
  });

  it('rejects open access when no keys configured', async () => {
    const req = new Request('https://api.example/v1/spam/score');
    const env = { GECKODUPE_SPAM: { get: async () => null } };
    const r = await requireApiKey(req, env);
    assert.equal(r.ok, false);
  });

  it('allows open access only when ALLOW_OPEN_API is set', async () => {
    const req = new Request('https://api.example/v1/spam/score');
    const env = { GECKODUPE_SPAM: { get: async () => null }, ALLOW_OPEN_API: '1' };
    const r = await requireApiKey(req, env);
    assert.equal(r.ok, true);
    if (r.ok) assert.ok(r.tenant.startsWith('t'));
  });

  it('rejects missing bearer when keys are set', async () => {
    const req = new Request('https://api.example/v1/spam/score');
    const env = {
      API_KEYS: 'secret-key',
      GECKODUPE_SPAM: { get: async () => null }
    };
    const r = await requireApiKey(req, env);
    assert.equal(r.ok, false);
  });

  it('accepts valid bearer and stable tenant', async () => {
    const req = new Request('https://api.example/v1/spam/score', {
      headers: { Authorization: 'Bearer secret-key' }
    });
    const env = {
      API_KEYS: 'secret-key',
      GECKODUPE_SPAM: { get: async () => null }
    };
    const r = await requireApiKey(req, env);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.tenant, tenantIdFromKey('secret-key'));
      assert.equal(r.via, 'static');
      assert.equal(extractBearerToken(req), 'secret-key');
    }
  });
});

describe('client spam opts', () => {
  it('ignores attempts to disable detectors or inject fingerprints', async () => {
    const { sanitizeClientSpamOpts, spamDefaultOpts } = await import('../src/lib/spam-engine.ts');
    const clamped = sanitizeClientSpamOpts({
      detectBait: false,
      detectUrlFlood: false,
      blockScore: 0.01,
      recentFingerprints: [{ fingerprint: 'x' }],
      mode: 'list',
      maxUrls: 99
    });
    assert.equal((clamped as any).detectBait, undefined);
    assert.equal((clamped as any).recentFingerprints, undefined);
    const o = spamDefaultOpts(clamped);
    assert.equal(o.detectBait, true);
    assert.equal(o.detectUrlFlood, true);
    assert.equal(o.mode, 'list');
    assert.equal(o.blockScore >= 0.5, true);
    assert.equal(o.maxUrls, 20);
    assert.deepEqual(o.recentFingerprints, []);
  });
});

describe('service quota plan', () => {
  it('maps static keys to service plan limits', async () => {
    const { PLANS } = await import('../src/lib/plans.ts');
    assert.ok(PLANS.service.limits.apiRequestsPerDay > 0);
    assert.equal(PLANS.guest.limits.apiRequestsPerDay, 0);
  });
});
