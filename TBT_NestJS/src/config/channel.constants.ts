export const CHANNEL_SCOPE_PRIVATE = 'private';
export const CHANNEL_SCOPE_PUBLIC = 'public';
export const CHANNEL_SCOPE_PRESENCE = 'presence';
export const DEFAULT_ORG_ID = 'unknown';

// Pusher channel names allow alphanumeric, hyphens and underscores — avoid colons.
export function perTicketChannel(ticketId: number | string) {
  return `${CHANNEL_SCOPE_PRIVATE}-ticket-${ticketId}`;
}

export function userChannel(userId: string | number) {
  return `${CHANNEL_SCOPE_PRIVATE}-user-${userId}`;
}

export function orgTicketsChannel() {
  return `${CHANNEL_SCOPE_PRIVATE}-tickets`;
}

export function publicTicketsChannel() {
  return `${CHANNEL_SCOPE_PUBLIC}-tickets`;
}

export function presenceAgentsChannel() {
  return `${CHANNEL_SCOPE_PRESENCE}-agents`;
}
