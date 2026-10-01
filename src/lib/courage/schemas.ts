import { z } from "zod";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

const optionalText = z
  .string()
  .trim()
  .max(500, "Keep it under 500 characters.")
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional();

export const courageRepSchema = z
  .object({
    typeId: z.number().int().positive().nullable().optional(),
    customLabel: z
      .string()
      .trim()
      .max(80, "Keep the label under 80 characters.")
      .transform((v) => (v.length ? v : null))
      .nullable()
      .optional(),
    note: optionalText,
  })
  .refine((v) => v.typeId || v.customLabel, { message: "Pick a type or write a short label.", path: ["typeId"] });

export type CourageRepInput = z.input<typeof courageRepSchema>;
