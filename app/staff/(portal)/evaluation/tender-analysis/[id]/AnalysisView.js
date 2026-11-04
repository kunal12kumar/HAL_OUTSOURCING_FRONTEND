"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, DefinitionList, Field, Input, PageHeader, Spinner, Stat, StateBadge, Table } from "@/components/ui";
import { staff } from "@/lib/api";
import { dateTime, money, titleCase } from "@/lib/format";
import { useLoad } from "@/lib/hooks";

const STEPS = [
  ["extract_tender_requirements", "Read tender requirements"],
  ["prepare_vendor_candidates", "Find relevant vendor evidence"],
  ["technical_evaluation", "Technical specification evaluation", "parallel"],
  ["commercial_evaluation", "Commercial and cost evaluation", "parallel"],
  ["merge_evaluations", "Combine both evaluations"],
  ["eligibility_check", "Check eligibility"],
  ["vendor_scoring_engine", "Score and rank vendors"],
  ["generate_explanations", "Write explanations"],
  ["generate_report", "Prepare report"],
];
const STEP_TONE = { DONE: "green", RUNNING: "blue", FAILED: "red", PENDING: "slate" };
const NA = "Information not available in the submitted document.";
const num = (v, digits = 1) => (v === null || v === undefined ? "-" : Number(v).toFixed(digits).replace(/\.0+$/, ""));
const docUrl = (id) => `/api/internal/evaluation/vendor-documents/${id}/download/`;

function Score({ value }) {
  return <span className="font-semibold tabular-nums">{value === null || value === undefined ? "-" : num(value, 1)}</span>;
}

function Status({ s }) {
  return <StateBadge state={s} label={titleCase(s)} />;
}

function Source({ item }) {
  if (!item.source_document) return <span className="text-slate-400">-</span>;
  return (
    <div className="text-xs">
      <a className="font-medium text-brand-700 hover:underline" href={docUrl(item.document_id)}>{item.source_document}</a>
      <div className="text-slate-500">{item.page ? `Page ${item.page}` : item.page_ref}</div>
      {item.evidence && <div className="mt-0.5 max-w-xs truncate text-slate-400" title={item.evidence}>&ldquo;{item.evidence}&rdquo;</div>}
    </div>
  );
}

