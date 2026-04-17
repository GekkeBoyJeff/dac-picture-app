/**
 * Pick a random item from a list, optionally excluding one value
 * to avoid immediate repeats.
 * @param {Array} list
 * @param {*} [exclude]
 * @returns {*}
 */
export function pickRandom(list, exclude) {
  const candidates = exclude != null ? list.filter((item) => item !== exclude) : list
  return candidates[Math.floor(Math.random() * candidates.length)]
}