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

/**
 * Parse a JSON request body, returning a ready 400 instead of letting a
 * malformed body throw into an opaque 500. One shape for every route:
 *
 *   const { body, response } = await parseJsonBody(request);
 *   if (response) return response;
 *   const parsed = schema.safeParse(body);
 */
export async function parseJsonBody(
  request: Request,
): Promise<
  { body: unknown; response: null } | { body: null; response: NextResponse }
> {
  try {
    return { body: await request.json(), response: null };
  } catch {
    return {
      body: null,
      response: NextResponse.json({ error: "JSON invalide" }, { status: 400 }),
    };
  }
}
