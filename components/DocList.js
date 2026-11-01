"use client";

import { Badge, Empty } from "@/components/ui";
import { dateTime, titleCase } from "@/lib/format";

export default function DocList({ docs, showSharing = false }) {
  if (!docs?.length) return <Empty>No documents yet.</Empty>;
  return (
    <ul className="divide-y divide-slate-100">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div>
            <a href={d.download_url} className="text-sm font-medium text-brand-700 hover:underline" download>
              {d.title}
            </a>
            <p className="text-xs text-slate-500">
              {titleCase(d.doc_type)} &middot; {d.uploaded_by_name || (d.uploaded_by_hal ? "HAL" : "You")} &middot; {dateTime(d.created_at)}
            </p>
          </div>
          {showSharing && <Badge tone={d.visible_to_vendor ? "green" : "slate"}>{d.visible_to_vendor ? "Shared with vendor" : "Internal only"}</Badge>}
        </li>
      ))}
    </ul>
  );
}
