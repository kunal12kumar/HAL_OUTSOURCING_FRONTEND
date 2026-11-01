"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toneFor, titleCase } from "@/lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const BUTTONS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  ghost: "text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600",
};

export function Button({ variant = "primary", size = "md", className, href, ...props }) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
    BUTTONS[variant],
    className
  );
  if (href) return <Link href={href} className={classes} {...props} />;
  return <button type="button" className={classes} {...props} />;
}

export function Card({ title, actions, children, className, padded = true }) {
  return (
    <section className={cx("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        {back && (
          <Link href={back.href} className="mb-1 inline-block text-xs font-medium text-brand-600 hover:underline">
            &larr; {back.label}
          </Link>
        )}
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

const BADGES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

export function Badge({ tone = "blue", children }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", BADGES[tone])}>
      {children}
    </span>
  );
}

export function StateBadge({ state, label }) {
  return <Badge tone={toneFor(state)}>{label || titleCase(state)}</Badge>;
}

export function Alert({ tone = "red", children }) {
  const styles = {
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return <div role="alert" className={cx("rounded-md border px-4 py-3 text-sm", styles[tone])}>{children}</div>;
}

export function Spinner({ label = "Loading..." }) {
  return <p className="py-10 text-center text-sm text-slate-500">{label}</p>;
}

export function Empty({ children }) {
  return <p className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{children}</p>;
}

export function Stat({ label, value, tone, hint }) {
  const color = tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cx("mt-1 text-2xl font-semibold", color)}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Table({ columns, rows, empty = "Nothing to show.", onRowClick, rowKey = (r) => r.id }) {
  if (!rows?.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cx("whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500", c.align === "right" && "text-right")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cx(onRowClick && "cursor-pointer hover:bg-slate-50")}>
              {columns.map((c) => (
                <td key={c.key} className={cx("px-3 py-2.5 align-top text-slate-700", c.align === "right" && "text-right tabular-nums", c.nowrap && "whitespace-nowrap")}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DefinitionList({ items }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-0.5 whitespace-pre-line text-sm text-slate-800">{value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

const FIELD = "block w-full rounded-md border-0 px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600";

export function Field({ label, help, required, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-slate-500">{help}</p>}
    </div>
  );
}

export function Input(props) {
  return <input className={FIELD} {...props} />;
}

export function Textarea(props) {
  return <textarea rows={3} className={FIELD} {...props} />;
}

export function Select({ options, placeholder, ...props }) {
  return (
    <select className={FIELD} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx("w-full rounded-lg bg-white shadow-xl", wide ? "max-w-2xl" : "max-w-lg")}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            &times;
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Timeline({ items }) {
  if (!items?.length) return <Empty>No history yet.</Empty>;
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
          <p className="text-sm font-medium text-slate-800">
            {titleCase(it.stage)} <StateBadge state={it.decision} />
          </p>
          <p className="text-xs text-slate-500">
            {it.actor_name} ({titleCase(it.actor_role)}) &middot; {new Date(it.created_at).toLocaleString("en-IN")}
          </p>
          {it.remarks && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{it.remarks}</p>}
        </li>
      ))}
    </ol>
  );
}
