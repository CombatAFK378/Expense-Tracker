export const CATEGORIES = [
  "Food",
  "Groceries",
  "Travel",
  "Shopping",
  "Subscriptions",
  "Rent",
  "Mobile",
  "Health",
  "Fun",
  "Other",
] as const;

// Merchant/keyword -> category guesses. Matches anything inside the note,
// e.g. "Swiggy dinner" -> Food.
const HINTS: readonly (readonly [string, string])[] = [
  ["swiggy", "Food"],
  ["zomato", "Food"],
  ["domino", "Food"],
  ["starbucks", "Food"],
  ["coffee", "Food"],
  ["cafe", "Food"],
  ["tea", "Food"],
  ["food", "Food"],
  ["restaurant", "Food"],
  ["hotel", "Food"],
  ["pizza", "Food"],
  ["burger", "Food"],
  ["canteen", "Food"],
  ["blinkit", "Groceries"],
  ["zepto", "Groceries"],
  ["bigbasket", "Groceries"],
  ["dmart", "Groceries"],
  ["instamart", "Groceries"],
  ["grocery", "Groceries"],
  ["vegetable", "Groceries"],
  ["milk", "Groceries"],
  ["uber", "Travel"],
  ["ola", "Travel"],
  ["metro", "Travel"],
  ["petrol", "Travel"],
  ["fuel", "Travel"],
  ["irctc", "Travel"],
  ["flight", "Travel"],
  ["indigo", "Travel"],
  ["redbus", "Travel"],
  ["amazon", "Shopping"],
  ["myntra", "Shopping"],
  ["flipkart", "Shopping"],
  ["mesho", "Shopping"],
  ["meesho", "Shopping"],
  ["netflix", "Subscriptions"],
  ["spotify", "Subscriptions"],
  ["prime", "Subscriptions"],
  ["hotstar", "Subscriptions"],
  ["youtube", "Subscriptions"],
  ["icloud", "Subscriptions"],
  ["google one", "Subscriptions"],
  ["rent", "Rent"],
  ["recharge", "Mobile"],
  ["airtel", "Mobile"],
  ["jio", "Mobile"],
  ["pharmacy", "Health"],
  ["medicine", "Health"],
  ["apollo", "Health"],
  ["hospital", "Health"],
  ["doctor", "Health"],
  ["gym", "Health"],
  ["movie", "Fun"],
  ["pvr", "Fun"],
  ["bookmyshow", "Fun"],
  ["game", "Fun"],
  ["steam", "Fun"],
];

export function guessCategory(name: string): string {
  const n = name.toLowerCase();
  for (const [key, category] of HINTS) {
    if (n.includes(key)) return category;
  }
  return "Other";
}

// Visual identity per category — used by the list, timeline and quick-add preview.
export const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  Food: { emoji: "🍔", color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/25" },
  Groceries: { emoji: "🛒", color: "text-lime-300", bg: "bg-lime-500/10 border-lime-500/25" },
  Travel: { emoji: "🚗", color: "text-sky-300", bg: "bg-sky-500/10 border-sky-500/25" },
  Shopping: { emoji: "🛍️", color: "text-pink-300", bg: "bg-pink-500/10 border-pink-500/25" },
  Subscriptions: { emoji: "🎬", color: "text-violet-300", bg: "bg-violet-500/10 border-violet-500/25" },
  Rent: { emoji: "🏠", color: "text-indigo-300", bg: "bg-indigo-500/10 border-indigo-500/25" },
  Mobile: { emoji: "📱", color: "text-teal-300", bg: "bg-teal-500/10 border-teal-500/25" },
  Health: { emoji: "💊", color: "text-rose-300", bg: "bg-rose-500/10 border-rose-500/25" },
  Fun: { emoji: "🎮", color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/25" },
  Other: { emoji: "📦", color: "text-zinc-300", bg: "bg-zinc-500/10 border-zinc-500/25" },
};

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.Other;
}