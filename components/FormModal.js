"use client";

import { useState } from "react";
import { Alert, Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";

function initialValues(fields, initial = {}) {
  const values = {};
  fields.forEach((f) => {
    values[f.name] = initial[f.name] ?? f.default ?? (f.type === "checkbox" ? false : "");
  });
  return values;
}

// fields: [{ name, label, type, required, options, help, placeholder, min, step }]
// submitButtons: optional [{ label, variant, extra }] - each adds `extra` to the submitted values (used for approve / return).
export default function FormModal({ title, fields, initial, hint, submitLabel = "Save", submitButtons, onSubmit, onClose, wide }) {
  const [values, setValues] = useState(() => initialValues(fields, initial));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  async function submit(extra = {}) {
    setError("");
    const missing = fields.find((f) => f.required && !extra.__skipRequired?.includes(f.name) && (values[f.name] === "" || values[f.name] === null));
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setBusy(true);
    try {
      const { __skipRequired, ...rest } = extra;
      await onSubmit({ ...values, ...rest });
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setBusy(false);
    }
  }

  const buttons = submitButtons || [{ label: submitLabel, variant: "primary", extra: {} }];

  return (
    <Modal title={title} onClose={busy ? () => {} : onClose} wide={wide}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(buttons[0].extra);
        }}
        className="space-y-4"
      >
        {hint && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{hint}</p>}
        {fields.map((f) => (
          <Field key={f.name} label={f.label} help={f.help} required={f.required} htmlFor={`f-${f.name}`}>
            {f.type === "textarea" ? (
              <Textarea id={`f-${f.name}`} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
            ) : f.type === "select" ? (
              <Select id={`f-${f.name}`} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} options={f.options || []} placeholder="Select..." />
            ) : f.type === "checkbox" ? (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input id={`f-${f.name}`} type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                {f.checkboxLabel}
              </label>
            ) : f.type === "file" ? (
              <input id={`f-${f.name}`} type="file" onChange={(e) => set(f.name, e.target.files?.[0] || "")} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200" />
            ) : (
              <Input
                id={`f-${f.name}`}
                type={f.type || "text"}
                value={values[f.name]}
                min={f.min}
                step={f.step}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
              />
            )}
          </Field>
        ))}
        {error && <Alert>{error}</Alert>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {buttons.map((b) => (
            <Button key={b.label} variant={b.variant || "primary"} disabled={busy} onClick={() => submit(b.extra)}>
              {busy ? "Working..." : b.label}
            </Button>
          ))}
        </div>
      </form>
    </Modal>
  );
}
