"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import RegisterList from "@/components/RegisterList";
import { Badge, StateBadge } from "@/components/ui";
import { ago, date, money } from "@/lib/format";

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function Page() {
  const router = useRouter();
  return (
    <RegisterList
      title="Purchase orders"
      subtitle="Orders placed with vendors, with what has been delivered and what is still outstanding."
      path="orders"
      exportName="orders"
      filters={[{ name: "status", label: "Statuses", options: STATUSES }]}
      onRowClick={(o) => router.push(`/staff/orders/${o.id}`)}
      columns={[
        { key: "number", label: "Order", nowrap: true, render: (o) => <Link href={`/staff/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">{o.number}</Link> },
        { key: "vendor_name", label: "Vendor" },
        { key: "equipment_name", label: "Item" },
        { key: "quantity", label: "Ordered", align: "right" },
        { key: "qty_accepted", label: "Accepted", align: "right" },
        { key: "qty_outstanding", label: "Outstanding", align: "right" },
        { key: "value", label: "Value", align: "right", render: (o) => money(o.value) },
        {
          key: "delivery_date",
          label: "Due",
          nowrap: true,
          render: (o) => (
            <span>
              {date(o.delivery_date)} {o.is_overdue && <Badge tone="red">Overdue</Badge>}
            </span>
          ),
        },
        {
          key: "last_update_at",
          label: "Last update",
          nowrap: true,
          render: (o) => (
            <span>
              {ago(o.last_update_at)} {o.is_silent && <Badge tone="amber">Silent</Badge>}
            </span>
          ),
        },
        { key: "status", label: "Status", render: (o) => <StateBadge state={o.status} label={o.status_label} /> },
      ]}
    />
  );
}
