import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import TenderDetail from "./TenderDetail";

async function Content({ params }) {
  const { id } = await params;
  return <TenderDetail id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Content params={params} />
    </Suspense>
  );
}
