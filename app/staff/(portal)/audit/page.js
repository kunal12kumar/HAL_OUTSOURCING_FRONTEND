"use client";

import RegisterList from "@/components/RegisterList";
import { Badge } from "@/components/ui";
import { dateTime, ROLE_LABELS } from "@/lib/format";

export default function Page() {
  return (
    <RegisterList
      title="Audit log"
      subtitle="Every decision and change, with who did it and when. Entries cannot be edited or deleted."
      path="audit"
      columns={[
        { key: "created_at", label: "When", nowrap: true, render: (a) => dateTime(a.created_at) },
        { key: "actor_name", label: "Who", render: (a) => <div><p>{a.actor_name}</p><p className="text-xs text-slate-500">{ROLE_LABELS[a.actor_role] || a.actor_role}</p></div> },
        { key: "action", label: "Action", render: (a) => <Badge tone="slate">{a.action}</Badge> },
        { key: "object_id", label: "Record", nowrap: true },
        { key: "summary", label: "What happened" },
      ]}
    />
  );
}
