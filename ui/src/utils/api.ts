// API utility to include JWT token in Authorization header
export const apiFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("jwt");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
}; 