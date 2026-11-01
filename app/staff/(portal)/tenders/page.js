"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import RegisterList from "@/components/RegisterList";
import { StateBadge } from "@/components/ui";
import { date, money } from "@/lib/format";

const STATUSES = [
  ["DRAFT", "Draft"],
  ["PENDING_APPROVAL", "Awaiting committee approval"],
  ["APPROVED", "Awaiting MSD estimate"],
  ["ESTIMATED", "Awaiting internal review"],
  ["READY_TO_PUBLISH", "Ready to publish"],
  ["PUBLISHED", "Published"],
  ["EVALUATION", "Under evaluation"],
  ["PNC_REVIEW", "With PNC Committee"],
  ["AWARDED", "Awarded"],
  ["RETENDERED", "Superseded by a new round"],
].map(([value, label]) => ({ value, label }));

export default function Page() {
  const router = useRouter();
  return (
    <RegisterList
      title="Tenders"
      subtitle="Tenders for the portion of each requirement that goes to external vendors."
      path="tenders"
      exportName="tenders"
      filters={[{ name: "status", label: "Statuses", options: STATUSES }]}
      onRowClick={(t) => router.push(`/staff/tenders/${t.id}`)}
      columns={[
        { key: "number", label: "Tender", nowrap: true, render: (t) => <Link href={`/staff/tenders/${t.id}`} className="font-medium text-brand-700 hover:underline">{t.number}</Link> },
        { key: "round", label: "Round", align: "right" },
        { key: "requirement_number", label: "Requirement", render: (t) => `${t.requirement_number} ${t.requirement_title}` },
        { key: "quantity", label: "Qty", align: "right" },
        { key: "estimated_price", label: "MSD estimate", align: "right", render: (t) => money(t.estimated_price) },
        { key: "quotation_count", label: "Quotes", align: "right" },
        { key: "closing_date", label: "Closes", nowrap: true, render: (t) => date(t.closing_date) },
        { key: "status", label: "Status", render: (t) => <StateBadge state={t.status} label={t.status_label} /> },
      ]}
    />
  );
}
