export const checkIsOnMobile = () => {
  return window.innerWidth < 600;
};

export const uniqBy = <T, K extends keyof T>(array: T[], k: K): T[] => {
  const seen = new Set<T[K]>();

  return array.filter((item) => {
    const key = item[k];

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Filter falsy values: false, 0, "", null, undefined and NaN. */
type Falsy = false | 0 | "" | null | undefined;
export const compact = <T>(
  array: T[],
): Exclude<T, Falsy>[] =>
  array.filter((value): value is Exclude<T, Falsy> => Boolean(value));

export const round = (n: number, digits = 2) => {
  return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
};
