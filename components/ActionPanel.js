"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FormModal from "@/components/FormModal";
import { Button } from "@/components/ui";
import { listOf, staff, toFormData } from "@/lib/api";

const REMARKS = { name: "remarks", label: "Remarks", type: "textarea" };

const decision = (path, approveLabel, rejectLabel, remarksHelp) => ({
  path,
  title: `${approveLabel} or ${rejectLabel.toLowerCase()}`,
  button: "Record decision",
  fields: [{ ...REMARKS, help: remarksHelp }],
  buttons: [
    { label: rejectLabel, variant: "danger", extra: { approve: false } },
    { label: approveLabel, variant: "primary", extra: { approve: true, __skipRequired: ["remarks"] } },
  ],
});

// What each action needs. `kind` + the action key come from the API's `actions` list for the logged-in role.
export const ACTION_DEFS = {
  requirement: {
    submit: {
      path: "submit",
      button: "Submit for approval",
      title: "Submit requirement",
      hint: "Records that this requirement is being routed through IFS and e-File to the Approval Committee.",
      fields: [
        { name: "ifs_ref", label: "IFS reference" },
        { name: "efile_ref", label: "e-File reference" },
      ],
    },
    committee_decision: decision("committee-decision", "Approve", "Return to MSR", "Required when returning, so MSR knows what to change."),
    methods_advice: {
      path: "methods-advice",
      button: "Record Methods advice",
      title: "Manufacturing and process advice",
      fields: [{ name: "text", label: "Advice", type: "textarea", required: true, help: "How the equipment should be manufactured and which processes are needed." }],
    },
    imm_assessment: {
      path: "imm-assessment",
      button: "Record material assessment",
      title: "Material and procurement requirements",
      fields: [{ name: "text", label: "Materials needed and availability", type: "textarea", required: true }],
    },
    allocate: {
      path: "allocate",
      button: "Record allocation",
      title: "Split the quantity between sources",
      hint: (o) => `The three quantities must add up to ${o.quantity} ${o.unit}. Only the vendor quantity goes to tender.`,
      fields: [
        { name: "in_house_qty", label: "Made within HAL", type: "number", min: 0, default: 0, required: true },
        { name: "other_division_qty", label: "From other HAL divisions", type: "number", min: 0, default: 0, required: true },
        { name: "other_division_name", label: "Name of the other division" },
        { name: "outsource_qty", label: "To external vendors", type: "number", min: 0, default: 0, required: true },
        REMARKS,
      ],
      numeric: ["in_house_qty", "other_division_qty", "outsource_qty"],
    },
    create_tender: {
      path: "create-tender",
      button: "Create tender",
      title: "Create tender",
      hint: (o) => `The tender will cover ${o.allocation?.outsource_qty ?? 0} ${o.unit} (the vendor quantity).`,
      fields: [{ name: "scope", label: "Tender scope", type: "textarea", required: true, help: "What the vendor must manufacture, to which drawings and specifications." }],
      redirect: (res) => `/staff/tenders/${res.id}`,
    },
  },
  tender: {
    submit: {
      path: "submit",
      button: "Submit for committee approval",
      title: "Submit tender for approval",
      fields: [{ name: "efile_ref", label: "e-File reference" }],
    },
    committee_decision: decision("committee-decision", "Approve tender", "Return to Outsourcing", "Required when returning."),
    set_estimate: {
      path: "set-estimate",
      button: "Enter MSD estimate",
      title: "Manufacturing cost estimate",
      fields: [
        { name: "amount", label: "Estimated price (INR)", type: "number", min: 1, step: "0.01", required: true },
        REMARKS,
      ],
    },
    review_estimate: decision("review-estimate", "Approve estimate", "Send back to MSD", "Required when sending back."),
    publish: {
      path: "publish",
      button: "Publish tender",
      title: "Publish on GeM and the HAL e-Portal",
      hint: "Both references are required. Publication happens in parallel on both portals.",
      fields: [
        { name: "gem_ref", label: "GeM bid number", required: true },
        { name: "eportal_ref", label: "HAL e-Portal reference", required: true },
        { name: "closing_date", label: "Closing date", type: "date", required: true },
      ],
    },
    add_quotation: {
      path: "quotations",
      button: "Record quotation",
      title: "Record a vendor quotation",
      needs: "vendors",
      fields: [
        { name: "vendor", label: "Vendor", type: "select", required: true },
        { name: "price", label: "Quoted price (INR)", type: "number", min: 1, step: "0.01", required: true },
        { name: "delivery_days", label: "Delivery period (days)", type: "number", min: 0, default: 30 },
        {
          name: "source",
          label: "Received through",
          type: "select",
          default: "GEM",
          options: [
            { value: "GEM", label: "GeM" },
            { value: "EPORTAL", label: "HAL e-Portal" },
            { value: "OTHER", label: "Other" },
          ],
        },
        REMARKS,
      ],
      numeric: ["price", "delivery_days"],
    },
    start_evaluation: {
      path: "start-evaluation",
      button: "Close bidding and start evaluation",
      title: "Start evaluation",
      hint: "Technical and commercial evaluation of the recorded quotations begins.",
      fields: [],
    },
    refer_to_pnc: {
      path: "refer-to-pnc",
      button: "Refer to PNC Committee",
      title: "No acceptable quotation: refer to PNC",
      hint: "Only possible when no technically qualified quotation is at or below the estimate.",
      fields: [REMARKS],
    },
    pnc_decision: {
      path: "pnc-decision",
      button: "Record PNC decision",
      title: "PNC Committee recommendation",
      hint: "A new tender round opens, linked to this one. Leave the revised estimate empty to retender at the existing estimate.",
      fields: [
        { name: "revised_estimate", label: "Revised estimate (INR)", type: "number", min: 1, step: "0.01", help: "Must be higher than the current estimate." },
        REMARKS,
      ],
      optionalNumeric: ["revised_estimate"],
      redirect: (res) => `/staff/tenders/${res.id}`,
    },
  },
  order: {
    issue_material: {
      path: "issue-material",
      button: "Issue raw material",
      title: "Issue raw material to the vendor",
      fields: [
        { name: "material", label: "Material", required: true },
        { name: "specification", label: "Specification" },
        { name: "quantity", label: "Quantity", type: "number", min: 0.001, step: "0.001", required: true },
        { name: "unit", label: "Unit", default: "kg", required: true },
        { name: "vehicle_no", label: "Vehicle number" },
        { name: "dispatch_doc_no", label: "Dispatch document number" },
        REMARKS,
      ],
    },
    revise_delivery_date: {
      path: "revise-delivery-date",
      button: "Revise delivery date",
      title: "Revise delivery date",
      fields: [
        { name: "delivery_date", label: "New delivery date", type: "date", required: true },
        { name: "remarks", label: "Reason", type: "textarea", required: true },
      ],
      variant: "secondary",
    },
  },
  inspection: {
    schedule: {
      path: "schedule",
      button: "Schedule",
      title: "Schedule inspection",
      fields: [{ name: "date", label: "Inspection date", type: "date", required: true }],
      variant: "secondary",
    },
    complete: {
      path: "complete",
      button: "Record result",
      title: "Record inspection result",
      hint: (o) => `Accepted plus rejected must equal ${o.qty_offered}. Deficiencies are shared with the vendor; internal notes are not.`,
      fields: [
        { name: "qty_accepted", label: "Accepted", type: "number", min: 0, default: 0, required: true },
        { name: "qty_rejected", label: "Rejected", type: "number", min: 0, default: 0, required: true },
        { name: "report", label: "Inspection report", type: "textarea", required: true },
        { name: "deficiencies", label: "Deficiencies (shown to the vendor)", type: "textarea", help: "Required if anything is rejected." },
        { name: "internal_notes", label: "Internal notes (never shown to the vendor)", type: "textarea" },
      ],
      numeric: ["qty_accepted", "qty_rejected"],
    },
  },
  consignment: {
    gate_receipt: {
      path: "gate-receipt",
      button: "Record receipt",
      title: "Gate receipt and quantity check",
      hint: (o) => `Declared by the vendor: ${o.qty} items on challan ${o.challan_no}, vehicle ${o.vehicle_no}.`,
      fields: [
        { name: "qty_received", label: "Quantity actually received", type: "number", min: 1, required: true },
        REMARKS,
      ],
      numeric: ["qty_received"],
    },
    start_finishing: { path: "start-finishing", button: "Start finishing", title: "Start finishing", fields: [], hint: "Marks the accepted items as in finishing." },
    complete_finishing: { path: "complete-finishing", button: "Complete finishing", title: "Complete finishing", fields: [REMARKS] },
  },
};

