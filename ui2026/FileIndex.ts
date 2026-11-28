// files_index.json is written at build time and lists the per-stock files that exist (idx, studies, flow_combo).
// Used to skip requests that would only 404. If the index is missing, nothing is skipped.
let P: Promise<any> | null = null;
const idx = (): Promise<any> => P || (P = fetch('files_index.json?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
export const hasFile = (kind: 'idx' | 'studies' | 'combo', code: string): Promise<boolean> => idx().then(j => !j || !Array.isArray(j[kind]) || j[kind].includes(String(code).toUpperCase()));
