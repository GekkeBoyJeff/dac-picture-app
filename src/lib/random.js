/**
 * Pick a random item from a list, optionally excluding one value
 * to avoid immediate repeats.
 */
export function pickRandom(list, exclude) {
  const filtered = exclude != null ? list.filter((item) => item !== exclude) : list;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
