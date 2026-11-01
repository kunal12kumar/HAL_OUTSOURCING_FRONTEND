import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import RequirementDetail from "./RequirementDetail";

async function Content({ params }) {
  const { id } = await params;
  return <RequirementDetail id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Content params={params} />
    </Suspense>
  );
}