function Draft({ a, onStarted }) {
  const reqs = a.requirements.requirements;
  const [flags, setFlags] = useState(() => Object.fromEntries(reqs.map((r) => [r.id, r.mandatory === true ? "yes" : r.mandatory === false ? "no" : "unset"])));
  const [tech, setTech] = useState(String(Math.round(a.default_config.technical_weight * 100)));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const comm = 100 - Number(tech || 0);
  const weightsOk = Number(tech) >= 0 && Number(tech) <= 100 && tech !== "";

  async function start() {
    setBusy(true);
    setError("");
    try {
      await staff(`evaluation/analyses/${a.evaluation_id}/start/`, {
        method: "POST",
        body: {
          technical_weight: Number(tech) / 100,
          commercial_weight: comm / 100,
          requirements: Object.fromEntries(Object.entries(flags).map(([k, v]) => [k, v === "yes" ? true : v === "no" ? false : null])),
        },
      });
      onStarted();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <>
      {a.requirements.source === "llm" && <div className="mb-4"><Alert tone="amber">These requirements were read from free text by a local AI model. Please check each one before starting.</Alert></div>}
      {a.requirements.review_note && <div className="mb-4"><Alert tone="amber">{a.requirements.review_note} Use the Mandatory column below to set it for this analysis.</Alert></div>}
      {a.requirements.problems?.length > 0 && <div className="mb-4"><Alert tone="amber">Skipped: {a.requirements.problems.join("; ")}</Alert></div>}
      <Card title={`Extracted requirements (${reqs.length})`} className="mb-6" padded={false}>
        <div className="p-2">
          <Table
            empty="No requirements could be extracted from this tender. Check that it lists requirements as 'Parameter: value' lines or table rows."
            rows={reqs}
            columns={[
              { key: "category", label: "Type", render: (r) => <Badge tone={r.category === "technical" ? "blue" : "amber"}>{titleCase(r.category)}</Badge> },
              { key: "label", label: "Parameter" },
              { key: "raw", label: "Requirement", render: (r) => <>{r.raw}{r.needs_verification && <Badge tone="amber">Verify</Badge>}</> },
              { key: "comparator", label: "Test", render: (r) => ({ gte: "At least", lte: "At most", eq: "Match" })[r.comparator] },
              { key: "mandatory", label: "Mandatory?", render: (r) => (
                <select aria-label={`Mandatory flag for ${r.label}`} className="rounded border-0 text-sm ring-1 ring-slate-300" value={flags[r.id]} onChange={(e) => setFlags({ ...flags, [r.id]: e.target.value })}>
                  <option value="unset">Not stated</option>
                  <option value="yes">Mandatory</option>
                  <option value="no">Desirable</option>
                </select>) },
              { key: "source", label: "Tender text", render: (r) => <span className="text-xs text-slate-500">{r.source.line}</span> },
            ]}
          />
        </div>
      </Card>
      <Card title="Evaluation weights" className="mb-6">
        <p className="mb-3 text-sm text-slate-600">Demonstration defaults, not official HAL procurement criteria. Change them to match the approved tender rules.</p>
        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <Field label="Technical weight (%)" htmlFor="tw"><Input id="tw" type="number" min="0" max="100" value={tech} onChange={(e) => setTech(e.target.value)} /></Field>
          <Field label="Commercial weight (%)" htmlFor="cw"><Input id="cw" value={weightsOk ? comm : ""} readOnly /></Field>
        </div>
      </Card>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <div className="flex justify-end"><Button onClick={start} disabled={busy || !reqs.length || !weightsOk}>{busy ? "Starting..." : "Start analysis"}</Button></div>
    </>
  );
}

function Progress({ a }) {
  const p = a.progress || {};
  return (
    <Card title="Analysis progress">
      <p className="mb-4 text-sm text-slate-600">The technical and commercial evaluations run at the same time, then their results are combined.</p>
      <ol className="space-y-2">
        {STEPS.map(([key, label, kind]) => {
          const st = p[key]?.status || "PENDING";
          return (
            <li key={key} className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${kind ? "ml-6 border-brand-200 bg-brand-50" : "border-slate-200"}`}>
              <span>{label}{kind && <span className="ml-2 text-xs text-brand-700">runs in parallel</span>}</span>
              <Badge tone={STEP_TONE[st]}>{titleCase(st)}</Badge>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function Compare({ result, vendors }) {
  const cols = vendors;
  const rows = [
    ["Overall score", (v) => <Score value={v.overall_score} />],
    ["Technical score", (v) => <Score value={v.technical?.technical_score} />],
    ["Commercial score", (v) => <Score value={v.commercial?.commercial_score} />],
    ["Eligibility", (v) => <Status s={v.eligibility} />],
    ["Comparable total cost", (v) => money(v.commercial?.comparable_total_cost) + (v.commercial?.comparable_total_cost == null && v.commercial?.comparable_pre_tax_cost != null ? " (tax unresolved)" : "")],
    ["Cost before tax", (v) => money(v.commercial?.comparable_pre_tax_cost)],
    ["Delivery (days)", (v) => num(v.commercial?.delivery_days)],
    ["Warranty (months)", (v) => num(v.commercial?.warranty_months)],
    ["Deviations", (v) => v.technical ? v.technical.compliance_summary.non_compliant + v.technical.compliance_summary.partially_compliant : "-"],
    ["Missing information", (v) => (v.technical?.missing_information.length || 0) + (v.commercial?.missing_information.length || 0)],
  ];
  const reqRows = result.requirements.filter((r) => r.category === "technical");
  return (
    <Card title="Side-by-side comparison" className="mb-6" padded={false}>
      <div className="overflow-x-auto p-2">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead><tr><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">&nbsp;</th>{cols.map((v) => <th key={v.vendor_id} className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">{v.vendor_name}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([label, fn]) => (<tr key={label}><td className="px-3 py-2 font-medium text-slate-600">{label}</td>{cols.map((v) => <td key={v.vendor_id} className="px-3 py-2 tabular-nums">{fn(v)}</td>)}</tr>))}
            <tr><td colSpan={cols.length + 1} className="bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase text-slate-500">Technical requirements</td></tr>
            {reqRows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-slate-600">{r.label} <span className="text-slate-400">({r.raw})</span>{r.mandatory && <Badge tone="red">Mandatory</Badge>}</td>
                {cols.map((v) => {
                  const t = v.technical?.requirements.find((x) => x.requirement_id === r.id);
                  return <td key={v.vendor_id} className="px-3 py-2">{t ? <><Status s={t.status} /><div className="mt-0.5 text-xs text-slate-500">{t.offered || "-"}</div></> : "-"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Evidence({ e }) {
  if (!e) return null;
  return <span className="ml-1 text-xs text-slate-500">[<a className="text-brand-700 hover:underline" href={docUrl(e.document_id)}>{e.document}</a>, {e.page ? `page ${e.page}` : e.location}]</span>;
}

function Points({ items, empty, tone }) {
  if (!items.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-1.5 text-sm text-slate-700">
      {items.map((p, i) => (
        <li key={i} className="flex gap-2"><span className={tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-amber-600"}>{tone === "good" ? "+" : tone === "bad" ? "-" : "?"}</span><span>{p.text}<Evidence e={p.evidence} /></span></li>
      ))}
    </ul>
  );
}

function VendorDetail({ v }) {
  const [tab, setTab] = useState("summary");
  const t = v.technical;
  const c = v.commercial;
  const tabs = [["summary", "Summary"], ["technical", "Technical compliance"], ["commercial", "Commercial breakdown"], ["sources", "Source documents"]];
  return (
    <Card title={`${v.vendor_name} - detailed evaluation`} className="mb-6">
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200" role="tablist">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-brand-600 font-medium text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{label}</button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-slate-800">{v.summary}</p>
          {v.eligibility_reasons?.length > 0 && <Alert tone={v.eligibility === "NOT_ELIGIBLE" ? "red" : "amber"}><ul className="list-disc pl-4">{v.eligibility_reasons.map((r, i) => <li key={i}>{r}</li>)}</ul></Alert>}
          <div className="grid gap-6 md:grid-cols-3">
            <div><h3 className="mb-2 text-sm font-semibold text-emerald-700">Advantages</h3><Points items={v.advantages} empty="None identified from the submitted documents." tone="good" /></div>
            <div><h3 className="mb-2 text-sm font-semibold text-red-700">Disadvantages and deviations</h3><Points items={v.disadvantages} empty="No deviations identified." tone="bad" /></div>
            <div><h3 className="mb-2 text-sm font-semibold text-amber-700">Missing or unclear</h3><Points items={v.unclear} empty="Nothing missing." tone="warn" /></div>
          </div>
        </div>
      )}

      {tab === "technical" && (!t ? <Alert tone="amber">The technical evaluation did not complete for this vendor.</Alert> : (
        <Table
          empty="No technical requirements were found in the tender."
          rows={t.requirements}
          rowKey={(r) => r.requirement_id}
          columns={[
            { key: "parameter", label: "Parameter", render: (r) => <>{r.parameter}{r.mandatory && <Badge tone="red">Mandatory</Badge>}</> },
            { key: "required", label: "HAL requirement" },
            { key: "offered", label: "Vendor offer", render: (r) => r.offered || <span className="text-slate-400">{NA}</span> },
            { key: "status", label: "Result", render: (r) => <Status s={r.status} /> },
            { key: "deviation", label: "Deviation / note", render: (r) => <span className="text-xs">{r.deviation || r.note}</span> },
            { key: "source", label: "Evidence", render: (r) => <Source item={r} /> },
          ]}
        />
      ))}

      {tab === "commercial" && (!c ? <Alert tone="amber">The commercial evaluation did not complete for this vendor.</Alert> : (
        <div className="space-y-5">
          <DefinitionList items={[
            ["Base price", `${money(c.base_price)}${c.base_price_basis ? ` (${c.base_price_basis})` : ""}`],
            ["Freight", c.freight === null ? NA : c.freight_mode === "included" ? "Included in price" : money(c.freight)],
            ["Taxes", c.taxes.mode === "included" ? "Included in quoted price" : c.taxes.mode === "excluded" ? `Extra${c.taxes.rate ? ` at ${c.taxes.rate}%` : ""}: ${money(c.taxes.amount)}` : "Requires manual verification"],
            ["Cost before tax", money(c.comparable_pre_tax_cost)],
            ["Comparable total cost", c.comparable_total_cost === null ? "Not calculated (tax unresolved)" : money(c.comparable_total_cost)],
            ["Difference from lowest", c.cost_comparison.difference_from_lowest === null ? "-" : `${money(c.cost_comparison.difference_from_lowest)} (${c.cost_comparison.percent_above_lowest ?? 0}% above)`],
            ["Delivery", c.delivery_days === null ? NA : `${num(c.delivery_days)} days`],
            ["Warranty", c.warranty_months === null ? NA : `${num(c.warranty_months)} months`],
            ["Quotation validity", c.validity_days === null ? NA : `${num(c.validity_days)} days`],
            ["Payment terms", c.payment_terms || NA],
            ["Commercial score", num(c.commercial_score, 1)],
            ["Cost compared on", c.cost_basis === "comparable_total_cost" ? "Total cost incl. tax" : "Cost before tax (tax not resolved for every vendor)"],
          ]} />
          {c.assumptions.length > 0 && <div><h3 className="mb-1 text-sm font-semibold text-slate-700">Assumptions used</h3><ul className="list-disc pl-5 text-sm text-slate-600">{c.assumptions.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
          {c.missing_information.length > 0 && <Alert tone="amber"><p className="font-medium">Missing or unclear</p><ul className="list-disc pl-4">{c.missing_information.map((x, i) => <li key={i}>{x}</li>)}</ul></Alert>}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Score breakdown</h3>
            <p className="text-sm text-slate-600">{Object.entries(c.score_breakdown).map(([k, val]) => `${titleCase(k)}: ${num(val, 1)}`).join(" | ")}</p>
          </div>
          {c.requirement_checks.length > 0 && (
            <Table rows={c.requirement_checks} rowKey={(r) => r.requirement_id} columns={[
              { key: "parameter", label: "Commercial requirement", render: (r) => <>{r.parameter}{r.mandatory && <Badge tone="red">Mandatory</Badge>}</> },
              { key: "required", label: "HAL requirement" },
              { key: "offered", label: "Vendor offer", render: (r) => r.offered || <span className="text-slate-400">{NA}</span> },
              { key: "status", label: "Result", render: (r) => <Status s={r.status} /> },
              { key: "deviation", label: "Deviation", render: (r) => <span className="text-xs">{r.deviation}</span> },
            ]} />
          )}
          {Object.keys(c.sources).length > 0 && (
            <div><h3 className="mb-1 text-sm font-semibold text-slate-700">Where each figure came from</h3>
              <ul className="space-y-1 text-sm">{Object.entries(c.sources).map(([k, s]) => <li key={k}><span className="inline-block w-36 text-slate-500">{titleCase(k)}</span><a className="text-brand-700 hover:underline" href={docUrl(s.document_id)}>{s.source_document}</a> <span className="text-slate-500">({s.page ? `page ${s.page}` : s.page_ref}) &ldquo;{s.evidence}&rdquo;</span></li>)}</ul></div>
          )}
        </div>
      ))}

      {tab === "sources" && (
        <div className="space-y-3">
          <Table empty="No documents." rows={v.documents} rowKey={(d) => d.document_id} columns={[
            { key: "filename", label: "File", render: (d) => <a className="font-medium text-brand-700 hover:underline" href={docUrl(d.document_id)}>{d.filename}</a> },
            { key: "doc_type", label: "Type", render: (d) => titleCase(d.doc_type) },
            { key: "warnings", label: "Warnings", render: (d) => d.warnings.length ? <span className="text-xs text-amber-700">{d.warnings.join("; ")}</span> : "-" },
          ]} />
          {v.notes?.map((n, i) => <Alert key={i} tone="amber">{n}</Alert>)}
        </div>
      )}
    </Card>
  );
}

export default function AnalysisView({ id }) {
  const { data: a, error, loading, reload } = useLoad(() => staff(`evaluation/analyses/${id}/`));
  const running = a?.status === "RUNNING";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(reload, 1200);
    return () => clearInterval(t);
  }, [running, reload]);

  if (loading && !a) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;
  return (
    <>
      <PageHeader
        title={a.title}
        subtitle={`${a.filename} - uploaded ${dateTime(a.created_at)}`}
        back={{ href: "/staff/evaluation/tender-analysis", label: "Tender analysis" }}
        actions={<StateBadge state={a.status} label={a.status_label} />}
      />
      {a.status === "DRAFT" && <Draft a={a} onStarted={reload} />}
      {running && <Progress a={a} />}
      {a.status === "FAILED" && <><div className="mb-4"><Alert>The analysis could not be completed. {a.error}</Alert></div><Progress a={a} /></>}
      {(a.status === "COMPLETED" || a.status === "INCOMPLETE") && <Results a={a} />}
    </>
  );
}

function Results({ a }) {
  const r = a.result;
  const vendors = useMemo(() => r.ranking.map((rk) => ({ ...r.vendors[String(rk.vendor_id)], ...rk })), [r]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("rank");
  const [selected, setSelected] = useState(vendors[0]?.vendor_id ?? null);

  const cost = (v) => v.commercial?.comparable_total_cost ?? v.commercial?.comparable_pre_tax_cost ?? Infinity;
  const SORTS = {
    rank: () => 0,
    technical: (x, y) => (y.technical_score ?? -1) - (x.technical_score ?? -1),
    cost: (x, y) => cost(x) - cost(y),
    delivery: (x, y) => (x.commercial?.delivery_days ?? Infinity) - (y.commercial?.delivery_days ?? Infinity),
    overall: (x, y) => (y.overall_score ?? -1) - (x.overall_score ?? -1),
  };
  const shown = vendors.filter((v) => filter === "all" || (filter === "ELIGIBLE" ? v.eligibility === "ELIGIBLE" : filter === "NOT_ELIGIBLE" ? v.eligibility === "NOT_ELIGIBLE" : !["ELIGIBLE", "NOT_ELIGIBLE"].includes(v.eligibility))).sort(SORTS[sort]);
  const sel = vendors.find((v) => v.vendor_id === selected) || vendors[0];
  const count = (s) => vendors.filter((v) => v.eligibility === s).length;

  return (
    <>
      {r.errors?.length > 0 && <div className="mb-4"><Alert>Part of this evaluation did not complete, so affected vendors have no overall score. {r.errors.map((e) => e.error).join(" ")}</Alert></div>}
      {r.review_note && <div className="mb-4"><Alert tone="amber">{r.review_note}</Alert></div>}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Vendors evaluated" value={vendors.length} />
        <Stat label="Eligible and ranked" value={count("ELIGIBLE")} />
        <Stat label="Not eligible" value={count("NOT_ELIGIBLE")} tone={count("NOT_ELIGIBLE") ? "red" : undefined} />
        <Stat label="Need verification / incomplete" value={count("REQUIRES_VERIFICATION") + count("INCOMPLETE")} tone={count("REQUIRES_VERIFICATION") + count("INCOMPLETE") ? "amber" : undefined} />
      </div>

      <Card title="Vendor ranking" className="mb-6" padded={false}
        actions={<>
          <select aria-label="Filter vendors" className="rounded border-0 text-sm ring-1 ring-slate-300" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All vendors</option><option value="ELIGIBLE">Eligible</option><option value="NOT_ELIGIBLE">Not eligible</option><option value="OTHER">Needs verification / incomplete</option>
          </select>
          <select aria-label="Sort vendors" className="rounded border-0 text-sm ring-1 ring-slate-300" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rank">Overall ranking</option><option value="technical">Highest technical score</option><option value="cost">Lowest comparable cost</option><option value="delivery">Shortest delivery</option>
          </select></>}>
        <div className="p-2">
          <Table
            empty="No vendors match this filter."
            rows={shown}
            rowKey={(v) => v.vendor_id}
            onRowClick={(v) => setSelected(v.vendor_id)}
            columns={[
              { key: "rank", label: "Rank", render: (v) => <span className={`font-semibold ${v.rank ? "text-slate-900" : "text-slate-400"}`}>{v.rank || "-"}</span> },
              { key: "vendor_name", label: "Vendor", render: (v) => <span className={`font-medium ${v.vendor_id === sel.vendor_id ? "text-brand-700" : ""}`}>{v.vendor_name}</span> },
              { key: "technical_score", label: "Technical", align: "right", render: (v) => <Score value={v.technical_score} /> },
              { key: "commercial_score", label: "Commercial", align: "right", render: (v) => <Score value={v.commercial_score} /> },
              { key: "overall_score", label: "Overall", align: "right", render: (v) => <Score value={v.overall_score} /> },
              { key: "eligibility", label: "Eligibility", render: (v) => <Status s={v.eligibility} /> },
              { key: "cost", label: "Comparable cost", align: "right", render: (v) => money(cost(v) === Infinity ? null : cost(v)) },
              { key: "delivery", label: "Delivery", align: "right", render: (v) => (v.commercial?.delivery_days == null ? "-" : `${num(v.commercial.delivery_days)} d`) },
            ]}
          />
        </div>
        <p className="border-t border-slate-100 px-5 py-2 text-xs text-slate-500">
          Overall = technical x {Math.round(r.config.technical_weight * 100)}% + commercial x {Math.round(r.config.commercial_weight * 100)}%. Only eligible vendors are ranked. Select a row for details. This is decision support; the final decision rests with authorised HAL officials.
        </p>
      </Card>

      <Compare result={r} vendors={vendors} />
      {sel && <VendorDetail v={sel} />}
    </>
  );
}
