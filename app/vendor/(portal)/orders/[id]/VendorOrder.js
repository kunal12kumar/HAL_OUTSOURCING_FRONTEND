"use client";

import { useState } from "react";
import DocList from "@/components/DocList";
import FormModal from "@/components/FormModal";
import { Alert, Badge, Button, Card, DefinitionList, PageHeader, Spinner, Stat, StateBadge, Table } from "@/components/ui";
import { toFormData, vendor } from "@/lib/api";
import { ago, date, dateTime, money } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

export default function VendorOrder({ id }) {
  const { data: o, error, loading, reload } = useLoad(() => vendor(`orders/${id}/`), id);
  const [modal, setModal] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error.status === 404 ? "Order not found." : error.message}</Alert>;

  const active = o.status === "ACTIVE";
  const post = (path, body) => vendor(`orders/${o.id}/${path}/`, { method: "POST", body });
  const close = () => setModal(null);
  const done = () => {
    close();
    reload();
  };

  return (
    <>
      <PageHeader
        back={{ href: "/vendor", label: "My orders" }}
        title={`${o.number}${o.po_ref ? ` (${o.po_ref})` : ""}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StateBadge state={o.status} label={o.status_label} />
            <span>{o.equipment_name}</span>
          </span>
        }
        actions={
          active && (
            <>
              <Button onClick={() => setModal({ type: "progress" })}>Post progress update</Button>
              <Button variant="secondary" onClick={() => setModal({ type: "pdi" })}>Request inspection</Button>
              <Button variant="secondary" disabled={o.qty_dispatchable < 1} title={o.qty_dispatchable < 1 ? "Only items cleared at pre-dispatch inspection can be dispatched" : undefined} onClick={() => setModal({ type: "dispatch" })}>
                Dispatch
              </Button>
              <Button variant="secondary" onClick={() => setModal({ type: "upload" })}>Upload document</Button>
            </>
          )
        }
      />

      {o.is_overdue && <div className="mb-4"><Alert tone="red">This order was due on {date(o.delivery_date)}. Please post an update with a revised ready date.</Alert></div>}
      {o.unacknowledged_material > 0 && <div className="mb-4"><Alert tone="blue">HAL has issued raw material you have not acknowledged yet. Confirm what you received below.</Alert></div>}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Ordered" value={o.quantity} />
        <Stat label="Cleared by inspection" value={o.qty_pdi_accepted} />
        <Stat label="Ready to dispatch" value={o.qty_dispatchable} />
        <Stat label="Accepted by HAL" value={o.qty_accepted} />
        <Stat label="Outstanding" value={o.qty_outstanding} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Raw material issued by HAL" padded={false}>
            <div className="p-2">
              <Table
                empty="HAL has not issued any raw material on this order."
                rows={o.material_issues}
                columns={[
                  { key: "material", label: "Material", render: (m) => <div><p className="font-medium text-slate-800">{m.material}</p><p className="text-xs text-slate-500">{m.specification}</p></div> },
                  { key: "quantity", label: "Issued", align: "right", render: (m) => `${Number(m.quantity)} ${m.unit}` },
                  { key: "dispatch_doc_no", label: "Dispatch doc", render: (m) => `${m.dispatch_doc_no || "-"} ${m.vehicle_no ? `(${m.vehicle_no})` : ""}` },
                  { key: "issued_at", label: "Issued on", nowrap: true, render: (m) => dateTime(m.issued_at) },
                  {
                    key: "ack",
                    label: "Your acknowledgement",
                    render: (m) =>
                      m.acknowledged_at ? (
                        <Badge tone="green">{Number(m.acknowledged_qty)} {m.unit} received</Badge>
                      ) : active ? (
                        <Button size="sm" onClick={() => setModal({ type: "ack", m })}>Acknowledge</Button>
                      ) : (
                        "-"
                      ),
                  },
                ]}
              />
            </div>
          </Card>

          <Card title="Your progress updates" padded={false}>
            <div className="p-2">
              <Table
                empty="You have not posted an update yet."
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
            {o.updates[0] && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Last update {ago(o.updates[0].created_at)}.</p>}
          </Card>

          <Card title="Inspections" padded={false}>
            <div className="p-2">
              <Table
                empty="No inspections yet."
                rows={o.inspections}
                columns={[
                  { key: "kind_label", label: "Type" },
                  { key: "qty_offered", label: "Items", align: "right" },
                  { key: "status", label: "Status", render: (i) => <StateBadge state={i.status} label={i.status_label} /> },
                  {
                    key: "outcome",
                    label: "Result",
                    render: (i) =>
                      i.outcome ? (
                        <div>
                          <p>{i.qty_accepted} accepted, {i.qty_rejected} rejected</p>
                          {i.deficiencies && <p className="mt-1 max-w-sm text-xs text-red-700">Deficiencies: {i.deficiencies}</p>}
                        </div>
                      ) : i.scheduled_date ? (
                        `Scheduled for ${date(i.scheduled_date)}`
                      ) : (
                        `Requested ${ago(i.requested_at)}`
                      ),
                  },
                ]}
              />
            </div>
          </Card>

          <Card title="Your consignments" padded={false}>
            <div className="p-2">
              <Table
                empty="You have not dispatched anything yet."
                rows={o.consignments}
                columns={[
                  { key: "number", label: "Consignment", nowrap: true },
                  { key: "qty", label: "Sent", align: "right" },
                  { key: "qty_received", label: "Received at gate", align: "right", render: (c) => (c.qty_received === null ? "-" : c.qty_received) },
                  { key: "shortage", label: "Shortage", align: "right", render: (c) => (c.shortage ? <span className="font-medium text-red-600">{c.shortage}</span> : "-") },
                  { key: "qty_accepted", label: "Accepted", align: "right", render: (c) => (c.qty_accepted === null ? "-" : c.qty_accepted) },
                  { key: "vehicle_no", label: "Vehicle / challan", render: (c) => `${c.vehicle_no} / ${c.challan_no}` },
                  { key: "status", label: "Status", render: (c) => <StateBadge state={c.status} label={c.status_label} /> },
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Order details">
            <DefinitionList
              items={[
                ["Order value", money(o.value)],
                ["Delivery date", date(o.delivery_date)],
                ["Scope of work", o.scope],
                ["Terms", o.terms],
              ]}
            />
          </Card>
          <Card title="Documents">
            <DocList docs={o.documents} />
          </Card>
        </div>
      </div>

      {modal?.type === "progress" && (
        <FormModal
          title="Post a progress update"
          hint="HAL sees this immediately. Post an update whenever something material changes."
          fields={[
            { name: "qty_completed", label: "Items completed so far", type: "number", min: 0, default: o.updates[0]?.qty_completed ?? 0, required: true },
            { name: "percent_complete", label: "Overall progress (%)", type: "number", min: 0, default: o.updates[0]?.percent_complete ?? 0, required: true },
            { name: "expected_ready_date", label: "Expected ready date", type: "date" },
            { name: "message", label: "Message to HAL", type: "textarea" },
          ]}
          submitLabel="Post update"
          onClose={close}
          onSubmit={async (v) => {
            const body = { qty_completed: Number(v.qty_completed), percent_complete: Number(v.percent_complete), message: v.message };
            if (v.expected_ready_date) body.expected_ready_date = v.expected_ready_date;
            await post("progress", body);
            done();
          }}
        />
      )}
      {modal?.type === "pdi" && (
        <FormModal
          title="Request pre-dispatch inspection"
          hint="Tell HAL how many items are ready. An inspector will schedule a visit to your premises."
          fields={[
            { name: "qty_offered", label: "Items ready for inspection", type: "number", min: 1, required: true },
            { name: "note", label: "Note for the inspector", type: "textarea" },
          ]}
          submitLabel="Request inspection"
          onClose={close}
          onSubmit={async (v) => {
            await post("request-pdi", { qty_offered: Number(v.qty_offered), note: v.note });
            done();
          }}
        />
      )}
      {modal?.type === "dispatch" && (
        <FormModal
          title="Dispatch a consignment"
          hint={`You can dispatch up to ${o.qty_dispatchable} items: the quantity cleared at pre-dispatch inspection.`}
          fields={[
            { name: "qty", label: "Items in this consignment", type: "number", min: 1, required: true },
            { name: "vehicle_no", label: "Vehicle number", required: true },
            { name: "challan_no", label: "Delivery challan number", required: true },
          ]}
          submitLabel="Record dispatch"
          onClose={close}
          onSubmit={async (v) => {
            await post("dispatch", { qty: Number(v.qty), vehicle_no: v.vehicle_no, challan_no: v.challan_no });
            done();
          }}
        />
      )}
      {modal?.type === "ack" && (
        <FormModal
          title={`Acknowledge ${modal.m.material}`}
          hint={`HAL recorded ${Number(modal.m.quantity)} ${modal.m.unit} issued. Enter what you actually received.`}
          fields={[
            { name: "quantity", label: `Quantity received (${modal.m.unit})`, type: "number", min: 0, step: "0.001", default: Number(modal.m.quantity), required: true },
            { name: "remarks", label: "Remarks (condition, shortage)", type: "textarea" },
          ]}
          submitLabel="Confirm receipt"
          onClose={close}
          onSubmit={async (v) => {
            await vendor(`orders/${o.id}/material/${modal.m.id}/acknowledge/`, { method: "POST", body: { quantity: String(v.quantity), remarks: v.remarks } });
            done();
          }}
        />
      )}
      {modal?.type === "upload" && (
        <FormModal
          title="Upload a document"
          fields={[
            { name: "title", label: "Title", required: true },
            {
              name: "doc_type",
              label: "Type",
              type: "select",
              default: "PROGRESS",
              options: [
                { value: "PROGRESS", label: "Progress photo or report" },
                { value: "DELIVERY", label: "Delivery document" },
                { value: "INSPECTION", label: "Inspection or test record" },
                { value: "OTHER", label: "Other" },
              ],
            },
            { name: "file", label: "File", type: "file", required: true, help: "PDF, images, Office files or ZIP. Up to 15 MB." },
          ]}
          submitLabel="Upload"
          onClose={close}
          onSubmit={async (v) => {
            await vendor(`orders/${o.id}/documents/`, { method: "POST", form: toFormData(v) });
            done();
          }}
        />
      )}
    </>
  );
}
