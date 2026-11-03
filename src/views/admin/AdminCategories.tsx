import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  Upload,
  X,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { store } from '../../services/store';
import { Category, Product } from '../../types';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(store.getCategories());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);

  // Category Deletion Modal
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategorySlug, setReassignCategorySlug] = useState<string>('');

  // Manage Products inside a Category
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<Category | null>(null);

  const refreshData = () => {
    setCategories(store.getCategories());
    setProducts(store.getProducts());
  };

  useEffect(() => {
    const unsub = store.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImageUrl('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80');
    setFormDisplayOrder(categories.length + 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormImageUrl(cat.imageUrl);
    setFormDisplayOrder(cat.displayOrder);
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    store.saveCategory({
      id: editingCategory?.id,
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      description: formDescription.trim(),
      imageUrl: formImageUrl.trim() || undefined,
      displayOrder: Number(formDisplayOrder) || 1,
    });

    setIsModalOpen(false);
    refreshData();
    setNotice(editingCategory ? `Category "${formName}" updated.` : `New category "${formName}" created.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete.name;

    store.deleteCategory(categoryToDelete.id, reassignCategorySlug || undefined);
    setCategoryToDelete(null);
    refreshData();
    setNotice(`Category "${catName}" deleted.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleReassignProduct = (productId: string, newSlug: string) => {
    store.assignProductToCategory(productId, newSlug);
    refreshData();
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
            CATALOG TAXONOMY & SILHOUETTES
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
            Category & Collection Management
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Organize which bespoke products appear under which category across the HYDEE boutique storefront.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold px-5 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 px-3 py-2 bg-neutral-100 rounded-xl">
          <Layers className="w-4 h-4 text-[#800000]" />
          <span>{categories.length} Categories Total</span>
        </div>
      </div>

      {/* Categories Grid Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => {
          const linkedProducts = products.filter((p) => p.categorySlug === cat.slug);
          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-neutral-300 transition-all"
            >
              <div>
                {/* Category Cover Image */}
                <div className="relative h-40 bg-neutral-100 overflow-hidden">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-mono tracking-widest uppercase bg-[#800000] px-2 py-0.5 rounded-sm">
                      Slug: {cat.slug}
                    </span>
                    <h3 className="font-serif text-xl font-bold mt-1 text-white leading-tight">
                      {cat.name}
                    </h3>
                  </div>

                  <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                    {linkedProducts.length} Products
                  </span>
                </div>

                <div className="p-4 space-y-2.5">
                  <p className="text-xs text-neutral-600 line-clamp-2 min-h-[32px]">
                    {cat.description || 'No description provided for this collection.'}
                  </p>
                  
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                    <span>Display Order: #{cat.displayOrder}</span>
                    <button
                      onClick={() => setSelectedCategoryForProducts(cat)}
                      className="text-[#800000] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Products ({linkedProducts.length})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
                <a
                  href={`/categories/${cat.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Public Page</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-neutral-500 hover:text-[#800000] rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCategoryToDelete(cat);
                      const other = categories.find((c) => c.id !== cat.id);
                      setReassignCategorySlug(other?.slug || '');
                    }}
                    disabled={categories.length <= 1}
                    className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Category */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-neutral-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#800000] text-white flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-neutral-950">
                    {editingCategory ? 'Edit Collection Category' : 'Create New Collection Category'}
                  </h3>
                  <span className="text-[11px] text-neutral-500">
                    Configure name, slug, and cover image
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-700" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tangail Tant Sarees, Silk Kurtis, Panjabis"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCategory) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                    }
                  }}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:border-[#800000] focus:outline-hidden font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tangail-tant"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Display Order (Rank)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono text-[11px]"
                />
                {formImageUrl && (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Collection Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Artisanal silhouettes woven with heritage looms..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:border-[#800000] focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#800000] hover:bg-[#5c0000] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Category */}
      {categoryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setCategoryToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-neutral-950">Delete Category</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Are you sure you want to remove <strong>"{categoryToDelete.name}"</strong>?
                </p>
              </div>
            </div>

            {/* Reassign warning if products exist */}
            {products.filter((p) => p.categorySlug === categoryToDelete.slug).length > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {products.filter((p) => p.categorySlug === categoryToDelete.slug).length} products belong to this category!
                  </span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  Select which category to safely move these products into:
                </p>
                <select
                  value={reassignCategorySlug}
                  onChange={(e) => setReassignCategorySlug(e.target.value)}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                >
                  {categories
                    .filter((c) => c.id !== categoryToDelete.id)
                    .map((c) => (
                      <option key={c.id} value={c.slug}>
                        Move to {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Yes, Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manage Products Inside a Specific Category */}
      {selectedCategoryForProducts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedCategoryForProducts(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 space-y-4 shadow-2xl border border-neutral-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#800000] block">
                  CATEGORY PRODUCT ASSIGNMENT
                </span>
                <h3 className="font-serif text-xl font-bold text-neutral-950">
                  Products in "{selectedCategoryForProducts.name}"
                </h3>
              </div>
              <button
                onClick={() => setSelectedCategoryForProducts(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-700" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Select or reassign products to <strong>{selectedCategoryForProducts.name}</strong> or move them to another category:
            </p>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 no-scrollbar">
              {products.map((prod) => {
                const isCurrent = prod.categorySlug === selectedCategoryForProducts.slug;
                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isCurrent
                        ? 'border-[#800000]/40 bg-[#800000]/[0.02]'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-11 h-11 object-cover rounded-lg bg-neutral-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 truncate">{prod.name}</span>
                          {isCurrent && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              In this category
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500 font-mono block">
                          SKU: {prod.sku} · ৳{prod.price.toLocaleString()} · Current: {prod.categoryName}
                        </span>
                      </div>
                    </div>

                    {/* Quick Move Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={prod.categorySlug}
                        onChange={(e) => handleReassignProduct(prod.id, e.target.value)}
                        className="p-1.5 border border-neutral-300 rounded-lg text-xs font-semibold focus:border-[#800000] bg-white cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCategoryForProducts(null)}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
