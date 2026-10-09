import type { SupportLevel } from '../../lib/model';

export interface ProviderDefinition {
  id: string;
  name: string;
  kind: 'bank' | 'wallet' | 'rail';
  rails: string[];
  aliases: string[];
  support: SupportLevel;
  evidence: string;
}

export const PROVIDERS: ProviderDefinition[] = [
  { id: 'hbl', name: 'HBL', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['hbl', 'habib bank'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'ubl', name: 'UBL', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['ubl', 'united bank'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'mcb', name: 'MCB Bank', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['mcb'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'meezan', name: 'Meezan Bank', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['meezan'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'alfalah', name: 'Bank Alfalah', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['bank alfalah', 'alfalah'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'abl', name: 'Allied Bank', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['allied bank'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'askari', name: 'Askari Bank', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['askari'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'faysal', name: 'Faysal Bank', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['faysal'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'bankislami', name: 'BankIslami', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['bankislami', 'bank islami'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'nbp', name: 'National Bank of Pakistan', kind: 'bank', rails: ['raast', 'ibft', '1link', 'card'], aliases: ['national bank', 'nbp'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'scb', name: 'Standard Chartered Pakistan', kind: 'bank', rails: ['raast', 'ibft', 'card'], aliases: ['standard chartered'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'js', name: 'JS Bank', kind: 'bank', rails: ['raast', 'ibft', '1link'], aliases: ['js bank'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'bop', name: 'Bank of Punjab', kind: 'bank', rails: ['raast', 'ibft', '1link'], aliases: ['bank of punjab'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'habibmetro', name: 'HabibMetro', kind: 'bank', rails: ['raast', 'ibft', '1link'], aliases: ['habibmetro', 'habib metro'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'jazzcash', name: 'JazzCash', kind: 'wallet', rails: ['wallet', 'raast', 'ibft'], aliases: ['jazzcash', 'jazz cash'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'easypaisa', name: 'Easypaisa', kind: 'wallet', rails: ['wallet', 'raast', 'ibft'], aliases: ['easypaisa', 'easy paisa'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'sadapay', name: 'SadaPay', kind: 'wallet', rails: ['wallet', 'raast'], aliases: ['sadapay', 'sada pay'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'nayapay', name: 'NayaPay', kind: 'wallet', rails: ['wallet', 'raast'], aliases: ['nayapay', 'naya pay'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'zindigi', name: 'Zindigi', kind: 'wallet', rails: ['wallet', 'raast'], aliases: ['zindigi'], support: 'implemented', evidence: 'Institution name only. No verified sender ID.' },
  { id: 'raast', name: 'Raast', kind: 'rail', rails: ['raast'], aliases: ['raast'], support: 'tested', evidence: 'Synthetic Raast wording in parser tests. Not a live scheme integration.' },
  { id: 'ibft', name: 'IBFT', kind: 'rail', rails: ['ibft'], aliases: ['ibft'], support: 'tested', evidence: 'Synthetic IBFT wording in parser tests.' },
  { id: 'onelink', name: '1LINK', kind: 'rail', rails: ['1link'], aliases: ['1link', '1 link'], support: 'implemented', evidence: 'Rail name detection only.' },
];

function mentions(text: string, alias: string): boolean {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, 'i').test(text);
}

export function detectProvider(body: string): ProviderDefinition | null {
  const ordered = [...PROVIDERS].sort((a, b) => b.name.length - a.name.length);
  return ordered.find(provider => provider.aliases.some(alias => mentions(body, alias))) ?? null;
}

export function providerById(id: string | null): ProviderDefinition | undefined {
  return PROVIDERS.find(provider => provider.id === id);
}
