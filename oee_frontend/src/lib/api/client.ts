export type ApiError = {
  message: string;
  status?: number;
  details?: unknown;
};

function getBaseUrl(): string {
  // In Next.js (app router), only NEXT_PUBLIC_* is safe for browser bundles.
  return (
    process.env.NEXT_PUBLIC_OEE_API_BASE_URL?.replace(/\/$/, "") ||
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
