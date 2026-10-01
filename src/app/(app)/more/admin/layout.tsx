import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AdminNav } from "@/components/settings/admin-nav";
import { requireProfile } from "@/lib/profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!profile.is_admin) redirect("/more");

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" backHref="/more" />
      <AdminNav />
      {children}
    </div>
  );
}
