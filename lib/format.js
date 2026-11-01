const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function money(value) {
  if (value === null || value === undefined || value === "") return "-";
  return inr.format(Number(value));
}

export function date(value) {
  if (!value) return "-";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ago(value) {
  if (!value) return "never";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const TONES = {
  green: ["APPROVED", "COMPLETED", "ACCEPTED", "AWARDED", "FINISHED", "CLOSED", "ACTIVE", "PUBLISHED", "READY_TO_PUBLISH", "INTERNAL_ONLY"],
  red: ["REJECTED", "RETURNED", "SUSPENDED", "CANCELLED"],
  amber: ["PENDING", "PENDING_APPROVAL", "SUBMITTED", "PNC_REVIEW", "SCHEDULED", "RECEIVED", "DISPATCHED", "IN_FINISHING", "EVALUATION", "ESTIMATED"],
  slate: ["DRAFT", "RETENDERED", "REGISTERED"],
};

export function toneFor(state) {
  for (const [tone, states] of Object.entries(TONES)) if (states.includes(state)) return tone;
  return "blue";
}

export const ROLE_LABELS = {
  ADMIN: "HAL Administrator",
  MSR: "MSR Department",
  APPROVAL_COMMITTEE: "Approval Committee",
  METHODS: "Methods Department",
  IMM: "Integrated Material Management",
  SCHEDULING: "Scheduling Department",
  OUTSOURCING: "Outsourcing Department",
  MSD: "MSD Department",
  INTERNAL_COMMITTEE: "Internal Committee",
  PNC: "PNC Committee",
  INSPECTOR: "HAL Inspection Team",
  GATE: "Security Gate and Receiving",
  FINISHING: "Finishing Team",
};
