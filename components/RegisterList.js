"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Input, PageHeader, Select, Spinner, Table } from "@/components/ui";
import { listOf, staff } from "@/lib/api";
import { useLoad } from "@/lib/hooks";

// A searchable, filterable list backed by one API endpoint.
// `columns` may be a function receiving `reload` so cells can hold action buttons.
export default function RegisterList({ title, subtitle, path, columns, filters = [], initial = {}, exportName, headerActions, empty, onRowClick, searchable = true }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [values, setValues] = useState(() => Object.fromEntries(filters.map((f) => [f.name, initial[f.name] || ""])));

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams();
  if (debouncedQ) params.set("q", debouncedQ);
  Object.entries(values).forEach(([k, v]) => v && params.set(k, v));
  const query = params.toString();

  const { data, error, loading, reload } = useLoad(() => staff(`${path}/${query ? `?${query}` : ""}`), query);
  const rows = data ? listOf(data) : [];
  const cols = typeof columns === "function" ? columns(reload) : columns;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {exportName && (
              <Button variant="secondary" href={`/api/internal/export/${exportName}/`} prefetch={false} download>
                Export to Excel (CSV)
              </Button>
            )}
            {headerActions}
          </>
        }
      />
      <Card padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          {searchable && (
            <div className="min-w-56 flex-1">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." aria-label="Search" />
            </div>
          )}
          {filters.map((f) => (
            <div key={f.name} className="w-52">
              <Select
                aria-label={f.label}
                value={values[f.name]}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                options={f.options}
                placeholder={`All ${f.label.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
        <div className="p-2">
          {error ? <Alert>{error.message}</Alert> : loading ? <Spinner /> : <Table columns={cols} rows={rows} empty={empty} onRowClick={onRowClick} />}
        </div>
        {data && !Array.isArray(data) && data.count > rows.length && (
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            Showing the first {rows.length} of {data.count}. Narrow the search to see others.
          </p>
        )}
      </Card>
    </>
  );
}
