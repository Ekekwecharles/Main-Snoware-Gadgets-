import { getAllCategories } from "@/lib/catalog";
import { Card, inputClass, Label, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/action-form";
import { saveCategory } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const all = await getAllCategories();
  const parents = all.filter((c) => !c.parentId);

  return (
    <>
      <PageHeader title="Categories" description="Top-level categories power the store menu; sub-categories group products inside them." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <ul className="space-y-4">
            {parents.map((p) => (
              <li key={p.id}>
                <details className="group rounded-xl ring-1 ring-line">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-semibold">
                    {p.name} <span className="text-[12.5px] font-normal text-muted">/c/{p.slug} · {all.filter((c) => c.parentId === p.id).length} sub-categories</span>
                  </summary>
                  <div className="space-y-3 border-t border-line p-4">
                    <CategoryEditForm category={p} parents={parents} />
                    {all
                      .filter((c) => c.parentId === p.id)
                      .map((c) => (
                        <details key={c.id} className="rounded-lg bg-mist/70">
                          <summary className="cursor-pointer px-3 py-2 text-[14px] font-medium">{c.name}</summary>
                          <div className="p-3 pt-0"><CategoryEditForm category={c} parents={parents} /></div>
                        </details>
                      ))}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-fit">
          <h2 className="mb-4 text-[17px] font-bold">Add category</h2>
          <ActionForm action={saveCategory} submitLabel="Add category">
            <CategoryFields parents={parents} />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}

type Cat = Awaited<ReturnType<typeof getAllCategories>>[number];

function CategoryEditForm({ category, parents }: { category: Cat; parents: Cat[] }) {
  return (
    <ActionForm action={saveCategory} submitLabel="Save">
      <input type="hidden" name="id" value={category.id} />
      <CategoryFields parents={parents.filter((p) => p.id !== category.id)} category={category} />
    </ActionForm>
  );
}

function CategoryFields({ parents, category }: { parents: Cat[]; category?: Cat }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Name</Label>
        <input name="name" required defaultValue={category?.name} className={inputClass} />
      </div>
      <div>
        <Label>Parent</Label>
        <select name="parentId" defaultValue={category?.parentId ?? ""} className={inputClass}>
          <option value="">None (top level)</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <input name="description" defaultValue={category?.description ?? ""} className={inputClass} />
      </div>
      <div>
        <Label>Sort order</Label>
        <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className={inputClass} />
      </div>
    </div>
  );
}
