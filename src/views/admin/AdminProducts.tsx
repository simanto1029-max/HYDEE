import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Search,
  Check,
  Rotate3D,
  Sparkles,
  Layers,
  X,
  Upload,
  ArrowLeft,
  ArrowRight,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import { store } from '../../services/store';
import { Product, ProductVariant, BundleTier, Category } from '../../types';

interface AdminProductsProps {
  onNavigateToProduct: (slug: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ onNavigateToProduct }) => {
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [categories, setCategories] = useState<Category[]>(store.getCategories());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit / Create modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Quick category creation inside product modal
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  // Subscribe to store updates so deleted products and added categories reflect in realtime
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setProducts(store.getProducts());
      setCategories(store.getCategories());
    });
    return unsub;
  }, []);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCatSlug, setFormCatSlug] = useState('shackets');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCompareAt, setFormCompareAt] = useState<number | undefined>(undefined);
  const [formCostPrice, setFormCostPrice] = useState<number | undefined>(undefined);
  const [formStock, setFormStock] = useState<number>(10);
  const [formDescription, setFormDescription] = useState('');
  const [formFabric, setFormFabric] = useState('');
  const [formFit, setFormFit] = useState('');
  const [formCare, setFormCare] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formImages, setFormImages] = useState<string>('');
  const [formImagesList, setFormImagesList] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formTransparentImage, setFormTransparentImage] = useState('');
  const [formHas360, setFormHas360] = useState(false);
  const [formFrames360, setFormFrames360] = useState<string>('');
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [formIsHangerFeatured, setFormIsHangerFeatured] = useState(true);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Bundle Offer Tiers (Screenshot 3 Style)
  const [formBundleHeadline, setFormBundleHeadline] = useState('50% OFF TODAY ONLY');
  const [formTier1Price, setFormTier1Price] = useState<number>(0);
  const [formTier2Price, setFormTier2Price] = useState<number>(0);
  const [formTier2Badge, setFormTier2Badge] = useState('Most Popular');
  const [formTier3Price, setFormTier3Price] = useState<number>(0);

  const refreshList = () => {
    setProducts(store.getProducts());
  };

  // Image Upload & Reorder Helpers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const resultUrl = evt.target.result as string;
          setFormImagesList((prev) => [...prev, resultUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setFormImagesList((prev) => [...prev, trimmed]);
    setImageUrlInput('');
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formImagesList.length) return;
    setFormImagesList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSetAsThumbnail = (index: number) => {
    if (index === 0) return;
    setFormImagesList((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormSku(`HYD-${Date.now().toString().slice(-4)}`);
    setFormCatSlug(categories[0]?.slug || 'three-piece');
    setFormPrice(16500);
    setFormCompareAt(19500);
    setFormCostPrice(7000);
    setFormStock(10);
    setFormDescription('Luxury in every fold. Specially designed for fancy gatherings and graceful evenings.');
    setFormFabric('100% Pure Silk with intricate zardozi needlework');
    setFormFit('Graceful Long Silhouette with Flared Palazzo');
    setFormCare('Specialist Dry Clean Only');
    setFormOrigin('Dhaka Atelier Studio');
    setFormImages('/images/editorial-glory-red.jpg');
    setFormImagesList(['/images/editorial-glory-red.jpg']);
    setFormTransparentImage('');
    setFormHas360(false);
    setFormFrames360('');
    setFormIsBestSeller(false);
    setFormIsFeatured(true);
    setFormIsHangerFeatured(true);
    setFormVariants([
      { id: `v-${Date.now()}-38`, name: 'Size 38 / Royal Crimson', size: '38', color: 'Royal Crimson', sku: `HYD-38`, price: 16500, stock: 4 },
      { id: `v-${Date.now()}-40`, name: 'Size 40 / Royal Crimson', size: '40', color: 'Royal Crimson', sku: `HYD-40`, price: 16500, stock: 4 },
      { id: `v-${Date.now()}-42`, name: 'Size 42 / Royal Crimson', size: '42', color: 'Royal Crimson', sku: `HYD-42`, price: 16500, stock: 2 },
    ]);
    setFormBundleHeadline('50% OFF TODAY ONLY');
    setFormTier1Price(16500);
    setFormTier2Price(29700);
    setFormTier2Badge('Most Popular');
    setFormTier3Price(39600);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormSku(p.sku);
    setFormCatSlug(p.categorySlug);
    setFormPrice(p.price);
    setFormCompareAt(p.compareAtPrice);
    setFormCostPrice(p.costPrice);
    setFormStock(p.stock);
    setFormDescription(p.description);
    setFormFabric(p.specifications.fabric);
    setFormFit(p.specifications.fit);
    setFormCare(p.specifications.care);
    setFormOrigin(p.specifications.origin);
    setFormImages(p.images.join('\n'));
    setFormImagesList(p.images ? [...p.images] : []);
    setFormTransparentImage(p.transparentImage || '');
    setFormHas360(p.has360View ?? false);
    setFormFrames360((p.frames360 || []).join('\n'));
    setFormIsBestSeller(p.isBestSeller ?? false);
    setFormIsFeatured(p.isFeatured ?? true);
    setFormIsHangerFeatured(p.isHangerFeatured ?? true);
    setFormVariants(p.variants || []);

    // Load bundle tiers
    setFormBundleHeadline(p.bundleHeadline || '50% OFF TODAY ONLY');
    const tiers = p.bundleTiers || [];
    setFormTier1Price(tiers[0]?.price ?? p.price);
    setFormTier2Price(tiers[1]?.price ?? Math.round(p.price * 2 * 0.9));
    setFormTier2Badge(tiers[1]?.badge || 'Most Popular');
    setFormTier3Price(tiers[2]?.price ?? Math.round(p.price * 3 * 0.8));

    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.slug === formCatSlug);

    const imagesArray = formImagesList.length > 0
      ? formImagesList
      : formImages
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

    const framesArray = formFrames360
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const bundleTiers: BundleTier[] = [
      {
        quantity: 1,
        label: 'Buy 1',
        subtitle: 'Standard price',
        price: Number(formTier1Price || formPrice),
      },
      {
        quantity: 2,
        label: 'Buy 2',
        subtitle: 'Save 10%',
        badge: formTier2Badge || undefined,
        price: Number(formTier2Price || Math.round(formPrice * 2 * 0.9)),
      },
      {
        quantity: 3,
        label: 'Buy 3',
        subtitle: 'Save 20%',
        price: Number(formTier3Price || Math.round(formPrice * 3 * 0.8)),
      },
    ];

    store.saveProduct({
      id: editingProduct?.id,
      name: formName,
      slug: formSlug,
      sku: formSku,
      categorySlug: formCatSlug,
      categoryName: cat?.name || formCatSlug,
      price: Number(formPrice),
      compareAtPrice: formCompareAt ? Number(formCompareAt) : undefined,
      costPrice: formCostPrice ? Number(formCostPrice) : undefined,
      stock: Number(formStock),
      description: formDescription,
      specifications: {
        fabric: formFabric,
        fit: formFit,
        care: formCare,
        origin: formOrigin,
      },
      images: imagesArray.length > 0 ? imagesArray : ['https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85'],
      transparentImage: formTransparentImage || imagesArray[0],
      has360View: formHas360,
      frames360: framesArray,
      isBestSeller: formIsBestSeller,
      isFeatured: formIsFeatured,
      isHangerFeatured: formIsHangerFeatured,
      variants: formVariants,
      bundleHeadline: formBundleHeadline,
      bundleTiers,
    });

    setIsModalOpen(false);
    refreshList();
  };

  const handleInitiateDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    const name = productToDelete.name;
    store.deleteProduct(productToDelete.id);
    refreshList();
    setProductToDelete(null);
    setDeleteNotice(`Product "${name}" was removed from the boutique archive.`);
    setTimeout(() => setDeleteNotice(null), 3500);
  };

  const handleDuplicate = (id: string) => {
    store.duplicateProduct(id);
    refreshList();
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.categorySlug === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
            CATALOGUE DIRECTORY
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
            Bespoke Product Portfolio
          </h2>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold px-5 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Garment Piece</span>
        </button>
      </div>

      {deleteNotice && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
          <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
        >
          <option value="all">All Departments</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Piece</th>
                <th className="p-4">Dept</th>
                <th className="p-4">SKU / Slug</th>
                <th className="p-4">Pricing</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Badges</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                      />
                      <div>
                        <p className="font-serif font-bold text-neutral-900 line-clamp-1">{product.name}</p>
                        <span className="text-[10px] text-neutral-400">
                          {product.variants.length} Variants
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-neutral-700">{product.categoryName}</td>
                  <td className="p-4 font-mono text-[11px] text-neutral-600">
                    <p className="font-bold">{product.sku}</p>
                    <p className="text-[10px] text-neutral-400 truncate max-w-xs">{product.slug}</p>
                  </td>
                  <td className="p-4 font-bold text-neutral-900">
                    <p>৳{product.price.toLocaleString()}</p>
                    {product.costPrice && (
                      <span className="text-[10px] text-neutral-400 font-normal">
                        Cost: ৳{product.costPrice.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md ${
                        product.stock <= 5
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {product.stock} units
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                      {product.isBestSeller && (
                        <span className="bg-[#800000] text-white px-1.5 py-0.5 rounded-xs uppercase">
                          Bestseller
                        </span>
                      )}
                      {product.isHangerFeatured && (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-xs uppercase">
                          Hanger
                        </span>
                      )}
                      {product.has360View && (
                        <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-xs uppercase">
                          360°
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onNavigateToProduct(product.slug)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
                        title="View Public Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(product.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
                        title="Duplicate Product"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 text-neutral-400 hover:text-[#800000] transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(product)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative">
            {/* Sticky Header with prominent close button */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 truncate pr-4">
                {editingProduct ? `Edit Piece: ${editingProduct.name}` : 'Create New Couture Piece'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="product-edit-form" onSubmit={handleSaveProduct} className="overflow-y-auto p-6 sm:p-8 space-y-6 text-xs flex-1 touch-scroll">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingProduct) {
                        setFormSlug(store.generateUniqueSlug(e.target.value));
                      }
                    }}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-neutral-800">Department / Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCategory(!showQuickAddCategory)}
                      className="text-[11px] font-bold text-[#800000] hover:underline cursor-pointer"
                    >
                      {showQuickAddCategory ? 'Cancel' : '+ New Category'}
                    </button>
                  </div>

                  {showQuickAddCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter category name..."
                        value={quickCategoryName}
                        onChange={(e) => setQuickCategoryName(e.target.value)}
                        className="flex-1 p-2.5 border border-neutral-300 rounded-xl text-xs font-semibold focus:border-[#800000]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!quickCategoryName.trim()) return;
                          const created = store.saveCategory({
                            name: quickCategoryName.trim(),
                          });
                          setFormCatSlug(created.slug);
                          setQuickCategoryName('');
                          setShowQuickAddCategory(false);
                          setCategories(store.getCategories());
                        }}
                        className="px-3.5 py-2 bg-[#800000] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#5c0000]"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formCatSlug}
                      onChange={(e) => setFormCatSlug(e.target.value)}
                      className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Total Inventory Stock *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Retail Price (৳ BDT) *</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Compare-At Price (Optional)</label>
                  <input
                    type="number"
                    value={formCompareAt || ''}
                    onChange={(e) => setFormCompareAt(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Atelier Cost Price (Optional)</label>
                  <input
                    type="number"
                    value={formCostPrice || ''}
                    onChange={(e) => setFormCostPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Bundle Pricing / Quantity Offers Section (Screenshot 3 Style) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#800000]" />
                    <span className="font-semibold text-neutral-900">Quantity Bundle Offers (Screenshot 3 Style)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Custom Tiered Pricing</span>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">
                    Offer Headline (Banner on top of bundle box)
                  </label>
                  <input
                    type="text"
                    value={formBundleHeadline}
                    onChange={(e) => setFormBundleHeadline(e.target.value)}
                    placeholder="e.g. 50% OFF TODAY ONLY"
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-1.5">
                    <span className="font-bold text-neutral-900 block text-xs">Buy 1 (Standard)</span>
                    <label className="block text-[10px] text-neutral-500">Package Total (৳ BDT)</label>
                    <input
                      type="number"
                      value={formTier1Price || formPrice}
                      onChange={(e) => setFormTier1Price(Number(e.target.value))}
                      className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 text-xs">Buy 2 (Bundle)</span>
                      <span className="text-[9px] bg-neutral-900 text-white px-1.5 py-0.5 rounded-full font-bold">Badge</span>
                    </div>
                    <label className="block text-[10px] text-neutral-500">Package Total (৳ BDT)</label>
                    <input
                      type="number"
                      value={formTier2Price || Math.round(formPrice * 2 * 0.9)}
                      onChange={(e) => setFormTier2Price(Number(e.target.value))}
                      className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={formTier2Badge}
                      onChange={(e) => setFormTier2Badge(e.target.value)}
                      placeholder="Badge (e.g. Most Popular)"
                      className="w-full p-1.5 border border-neutral-200 rounded-lg text-[10px]"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-1.5">
                    <span className="font-bold text-neutral-900 block text-xs">Buy 3 (Mega Save)</span>
                    <label className="block text-[10px] text-neutral-500">Package Total (৳ BDT)</label>
                    <input
                      type="number"
                      value={formTier3Price || Math.round(formPrice * 3 * 0.8)}
                      onChange={(e) => setFormTier3Price(Number(e.target.value))}
                      className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Fabric Composition</label>
                  <input
                    type="text"
                    value={formFabric}
                    onChange={(e) => setFormFabric(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Origin Atelier</label>
                  <input
                    type="text"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Product Photos / Gallery Manager with File Upload and Thumbnail Reordering */}
              <div className="p-4 sm:p-5 bg-neutral-50/80 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-[#800000]" />
                      <span className="font-bold text-neutral-950 text-sm">Product Photographs & Thumbnail Order</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Upload photos from device. The <strong>1st photo</strong> is always the main catalog thumbnail. Use arrows or &quot;★ Set Cover&quot; to change which photo is first.
                    </p>
                  </div>
                  
                  {/* Upload Button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#800000] hover:bg-[#660000] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload From Device</span>
                    </button>
                  </div>
                </div>

                {/* Add by Image URL input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste an image URL / path here..."
                    className="flex-1 p-2.5 border border-neutral-200 rounded-xl bg-white text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    Add URL
                  </button>
                </div>

                {/* Visual Thumbnail Cards Grid */}
                {formImagesList.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-neutral-300 hover:border-[#800000] rounded-2xl text-center cursor-pointer transition-colors bg-white/60"
                  >
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="font-semibold text-neutral-700">No photos added yet</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Click here to upload photos from your phone or PC</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {formImagesList.map((img, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === formImagesList.length - 1;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-xl border overflow-hidden bg-white shadow-xs group transition-all ${
                            isFirst ? 'ring-2 ring-[#800000] border-transparent' : 'border-neutral-200'
                          }`}
                        >
                          <div className="aspect-3/4 relative bg-neutral-100 overflow-hidden">
                            <img
                              src={img}
                              alt={`Product photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Main Thumbnail Badge on 1st Photo */}
                            {isFirst ? (
                              <div className="absolute top-2 left-2 bg-[#800000] text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                                <Star className="w-3 h-3 fill-white" />
                                <span>MAIN THUMBNAIL</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetAsThumbnail(idx)}
                                className="absolute top-2 left-2 bg-black/70 hover:bg-[#800000] text-white text-[9px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs transition-colors cursor-pointer"
                                title="Make this the first/main thumbnail"
                              >
                                ★ Set Cover
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Reorder / Swipe Controls */}
                          <div className="p-1.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveImage(idx, 'left')}
                              className="p-1 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                              title="Move photo earlier"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-[10px] text-neutral-400 font-bold">
                              {idx + 1} of {formImagesList.length}
                            </span>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveImage(idx, 'right')}
                              className="p-1 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                              title="Move photo later"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transparent image for Fashion Hanger */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Hanger Transparent / Cutout Image URL (For MOVE & SLIDE Rack)
                </label>
                <input
                  type="text"
                  value={formTransparentImage}
                  onChange={(e) => setFormTransparentImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono text-[11px]"
                />
              </div>

              {/* 360 Frames Manager */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Rotate3D className="w-4 h-4 text-[#800000]" />
                    <span className="font-semibold text-neutral-900">360-Degree Turntable Frames</span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formHas360}
                      onChange={(e) => setFormHas360(e.target.checked)}
                      className="rounded-sm text-[#800000]"
                    />
                    <span className="font-medium text-neutral-700">Enable 360° Inspector</span>
                  </label>
                </div>

                {formHas360 && (
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">
                      Ordered Frame URLs (One image per sequential rotation frame):
                    </label>
                    <textarea
                      rows={3}
                      value={formFrames360}
                      onChange={(e) => setFormFrames360(e.target.value)}
                      placeholder="https://...frame1.jpg&#10;https://...frame2.jpg"
                      className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono text-[10px]"
                    />
                  </div>
                )}
              </div>

              {/* Feature checkboxes */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsBestSeller}
                    onChange={(e) => setFormIsBestSeller(e.target.checked)}
                    className="rounded-sm text-[#800000]"
                  />
                  <span className="font-semibold text-neutral-800">Feature in Best-Selling Carousel</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsHangerFeatured}
                    onChange={(e) => setFormIsHangerFeatured(e.target.checked)}
                    className="rounded-sm text-[#800000]"
                  />
                  <span className="font-semibold text-neutral-800">Display on MOVE & SLIDE Hanger Rail</span>
                </label>
              </div>
            </form>

            {/* Sticky Modal Footer (Always visible regardless of scroll height) */}
            <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-neutral-100 flex items-center justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-edit-form"
                className="px-6 py-2.5 rounded-full bg-[#800000] hover:bg-[#5c0000] text-white font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Save Piece
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Reliable on all browsers & Vercel) */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setProductToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-neutral-950">Delete Garment Product</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Are you sure you want to permanently delete this piece from your boutique catalogue?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <img
                src={productToDelete.images[0]}
                alt={productToDelete.name}
                className="w-12 h-12 object-cover rounded-lg bg-neutral-200 shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-neutral-900 truncate">{productToDelete.name}</p>
                <p className="font-mono text-neutral-500 text-[11px]">
                  {productToDelete.sku} · ৳{productToDelete.price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
