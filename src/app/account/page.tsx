import { Suspense } from "react";
import AccountClient from "@/components/AccountClient";

export default function AccountPage() {
  return (
    <Suspense>
      <AccountClient />
    </Suspense>
  );
}
