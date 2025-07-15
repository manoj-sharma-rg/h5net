// API utility to include JWT token in Authorization header
export const apiFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("jwt");
  let headers: Record<string, string> = {};
  if (options.headers instanceof Headers) {
    headers = Object.fromEntries(options.headers.entries());
  } else if (options.headers) {
    headers = { ...options.headers } as Record<string, string>;
  }
  headers["Authorization"] = token ? `Bearer ${token}` : "";

  // Only set Content-Type to application/json if body is not FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
}; 