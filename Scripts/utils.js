// utils.js - small helpers used across scripts

export function formatDateDMY(dateInput) {
  // Accepts Date object or ISO string
  const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

export function parseDMYHI(dateStr) {
  // Supports both "YYYY-MM-DD HH:MM:SS" and "d/m/Y H:i" fallback formats
  if (!dateStr) return null;

  // Try ISO-like (2025-11-19 14:20:00)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.split(/[- :]/);
    const y = parseInt(parts[0],10);
    const m = parseInt(parts[1],10) - 1;
    const d = parseInt(parts[2],10);
    const h = parts[3] ? parseInt(parts[3],10) : 0;
    const i = parts[4] ? parseInt(parts[4],10) : 0;
    const s = parts[5] ? parseInt(parts[5],10) : 0;
    return new Date(y,m,d,h,i,s);
  }

  // Try German d.m.Y H:i or d/m/Y H:i
  const dm = dateStr.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dm) {
    const d = parseInt(dm[1],10);
    const m = parseInt(dm[2],10) - 1;
    const y = parseInt(dm[3],10);
    const h = dm[4] ? parseInt(dm[4],10) : 0;
    const i = dm[5] ? parseInt(dm[5],10) : 0;
    return new Date(y,m,d,h,i);
  }

  // fallback: Date parse
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? null : new Date(parsed);
}
