"use client";

import { useUser } from "@/components/Shell";
import { Alert, Button, Card, PageHeader } from "@/components/ui";

// Served by the frontend itself from public/guides (no backend involved).
const FILE = "/guides/website-workflow.pdf";

export default function WorkflowGuide() {
  const user = useUser();

  if (user.role !== "ADMIN") {
    return <Alert tone="amber">The workflow guide is available to the HAL Administrator only.</Alert>;
  }

  return (
    <>
      <PageHeader
        title="Website workflow guide"
        subtitle="A walkthrough of how a requirement moves through the website, department by department, from MSR to finishing and the vendor portal."
        actions={
          <>
            <Button variant="secondary" href={FILE} prefetch={false} target="_blank" rel="noopener">
              Open in a new tab
            </Button>
            <Button href={FILE} prefetch={false} download="HAL-website-workflow.pdf">
              Download PDF
            </Button>
          </>
        }
      />
      <Card padded={false}>
        <iframe src={FILE} title="Website workflow guide (PDF)" className="h-[78vh] w-full rounded-lg" />
      </Card>
      <p className="mt-3 text-xs text-slate-500">
        If the document does not appear in this window (some phones and tablets do not show PDFs inside a page), use <strong>Open in a new tab</strong> or{" "}
        <strong>Download PDF</strong>. This document is visible to the administrator only.
      </p>
    </>
  );
}
