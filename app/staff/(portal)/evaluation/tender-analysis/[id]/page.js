import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import AnalysisView from "./AnalysisView";

async function Content({ params }) {
  const { id } = await params;
  return <AnalysisView id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Content params={params} />
    </Suspense>
  );
}
