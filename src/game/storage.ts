const KEY = "kompo.progress.v1";
const LEGACY_KEY = "composition.progress.v1";
export function readProgress(): string[] {
  try {
    const v: unknown = JSON.parse(
      localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY) ?? "[]",
    );
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
export function saveProgress(ids: string[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}
