"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { Spinner } from "@/components/ui";
import { staff, vendor } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

const STAFF_NAV = [
  { href: "/staff", label: "Home", exact: true },
  { href: "/staff/requirements", label: "Requirements" },
  { href: "/staff/tenders", label: "Tenders" },
  { href: "/staff/orders", label: "Orders" },
  { href: "/staff/inspections", label: "Inspections" },
  { href: "/staff/consignments", label: "Consignments" },
  { href: "/staff/vendors", label: "Vendors", roles: ["OUTSOURCING", "ADMIN"] },
  { href: "/staff/evaluation", label: "AI Evaluation", roles: ["OUTSOURCING", "ADMIN"] },
  { href: "/staff/audit", label: "Audit log", roles: ["OUTSOURCING", "ADMIN"] },
  { href: "/staff/users", label: "Users", roles: ["ADMIN"] },
  { href: "/staff/guide", label: "Workflow guide", roles: ["ADMIN"] },
];

const VENDOR_NAV = [{ href: "/vendor", label: "My orders", exact: true }];

const CONFIG = {
  staff: {
    api: staff,
    login: "/staff/login",
    home: "/staff",
    account: "/staff/account",
    title: "HAL Tejas Division",
    subtitle: "Outsourcing workflow",
    nav: STAFF_NAV,
    themeClass: "",
  },
  vendor: {
    api: vendor,
    login: "/vendor/login",
    home: "/vendor",
    account: "/vendor/change-password",
    title: "HAL Tejas Division",
    subtitle: "Vendor portal",
    nav: VENDOR_NAV,
    themeClass: "theme-vendor",
  },
};

export default function Shell({ portal, children }) {
  const cfg = CONFIG[portal];
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, error } = useLoad(() => cfg.api("auth/me/"));

  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) router.replace(cfg.login);
  }, [error, router, cfg.login]);

  const mustChange = user?.must_change_password;
  useEffect(() => {
    if (mustChange && pathname !== cfg.account) router.replace(cfg.account);
  }, [mustChange, pathname, router, cfg.account]);

  async function signOut() {
    await cfg.api("auth/logout/", { method: "POST" }).catch(() => {});
    router.replace(cfg.login);
  }

  if (error && error.status !== 401 && error.status !== 403) {
    return <p className="p-8 text-sm text-red-700">Cannot reach the server. {error.message}</p>;
  }
  if (!user) return <Spinner />;

  const nav = mustChange ? [] : cfg.nav.filter((n) => !n.roles || n.roles.includes(user.role));
  const active = (n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));
  const who = user.vendor ? "Vendor" : ROLE_LABELS[user.role] || user.role;

  return (
    <UserContext.Provider value={user}>
      <div className={`flex min-h-screen flex-col ${cfg.themeClass}`}>
        <header className="bg-brand-800 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href={cfg.home} className="flex items-baseline gap-3">
              <span className="text-base font-semibold tracking-wide">{cfg.title}</span>
              <span className="text-sm text-brand-200">{cfg.subtitle}</span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-brand-100 sm:inline">
                {user.first_name || user.username} &middot; {who}
              </span>
              {!mustChange && (
                <Link href={cfg.account} className="text-brand-200 hover:text-white">
                  Password
                </Link>
              )}
              <button type="button" onClick={signOut} className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20">
                Sign out
              </button>
            </div>
          </div>
          {nav.length > 0 && (
            <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Main">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${active(n) ? "border-white text-white" : "border-transparent text-brand-200 hover:text-white"}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="py-4 text-center text-xs text-slate-400">HAL Tejas Division &middot; Outsourcing management system</footer>
      </div>
    </UserContext.Provider>
  );
}
