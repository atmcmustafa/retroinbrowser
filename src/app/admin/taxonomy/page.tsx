import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TaxonomyTables } from "@/components/admin/taxonomy-tables";
import { requireAdmin } from "@/lib/auth";
import { getAdminTaxonomy } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Taxonomy" };

export default async function AdminTaxonomyPage() {
  await requireAdmin();
  const taxonomy = await getAdminTaxonomy();

  return (
    <>
      <AdminPageHeader
        title="Taxonomy"
        description="Platforms and genres, in the order the site lists them."
      />
      <TaxonomyTables {...taxonomy} />
    </>
  );
}
