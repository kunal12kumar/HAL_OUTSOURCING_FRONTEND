"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Badge, Card, PageHeader, Spinner, Stat, StateBadge, Table } from "@/components/ui";
import { vendor } from "@/lib/api";
import { ago, date, money } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

const TODO_TONE = { material: "blue", update: "amber", inspection: "blue", deficiency: "red", dispatch: "green" };
const TODO_LABEL = { material: "Material", update: "Update due", inspection: "Inspection", deficiency: "Rejected", dispatch: "Ready to ship" };

export default function VendorHome() {
  const router = useRouter();
  const { data: d, error, loading } = useLoad(() => vendor("dashboard/"));

  if (loading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  return (
    <>
      <PageHeader title={d.vendor.name} subtitle={`Vendor code ${d.vendor.code}. Everything you report here goes straight to HAL, so there is no need to email updates.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Active orders" value={d.active_orders} />
        <Stat label="Overdue" value={d.overdue_orders} tone={d.overdue_orders ? "red" : undefined} />
        <Stat label="Things to do" value={d.todo.length} tone={d.todo.length ? "amber" : undefined} />
      </div>

      <Card title="What needs your attention" className="mb-6">
        {d.todo.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing is waiting on you.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {d.todo.map((t, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 py-2.5">
                <Badge tone={TODO_TONE[t.kind]}>{TODO_LABEL[t.kind]}</Badge>
                <Link href={`/vendor/orders/${t.order_id}`} className="text-sm font-medium text-brand-700 hover:underline">
                  {t.order_number}
                </Link>
                <span className="text-sm text-slate-700">{t.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Your active orders" padded={false}>
        <div className="p-2">
          <Table
            empty="You have no active orders."
            rows={d.orders}
            onRowClick={(o) => router.push(`/vendor/orders/${o.id}`)}
            columns={[
              { key: "number", label: "Order", nowrap: true, render: (o) => <Link href={`/vendor/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">{o.number}</Link> },
              { key: "equipment_name", label: "Item" },
              { key: "quantity", label: "Ordered", align: "right" },
              { key: "qty_accepted", label: "Accepted by HAL", align: "right" },
              { key: "qty_outstanding", label: "Outstanding", align: "right" },
              { key: "value", label: "Value", align: "right", render: (o) => money(o.value) },
              { key: "delivery_date", label: "Due", nowrap: true, render: (o) => <span>{date(o.delivery_date)} {o.is_overdue && <Badge tone="red">Overdue</Badge>}</span> },
              { key: "last_update_at", label: "Your last update", nowrap: true, render: (o) => ago(o.last_update_at) },
              { key: "status", label: "Status", render: (o) => <StateBadge state={o.status} label={o.status_label} /> },
            ]}
          />
        </div>
      </Card>
    </>
  );
}
