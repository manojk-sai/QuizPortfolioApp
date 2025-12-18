const AUTH_BASE =
  process.env.REACT_APP_AUTH_BASE_URL || "http://localhost:9001";

export async function register(email, password) {
  const res = await fetch(`${AUTH_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Register failed");
  }

  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${AUTH_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Login failed");
  }

  return res.json();
}