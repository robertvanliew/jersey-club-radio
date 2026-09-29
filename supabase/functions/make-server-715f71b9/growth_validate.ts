// Validation for public growth endpoints: track submissions and weekly-chart email signups.
// Shared by index.ts (Deno) and unit tests (Vitest). `website` is a honeypot field that
// real visitors never see; bots that fill it are dropped silently.

export const SUBMISSION_STATUSES = ['new', 'reviewed', 'accepted', 'rejected'] as const;

type Result<T> = { ok: true; value: T } | { ok: false; error: string; spam?: boolean };

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const SC_HOSTS = new Set(['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com', 'on.soundcloud.com']);

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function isSoundCloudUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && SC_HOSTS.has(url.hostname.toLowerCase()) && url.pathname.length > 1;
  } catch { return false; }
}

export function validateSubmission(body: unknown): Result<{ name: string; email: string; soundcloudUrl: string; note: string }> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request' };
  const b = body as Record<string, unknown>;
  if (str(b.website)) return { ok: false, spam: true, error: 'spam' };
  const name = str(b.name);
  const email = str(b.email).toLowerCase();
  const soundcloudUrl = str(b.soundcloudUrl);
  const note = str(b.note);
  if (!name || name.length > 80) return { ok: false, error: 'Please enter your artist name' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email' };
  if (!isSoundCloudUrl(soundcloudUrl)) return { ok: false, error: 'Please paste a SoundCloud track link (https://soundcloud.com/…)' };
  if (note.length > 1000) return { ok: false, error: 'Note is too long (1000 characters max)' };
  return { ok: true, value: { name, email, soundcloudUrl, note } };
}

export const CONTACT_TOPICS = ['booking', 'advertising', 'press', 'general'] as const;
export type ContactTopic = typeof CONTACT_TOPICS[number];

export function validateContact(body: unknown): Result<{ name: string; email: string; topic: ContactTopic; message: string }> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request' };
  const b = body as Record<string, unknown>;
  if (str(b.website)) return { ok: false, spam: true, error: 'spam' };
  const name = str(b.name);
  const email = str(b.email).toLowerCase();
  const message = str(b.message);
  const topic = (CONTACT_TOPICS as readonly string[]).includes(str(b.topic)) ? str(b.topic) as ContactTopic : 'general';
  if (!name || name.length > 80) return { ok: false, error: 'Please enter your name' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email' };
  if (!message) return { ok: false, error: 'Please enter a message' };
  if (message.length > 5000) return { ok: false, error: 'Message is too long (5000 characters max)' };
  return { ok: true, value: { name, email, topic, message } };
}

/** Escape visitor-provided text before putting it into an HTML email */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function validateSubscribe(body: unknown): Result<{ email: string }> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request' };
  const b = body as Record<string, unknown>;
  if (str(b.website)) return { ok: false, spam: true, error: 'spam' };
  const email = str(b.email).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email' };
  return { ok: true, value: { email } };
}
