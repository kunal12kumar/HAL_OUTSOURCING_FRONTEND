"use client";

import Link from "next/link";
import ActionPanel from "@/components/ActionPanel";
import RegisterList from "@/components/RegisterList";
import { StateBadge } from "@/components/ui";
import { date } from "@/lib/format";

export default function Page() {
  return (
    <RegisterList
      title="Inspections"
      subtitle="Pre-dispatch inspections at vendor premises and inspections of consignments received at HAL."
      path="inspections"
      searchable={false}
      filters={[
        {
          name: "status",
          label: "Statuses",
          options: [
            { value: "PENDING", label: "Pending" },
            { value: "SCHEDULED", label: "Scheduled" },
            { value: "COMPLETED", label: "Completed" },
          ],
        },
        {
          name: "kind",
          label: "Types",
          options: [
            { value: "PDI", label: "Pre-dispatch (vendor)" },
            { value: "HAL", label: "At HAL" },
          ],
        },
      ]}
      columns={(reload) => [
        { key: "po_number", label: "Order", nowrap: true, render: (i) => <Link href={`/staff/orders/${i.po}`} className="font-medium text-brand-700 hover:underline">{i.po_number}</Link> },
        { key: "vendor_name", label: "Vendor" },
        { key: "kind_label", label: "Type" },
        { key: "consignment_number", label: "Consignment", render: (i) => i.consignment_number || "-" },
        { key: "qty_offered", label: "Offered", align: "right" },
        { key: "status", label: "Status", render: (i) => <StateBadge state={i.status} label={i.status_label} /> },
        {
          key: "outcome",
          label: "Result",
          render: (i) =>
            i.outcome ? `${i.qty_accepted} accepted, ${i.qty_rejected} rejected` : i.scheduled_date ? `Scheduled ${date(i.scheduled_date)}` : "-",
        },
        { key: "do", label: "", render: (i) => <div className="flex justify-end gap-1.5"><ActionPanel kind="inspection" obj={i} base={`inspections/${i.id}`} onDone={reload} /></div> },
      ]}
    />
  );
}
