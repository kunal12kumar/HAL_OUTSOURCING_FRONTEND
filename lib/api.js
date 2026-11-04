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

// Multipart upload with progress (fetch cannot report upload progress). Resolves with parsed JSON or rejects with ApiError.
export function upload(path, form, onProgress, portal = "internal") {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/${portal}/${path.replace(/^\//, "")}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(xhr.status, data));
    };
    xhr.onerror = () => reject(new ApiError(0, "Cannot reach the server."));
    xhr.send(form);
  });
}
