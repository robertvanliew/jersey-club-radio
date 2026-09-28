// Payment links (Stripe). Leave empty to hide the related buttons.
//
// Fast-Track Review: create a product + Payment Link in the Stripe dashboard
// (Products → + Add product → "Fast-Track Review"; then Payment Links → New) and paste
// the link here. After a producer submits, we send them to it with
// ?client_reference_id=<submission id> so you can match the payment to the submission
// in Stripe (Payments → the payment → "Client reference ID").
export const STRIPE_FAST_TRACK_URL = '';

// What the fast-track button promises. Keep it about review + feedback, never chart placement.
export const FAST_TRACK_LABEL = 'Fast-track: guaranteed listen + feedback within 48 hours';
