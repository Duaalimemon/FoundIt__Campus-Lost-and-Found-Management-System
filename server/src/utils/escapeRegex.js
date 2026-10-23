// Escapes special regular expression characters to prevent ReDoS and injection (Section 5.9, 8.1)
export const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
