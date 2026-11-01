"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { staff, vendor } from "@/lib/api";

export default function LoginForm({ portal }) {
  const router = useRouter();
  const isVendor = portal === "vendor";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await (isVendor ? vendor : staff)("auth/login/", { method: "POST", body: { username, password } });
      router.replace(isVendor ? (res.user.must_change_password ? "/vendor/change-password" : "/vendor") : "/staff");
    } catch (err) {
      setError(err.status === 429 ? "Too many attempts. Wait a minute and try again." : err.message);
      setBusy(false);
    }
  }

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 ${isVendor ? "theme-vendor" : ""}`}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">HAL Tejas Division</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{isVendor ? "Vendor portal" : "Outsourcing workflow"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isVendor ? "Sign in with the login HAL issued to your company." : "Sign in with your HAL account."}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Username" htmlFor="username">
            <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        {isVendor && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Access is issued by HAL after your tender is approved. Contact the Outsourcing Department if you have not received a login.
          </p>
        )}
      </div>
    </div>
  );
}
