type Raw = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function getString(sp: Raw, key: string): string | undefined {
  const v = first(sp[key])?.trim();
  return v ? v : undefined;
}

export function getInt(sp: Raw, key: string): number | undefined {
  const n = Number.parseInt(first(sp[key]) ?? "", 10);
  return Number.isFinite(n) ? n : undefined;
}

export function getEnum<T extends string>(sp: Raw, key: string, allowed: readonly T[]): T | undefined {
  const v = first(sp[key]);
  return allowed.includes(v as T) ? (v as T) : undefined;
}
