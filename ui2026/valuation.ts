// Valuers edit ui2026/valuation.json only. fv null = unavailable (with "why"). methods = count of methods used.
import J from './valuation.json';
export type Val = { fv: number | null; lo?: number; hi?: number; price?: number; price_date: string; methods: number | null; why?: string };
export const VAL_ASOF: string = (J as any).as_of;
export const VAL_METHOD: string = (J as any).method;
export const VAL: Record<string, Val> = (J as any).stocks;
