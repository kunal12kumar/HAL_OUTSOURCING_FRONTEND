export class ApiError extends Error {
  constructor(status, data) {
    super(messageFrom(data) || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

function messageFrom(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(messageFrom).filter(Boolean).join(" ");
  if (typeof data === "object") {
    if (data.detail) return messageFrom(data.detail);
    return Object.entries(data)
      .map(([field, value]) => {
        const text = messageFrom(value);
        return field === "non_field_errors" ? text : `${field.replace(/_/g, " ")}: ${text}`;
      })
      .join(" ");
  }
  return String(data);
}

async function request(portal, path, { method = "GET", body, form } = {}) {
  const url = `/api/${portal}/${path.replace(/^\//, "")}`;
  const options = { method, headers: {}, credentials: "same-origin", cache: "no-store" };
  if (form) {
    options.body = form;
  } else if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const staff = (path, options) => request("internal", path, options);
export const vendor = (path, options) => request("vendor", path, options);

export function listOf(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export function toFormData(values) {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") form.append(key, value);
  });
  return form;
}
