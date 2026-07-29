import {
  ConversionRequestError,
  apiCapabilities,
  convertRequest,
} from "@/lib/api";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export function GET() {
  return json(apiCapabilities());
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return json(convertRequest(payload));
  } catch (error) {
    const status =
      error instanceof ConversionRequestError || error instanceof SyntaxError
        ? 400
        : 500;
    const message =
      error instanceof Error ? error.message : "Unexpected conversion error.";
    return json({ error: message }, status);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
