"use client";

import Link from "next/link";
import { Alert, Badge, Button, Card, PageHeader, Spinner, StateBadge, Table } from "@/components/ui";
import { staff } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

export default function Page() {
  const docs = useLoad(() => staff("evaluation/vendor-documents/"));
  const runs = useLoad(() => staff("evaluation/analyses/"));
  const docCount = docs.data?.vendors.reduce((n, v) => n + v.documents.length, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="AI Vendor Evaluation"
        subtitle="Demonstration module. It works from uploaded documents only and does not change orders, tenders or vendors in the workflow."
      />
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card title="1. Vendor document upload" actions={<Button href="/staff/evaluation/vendor-documents" size="sm">Open</Button>}>
          <p className="text-sm text-slate-600">Upload quotations, datasheets, specifications and certificates for each vendor. Files are read, classified and indexed automatically.</p>
          <p className="mt-3 text-sm text-slate-500">
            {docs.loading ? "Loading..." : `${docs.data?.vendors.length ?? 0} vendors, ${docCount} documents`}
          </p>
        </Card>
        <Card title="2. HAL tender analysis" actions={<Button href="/staff/evaluation/tender-analysis" size="sm">Open</Button>}>
          <p className="text-sm text-slate-600">Upload a tender. The system extracts its requirements, evaluates every vendor technically and commercially in parallel, and ranks them with reasons.</p>
          <p className="mt-3 text-sm text-slate-500">{runs.loading ? "Loading..." : `${runs.data?.results.length ?? 0} analyses`}</p>
        </Card>
      </div>
      <Card title="Recent analyses" padded={false}>
        <div className="p-2">
          {runs.loading ? (
            <Spinner />
          ) : runs.error ? (
            <Alert>{runs.error.message}</Alert>
          ) : (
            <Table
              empty="No analyses yet."
              rows={runs.data.results}
              columns={[
                { key: "title", label: "Tender", render: (a) => <Link className="font-medium text-brand-700 hover:underline" href={`/staff/evaluation/tender-analysis/${a.evaluation_id}`}>{a.title}</Link> },
                { key: "status", label: "Status", render: (a) => <StateBadge state={a.status} label={a.status_label} /> },
                { key: "requirement_count", label: "Requirements", align: "right" },
                { key: "created_at", label: "Created", render: (a) => dateTime(a.created_at), nowrap: true },
              ]}
            />
          )}
        </div>
      </Card>
    </>
  );
}
