const URDU_DIGITS = /[\u06F0-\u06F9]/g;
const ARABIC_DIGITS = /[\u0660-\u0669]/g;

export function normalizeMessage(input: string): string {
  return input.normalize('NFKC')
    .replace(ARABIC_DIGITS, char => String(char.charCodeAt(0) - 0x0660))
    .replace(URDU_DIGITS, char => String(char.charCodeAt(0) - 0x06F0))
    .replace(/[\u064A\u06D2]/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/\u0647/g, '\u06C1')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function foldRomanUrdu(input: string): string {
  return normalizeMessage(input).toLowerCase()
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u');
}
