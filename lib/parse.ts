import { guessCategory } from "./categories";
import { toPaise } from "./format";

export type ParsedEntry = {
  name: string;
  paise: number;
  category: string;
  hasAmount: boolean;
};

/**
 * One-line entry parsing: "swiggy lunch 120" -> name "swiggy lunch", ₹120,
 * category guessed from the name. The LAST standalone number wins as the
 * amount, so "2 coffees 40" is ₹40 for "2 coffees".
 */
export function parseEntry(input: string): ParsedEntry {
  const text = input.trim();
  if (!text) return { name: "", paise: 0, category: "Other", hasAmount: false };

  const tokens = text.split(/\s+/);
  let amountIdx = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^\d+(?:[.,]\d+)?$/.test(tokens[i])) {
      amountIdx = i;
      break;
    }
  }
  if (amountIdx === -1) {
    return { name: text, paise: 0, category: guessCategory(text), hasAmount: false };
  }

  const paise = toPaise(tokens[amountIdx].replace(",", "."));
  const name = tokens.filter((_, i) => i !== amountIdx).join(" ");
  return {
    name,
    paise,
    category: guessCategory(name || text),
    hasAmount: Number.isFinite(paise) && paise > 0,
  };
}