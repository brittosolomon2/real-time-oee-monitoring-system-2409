export type ApiError = {
  message: string;
  status?: number;
  details?: unknown;
};

function getBaseUrl(): string {
  // In Next.js, only NEXT_PUBLIC_* is guaranteed in the browser bundle.
  // However, this repo's preview manifest provides API_BASE/BACKEND_URL. We expose those
  // by mirroring them into NEXT_PUBLIC_* via .env (already present in container), and
  // keep fallbacks for local dev.
  return (
    process.env.NEXT_PUBLIC_OEE_API_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

async function parseJsonSafe(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text();
  return text;
}

// PUBLIC_INTERFACE
export async function apiRequest<TResponse>(
  path: string,
  options?: RequestInit
): Promise<TResponse> {
  /** Generic API request wrapper with basic error handling. */
  const url = `${getBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  } catch (e) {
    throw {
      message: "Network error connecting to backend.",
      details: e,
    } satisfies ApiError;
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw {
      message: typeof data === "string" ? data : "Backend error response.",
      status: res.status,
      details: data,
    } satisfies ApiError;
  }

  return data as TResponse;
}
