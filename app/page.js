import Link from "next/link";

export default function Landing() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">Hindustan Aeronautics Limited</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Tejas Division - Outsourcing</h1>
          <p className="mt-2 text-sm text-slate-500">Requirement to finishing, tracked in one place.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/staff/login" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500 hover:shadow">
            <h2 className="text-lg font-semibold text-slate-900">HAL staff</h2>
            <p className="mt-1 text-sm text-slate-500">Departments, committees, inspection, gate and finishing teams.</p>
            <p className="mt-4 text-sm font-medium text-brand-600">Sign in &rarr;</p>
          </Link>
          <Link href="/vendor/login" className="theme-vendor rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500 hover:shadow">
            <h2 className="text-lg font-semibold text-slate-900">Vendor portal</h2>
            <p className="mt-1 text-sm text-slate-500">For vendors holding an approved order. Login is issued by HAL.</p>
            <p className="mt-4 text-sm font-medium text-brand-600">Sign in &rarr;</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
