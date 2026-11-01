"use client";

import Link from "next/link";
import ActionPanel, { UploadDocument } from "@/components/ActionPanel";
import DocList from "@/components/DocList";
import { useUser } from "@/components/Shell";
import { Alert, Badge, Card, DefinitionList, PageHeader, Spinner, Stat, StateBadge, Table } from "@/components/ui";
import { staff } from "@/lib/api";
import { ago, date, dateTime, money } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

export default function OrderDetail({ id }) {
  const user = useUser();
  const { data: o, error, loading, reload } = useLoad(() => staff(`orders/${id}/`), id);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error.status === 404 ? "Order not found." : error.message}</Alert>;

  const latest = o.updates[0];
  const unacked = o.material_issues.filter((m) => !m.acknowledged_at);

  return (
    <>
      <PageHeader
        back={{ href: "/staff/orders", label: "Orders" }}
        title={`${o.number}${o.po_ref ? ` (${o.po_ref})` : ""}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StateBadge state={o.status} label={o.status_label} />
            <span>{o.vendor_name} &middot; {o.equipment_name}</span>
          </span>
        }
        actions={<ActionPanel kind="order" obj={o} base={`orders/${o.id}`} onDone={reload} />}
      />

      <div className="mb-6 space-y-3 empty:hidden">
        {o.is_overdue && <Alert tone="red">Overdue: delivery was due {date(o.delivery_date)} and {o.qty_outstanding} items are still outstanding.</Alert>}
        {o.is_silent && <Alert tone="amber">This vendor has not posted an update {o.last_update_at ? `since ${ago(o.last_update_at)}` : "since the order was placed"}.</Alert>}
        {unacked.length > 0 && <Alert tone="blue">{unacked.length} raw material issue(s) not yet acknowledged by the vendor.</Alert>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Ordered" value={o.quantity} />
        <Stat label="PDI accepted" value={o.qty_pdi_accepted} />
        <Stat label="Ready to ship" value={o.qty_dispatchable} hint="Cleared, not yet dispatched" />
        <Stat label="Received" value={o.qty_received} hint="At HAL gate" />
        <Stat label="Accepted" value={o.qty_accepted} />
        <Stat label="Finished" value={o.qty_finished} />
        <Stat label="Outstanding" value={o.qty_outstanding} tone={o.is_overdue ? "red" : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Vendor progress updates" padded={false}>
            <div className="p-2">
              <Table
                empty="The vendor has not posted any updates yet."
                rows={o.updates}
                columns={[
                  { key: "created_at", label: "Posted", nowrap: true, render: (u) => dateTime(u.created_at) },
                  { key: "percent_complete", label: "Complete", align: "right", render: (u) => `${u.percent_complete}%` },
                  { key: "qty_completed", label: "Items done", align: "right" },
                  { key: "expected_ready_date", label: "Ready by", nowrap: true, render: (u) => date(u.expected_ready_date) },
                  { key: "message", label: "Message" },
                ]}
              />
            </div>
            {latest && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Latest update {ago(latest.created_at)}.</p>}
          </Card>

          <Card title="Raw material issued to vendor" padded={false}>
            <div className="p-2">
              <Table
                empty="No raw material has been issued on this order."
                rows={o.material_issues}
                columns={[
                  { key: "material", label: "Material", render: (m) => <div><p className="font-medium text-slate-800">{m.material}</p><p className="text-xs text-slate-500">{m.specification}</p></div> },
                  { key: "quantity", label: "Issued", align: "right", render: (m) => `${Number(m.quantity)} ${m.unit}` },
                  { key: "dispatch_doc_no", label: "Dispatch doc", render: (m) => `${m.dispatch_doc_no || "-"} ${m.vehicle_no ? `(${m.vehicle_no})` : ""}` },
                  { key: "issued_at", label: "Issued on", nowrap: true, render: (m) => dateTime(m.issued_at) },
                  {
                    key: "ack",
                    label: "Vendor acknowledgement",
                    render: (m) =>
                      m.acknowledged_at ? (
                        <div>
                          <Badge tone={Number(m.acknowledged_qty) === Number(m.quantity) ? "green" : "amber"}>{Number(m.acknowledged_qty)} {m.unit} received</Badge>
                          <p className="mt-0.5 text-xs text-slate-500">{dateTime(m.acknowledged_at)}</p>
                        </div>
                      ) : (
                        <Badge tone="amber">Awaiting</Badge>
                      ),
                  },
                ]}
              />
            </div>
          </Card>

          <Card title="Inspections" padded={false}>
            <div className="p-2">
              <Table
                empty="No inspections requested yet."
                rows={o.inspections}
                columns={[
                  { key: "kind_label", label: "Type" },
                  { key: "qty_offered", label: "Offered", align: "right" },
                  { key: "status", label: "Status", render: (i) => <StateBadge state={i.status} label={i.status_label} /> },
                  {
                    key: "outcome",
                    label: "Result",
                    render: (i) =>
                      i.outcome ? (
                        <div>
                          <StateBadge state={i.outcome === "PARTIAL" ? "PENDING" : i.outcome} label={i.outcome === "PARTIAL" ? "Partly accepted" : i.outcome === "ACCEPTED" ? "Accepted" : "Rejected"} />
                          <p className="mt-0.5 text-xs text-slate-500">{i.qty_accepted} accepted, {i.qty_rejected} rejected</p>
                          {i.deficiencies && <p className="mt-1 max-w-xs text-xs text-red-700">{i.deficiencies}</p>}
                        </div>
                      ) : i.scheduled_date ? (
                        `Scheduled ${date(i.scheduled_date)}`
                      ) : (
                        `Requested ${ago(i.requested_at)}`
                      ),
                  },
                  { key: "do", label: "", render: (i) => <div className="flex justify-end gap-1.5"><ActionPanel kind="inspection" obj={i} base={`inspections/${i.id}`} onDone={reload} /></div> },
                ]}
              />
            </div>
          </Card>

          <Card title="Consignments" padded={false}>
            <div className="p-2">
              <Table
                empty="Nothing has been dispatched yet."
                rows={o.consignments}
                columns={[
                  { key: "number", label: "Consignment", nowrap: true },
                  { key: "qty", label: "Dispatched", align: "right" },
                  { key: "qty_received", label: "Received", align: "right", render: (c) => (c.qty_received === null ? "-" : c.qty_received) },
                  { key: "shortage", label: "Shortage", align: "right", render: (c) => (c.shortage ? <span className="font-medium text-red-600">{c.shortage}</span> : "-") },
                  { key: "qty_accepted", label: "Accepted", align: "right", render: (c) => (c.qty_accepted === null ? "-" : c.qty_accepted) },
                  { key: "vehicle_no", label: "Vehicle / challan", render: (c) => `${c.vehicle_no} / ${c.challan_no}` },
                  { key: "status", label: "Status", render: (c) => <StateBadge state={c.status} label={c.status_label} /> },
                  { key: "do", label: "", render: (c) => <div className="flex justify-end gap-1.5"><ActionPanel kind="consignment" obj={c} base={`consignments/${c.id}`} onDone={reload} /></div> },
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Order details">
            <DefinitionList
              items={[
                ["Vendor", o.vendor_name],
                ["Value", money(o.value)],
                ["Delivery date", date(o.delivery_date)],
                ["Tender", <Link key="t" href={`/staff/tenders/${o.tender}`} className="text-brand-700 hover:underline">{o.tender_number}</Link>],
                ["Requirement", <Link key="r" href={`/staff/requirements/${o.requirement_id}`} className="text-brand-700 hover:underline">{o.requirement_number}</Link>],
                ["Terms", o.terms],
              ]}
            />
          </Card>
          <Card title="Documents" actions={["OUTSOURCING", "INSPECTOR"].includes(user.role) && <UploadDocument base={`orders/${o.id}`} canShare onDone={reload} />}>
            <DocList docs={o.documents} showSharing />
          </Card>
        </div>
      </div>
    </>
  );
}
