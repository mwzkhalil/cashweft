import { foldRomanUrdu, normalizeMessage } from '../parser/normalize';

const MARKERS: Record<string, RegExp> = {
  lending: /udh[ae]r|qarz|qarza|قرض|ادھار|lent|loan/,
  returned: /wapas|wapis|return|واپس|repay/,
  committee: /committee|committ|bisi|beesi|bachat|قمیٹی|بیسی|بچت/,
  zakat: /zakat|zakaat|sadqa|sadaqa|خیرات|زکو/,
  family: /ammi|abbu|baba|ghar|گھر|امی/,
  spent: /kharcha|خرچ|kharch|jama|nikala|bheja/,
  received: /mila|mili|aaya|aayi|ملا/,
};

export interface SemanticMarkers {
  lending: boolean;
  returned: boolean;
  committee: boolean;
  zakat: boolean;
  family: boolean;
  spent: boolean;
  received: boolean;
}

export function semanticMarkers(text: string): SemanticMarkers {
  const folded = foldRomanUrdu(normalizeMessage(text));
  return {
    lending: MARKERS.lending.test(folded),
    returned: MARKERS.returned.test(folded),
    committee: MARKERS.committee.test(folded),
    zakat: MARKERS.zakat.test(folded),
    family: MARKERS.family.test(folded),
    spent: MARKERS.spent.test(folded),
    received: MARKERS.received.test(folded),
  };
}

export function evidenceText(parts: (string | null | undefined)[]): string {
  return normalizeMessage(parts.filter((part): part is string => Boolean(part)).join(' '));
}
