import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import VendorOrder from "./VendorOrder";

async function Content({ params }) {
  const { id } = await params;
  return <VendorOrder id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Content params={params} />
    </Suspense>
  );
}
