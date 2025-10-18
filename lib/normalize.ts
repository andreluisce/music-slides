export const normalizeText = (s: string) =>
  s.toLowerCase()
   .normalize('NFD')
   .replace(/\p{Diacritic}/gu, '')
   .replace(/[^a-z0-9]+/g, ' ')
   .trim();

export const tokenize = (s: string) =>
  normalizeText(s).split(/\s+/).filter(Boolean);

export const fuzzyMatch = (query: string, target: string) => {
  const qTokens = tokenize(query);
  const tTokens = tokenize(target);
  const matches = qTokens.filter(t => tTokens.includes(t));
  return matches.length >= Math.min(2, qTokens.length);
};