const HIDDEN = new Set(["evaluate_quotation", "award"]);

function clean(def, values) {
  const body = { ...values };
  (def.numeric || []).forEach((k) => (body[k] = Number(body[k] || 0)));
  (def.optionalNumeric || []).forEach((k) => {
    if (body[k] === "" || body[k] === undefined) delete body[k];
  });
  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
  return body;
}

// Shows one button per action the API says the current user may take on this record.
export default function ActionPanel({ kind, obj, base, onDone }) {
  const router = useRouter();
  const [open, setOpen] = useState(null);
  const [options, setOptions] = useState({});
  const defs = ACTION_DEFS[kind] || {};
  const actions = (obj.actions || []).filter((a) => defs[a] && !HIDDEN.has(a));
  if (!actions.length) return null;

  async function openAction(key) {
    const def = defs[key];
    if (def.needs === "vendors" && !options.vendor) {
      const vendors = listOf(await staff("vendors/"));
      setOptions((o) => ({ ...o, vendor: vendors.filter((v) => v.status !== "SUSPENDED").map((v) => ({ value: v.id, label: `${v.code} - ${v.name}` })) }));
    }
    setOpen(key);
  }

  const def = open ? defs[open] : null;
  const fields = def?.fields.map((f) => (options[f.name] ? { ...f, options: options[f.name] } : f)) || [];

  return (
    <>
      {actions.map((key, i) => (
        <Button key={key} variant={defs[key].variant || (i === 0 ? "primary" : "secondary")} onClick={() => openAction(key)}>
          {defs[key].button}
        </Button>
      ))}
      {def && (
        <FormModal
          title={def.title}
          hint={typeof def.hint === "function" ? def.hint(obj) : def.hint}
          fields={fields}
          submitLabel={def.button}
          submitButtons={def.buttons}
          onClose={() => setOpen(null)}
          onSubmit={async (values) => {
            const res = await staff(`${base}/${def.path}/`, { method: "POST", body: clean(def, values) });
            setOpen(null);
            if (def.redirect) router.push(def.redirect(res));
            else onDone?.(res);
          }}
        />
      )}
    </>
  );
}

