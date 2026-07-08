// Personal study "deck" — saved diagram states, persisted in localStorage.
// Each item is a full URL (path + query), so it restores the exact widget state.

export type DeckItem = {
  url: string; // "/cv/frank-starling?preload=14&contractility=1.3"
  title: string;
  systemId: string;
  hasState: boolean; // true when the URL carries perturbed (non-default) params
  savedAt: number;
};

const KEY = "physiohub-deck";
const MAX = 60;

export function getDeck(): DeckItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DeckItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: DeckItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // storage full / disabled — fail quietly
  }
  window.dispatchEvent(new Event("ph:deck-changed"));
}

export function isInDeck(url: string): boolean {
  return getDeck().some((i) => i.url === url);
}

export function addToDeck(item: Omit<DeckItem, "savedAt">) {
  const rest = getDeck().filter((i) => i.url !== item.url);
  write([{ ...item, savedAt: Date.now() }, ...rest]);
}

export function removeFromDeck(url: string) {
  write(getDeck().filter((i) => i.url !== url));
}

/** Toggle the item; returns the new saved state (true = now saved). */
export function toggleDeck(item: Omit<DeckItem, "savedAt">): boolean {
  if (isInDeck(item.url)) {
    removeFromDeck(item.url);
    return false;
  }
  addToDeck(item);
  return true;
}
