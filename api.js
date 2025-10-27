const API_BASE = "https://api-repartidor-tm.onrender.com";

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}/api/${endpoint}`);
  return res.json();
}

async function apiPost(endpoint, data) {
  const res = await fetch(`${API_BASE}/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiDelete(endpoint, id) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, { method: "DELETE" });
  return res.json();
}
