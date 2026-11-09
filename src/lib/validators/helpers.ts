import { z } from "zod";

/** Optional text input: trims, and turns "" into null. */
export const optionalText = (max = 255) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .transform((v) => (v ? v : null));

/** Required text input. */
export const requiredText = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Must be at most ${max} characters`);

/** Optional number typed into an <input>: "" → null, otherwise a number within range. */
export const optionalNumber = (min: number, max: number, opts: { int?: boolean; unit?: string } = {}) =>
  z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((v, ctx) => {
    if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
    const n = typeof v === "number" ? v : Number(v);
    const unit = opts.unit ? ` ${opts.unit}` : "";
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Enter a number" });
      return z.NEVER;
    }
    if (opts.int && !Number.isInteger(n)) {
      ctx.addIssue({ code: "custom", message: "Enter a whole number" });
      return z.NEVER;
    }
    if (n < min || n > max) {
      ctx.addIssue({ code: "custom", message: `Must be between ${min} and ${max}${unit}` });
      return z.NEVER;
    }
    return n;
  });

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

export const optionalIsoDate = z
  .union([isoDate, z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));
