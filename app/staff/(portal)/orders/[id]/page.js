import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import OrderDetail from "./OrderDetail";

async function Content({ params }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Content params={params} />
    </Suspense>
  );
}
