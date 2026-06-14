import { CustomerShell } from "@/components/customer-shell";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { getCategoryCounts, getPortalProducts } from "@/lib/portal-data";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getPortalProducts(), getCategoryCounts()]);

  return (
    <CustomerShell active="/catalogo">
      <CatalogExplorer
        products={products}
        categories={categories}
        selectedCategory={params.categoria ?? "all"}
      />
    </CustomerShell>
  );
}
