import React, { useState } from 'react';
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
} from 'lucide-react';
import { store } from '../../services/store';
import { Product, ProductVariant, BundleTier } from '../../types';

interface AdminProductsProps {
  onNavigateToProduct: (slug: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ onNavigateToProduct }) => {
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const categories = store.getCategories();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit / Create modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const [formTransparentImage, setFormTransparentImage] = useState('');
  const [formHas360, setFormHas360] = useState(false);
  const [formFrames360, setFormFrames360] = useState<string>('');
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [formIsHangerFeatured, setFormIsHangerFeatured] = useState(true);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);

  // Bundle Offer Tiers (Screenshot 3 Style)
  const [formBundleHeadline, setFormBundleHeadline] = useState('50% OFF TODAY ONLY');
  const [formTier1Price, setFormTier1Price] = useState<number>(0);
  const [formTier2Price, setFormTier2Price] = useState<number>(0);
  const [formTier2Badge, setFormTier2Badge] = useState('Most Popular');
  const [formTier3Price, setFormTier3Price] = useState<number>(0);

  const refreshList = () => {
    setProducts(store.getProducts());
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormSku(`HYD-${Date.now().toString().slice(-4)}`);
    setFormCatSlug(categories[0]?.slug || 'shackets');
    setFormPrice(8500);
    setFormCompareAt(10500);
    setFormCostPrice(3800);
    setFormStock(15);
    setFormDescription('Artisanal silhouette handcrafted from premium fibres.');
    setFormFabric('80% Virgin Wool, 20% Cashmere-touch Polyamide');
    setFormFit('Relaxed Tailored Silhouette');
    setFormCare('Specialist Dry Clean Only');
    setFormOrigin('Dhaka Atelier Studio');
    setFormImages('https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85');
    setFormTransparentImage('https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=85');
    setFormHas360(false);
    setFormFrames360('');
    setFormIsBestSeller(false);
    setFormIsFeatured(true);
    setFormIsHangerFeatured(true);
    setFormVariants([
      { id: `v-${Date.now()}-38`, name: 'Size 38 / Signature', size: '38', color: 'Signature', sku: `HYD-38`, price: 8500, stock: 5 },
      { id: `v-${Date.now()}-40`, name: 'Size 40 / Signature', size: '40', color: 'Signature', sku: `HYD-40`, price: 8500, stock: 6 },
      { id: `v-${Date.now()}-42`, name: 'Size 42 / Signature', size: '42', color: 'Signature', sku: `HYD-42`, price: 8500, stock: 4 },
    ]);
    setFormBundleHeadline('50% OFF TODAY ONLY');
    setFormTier1Price(8500);
    setFormTier2Price(15300);
    setFormTier2Badge('Most Popular');
    setFormTier3Price(20400);
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

    const imagesArray = formImages
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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this piece from the archive?')) {
      store.deleteProduct(id);
      refreshList();
    }
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
          className="bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold px-5 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Garment Piece</span>
        </button>
      </div>

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
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="font-serif text-xl font-bold text-neutral-950">
                {editingProduct ? `Edit Piece: ${editingProduct.name}` : 'Create New Couture Piece'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-6 space-y-5 text-xs">
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
                  <label className="block font-semibold text-neutral-800 mb-1">Department / Category *</label>
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

              {/* Gallery Image URLs */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Product Image URLs (One URL per line)
                </label>
                <textarea
                  rows={3}
                  value={formImages}
                  onChange={(e) => setFormImages(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono text-[11px]"
                />
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

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#800000] hover:bg-[#5c0000] text-white font-semibold uppercase tracking-wider"
                >
                  Save Piece
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
