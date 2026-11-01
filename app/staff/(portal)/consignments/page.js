"use client";

import Link from "next/link";
import ActionPanel from "@/components/ActionPanel";
import RegisterList from "@/components/RegisterList";
import { StateBadge } from "@/components/ui";
import { dateTime } from "@/lib/format";

const STATUSES = [
  ["DISPATCHED", "Dispatched by vendor"],
  ["RECEIVED", "Received at gate"],
  ["ACCEPTED", "Accepted at HAL"],
  ["REJECTED", "Rejected at HAL"],
  ["IN_FINISHING", "In finishing"],
  ["FINISHED", "Finished"],
].map(([value, label]) => ({ value, label }));

export default function Page() {
  return (
    <RegisterList
      title="Consignments"
      subtitle="Deliveries from vendors: gate receipt, inspection at HAL and finishing."
      path="consignments"
      exportName="consignments"
      searchable={false}
      filters={[{ name: "status", label: "Statuses", options: STATUSES }]}
      columns={(reload) => [
        { key: "number", label: "Consignment", nowrap: true, render: (c) => <Link href={`/staff/orders/${c.po}`} className="font-medium text-brand-700 hover:underline">{c.number}</Link> },
        { key: "vendor_name", label: "Vendor" },
        { key: "qty", label: "Dispatched", align: "right" },
        { key: "qty_received", label: "Received", align: "right", render: (c) => (c.qty_received === null ? "-" : c.qty_received) },
        { key: "shortage", label: "Shortage", align: "right", render: (c) => (c.shortage ? <span className="font-medium text-red-600">{c.shortage}</span> : "-") },
        { key: "vehicle_no", label: "Vehicle / challan", render: (c) => `${c.vehicle_no} / ${c.challan_no}` },
        { key: "dispatched_at", label: "Dispatched", nowrap: true, render: (c) => dateTime(c.dispatched_at) },
        { key: "status", label: "Status", render: (c) => <StateBadge state={c.status} label={c.status_label} /> },
        { key: "do", label: "", render: (c) => <div className="flex justify-end gap-1.5"><ActionPanel kind="consignment" obj={c} base={`consignments/${c.id}`} onDone={reload} /></div> },
      ]}
    />
  );
}
