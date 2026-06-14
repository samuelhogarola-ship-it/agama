import { AdminSidebar } from "@/components/admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { getCategoryCounts } from "@/lib/portal-data";

export default async function AdminCategoriesPage() {
  const categories = await getCategoryCounts();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <AdminSidebar active="/admin/categorias" />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
        <div className="space-y-5">
          <div>
            <p className="label-kicker">Panel de administracion</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-graphite">Categorias</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.slug}
                className="rounded-[1.7rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]"
              >
                <Badge variant="brand">{category.count} productos</Badge>
                <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-graphite">{category.name}</h2>
                <p className="mt-3 text-sm leading-7 text-muted">{category.description}</p>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
