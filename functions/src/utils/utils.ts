/**
 * Generates a random integer between 0 and the specified maximum value (exclusive).
 * @param {number} max - The maximum value for the random integer.
 * @return {number} - The generated random integer.
 */
function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export { getRandomInt };

