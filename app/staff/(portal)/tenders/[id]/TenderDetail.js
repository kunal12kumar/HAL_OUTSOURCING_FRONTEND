"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ActionPanel, { UploadDocument } from "@/components/ActionPanel";
import DocList from "@/components/DocList";
import FormModal from "@/components/FormModal";
import { useUser } from "@/components/Shell";
import { Alert, Badge, Button, Card, DefinitionList, PageHeader, Spinner, StateBadge, Table, Timeline } from "@/components/ui";
import { staff } from "@/lib/api";
import { date, money } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

function vsEstimate(price, estimate) {
  if (!estimate) return "-";
  const pct = ((price - estimate) / estimate) * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export default function TenderDetail({ id }) {
  const router = useRouter();
  const user = useUser();
  const { data: t, error, loading, reload } = useLoad(() => staff(`tenders/${id}/`), id);
  const [modal, setModal] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error.status === 404 ? "Tender not found." : error.message}</Alert>;

  const can = (a) => t.actions.includes(a);
  const eligible = t.quotations.filter((q) => q.eligible);
  const lowestEligible = eligible.length ? Math.min(...eligible.map((q) => Number(q.price))) : null;
  const estimate = t.estimated_price ? Number(t.estimated_price) : null;
  const showTechnical = ["PUBLISHED", "EVALUATION"].includes(t.status);

  return (
    <>
      <PageHeader
        back={{ href: "/staff/tenders", label: "Tenders" }}
        title={`${t.number} (round ${t.round})`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StateBadge state={t.status} label={t.status_label} />
            <span>
              for{" "}
              <Link href={`/staff/requirements/${t.requirement}`} className="text-brand-700 hover:underline">
                {t.requirement_number} {t.requirement_title}
              </Link>
            </span>
          </span>
        }
        actions={<ActionPanel kind="tender" obj={t} base={`tenders/${t.id}`} onDone={reload} />}
      />

      {t.status === "PNC_REVIEW" && (
        <div className="mb-6">
          <Alert tone="amber">No acceptable quotation was at or below the estimate. The PNC Committee decides whether to revise the estimate or retender at the existing one.</Alert>
        </div>
      )}
      {t.status === "RETENDERED" && (
        <div className="mb-6">
          <Alert tone="blue">This round was superseded. See the newer round below.</Alert>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Tender details">
            <DefinitionList
              items={[
                ["Quantity to outsource", t.quantity],
                ["MSD estimate", money(t.estimated_price)],
                ["Closing date", date(t.closing_date)],
                ["GeM bid number", t.gem_ref],
                ["HAL e-Portal reference", t.eportal_ref],
                ["e-File reference", t.efile_ref],
                ["Scope", t.scope],
                ["Previous round", t.parent_number],
              ]}
            />
          </Card>

          <Card title={`Quotations (${t.quotations.length})`} padded={false}>
            <div className="p-2">
              <Table
                empty="No quotations recorded yet."
                rows={t.quotations}
                columns={[
                  {
                    key: "vendor_name",
                    label: "Vendor",
                    render: (q) => (
                      <div>
                        <p className="font-medium text-slate-800">{q.vendor_name}</p>
                        <p className="text-xs text-slate-500">{q.vendor_code}</p>
                      </div>
                    ),
                  },
                  { key: "price", label: "Price", align: "right", render: (q) => money(q.price) },
                  {
                    key: "vs",
                    label: "Against estimate",
                    align: "right",
                    render: (q) => <span className={q.within_estimate ? "text-emerald-700" : "text-red-600"}>{vsEstimate(Number(q.price), estimate)}</span>,
                  },
                  { key: "delivery_days", label: "Days", align: "right" },
                  {
                    key: "tech",
                    label: "Technical",
                    render: (q) =>
                      q.technically_qualified === null ? <Badge tone="slate">Not evaluated</Badge> : q.technically_qualified ? <Badge tone="green">Qualified</Badge> : <Badge tone="red">Not qualified</Badge>,
                  },
                  {
                    key: "result",
                    label: "Result",
                    render: (q) =>
                      q.eligible ? (
                        <Badge tone="green">{Number(q.price) === lowestEligible ? "Eligible, lowest" : "Eligible"}</Badge>
                      ) : q.technically_qualified && !q.within_estimate ? (
                        <Badge tone="red">Above estimate</Badge>
                      ) : null,
                  },
                  {
                    key: "do",
                    label: "",
                    render: (q) => (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {can("evaluate_quotation") && showTechnical && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => setModal({ type: "evaluate", q, qualified: true })}>
                              Qualify
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setModal({ type: "evaluate", q, qualified: false })}>
                              Disqualify
                            </Button>
                          </>
                        )}
                        {can("award") && q.eligible && (
                          <Button size="sm" onClick={() => setModal({ type: "award", q })}>
                            Award
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
            {user.role === "OUTSOURCING" && showTechnical && (
              <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                The lowest quotation is not automatically the winner: a vendor must be technically qualified and at or below the estimate. If none is, refer the tender to the PNC Committee.
              </p>
            )}
          </Card>

          {t.rounds.length > 1 && (
            <Card title="Tender rounds" padded={false}>
              <div className="p-2">
                <Table
                  rows={t.rounds}
                  columns={[
                    { key: "round", label: "Round" },
                    { key: "number", label: "Tender", render: (r) => <Link href={`/staff/tenders/${r.id}`} className="font-medium text-brand-700 hover:underline">{r.number}</Link> },
                    { key: "estimated_price", label: "Estimate", align: "right", render: (r) => money(r.estimated_price) },
                    { key: "status", label: "Status", render: (r) => <StateBadge state={r.status} /> },
                  ]}
                />
              </div>
            </Card>
          )}

          {t.orders.length > 0 && (
            <Card title="Purchase order">
              {t.orders.map((o) => (
                <Link key={o.id} href={`/staff/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">
                  {o.number}
                </Link>
              ))}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Decision trail">
            <Timeline items={t.trail} />
          </Card>
          <Card title="Documents" actions={["OUTSOURCING", "MSD"].includes(user.role) && <UploadDocument base={`tenders/${t.id}`} onDone={reload} />}>
            <DocList docs={t.documents} />
          </Card>
        </div>
      </div>

      {modal?.type === "evaluate" && (
        <FormModal
          title={`${modal.qualified ? "Qualify" : "Disqualify"} ${modal.q.vendor_name}`}
          hint={modal.qualified ? "Confirms the vendor meets the mandatory technical requirements of the tender." : "A commercially attractive quotation cannot make up for a failed mandatory technical requirement. State the reason."}
          fields={[{ name: "remarks", label: modal.qualified ? "Remarks" : "Reason", type: "textarea", required: !modal.qualified }]}
          submitLabel={modal.qualified ? "Mark qualified" : "Mark not qualified"}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await staff(`tenders/${t.id}/evaluate-quotation/`, { method: "POST", body: { quotation: modal.q.id, qualified: modal.qualified, remarks: v.remarks } });
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.type === "award" && (
        <FormModal
          title={`Award to ${modal.q.vendor_name}`}
          hint={`This places the purchase order for ${money(modal.q.price)}. It then lets HAL issue the vendor a portal login.`}
          fields={[
            { name: "delivery_date", label: "Delivery date", type: "date", help: `Leave empty to use today plus the quoted ${modal.q.delivery_days} days.` },
            { name: "po_ref", label: "HAL purchase order number" },
            { name: "terms", label: "Terms", type: "textarea" },
          ]}
          submitLabel="Place purchase order"
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            const body = { quotation: modal.q.id, po_ref: v.po_ref, terms: v.terms };
            if (v.delivery_date) body.delivery_date = v.delivery_date;
            const po = await staff(`tenders/${t.id}/award/`, { method: "POST", body });
            router.push(`/staff/orders/${po.id}`);
          }}
        />
      )}
    </>
  );
}
