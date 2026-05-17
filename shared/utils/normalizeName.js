/**
 * Normalize a name to Title Case with intelligent handling of:
 * - Balinese/Hindu honorifics (IB, IA, AA, GD) → UPPERCASE
 * - Title prefixes (Prof., Dr., Drs., Ir.) → Title Case
 * - Academic degree abbreviations (S.E., M.M., Ph.D) → UPPERCASE
 * - Comma-attached degrees (S.E., M.M.) → preserve dots and commas
 * - Single-letter words/initials → UPPERCASE
 */

// Balinese/Hindu honorifics that must stay UPPERCASE
const UPPER_HONORIFICS = ['IB', 'IA', 'AA', 'GD', 'ANAK', 'AGUNG', 'GUSTI'];

// Title prefixes → Title Case (Prof., Dr., Drs., Ir., Hj.)
const TITLE_CASE_PREFIXES = ['PROF', 'DR', 'DRS', 'IR', 'HJ', 'KH'];

// Academic degree abbreviations → UPPERCASE
const DEGREE_PATTERNS = [
  // Sarjana
  'S.PD', 'S.AG', 'S.KOM', 'S.T', 'S.E', 'S.H', 'S.SI', 'S.SOS', 'S.KED', 'S.IP',
  'S.HUM', 'S.PSI', 'S.KM', 'S.FARM', 'S.PD.I', 'S.PD.H', 'S.FIL', 'S.SN', 'S.DS',
  'S.KEP', 'S.IKOM', 'S.AK', 'S.AP', 'S.TP', 'S.TH', 'S.PI',
  // Magister
  'M.PD', 'M.AG', 'M.KOM', 'M.T', 'M.E', 'M.H', 'M.SI', 'M.M', 'M.SC',
  'M.HUM', 'M.PSI', 'M.KES', 'M.FARM', 'M.SN', 'M.A', 'M.AK', 'M.AP',
  'M.IKOM', 'M.FIL', 'M.TH', 'M.BA', 'MBA', 'M.DIV',
  // Doktor
  'PH.D', 'PHD',
  // Diploma
  'A.MD', 'A.MK', 'A.MA',
  // Lainnya
  'S.SOS.I', 'LC', 'B.A', 'B.SC', 'B.ED',
];

/**
 * Check if a word looks like a dot-separated academic degree abbreviation.
 */
function isDegreeAbbreviation(word) {
  const cleaned = word.replace(/,+$/, '').toUpperCase();
  const withoutTrailingDot = cleaned.replace(/\.+$/, '');

  if (DEGREE_PATTERNS.includes(withoutTrailingDot) || DEGREE_PATTERNS.includes(cleaned)) {
    return true;
  }

  // Heuristic: letter(s).letter(s) pattern e.g. S.E. or M.Pd
  if (/^[A-Za-z]+(\.[A-Za-z]+)+\.?$/.test(cleaned)) {
    return true;
  }

  return false;
}

/**
 * Check if a word is a title prefix (Prof, Dr, Drs, Ir).
 * Returns the properly cased version or null.
 */
function getTitleCase(word) {
  const cleaned = word.replace(/[.,]+$/, '').toUpperCase();
  if (TITLE_CASE_PREFIXES.includes(cleaned)) {
    // Preserve trailing punctuation (dot, comma)
    const suffix = word.slice(word.replace(/[.,]+$/, '').length);
    return cleaned.charAt(0) + cleaned.slice(1).toLowerCase() + suffix.toLowerCase();
  }
  return null;
}

function normalizeName(name) {
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

      // 1. Check Balinese/Hindu honorifics → UPPERCASE
      if (UPPER_HONORIFICS.includes(strippedUpper)) {
        return prefix + upperMain;
      }

      // 2. Check title prefixes (Prof., Dr., Drs., Ir.) → Title Case
      const titleCased = getTitleCase(mainPart);
      if (titleCased !== null) {
        return prefix + titleCased;
      }

      // 3. Check degree abbreviations (S.E., M.M., Ph.D) → UPPERCASE
      if (isDegreeAbbreviation(mainPart)) {
        return prefix + mainPart.toUpperCase();
      }

      // 4. Single character → UPPERCASE
      if (mainPart.length <= 1) return prefix + upperMain;

      // 5. Default: Title Case
      return prefix + mainPart.charAt(0).toUpperCase() + mainPart.slice(1).toLowerCase();
    })
    .join(' ');
}

module.exports = { normalizeName };

