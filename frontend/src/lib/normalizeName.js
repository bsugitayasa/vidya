/**
 * Normalize a name to Title Case with intelligent handling of:
 * - Balinese/Hindu honorifics (IB, IA, AA, GD) → UPPERCASE
 * - Title prefixes (Prof., Dr., Drs., Ir.) → Title Case
 * - Academic degree abbreviations (S.E., M.M., Ph.D) → UPPERCASE
 * - Comma-attached degrees (S.E., M.M.) → preserve dots and commas
 * - Single-letter words/initials → UPPERCASE
 */

const UPPER_HONORIFICS = ['IB', 'IA', 'AA', 'GD', 'ANAK', 'AGUNG', 'GUSTI'];

const TITLE_CASE_PREFIXES = ['PROF', 'DR', 'DRS', 'IR', 'HJ', 'KH'];

const DEGREE_PATTERNS = [
  'S.PD', 'S.AG', 'S.KOM', 'S.T', 'S.E', 'S.H', 'S.SI', 'S.SOS', 'S.KED', 'S.IP',
  'S.HUM', 'S.PSI', 'S.KM', 'S.FARM', 'S.PD.I', 'S.PD.H', 'S.FIL', 'S.SN', 'S.DS',
  'S.KEP', 'S.IKOM', 'S.AK', 'S.AP', 'S.TP', 'S.TH', 'S.PI',
  'M.PD', 'M.AG', 'M.KOM', 'M.T', 'M.E', 'M.H', 'M.SI', 'M.M', 'M.SC',
  'M.HUM', 'M.PSI', 'M.KES', 'M.FARM', 'M.SN', 'M.A', 'M.AK', 'M.AP',
  'M.IKOM', 'M.FIL', 'M.TH', 'M.BA', 'MBA', 'M.DIV',
  'PH.D', 'PHD',
  'A.MD', 'A.MK', 'A.MA',
  'S.SOS.I', 'LC', 'B.A', 'B.SC', 'B.ED',
];

function isDegreeAbbreviation(word) {
  const cleaned = word.replace(/,+$/, '').toUpperCase();
  const withoutTrailingDot = cleaned.replace(/\.+$/, '');
  if (DEGREE_PATTERNS.includes(withoutTrailingDot) || DEGREE_PATTERNS.includes(cleaned)) {
    return true;
  }
  if (/^[A-Za-z]+(\.[A-Za-z]+)+\.?$/.test(cleaned)) {
    return true;
  }
  return false;
}

function getTitleCase(word) {
  const cleaned = word.replace(/[.,]+$/, '').toUpperCase();
  if (TITLE_CASE_PREFIXES.includes(cleaned)) {
    const suffix = word.slice(word.replace(/[.,]+$/, '').length);
    return cleaned.charAt(0) + cleaned.slice(1).toLowerCase() + suffix.toLowerCase();
  }
  return null;
}

export function normalizeName(name) {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      const firstAlphaIdx = word.search(/[a-zA-Z]/);
      if (firstAlphaIdx === -1) return word.toUpperCase();

      const prefix = word.slice(0, firstAlphaIdx);
      const mainPart = word.slice(firstAlphaIdx);
      const upperMain = mainPart.toUpperCase();
      const strippedUpper = upperMain.replace(/[.,]+$/, '');

      if (UPPER_HONORIFICS.includes(strippedUpper)) {
        return prefix + upperMain;
      }
      const titleCased = getTitleCase(mainPart);
      if (titleCased !== null) {
        return prefix + titleCased;
      }
      if (isDegreeAbbreviation(mainPart)) {
        return prefix + mainPart.toUpperCase();
      }
      if (mainPart.length <= 1) return prefix + upperMain;
      return prefix + mainPart.charAt(0).toUpperCase() + mainPart.slice(1).toLowerCase();
    })
    .join(' ');
}
