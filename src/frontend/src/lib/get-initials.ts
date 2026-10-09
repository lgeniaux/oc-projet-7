/**
 * Build avatar initials from a real user.
 * @param user - A user with an optional name and an e-mail.
 * @returns The first letters of the first and last name words, or of the e-mail.
 */
export function getInitials(user: { name?: string | null; email: string }) {
  const words = user.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return user.email.charAt(0).toUpperCase();
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}
