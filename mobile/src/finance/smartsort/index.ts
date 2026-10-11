import { categoryFor } from '../parser/categories';
import { classifyMovement, rejectReason } from '../parser/classify';
import { normalizeMessage } from '../parser/normalize';

export type TextClass = 'transaction' | 'not_transaction';

export interface Classification {
  label: TextClass;
  reason: string | null;
  source: 'rules';
}

export interface CategorySuggestion {
  category: string;
  source: 'rules';
  suggested: boolean;
}

export interface ModelInfo {
  available: false;
  name: null;
  version: null;
  bytes: 0;
  note: string;
}

export function isModelAvailable(): false {
  return false;
}

export function getModelInfo(): ModelInfo {
  return { available: false, name: null, version: null, bytes: 0, note: 'No model ships in this build. Rules on this phone decide.' };
}

export function classifyFinancialText(text: string): Classification {
  const normalized = normalizeMessage(text);
  const reason = rejectReason(normalized);
  if (reason) return { label: 'not_transaction', reason, source: 'rules' };
  return classifyMovement(normalized) ? { label: 'transaction', reason: null, source: 'rules' } : { label: 'not_transaction', reason: 'no_movement', source: 'rules' };
}

export function suggestCategory(merchant: string, body = ''): CategorySuggestion {
  const category = categoryFor(merchant, normalizeMessage(body));
  return { category, source: 'rules', suggested: category !== 'Other' };
}
