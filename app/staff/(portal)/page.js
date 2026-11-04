"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Badge, Button, Card, PageHeader, Spinner, Stat, StateBadge, Table } from "@/components/ui";
import { useUser } from "@/components/Shell";
import { staff } from "@/lib/api";
import { ago, date, ROLE_LABELS, titleCase } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

const HREF = { requirement: "requirements", tender: "tenders", inspection: "inspections", consignment: "consignments" };
const ACTION_TEXT = {
  submit: "Submit",
  committee_decision: "Approve or return",
  methods_advice: "Record advice",
  imm_assessment: "Record materials",
  allocate: "Split quantity",
  create_tender: "Create tender",
  set_estimate: "Enter estimate",
  review_estimate: "Review estimate",
  publish: "Publish",
  add_quotation: "Record quotations",
  start_evaluation: "Start evaluation",
  evaluate_quotation: "Evaluate quotations",
  award: "Award",
  refer_to_pnc: "Refer to PNC",
  schedule: "Schedule",
  complete: "Record result",
  gate_receipt: "Record receipt",
  start_finishing: "Start finishing",
  complete_finishing: "Complete finishing",
  pnc_decision: "Recommend",
};

const STAGES = [
  ["DRAFT", "Draft"],
  ["SUBMITTED", "With committee"],
  ["APPROVED", "Methods"],
  ["METHODS_DONE", "IMM"],
  ["IMM_DONE", "Scheduling"],
  ["ALLOCATED", "To tender"],
  ["TENDERING", "Tendering"],
  ["IN_EXECUTION", "In execution"],
  ["CLOSED", "Closed"],
];

function OrderRows({ orders, empty }) {
  return (
    <Table
      empty={empty}
      rows={orders}
      columns={[
        { key: "number", label: "Order", render: (o) => <Link className="font-medium text-brand-700 hover:underline" href={`/staff/orders/${o.id}`}>{o.number}</Link> },
        { key: "vendor_name", label: "Vendor" },
        { key: "equipment_name", label: "Item" },
        { key: "delivery_date", label: "Due", render: (o) => date(o.delivery_date), nowrap: true },
        { key: "qty_outstanding", label: "Outstanding", align: "right" },
        { key: "last_update_at", label: "Last update", render: (o) => ago(o.last_update_at), nowrap: true },
      ]}
    />
  );
}

export default function Home() {
  const user = useUser();
  const router = useRouter();
  const queue = useLoad(() => staff("queue/"));
  const dash = useLoad(() => staff("dashboard/"));
  const d = dash.data;

  return (
    <>
      <PageHeader title={`Welcome, ${user.first_name || user.username}`} subtitle={ROLE_LABELS[user.role]} />

      {user.role === "ADMIN" && (
        <Card
          title="Website workflow guide"
          className="mb-6"
          actions={<Button href="/staff/guide">Open the guide</Button>}
        >
          <p className="text-sm text-slate-600">
            A walkthrough of how a requirement moves through the website, from the MSR Department to finishing, including the vendor portal and the audit log. Visible to the administrator only.
          </p>
        </Card>
      )}

      {user.role !== "ADMIN" && (
        <Card title={`Waiting for you${queue.data ? ` (${queue.data.count})` : ""}`} className="mb-6" padded={false}>
          <div className="p-2">
            {queue.loading ? (
              <Spinner />
            ) : queue.error ? (
              <Alert>{queue.error.message}</Alert>
            ) : (
              <Table
                empty="Nothing is waiting on you right now."
                rows={queue.data.items}
                rowKey={(i) => `${i.kind}-${i.id}`}
                onRowClick={(i) => router.push(i.kind === "inspection" || i.kind === "consignment" ? `/staff/${HREF[i.kind]}` : `/staff/${HREF[i.kind]}/${i.id}`)}
                columns={[
                  { key: "kind", label: "Type", render: (i) => <Badge tone="slate">{titleCase(i.kind)}</Badge> },
                  { key: "number", label: "Reference", render: (i) => <span className="font-medium text-brand-700">{i.number}</span> },
                  { key: "title", label: "Subject" },
                  { key: "state_label", label: "Status", render: (i) => <StateBadge state={i.state} label={i.state_label} /> },
                  { key: "actions", label: "What to do", render: (i) => [...new Set(i.actions.map((a) => ACTION_TEXT[a] || titleCase(a)))].join(", ") },
                ]}
              />
            )}
          </div>
        </Card>
      )}

      {dash.error && <Alert>{dash.error.message}</Alert>}
      {d && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Active orders" value={d.active_orders} />
            <Stat label="Overdue" value={d.overdue_orders.length} tone={d.overdue_orders.length ? "red" : undefined} />
            <Stat label="Silent vendors" value={d.silent_orders.length} tone={d.silent_orders.length ? "amber" : undefined} hint={`No update in ${d.silent_days_threshold}+ days`} />
            <Stat label="PDI waiting" value={d.pdi_waiting} />
            <Stat label="In transit" value={d.consignments_in_transit} hint="Dispatched, not yet at gate" />
            <Stat label="HAL inspection" value={d.hal_inspections_waiting} hint="Received, awaiting check" />
          </div>

          <Card title="Requirements by stage" className="mb-6">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
              {STAGES.map(([key, label]) => (
                <Link key={key} href={`/staff/requirements?stage=${key}`} className="rounded-md bg-slate-50 px-3 py-2 text-center hover:bg-brand-50">
                  <p className="text-xl font-semibold text-slate-900">{d.requirements_by_stage[key] || 0}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </Link>
              ))}
            </div>
          </Card>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card title="Overdue orders" padded={false}>
              <div className="p-2">
                <OrderRows orders={d.overdue_orders} empty="No overdue orders." />
              </div>
            </Card>
            <Card title={`Vendors gone quiet (${d.silent_days_threshold}+ days without an update)`} padded={false}>
              <div className="p-2">
                <OrderRows orders={d.silent_orders} empty="Every vendor has reported recently." />
              </div>
            </Card>
          </div>

          <Card title="Latest vendor updates">
            {d.recent_updates.length === 0 ? (
              <p className="text-sm text-slate-500">No vendor updates yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {d.recent_updates.map((u) => (
                  <li key={u.id} className="py-3">
                    <p className="text-sm text-slate-800">
                      <Link href={`/staff/orders/${u.po_id}`} className="font-medium text-brand-700 hover:underline">{u.po_number}</Link>
                      {" "}&middot; {u.vendor_name} &middot; {u.equipment_name}
                      <span className="ml-2 text-xs text-slate-400">{ago(u.created_at)}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {u.percent_complete}% complete, {u.qty_completed} items done
                      {u.expected_ready_date ? `, ready by ${date(u.expected_ready_date)}` : ""}
                      {u.message ? ` - ${u.message}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
}
