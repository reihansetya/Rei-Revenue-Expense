import { getCategories } from "./actions";
import { CategoriesList } from "./categories-list";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kategori</h1>
      </div>
      <CategoriesList initialCategories={categories} />
    </div>
  );
}
