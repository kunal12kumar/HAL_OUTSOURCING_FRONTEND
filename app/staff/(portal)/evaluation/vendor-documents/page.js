"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Card, DefinitionList, Empty, Field, Input, Modal, PageHeader, Select, Spinner, StateBadge, Table } from "@/components/ui";
import { staff, upload } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

const ACCEPT = ".pdf,.docx,.xlsx,.csv";
const size = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const busy = (d) => d.status === "UPLOADED" || d.status === "PROCESSING";

function DocDetail({ id, onClose }) {
  const { data, error, loading } = useLoad(() => staff(`evaluation/vendor-documents/${id}/`));
  return (
    <Modal title={data ? data.filename : "Document"} onClose={onClose} wide>
      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert>{error.message}</Alert>
      ) : (
        <div className="space-y-4">
          <DefinitionList items={[["Vendor", data.vendor_name], ["Type", data.doc_type_label], ["Pages / sheets", data.pages ?? "-"], ["Facts extracted", data.fact_count]]} />
          {data.status_detail && <Alert tone="amber">{data.status_detail}</Alert>}
          <Table
            empty="No labelled values were found in this document. Its text is still searchable, but specifications and prices may need manual verification."
            rows={data.facts.map((f, i) => ({ ...f, id: i }))}
            columns={[
              { key: "label", label: "Item" },
              { key: "value", label: "Value" },
              { key: "ref", label: "Location", nowrap: true },
            ]}
          />
        </div>
      )}
    </Modal>
  );
}

export default function Page() {
  const { data, error, loading, reload } = useLoad(() => staff("evaluation/vendor-documents/"));
  const [vendorName, setVendorName] = useState("");
  const [docType, setDocType] = useState("");
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [detail, setDetail] = useState(null);
  const input = useRef(null);

  const anyBusy = data?.vendors.some((v) => v.documents.some(busy));
  useEffect(() => {
    if (!anyBusy) return;
    const t = setInterval(reload, 1500);
    return () => clearInterval(t);
  }, [anyBusy, reload]);

  function addFiles(list) {
    setFiles((cur) => [...cur, ...Array.from(list)]);
  }

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    const form = new FormData();
    form.append("vendor_name", vendorName);
    if (docType) form.append("doc_type", docType);
    files.forEach((f) => form.append("files", f));
    setProgress(0);
    try {
      const res = await upload("evaluation/vendor-documents/", form, setProgress);
      setMessage({ tone: res.rejected.length ? "amber" : "green", text: `${res.created.length} file(s) uploaded for ${res.vendor.name}.${res.rejected.length ? " Not uploaded: " + res.rejected.join(" ") : ""}` });
      setFiles([]);
      if (input.current) input.current.value = "";
      reload();
    } catch (err) {
      const rejected = err.data?.rejected?.join(" ");
      setMessage({ tone: "red", text: rejected || err.message });
    } finally {
      setProgress(null);
    }
  }

  async function act(fn) {
    try {
      await fn();
      reload();
    } catch (err) {
      setMessage({ tone: "red", text: err.message });
    }
  }

  const types = Object.entries(data?.doc_types || {}).map(([value, label]) => ({ value, label }));
  const names = data?.vendors.map((v) => v.name) || [];

  return (
    <>
      <PageHeader
        title="Vendor documents"
        subtitle="Upload the documents received from each vendor. They are stored with that vendor, read, classified and indexed so they can be used in a tender analysis."
        back={{ href: "/staff/evaluation", label: "AI Evaluation" }}
      />
      <Card title="Upload documents" className="mb-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor name" required htmlFor="vendor" help="Pick an existing vendor or type a new name.">
              <Input id="vendor" list="vendor-names" value={vendorName} onChange={(e) => setVendorName(e.target.value)} required maxLength={200} />
              <datalist id="vendor-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
            </Field>
            <Field label="Document type" htmlFor="dtype" help="Leave on automatic and the type is detected from the file name and contents.">
              <Select id="dtype" value={docType} onChange={(e) => setDocType(e.target.value)} options={types} placeholder="Detect automatically" />
            </Field>
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            className={`rounded-lg border-2 border-dashed px-4 py-8 text-center ${dragging ? "border-brand-600 bg-brand-50" : "border-slate-300 bg-slate-50"}`}
          >
            <p className="text-sm text-slate-700">Drag files here, or</p>
            <Button variant="secondary" className="mt-2" onClick={() => input.current?.click()}>Choose files</Button>
            <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => addFiles(e.target.files)} />
            <p className="mt-2 text-xs text-slate-500">PDF, DOCX, XLSX or CSV, up to 15 MB each. Several files can be added at once.</p>
          </div>
          {files.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 text-sm">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="truncate">{f.name} <span className="text-slate-400">({size(f.size)})</span></span>
                  <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}>Remove</button>
                </li>
              ))}
            </ul>
          )}
          {progress !== null && (
            <div aria-label="Upload progress">
              <div className="h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="mt-1 text-xs text-slate-500">Uploading {progress}%</p>
            </div>
          )}
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <div className="flex justify-end">
            <Button type="submit" disabled={!vendorName.trim() || files.length === 0 || progress !== null}>Upload {files.length > 0 ? `${files.length} file(s)` : ""}</Button>
          </div>
        </form>
      </Card>

      {loading && !data ? <Spinner /> : error ? <Alert>{error.message}</Alert> : data.vendors.length === 0 ? (
        <Empty>No vendor documents yet. Upload the first set above.</Empty>
      ) : (
        <div className="space-y-6">
          {data.vendors.map((v) => (
            <Card key={v.id} title={`${v.name} (${v.documents.length} document${v.documents.length === 1 ? "" : "s"})`} padded={false}>
              <div className="p-2">
                <Table
                  rows={v.documents}
                  columns={[
                    { key: "filename", label: "File", render: (d) => <button type="button" className="text-left font-medium text-brand-700 hover:underline" onClick={() => setDetail(d.id)}>{d.filename}</button> },
                    { key: "doc_type", label: "Type", render: (d) => (
                      <select aria-label={`Type of ${d.filename}`} className="rounded border-0 bg-transparent text-sm ring-1 ring-slate-200" value={d.doc_type}
                        onChange={(e) => act(() => staff(`evaluation/vendor-documents/${d.id}/`, { method: "PATCH", body: { doc_type: e.target.value } }))}>
                        {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>) },
                    { key: "status", label: "Status", render: (d) => (<div><StateBadge state={d.status} label={d.status_label} />{d.status_detail && <p className="mt-1 max-w-xs text-xs text-slate-500">{d.status_detail}</p>}</div>) },
                    { key: "fact_count", label: "Facts", align: "right" },
                    { key: "size", label: "Size", render: (d) => size(d.size), nowrap: true },
                    { key: "uploaded_at", label: "Uploaded", render: (d) => dateTime(d.uploaded_at), nowrap: true },
                    { key: "actions", label: "", render: (d) => (
                      <div className="flex gap-3 whitespace-nowrap text-xs">
                        <a className="text-brand-700 hover:underline" href={`/api/internal/evaluation/vendor-documents/${d.id}/download/`}>Download</a>
                        <button type="button" className="text-brand-700 hover:underline" onClick={() => act(() => staff(`evaluation/vendor-documents/${d.id}/reprocess/`, { method: "POST" }))}>Reprocess</button>
                        <button type="button" className="text-red-600 hover:underline" onClick={() => confirm(`Delete ${d.filename}?`) && act(() => staff(`evaluation/vendor-documents/${d.id}/`, { method: "DELETE" }))}>Delete</button>
                      </div>) },
                  ]}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
      {detail && <DocDetail id={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
