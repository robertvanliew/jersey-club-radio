// Text cleanup for Rising Now chart entries, shared by scripts/draft-chart.mjs and
// one-off fixes of older weeks.

// Fancy Unicode lettering ("𝚂𝚕𝚘𝚠𝚎𝚍") → plain letters, so filters and titles see real text
export const plain = s => String(s ?? '').normalize('NFKC');

/** Chart title: no hashtags, @handles, "prod." credits, emoji or [TAG] blocks; tidy spacing */
export const cleanTitle = raw => {
  const t = plain(raw)
    .replace(/\[[^\]]*\]/g, ' ')                                   // [JERSEY CLUB + TRAP] [DROP]
    .replace(/\(\s*(?:prod(?:uced)?|p)\.?\s*(?:by\b)?[^)]*\)/gi, ' ') // "(prod. Judah Jay)", "(p.ZBEE)"
    .replace(/\b(?:prod(?:uced)?\.?\s*(?:by\b)?|p\.)\s*[:\-]?\s*@?[\w$.]+/gi, ' ') // bare "prod. X", "p.ZBEE"
    .replace(/#[\w.]+/g, ' ')
    .replace(/@[\w.]*/g, ' ')
    .replace(/(^|\s)x(?=\s*(?:[-–—]|$))/gi, ' ')                 // "@a x @b - Song" leaves a stray "x"
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}☆*:.｡。]+(?=\s|$)/gu, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\s+([),])/g, '$1')
    .replace(/[\s\-–—|:,]+$/g, '')
    .replace(/^[\s\-–—|:,]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return t.length >= 3 ? t : plain(raw).trim();
};
