const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// All API calls include the session cookie. Database credentials stay on the server.
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("We couldn't reach Togetherly. Please check your connection and try again.");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
