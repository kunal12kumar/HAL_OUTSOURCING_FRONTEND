"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/components/Shell";
import { Alert, Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { staff } from "@/lib/api";

export default function NewRequirement() {
  const router = useRouter();
  const user = useUser();
  const [v, setV] = useState({ title: "", equipment_name: "", description: "", quantity: "", unit: "Nos", purpose: "", required_by: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  if (user.role !== "MSR") {
    return <Alert tone="amber">Only the MSR Department raises requirements.</Alert>;
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { ...v, quantity: Number(v.quantity) };
      if (!body.required_by) delete body.required_by;
      const res = await staff("requirements/", { method: "POST", body });
      router.replace(`/staff/requirements/${res.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Raise a requirement" subtitle="Describe what is needed. You can edit it until it is submitted for approval." back={{ href: "/staff/requirements", label: "Requirements" }} />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required htmlFor="title">
            <Input id="title" value={v.title} onChange={set("title")} required />
          </Field>
          <Field label="Equipment or material" required htmlFor="eq">
            <Input id="eq" value={v.equipment_name} onChange={set("equipment_name")} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantity" required htmlFor="qty">
              <Input id="qty" type="number" min="1" value={v.quantity} onChange={set("quantity")} required />
            </Field>
            <Field label="Unit" htmlFor="unit">
              <Input id="unit" value={v.unit} onChange={set("unit")} />
            </Field>
          </div>
          <Field label="Description" htmlFor="desc">
            <Textarea id="desc" value={v.description} onChange={set("description")} />
          </Field>
          <Field label="Purpose" htmlFor="purpose">
            <Textarea id="purpose" value={v.purpose} onChange={set("purpose")} />
          </Field>
          <Field label="Required by" htmlFor="by">
            <Input id="by" type="date" value={v.required_by} onChange={set("required_by")} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save as draft"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
