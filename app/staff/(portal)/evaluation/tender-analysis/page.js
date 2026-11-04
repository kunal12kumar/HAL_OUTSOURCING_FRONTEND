"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert, Button, Card, Field, Input, PageHeader, Spinner, StateBadge, Table } from "@/components/ui";
import { staff, upload } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

export default function Page() {
  const router = useRouter();
  const runs = useLoad(() => staff("evaluation/analyses/"));
  const docs = useLoad(() => staff("evaluation/vendor-documents/"));
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);
  const vendors = docs.data?.vendors.length ?? 0;

  async function submit(e) {
    e.preventDefault();
    setError("");
    const form = new FormData();
    form.append("file", file);
    if (title.trim()) form.append("title", title.trim());
    setProgress(0);
    try {
      const a = await upload("evaluation/analyses/", form, setProgress);
      router.push(`/staff/evaluation/tender-analysis/${a.evaluation_id}`);
    } catch (err) {
      setError(err.data?.file || err.message);
      setProgress(null);
    }
  }

  return (
    <>
      <PageHeader
        title="HAL tender analysis"
        subtitle="Upload a tender or requirement document. The requirements are extracted for your review, then every vendor is evaluated against them."
        back={{ href: "/staff/evaluation", label: "AI Evaluation" }}
      />
      {!docs.loading && vendors === 0 && (
        <div className="mb-6"><Alert tone="amber">No vendor documents have been uploaded yet. <Link className="font-medium underline" href="/staff/evaluation/vendor-documents">Upload vendor documents</Link> before starting an analysis.</Alert></div>
      )}
      <Card title="Upload tender document" className="mb-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title (optional)" htmlFor="title" help="Defaults to the file name.">
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </Field>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0] || null); }}
            className={`rounded-lg border-2 border-dashed px-4 py-8 text-center ${dragging ? "border-brand-600 bg-brand-50" : "border-slate-300 bg-slate-50"}`}
          >
            {file ? <p className="text-sm font-medium text-slate-800">{file.name}</p> : <p className="text-sm text-slate-700">Drag the tender here, or</p>}
            <Button variant="secondary" className="mt-2" onClick={() => input.current?.click()}>{file ? "Choose a different file" : "Choose file"}</Button>
            <input ref={input} type="file" accept=".pdf,.docx,.xlsx,.csv" className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
            <p className="mt-2 text-xs text-slate-500">PDF, DOCX, XLSX or CSV, up to 15 MB.</p>
          </div>
          {progress !== null && (
            <div><div className="h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-brand-600" style={{ width: `${progress}%` }} /></div>
              <p className="mt-1 text-xs text-slate-500">{progress < 100 ? `Uploading ${progress}%` : "Reading the tender and extracting requirements..."}</p></div>
          )}
          {error && <Alert>{error}</Alert>}
          <div className="flex justify-end"><Button type="submit" disabled={!file || progress !== null}>Upload and extract requirements</Button></div>
        </form>
      </Card>
      <Card title="Previous analyses" padded={false}>
        <div className="p-2">
          {runs.loading ? <Spinner /> : runs.error ? <Alert>{runs.error.message}</Alert> : (
            <Table
              empty="No analyses yet."
              rows={runs.data.results}
              columns={[
                { key: "title", label: "Tender", render: (a) => <Link className="font-medium text-brand-700 hover:underline" href={`/staff/evaluation/tender-analysis/${a.evaluation_id}`}>{a.title}</Link> },
                { key: "filename", label: "File" },
                { key: "status", label: "Status", render: (a) => <StateBadge state={a.status} label={a.status_label} /> },
                { key: "created_at", label: "Created", render: (a) => dateTime(a.created_at), nowrap: true },
              ]}
            />
          )}
        </div>
      </Card>
    </>
  );
}
