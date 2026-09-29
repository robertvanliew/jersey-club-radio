import { describe, it, expect } from 'vitest';
import { validateSubmission, validateSubscribe, validateContact, escapeHtml, SUBMISSION_STATUSES } from './growth_validate';

const good = { name: 'DJ Test', email: 'Dj@Example.com ', soundcloudUrl: 'https://soundcloud.com/dj-test/new-flip', note: 'Jersey club flip' };

describe('validateSubmission', () => {
  it('accepts and normalises a good submission', () => {
    const r = validateSubmission(good);
    expect(r).toEqual({ ok: true, value: { name: 'DJ Test', email: 'dj@example.com', soundcloudUrl: 'https://soundcloud.com/dj-test/new-flip', note: 'Jersey club flip' } });
  });
  it('accepts on.soundcloud.com and m.soundcloud.com links', () => {
    expect(validateSubmission({ ...good, soundcloudUrl: 'https://on.soundcloud.com/AbC123' }).ok).toBe(true);
    expect(validateSubmission({ ...good, soundcloudUrl: 'https://m.soundcloud.com/a/b' }).ok).toBe(true);
  });
  it.each([
    ['non-SoundCloud link', { soundcloudUrl: 'https://evil.com/soundcloud.com/x' }],
    ['plain http', { soundcloudUrl: 'http://soundcloud.com/a/b' }],
    ['look-alike host', { soundcloudUrl: 'https://soundcloud.com.evil.com/a' }],
    ['bad email', { email: 'not-an-email' }],
    ['missing name', { name: '   ' }],
    ['huge note', { note: 'x'.repeat(1001) }],
  ])('rejects %s', (_, patch) => expect(validateSubmission({ ...good, ...patch }).ok).toBe(false));
  it('treats a filled honeypot as spam', () => {
    expect(validateSubmission({ ...good, website: 'http://spam' })).toEqual({ ok: false, spam: true, error: 'spam' });
  });
  it('rejects non-objects', () => expect(validateSubmission(null).ok).toBe(false));
});

describe('validateSubscribe', () => {
  it('normalises the email', () => expect(validateSubscribe({ email: ' Fan@Mail.COM' })).toEqual({ ok: true, value: { email: 'fan@mail.com' } }));
  it('rejects a bad email and honeypot', () => {
    expect(validateSubscribe({ email: 'nope' }).ok).toBe(false);
    expect(validateSubscribe({ email: 'a@b.co', website: 'x' })).toMatchObject({ ok: false, spam: true });
  });
});

it('statuses', () => expect(SUBMISSION_STATUSES).toEqual(['new', 'reviewed', 'accepted', 'rejected']));

describe('validateContact', () => {
  const ok = { name: 'Brand Co', email: 'Ads@Brand.com', topic: 'advertising', message: 'We want to sponsor Rising Now.' };
  it('accepts and normalises', () => {
    expect(validateContact(ok)).toEqual({ ok: true, value: { name: 'Brand Co', email: 'ads@brand.com', topic: 'advertising', message: 'We want to sponsor Rising Now.' } });
  });
  it('defaults an unknown topic to general', () => {
    expect(validateContact({ ...ok, topic: 'hax' })).toMatchObject({ ok: true, value: { topic: 'general' } });
  });
  it.each([
    ['empty message', { message: '  ' }],
    ['huge message', { message: 'x'.repeat(5001) }],
    ['bad email', { email: 'x' }],
    ['missing name', { name: '' }],
  ])('rejects %s', (_, patch) => expect(validateContact({ ...ok, ...patch }).ok).toBe(false));
  it('honeypot', () => expect(validateContact({ ...ok, website: 'x' })).toMatchObject({ ok: false, spam: true }));
});

describe('escapeHtml', () => {
  it('neutralises markup from visitors before it goes into an email', () => {
    expect(escapeHtml('<b>"hi"</b> & \'x\'')).toBe('&lt;b&gt;&quot;hi&quot;&lt;/b&gt; &amp; &#39;x&#39;');
  });
});
