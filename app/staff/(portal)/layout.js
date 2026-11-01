import { Suspense } from "react";
import Shell from "@/components/Shell";
import { Spinner } from "@/components/ui";

export default function Layout({ children }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Shell portal="staff">{children}</Shell>
    </Suspense>
  );
}
