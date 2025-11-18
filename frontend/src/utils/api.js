// utils/api.js
const RAW = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
// Always ensure the base ends with /api
const API_ROOT = /\/api$/.test(RAW) ? RAW.replace(/\/$/, '') : (RAW.replace(/\/$/, '') + '/api');

function join(base, path) {
  const p = String(path || '');
  return p.startsWith('/') ? base + p : base + '/' + p;
}

function getAuthHeader() {
  const t = localStorage.getItem('accessToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function _fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  let data;
  try { data = await res.json(); } catch { data = undefined; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function apiPost(path, body) {
  const url = join(API_ROOT, path);            // <— ALWAYS under /api
  return _fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
}

export async function apiGet(path) {
  const url = join(API_ROOT, path);            // <— ALWAYS under /api
  return _fetchJson(url, {
    headers: { ...getAuthHeader() },
    credentials: 'include',
  });
}


export { API_ROOT as API_BASE }; // for debugging if needed
