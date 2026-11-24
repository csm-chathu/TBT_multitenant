import { User } from '@/redux/user/userTypes';

/**
 * Extracts a display name from a user object.
 * Priority: name > first_name + last_name > first_name > username > email prefix > "User"
 */
export const getDisplayName = (user: User | null | undefined): string => {
  if (!user) return "User"

  const {
    name,
    first_name,
    last_name,
    email,
    username,
  } = user

  if (name) return name
  if (first_name && last_name) return `${first_name} ${last_name}`
  if (first_name) return first_name
  if (username) return username
  if (email) return email.split("@")[0]

  return "User"
}

/**
 * Gets the display email from a user object
 */
export const getDisplayEmail = (user: User | null | undefined): string => {
  if (!user) return ""
  return user.email || user.username || ""
}

/**
 * Gets the full name from a user object (name or first_name + last_name)
 */
export const getFullName = (user: User | null | undefined): string => {
  if (!user) return ""
  if (user.name) return user.name
  const parts = [user.first_name, user.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : ""
}


/**
 * Checks if a user is a restricted Ticket Tracker agent (e.g. Darrel or Janet)
 * who should ONLY see the ticket tracking page and search interface.
 */
export const isTicketTrackerUser = (user: any): boolean => {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  if (email === 'darryl@renewhealthcs.com' || email === 'janet@renewhealthcs.com' || email === 'darrel@mditbt.com' || email === 'janet@mditbt.com') return true;
  const roles = user.roles || [];
  return roles.some((r: any) => {
    const name = (r?.name || '').toLowerCase();
    const label = (r?.label || '').toLowerCase();
    return name.includes('ticket tracker') || label.includes('ticket_tracker');
  });
};
