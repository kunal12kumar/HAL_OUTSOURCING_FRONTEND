"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import RegisterList from "@/components/RegisterList";
import { useUser } from "@/components/Shell";
import { Button, Spinner, StateBadge } from "@/components/ui";
import { date } from "@/lib/format";

const STAGES = [
  ["DRAFT", "Draft"],
  ["SUBMITTED", "Submitted to committee"],
  ["RETURNED", "Returned to MSR"],
  ["APPROVED", "Approved - awaiting Methods"],
  ["METHODS_DONE", "Methods done - awaiting IMM"],
  ["IMM_DONE", "IMM done - awaiting Scheduling"],
  ["ALLOCATED", "Allocated - awaiting tender"],
  ["TENDERING", "Tender in progress"],
  ["IN_EXECUTION", "Order placed - in execution"],
  ["CLOSED", "Closed"],
  ["INTERNAL_ONLY", "Met within HAL"],
].map(([value, label]) => ({ value, label }));

function List() {
  const router = useRouter();
  const user = useUser();
  const params = useSearchParams();
  return (
    <RegisterList
      title="Requirements"
      subtitle="Every equipment or material requirement raised by MSR, and where it stands."
      path="requirements"
      exportName="requirements"
      initial={{ stage: params.get("stage") || "" }}
      filters={[{ name: "stage", label: "Stages", options: STAGES }]}
      onRowClick={(r) => router.push(`/staff/requirements/${r.id}`)}
      headerActions={user.role === "MSR" && <Button href="/staff/requirements/new">Raise requirement</Button>}
      columns={[
        { key: "number", label: "Number", nowrap: true, render: (r) => <Link href={`/staff/requirements/${r.id}`} className="font-medium text-brand-700 hover:underline">{r.number}</Link> },
        { key: "title", label: "Title" },
        { key: "equipment_name", label: "Equipment" },
        { key: "quantity", label: "Quantity", align: "right", render: (r) => `${r.quantity} ${r.unit}` },
        { key: "stage", label: "Stage", render: (r) => <StateBadge state={r.stage} label={r.stage_label} /> },
        { key: "raised_by_name", label: "Raised by" },
        { key: "required_by", label: "Required by", nowrap: true, render: (r) => date(r.required_by) },
      ]}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <List />
    </Suspense>
  );
}
