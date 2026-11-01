"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { staff, vendor } from "@/lib/api";
import { useUser } from "@/components/Shell";

export default function ChangePassword({ portal }) {
  const router = useRouter();
  const user = useUser();
  const api = portal === "vendor" ? vendor : staff;
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const forced = user?.must_change_password;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api("auth/change-password/", { method: "POST", body: { old_password: oldPassword, new_password: newPassword } });
      window.location.assign(portal === "vendor" ? "/vendor" : "/staff");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={forced ? "Set a new password" : "Change password"} subtitle={forced ? "You are using a temporary password. Choose your own to continue." : undefined} />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label={forced ? "Temporary password" : "Current password"} htmlFor="old">
            <Input id="old" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOld(e.target.value)} required />
          </Field>
          <Field label="New password" htmlFor="new" help="At least 10 characters. Avoid common passwords.">
            <Input id="new" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} required />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm">
            <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="flex justify-end gap-2">
            {!forced && (
              <Button variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Change password"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
