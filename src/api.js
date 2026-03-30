// ─── API Client ─────────────────────────────────────────────────────────────
// Handles auth + CRUD with camelCase↔snake_case and enum normalization

const API = "";

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function fetchProviders() {
  const res = await fetch(`${API}/api/auth-providers`);
  const data = await res.json();
  return data.providers || { email: true };
}

export async function getSession() {
  const res = await fetch(`${API}/api/auth/get-session`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export async function signIn(email, password) {
  const res = await fetch(`${API}/api/auth/sign-in/email`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Sign in failed");

  // Verify the cookie was actually stored (cross-origin can silently block it)
  const session = await getSession();
  if (!session) throw new Error("Session cookie was blocked by your browser. Try disabling third-party cookie blocking, or use the app directly at https://creator-app-bbi.pages.dev");

  return data;
}

export async function signUp(email, password, name) {
  const res = await fetch(`${API}/api/auth/sign-up/email`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Sign up failed");

  // Verify cookie stored
  const session = await getSession();
  if (!session) throw new Error("Session cookie was blocked by your browser. Try disabling third-party cookie blocking, or use the app directly at https://creator-app-bbi.pages.dev");

  return data;
}

export async function signOut() {
  await fetch(`${API}/api/auth/sign-out`, { method: "POST", credentials: "include" });
}

// ─── Data Mapping ───────────────────────────────────────────────────────────
// Frontend uses camelCase + Title Case enums
// Database may return either case depending on NCB

const STATUS_TO_DB = {
  "Discovered": "discovered",
  "Contacted": "contacted",
  "Responded": "responded",
  "In Talks": "in talks",
  "Onboarded": "onboarded",
  "Declined": "declined",
};

const STATUS_FROM_DB = {
  "discovered": "Discovered", "Discovered": "Discovered",
  "contacted": "Contacted",   "Contacted": "Contacted",
  "responded": "Responded",   "Responded": "Responded",
  "in talks": "In Talks",     "In Talks": "In Talks",
  "onboarded": "Onboarded",   "Onboarded": "Onboarded",
  "declined": "Declined",     "Declined": "Declined",
};

const PRIORITY_TO_DB = { "High": "high", "Medium": "medium", "Low": "low" };
const PRIORITY_FROM_DB = {
  "high": "High", "High": "High",
  "medium": "Medium", "Medium": "Medium",
  "low": "Low", "Low": "Low",
};

function toDb(creator) {
  return {
    name: creator.name || "",
    handle: creator.handle || "",
    platform: creator.platform || "Instagram",
    niche: creator.niche || "",
    followers: creator.followers || "",
    contact: creator.contact || "",
    notes: creator.notes || "",
    priority: PRIORITY_TO_DB[creator.priority] || "medium",
    status: STATUS_TO_DB[creator.status] || "discovered",
    follow_up_date: creator.followUpDate || null,
    tags: JSON.stringify(creator.tags || []),
    log: JSON.stringify(creator.log || []),
    date_added: creator.dateAdded || Date.now(),
  };
}

function fromDb(row) {
  return {
    id: row.id,
    name: row.name || "",
    handle: row.handle || "",
    platform: row.platform || "Instagram",
    niche: row.niche || "",
    followers: row.followers || "",
    contact: row.contact || "",
    notes: row.notes || "",
    priority: PRIORITY_FROM_DB[row.priority] || "Medium",
    status: STATUS_FROM_DB[row.status] || "Discovered",
    followUpDate: row.follow_up_date || "",
    tags: parseJson(row.tags, []),
    log: parseJson(row.log, []),
    dateAdded: row.date_added || Date.now(),
  };
}

function parseJson(val, fallback) {
  if (Array.isArray(val)) return val;
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function fetchCreators() {
  const res = await fetch(`${API}/api/data/read/creators?limit=500&sort=date_added&order=desc`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch creators");
  const data = await res.json();
  return (data.data || []).map(fromDb);
}

export async function createCreator(creator) {
  const body = toDb(creator);
  const res = await fetch(`${API}/api/data/create/creators`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create: ${err}`);
  }
  const data = await res.json();
  return { ...creator, id: data.id ?? creator.id };
}

export async function updateCreator(creator) {
  const body = toDb(creator);
  const res = await fetch(`${API}/api/data/update/creators/${creator.id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update: ${err}`);
  }
  return creator;
}

export async function deleteCreatorApi(id) {
  const res = await fetch(`${API}/api/data/delete/creators/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete: ${err}`);
  }
}
