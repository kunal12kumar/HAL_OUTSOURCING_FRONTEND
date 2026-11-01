"use client";

import Link from "next/link";
import { useState } from "react";
import ActionPanel, { UploadDocument } from "@/components/ActionPanel";
import DocList from "@/components/DocList";
import FormModal from "@/components/FormModal";
import { useUser } from "@/components/Shell";
import { Alert, Button, Card, DefinitionList, PageHeader, Spinner, StateBadge, Table, Timeline } from "@/components/ui";
import { staff } from "@/lib/api";
import { date } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

export default function RequirementDetail({ id }) {
  const user = useUser();
  const { data: r, error, loading, reload } = useLoad(() => staff(`requirements/${id}/`), id);
  const [editing, setEditing] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error.status === 404 ? "Requirement not found." : error.message}</Alert>;

  const lastReturn = r.stage === "RETURNED" ? [...r.trail].reverse().find((t) => t.decision === "REJECTED") : null;
  const canEdit = user.role === "MSR" && ["DRAFT", "RETURNED"].includes(r.stage);

  return (
    <>
      <PageHeader
        back={{ href: "/staff/requirements", label: "Requirements" }}
        title={`${r.number}: ${r.title}`}
        subtitle={<StateBadge state={r.stage} label={r.stage_label} />}
        actions={
          <>
            {canEdit && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit details
              </Button>
            )}
            <ActionPanel kind="requirement" obj={r} base={`requirements/${r.id}`} onDone={reload} />
          </>
        }
      />

      {lastReturn && (
        <div className="mb-6">
          <Alert tone="amber">
            <strong>Returned by {lastReturn.actor_name}.</strong> {lastReturn.remarks} Edit the requirement and submit it again.
          </Alert>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Requirement">
            <DefinitionList
              items={[
                ["Equipment", r.equipment_name],
                ["Quantity", `${r.quantity} ${r.unit}`],
                ["Required by", date(r.required_by)],
                ["Raised by", r.raised_by_name],
                ["IFS reference", r.ifs_ref],
                ["e-File reference", r.efile_ref],
                ["Description", r.description],
                ["Purpose", r.purpose],
              ]}
            />
          </Card>

          <Card title="Technical and resource planning">
            <DefinitionList
              items={[
                ["Methods advice", r.methods_advice],
                ["Materials (IMM)", r.material_requirements],
              ]}
            />
            {r.allocation && (
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xl font-semibold">{r.allocation.in_house_qty}</p>
                  <p className="text-xs text-slate-500">Made within HAL</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xl font-semibold">{r.allocation.other_division_qty}</p>
                  <p className="text-xs text-slate-500">{r.allocation.other_division_name || "Other divisions"}</p>
                </div>
                <div className="rounded-md bg-brand-50 p-3">
                  <p className="text-xl font-semibold text-brand-700">{r.allocation.outsource_qty}</p>
                  <p className="text-xs text-slate-500">To external vendors</p>
                </div>
              </div>
            )}
          </Card>

          <Card title="Tenders" padded={false}>
            <div className="p-2">
              <Table
                empty="No tender has been raised for this requirement."
                rows={r.tenders}
                columns={[
                  { key: "number", label: "Tender", render: (t) => <Link href={`/staff/tenders/${t.id}`} className="font-medium text-brand-700 hover:underline">{t.number}</Link> },
                  { key: "round", label: "Round" },
                  { key: "status", label: "Status", render: (t) => <StateBadge state={t.status} label={t.status_label} /> },
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Approval trail">
            <Timeline items={r.trail} />
          </Card>
          <Card title="Documents" actions={<UploadDocument base={`requirements/${r.id}`} onDone={reload} />}>
            <DocList docs={r.documents} />
          </Card>
        </div>
      </div>

      {editing && (
        <FormModal
          title="Edit requirement"
          wide
          initial={r}
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "equipment_name", label: "Equipment or material", required: true },
            { name: "quantity", label: "Quantity", type: "number", min: 1, required: true },
            { name: "unit", label: "Unit" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "purpose", label: "Purpose", type: "textarea" },
            { name: "required_by", label: "Required by", type: "date" },
          ]}
          onClose={() => setEditing(false)}
          onSubmit={async (values) => {
            const body = { ...values, quantity: Number(values.quantity) };
            if (!body.required_by) delete body.required_by;
            await staff(`requirements/${r.id}/`, { method: "PATCH", body });
            setEditing(false);
            reload();
          }}
        />
      )}
    </>
  );
}
