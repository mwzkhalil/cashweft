const BRANDS: { category: string; pattern: RegExp }[] = [
  { category: 'Shopping', pattern: /\bbook ?mart\b/i },
  { category: 'Groceries', pattern: /\b(al[\s-]?rehman mart|al[\s-]?fatah|carrefour|esajees|euro store|fresh basket|green valley|hyperstar|imtiaz|jalal sons|metro cash|naheed|panda mart|springs stores)\b/i },
  { category: 'Food and Restaurants', pattern: /\b(broadway pizza|butt karahi|cheezious|gloria jeans|hot n spicy|kababjees|lal qila|mcdonald'?s?|optp|ranchers|rehmat[\s-]?e[\s-]?shereen|shinwari|student biryani|united king|kfc|hardee'?s|savour|foodpanda)\b/i },
  { category: 'Transport', pattern: /\b(airblue|bykea|careem|daewoo|faisal movers|fly jinnah|green line|m[\s-]?tag|pia|pakistan railways|road master|serene ?air|speedo|uber|yango|in[\s-]?drive)\b/i },
  { category: 'Fuel', pattern: /\b(attock petroleum|byco|go petroleum|hascol|pso|shell|total parco|askar fuel)\b/i },
  { category: 'Utilities', pattern: /\b(k[\s-]?electric|lesco|iesco|fesco|mepco|pesco|gepco|hesco|qesco|sepco|tesco|ssgc|sngpl|wasa|kwsc|wapda)\b/i },
  { category: 'Mobile and Internet', pattern: /\b(jazz|telenor|zong|ufone|ptcl|nayatel|storm ?fiber|wateen|worldcall|cybernet|transworld)\b/i },
  { category: 'Education', pattern: /\b(beaconhouse|the city school|lgs|roots millennium|lums|nust|fast[\s-]?nuces|the educators|kips|punjab group of colleges)\b/i },
  { category: 'Healthcare', pattern: /\b(aga khan hospital|chughtai|clinix|d\.? ?watson|dawaai|essa lab|excel labs|fazal din|green plus|indus hospital|marham)\b/i },
  { category: 'Shopping', pattern: /\b(alkaram|bata|breakout|chenone|daraz|junaid jamshed|khaadi|liberty books|limelight|mega\.pk|outfitters|priceoye|saeed book|sapphire|servis|stylo|telemart)\b/i },
  { category: 'Entertainment', pattern: /\b(atrium cinemas?|cinepax|nueplex|universal cinemas?|netflix|spotify|tapmad|youtube premium|steam|playstation|joyland|sindbad|funland|arena bowling)\b/i },
  { category: 'Government Fees and Taxes', pattern: /\b(fbr|nadra|dgip|kpra|pra|board of revenue|excise|e[\s-]?challan|safe city|traffic police|epay punjab)\b/i },
  { category: 'Charity and Zakat', pattern: /\b(akhuwat|al[\s-]?mustafa welfare|alkhidmat|chhipa|fatimid|jdc foundation|sos village|saylani|sundas)\b/i },
  { category: 'Subscriptions', pattern: /\b(adobe|apple\.com|canva|dropbox|google one|google play|grammarly|linkedin premium|microsoft 365|patreon|icloud)\b/i },
];

const WORDS: { category: string; pattern: RegExp }[] = [
  { category: 'Fuel', pattern: /petrol|petroleum|\bfuel\b|filling station|\bcng\b|\bpump\b/i },
  { category: 'Healthcare', pattern: /pharm|chemist|medical|medicos|hospital|clinic|doctor|medicine|\bhealth|\blabs?\b|laboratory|diagnostic|dental/i },
  { category: 'Education', pattern: /school|college|university|academy|tuition|institute|fee challan/i },
  { category: 'Groceries', pattern: /grocer|kiryana|karyana|general store|super ?market|super store|\bmart\b|cash and carry|sabzi|سبزی/i },
  { category: 'Food and Restaurants', pattern: /restaurant|\bcafe\b|coffee|\bfoods?\b|bakers|bakery|sweets|tikka|karahi|biryani|pizza|burger|dhaba|\bhotel\b/i },
  { category: 'Transport', pattern: /\bbus\b|\bbrt\b|railway|airline|airways|rickshaw|\btaxi\b|motorway|\btoll\b/i },
  { category: 'Utilities', pattern: /electric|\bsui gas\b|\bgas bill|water (?:bill|board)|bill payment/i },
  { category: 'Mobile and Internet', pattern: /broadband|internet|\bfiber\b|mobile package|top-?up/i },
  { category: 'Shopping', pattern: /garments?|\bshoes?\b|boutique|cloth|book (?:depot|bank|shop)|electronics|shopping|mobile zone/i },
  { category: 'Entertainment', pattern: /cinemas?|\bmovies?\b|bowling/i },
  { category: 'Charity and Zakat', pattern: /zakat|sadqa|charity|donation|khairat|welfare|foundation/i },
  { category: 'Government Fees and Taxes', pattern: /challan|\btax\b|taxation|passport/i },
  { category: 'Subscriptions', pattern: /subscription|membership/i },
  { category: 'Rent', pattern: /\brent\b|kiraya/i },
  { category: 'Housing', pattern: /society|maintenance|plumber|paint/i },
  { category: 'Cash Withdrawals', pattern: /\batm\b|cash withdrawal/i },
  { category: 'Income', pattern: /salary|payroll|تنخواہ/i },
];

const RAIL = /raast|ibft|1link|transfer/i;

export function categoryFor(merchant: string, body = ''): string {
  for (const rules of [BRANDS, WORDS]) {
    const hit = merchant ? rules.find(rule => rule.pattern.test(merchant)) : undefined;
    if (hit) return hit.category;
  }
  const text = `${merchant} ${body}`;
  for (const rules of [BRANDS, WORDS]) {
    const hit = rules.find(rule => rule.pattern.test(text));
    if (hit) return hit.category;
  }
  return !merchant.trim() && RAIL.test(body) ? 'Transfers' : 'Other';
}
