import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMessage } from "@/lib/i18n/api-messages";

/**
 * Standard 400 for a failed Zod `safeParse`, with the flattened field errors
 * under `details`. Pass the request to localize the top-level message:
 *
 *   const parsed = schema.safeParse(body);
 *   if (!parsed.success) return validationError(parsed.error, request);
 */
export function validationError(
  error: z.ZodError,
  request?: { headers: Headers },
): NextResponse {
  return NextResponse.json(
    {
      error: request ? apiMessage(request, "invalidData") : "Données invalides",
      details: z.flattenError(error),
    },
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
      response: NextResponse.json(
        { error: apiMessage(request, "invalidJson") },
        { status: 400 },
      ),
    };
  }
}
