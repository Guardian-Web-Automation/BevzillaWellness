export const routes = {
  home: '/',
};

export const collections = {
  mushroom: 'mushroom-coffee',
  protein: 'protein-coffee',
  flavoured: 'flavoured-coffee',
  all: 'all',
};

/**
 * Expected product counts per collection. null = only assert > 0 (safe default).
 * Verified live (2026-09) against the PLP "Choose your brew" grid:
 *   mushroom = 3 (Coffee + Calm / Energy / Focus), protein = 1, flavoured = 1.
 * Kept null so the smoke suite doesn't false-alarm on a catalog change; pin to the
 * numbers above if you want the count assertion to be exact.
 */
export const expectedCounts: Record<string, number | null> = {
  mushroom: null,
  protein: null,
  flavoured: null,
};

/** Sample product handle for direct PDP tests. Verified live (/products/coffee-focus). */
export const sampleProduct = {
  mushroom: 'coffee-focus',
};

export const search = {
  validQuery: 'coffee',
  noResultsQuery: 'zzzzzzzzzz', // for the (planned) no-results search case
};
