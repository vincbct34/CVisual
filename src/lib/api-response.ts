import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Standard 400 for a failed Zod `safeParse`, with the flattened field errors
 * under `details`. One shape for every route:
 *
 *   const parsed = schema.safeParse(body);
 *   if (!parsed.success) return validationError(parsed.error);
 */
export function validationError(error: z.ZodError): NextResponse {
  return NextResponse.json(
    { error: "Données invalides", details: z.flattenError(error) },
    { status: 400 },
  );
}