export function UploadDocument({ base, canShare, onDone, label = "Upload document" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <FormModal
          title="Upload document"
          submitLabel="Upload"
          hint={canShare ? "Tick the box to make this visible to the vendor on their portal. Leave it unticked for internal documents." : undefined}
          fields={[
            { name: "title", label: "Title", required: true },
            {
              name: "doc_type",
              label: "Type",
              type: "select",
              default: "DRAWING",
              options: [
                { value: "DRAWING", label: "Technical drawing" },
                { value: "SPEC", label: "Specification" },
                { value: "INSTRUCTION", label: "Manufacturing instruction" },
                { value: "MODEL", label: "Model or diagram" },
                { value: "INSPECTION", label: "Inspection report" },
                { value: "DELIVERY", label: "Delivery document" },
                { value: "OTHER", label: "Other" },
              ],
            },
            { name: "file", label: "File", type: "file", required: true, help: "PDF, images, Office files, drawings (DWG, DXF, STEP) or ZIP. Up to 15 MB." },
            ...(canShare ? [{ name: "visible_to_vendor", label: "Visibility", type: "checkbox", checkboxLabel: "Share with the vendor" }] : []),
          ]}
          onClose={() => setOpen(false)}
          onSubmit={async (values) => {
            await staff(`${base}/documents/`, { method: "POST", form: toFormData({ ...values, visible_to_vendor: values.visible_to_vendor ? "true" : "false" }) });
            setOpen(false);
            onDone?.();
          }}
        />
      )}
    </>
  );
}
