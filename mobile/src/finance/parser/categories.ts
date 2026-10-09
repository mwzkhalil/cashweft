const RULES: { category: string; pattern: RegExp }[] = [
  { category: 'Food and Restaurants', pattern: /swiggy|zomato|restaurant|cafe|coffee|food|kfc|mcdonald|biryani|hotel/i },
  { category: 'Groceries', pattern: /blinkit|zepto|grocer|\bsupermarket\b|\bkiryana\b|سبزی/i },
  { category: 'Fuel', pattern: /petrol|fuel|pump|pso|shell|total parco|\bcng\b/i },
  { category: 'Transport', pattern: /\buber\b|\bcareem\b|\bola\b|metro|irctc|flight|\bbus\b|in[\s-]?drive|bykea|rickshaw/i },
  { category: 'Mobile and Internet', pattern: /\bjazz\b|telenor|\bzong\b|ufone|ptcl|nayatel|stormfiber|airtel|\bjio\b|broadband/i },
  { category: 'Utilities', pattern: /electric|k[\s-]?electric|lesco|iesco|fesco|gas|ssgc|sngpl|water bill|wapda|bill payment/i },
  { category: 'Rent', pattern: /\brent\b|kiraya/i },
  { category: 'Housing', pattern: /society|maintenance|plumber|paint/i },
  { category: 'Education', pattern: /school|college|university|tuition|fee challan|academy/i },
  { category: 'Healthcare', pattern: /pharm|hospital|clinic|doctor|medicine|health|laboratory|lab test/i },
  { category: 'Entertainment', pattern: /netflix|spotify|movie|cinema|youtube|prime video/i },
  { category: 'Charity and Zakat', pattern: /zakat|sadqa|charity|donation|khairat/i },
  { category: 'Government Fees and Taxes', pattern: /fbr|nadra|challan|tax\b|excise|passport fee/i },
  { category: 'Subscriptions', pattern: /subscription|membership/i },
  { category: 'Shopping', pattern: /amazon|flipkart|daraz|shopping|\bbook\s*mart\b/i },
  { category: 'Cash Withdrawals', pattern: /atm|cash withdrawal/i },
  { category: 'Income', pattern: /salary|payroll|تنخواہ/i },
  { category: 'Transfers', pattern: /raast|ibft|1link|transfer/i },
];

export function categoryFor(merchant: string, body = ''): string {
  const text = `${merchant} ${body}`;
  return RULES.find(rule => rule.pattern.test(text))?.category ?? 'Other';
}
