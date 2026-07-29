import {
  ConversionRequestError,
  MAX_API_REQUEST_BODY_BYTES,
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

async function readJsonPayload(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    Number.isFinite(Number(contentLength)) &&
    Number(contentLength) > MAX_API_REQUEST_BODY_BYTES
  ) {
    throw new ConversionRequestError(
      `Request body must not exceed ${MAX_API_REQUEST_BODY_BYTES} bytes.`,
    );
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new SyntaxError("Request body is empty.");
  }

  const decoder = new TextDecoder();
  let byteCount = 0;
  let source = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteCount += value.byteLength;
    if (byteCount > MAX_API_REQUEST_BODY_BYTES) {
      await reader.cancel();
      throw new ConversionRequestError(
        `Request body must not exceed ${MAX_API_REQUEST_BODY_BYTES} bytes.`,
      );
    }
    source += decoder.decode(value, { stream: true });
  }
  source += decoder.decode();
  return JSON.parse(source);
}

export async function POST(request: Request) {
  try {
    const payload = await readJsonPayload(request);
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
