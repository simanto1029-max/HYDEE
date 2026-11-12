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
import { isSupabaseConfigured } from '../../services/supabase';
import { uploadDataUrlToStorage, containsDataUrl, replaceDataUrlsWithStorageLinks } from '../../services/imageStorage';
import { Product, ProductVariant, BundleTier, Category } from '../../types';

interface AdminProductsProps {
  onNavigateToProduct: (slug: string) => void;
}

// Default text under "Buy 1 / Buy 2 / Buy 3". The admin can replace it with any custom text per product.
const autoTierSubtitle = (tierIndex: number, freeDelivery: boolean): string => {
  const base = ['Standard Edition', 'Save 10% Extra', 'Save 20% Extra'][tierIndex] || '';
  return freeDelivery ? `${base} + Free Delivery` : base;
};

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
  const [formTier1FreeShipping, setFormTier1FreeShipping] = useState<boolean>(false);
  const [formTier2Price, setFormTier2Price] = useState<number>(0);
  const [formTier2Badge, setFormTier2Badge] = useState('Most Popular');
  const [formTier2FreeShipping, setFormTier2FreeShipping] = useState<boolean>(false);
  const [formTier3Price, setFormTier3Price] = useState<number>(0);
  const [formTier3FreeShipping, setFormTier3FreeShipping] = useState<boolean>(true);
  // Custom text under Buy 1/2/3. Empty = use the automatic default text
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [formTier1Subtitle, setFormTier1Subtitle] = useState('');
  const [formTier2Subtitle, setFormTier2Subtitle] = useState('');
  const [formTier3Subtitle, setFormTier3Subtitle] = useState('');

  // Size Options (Optional & Customizable per product)
  const [formHasSizes, setFormHasSizes] = useState<boolean>(true);
  const [formCustomSizes, setFormCustomSizes] = useState<string>('38, 40, 42');

  // Color Options (Screenshot 4 Style with image thumbnail)
  const [formColors, setFormColors] = useState<{ name: string; imageUrl?: string; colorHex?: string }[]>([
    { name: 'Blue', imageUrl: '', colorHex: '#2563eb' },
    { name: 'Black', imageUrl: '', colorHex: '#171717' },
    { name: 'Dark Red', imageUrl: '', colorHex: '#800000' },
  ]);

  const handleAddColorOption = () => {
    setFormColors((prev) => [
      ...prev,
      {
        name: `Color ${prev.length + 1}`,
        imageUrl: formImagesList[0] || '',
        colorHex: '#800000',
      },
    ]);
  };

  const handleUpdateColor = (index: number, field: 'name' | 'imageUrl' | 'colorHex', value: string) => {
    setFormColors((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveColorOption = (index: number) => {
    setFormColors((prev) => prev.filter((_, i) => i !== index));
  };

  const refreshList = () => {
    setProducts(store.getProducts());
  };

  // Client-side image compression: prevents large camera uploads from exceeding browser storage limits
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Image Upload & Reorder Helpers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const compressedPromises = files.map((file) => compressImageFile(file));
      const results = await Promise.all(compressedPromises);
      const valid = results.filter(Boolean);

      // Send each new photo to fast image storage (a small link is saved instead of a heavy embedded picture)
      let finalImages = valid;
      if (isSupabaseConfigured) {
        try {
          finalImages = await Promise.all(valid.map((img) => uploadDataUrlToStorage(img)));
          setUploadWarning(null);
        } catch (err: any) {
          console.error('Image storage upload failed:', err);
          setUploadWarning(
            `${err?.message || 'Image upload failed.'} The photo was still added, but it will make the website slower until storage is set up.`
          );
        }
      }
      setFormImagesList((prev) => [...prev, ...finalImages]);
    } catch (err) {
      console.error('Error compressing uploaded files:', err);
    }
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

  // One-time: move every old embedded (base64) picture to fast image storage
  const heavyProducts = products.filter((p) => containsDataUrl(p));

  const handleMigrateImages = async () => {
    if (migrating) return;
    setMigrating(true);
    setMigrateMsg(null);
    const cache = new Map<string, string>();
    let uploaded = 0;
    let failed = 0;
    let lastError = '';
    const list = store.getProducts().filter((p) => containsDataUrl(p));

    for (let i = 0; i < list.length; i++) {
      setMigrateMsg({ type: 'ok', text: `Moving images… product ${i + 1} of ${list.length} (${uploaded} photos done)` });
      try {
        const updated = await replaceDataUrlsWithStorageLinks(list[i], cache, () => {
          uploaded++;
        });
        store.saveProduct(updated);
      } catch (err: any) {
        failed++;
        lastError = err?.message || String(err);
        console.error('Image migration failed for', list[i].name, err);
      }
    }

    setProducts(store.getProducts());
    if (failed === 0) {
      store.updateSettings({ imagesInStorage: true });
      setMigrateMsg({ type: 'ok', text: `Done! ${uploaded} photos moved. Your website will now load much faster.` });
    } else {
      setMigrateMsg({ type: 'error', text: `${failed} product(s) could not be moved: ${lastError}` });
    }
    setMigrating(false);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormSku(`HYD-${Date.now().toString().slice(-4)}`);
    setFormCatSlug(categories[0]?.slug || 'three-piece');
    setFormPrice(1799);
    setFormCompareAt(2500);
    setFormCostPrice(900);
    setFormStock(15);
    setFormDescription('Luxury in every fold. Specially designed for fancy gatherings and graceful evenings.');
    setFormFabric('100% Premium Cotton with intricate embroidery');
    setFormFit('Graceful Long Silhouette with Flared Palazzo');
    setFormCare('Specialist Dry Clean Only');
    setFormOrigin('Tangail Atelier Studio');
    setFormImages('/images/editorial-glory-red.jpg');
    setFormImagesList(['/images/editorial-glory-red.jpg']);
    setFormTransparentImage('');
    setFormHas360(false);
    setFormFrames360('');
    setFormIsBestSeller(false);
    setFormIsFeatured(true);
    setFormIsHangerFeatured(true);
    setFormHasSizes(true);
    setFormCustomSizes('38, 40, 42');
    setFormColors([
      { name: 'Blue', imageUrl: '', colorHex: '#2563eb' },
      { name: 'Black', imageUrl: '', colorHex: '#171717' },
      { name: 'Dark Red', imageUrl: '', colorHex: '#800000' },
    ]);
    setFormBundleHeadline('50% OFF TODAY ONLY');
    setFormTier1Price(1799);
    setFormTier1FreeShipping(false);
    setFormTier2Price(3238);
    setFormTier2Badge('Most Popular');
    setFormTier2FreeShipping(false);
    setFormTier3Price(4318);
    setFormTier3FreeShipping(true);
    setFormTier1Subtitle('');
    setFormTier2Subtitle('');
    setFormTier3Subtitle('');
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
    
    // Load sizes
    setFormHasSizes(p.hasSizes ?? true);
    setFormCustomSizes(
      p.customSizes && p.customSizes.length > 0
        ? p.customSizes.join(', ')
        : Array.from(new Set((p.variants || []).map((v) => v.size).filter((s) => s && s !== 'Free Size' && s !== 'Standard'))).join(', ') || '38, 40, 42'
    );

    // Load colors (Screenshot 4 style)
    if (p.colorOptions && p.colorOptions.length > 0) {
      setFormColors(p.colorOptions);
    } else {
      const uniqueColors = Array.from(new Set((p.variants || []).map((v) => v.color).filter(Boolean)));
      if (uniqueColors.length > 0) {
        setFormColors(
          uniqueColors.map((c) => {
            const v = p.variants.find((vr) => vr.color === c);
            return {
              name: c,
              imageUrl: v?.colorImage || p.images[0] || '',
              colorHex: v?.colorHex || '#800000',
            };
          })
        );
      } else {
        setFormColors([
          { name: 'Blue', imageUrl: p.images[0] || '', colorHex: '#2563eb' },
          { name: 'Black', imageUrl: p.images[0] || '', colorHex: '#171717' },
          { name: 'Dark Red', imageUrl: p.images[0] || '', colorHex: '#800000' },
        ]);
      }
    }

    // Load bundle tiers & free shipping
    setFormBundleHeadline(p.bundleHeadline || '50% OFF TODAY ONLY');
    const tiers = p.bundleTiers || [];
    setFormTier1Price(tiers[0]?.price ?? p.price);
    setFormTier1FreeShipping(tiers[0]?.freeShipping ?? false);
    setFormTier2Price(tiers[1]?.price ?? Math.round(p.price * 2 * 0.9));
    setFormTier2Badge(tiers[1]?.badge || 'Most Popular');
    setFormTier2FreeShipping(tiers[1]?.freeShipping ?? false);
    setFormTier3Price(tiers[2]?.price ?? Math.round(p.price * 3 * 0.8));
    setFormTier3FreeShipping(tiers[2]?.freeShipping ?? true);
    // Show a custom text only if the admin really wrote one; the automatic default stays empty (placeholder shows it)
    const customSubtitleOf = (i: number): string => {
      const sub = (tiers[i]?.subtitle || '').trim();
      if (!sub) return '';
      return sub === autoTierSubtitle(i, true) || sub === autoTierSubtitle(i, false) ? '' : sub;
    };
    setFormTier1Subtitle(customSubtitleOf(0));
    setFormTier2Subtitle(customSubtitleOf(1));
    setFormTier3Subtitle(customSubtitleOf(2));

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
        subtitle: formTier1Subtitle.trim() || autoTierSubtitle(0, formTier1FreeShipping),
        price: Number(formTier1Price || formPrice),
        freeShipping: formTier1FreeShipping,
      },
      {
        quantity: 2,
        label: 'Buy 2',
        subtitle: formTier2Subtitle.trim() || autoTierSubtitle(1, formTier2FreeShipping),
        badge: formTier2Badge || undefined,
        price: Number(formTier2Price || Math.round(formPrice * 2 * 0.9)),
        freeShipping: formTier2FreeShipping,
      },
      {
        quantity: 3,
        label: 'Buy 3',
        subtitle: formTier3Subtitle.trim() || autoTierSubtitle(2, formTier3FreeShipping),
        price: Number(formTier3Price || Math.round(formPrice * 3 * 0.8)),
        freeShipping: formTier3FreeShipping,
      },
    ];

    const parsedSizes = formHasSizes
      ? formCustomSizes.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Free Size'];

    const colorsToUse = formColors.length > 0
      ? formColors
      : [{ name: 'Default', imageUrl: imagesArray[0], colorHex: '#800000' }];

    // Auto-generate synchronized variants with accurate price, compareAtPrice, size and color image
    const generatedVariants: ProductVariant[] = [];
    colorsToUse.forEach((col) => {
      parsedSizes.forEach((sz) => {
        generatedVariants.push({
          id: `v-${Date.now()}-${col.name}-${sz}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
          name: formHasSizes ? `Size ${sz} / ${col.name}` : col.name,
          size: formHasSizes ? sz : 'Free Size',
          color: col.name,
          colorHex: col.colorHex,
          colorImage: col.imageUrl || imagesArray[0],
          sku: `${formSku}-${sz}-${col.name}`.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase(),
          price: Number(formPrice),
          compareAtPrice: formCompareAt ? Number(formCompareAt) : undefined,
          stock: Math.max(1, Math.floor(formStock / (colorsToUse.length * parsedSizes.length)) || 4),
        });
      });
    });

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
      hasSizes: formHasSizes,
      customSizes: formHasSizes ? parsedSizes : [],
      colorOptions: colorsToUse,
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
      variants: generatedVariants,
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

      {uploadWarning && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl">{uploadWarning}</div>
      )}

      {isSupabaseConfigured && (heavyProducts.length > 0 || migrateMsg) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-blue-950 leading-relaxed">
            <strong>⚡ Make your website faster.</strong>{' '}
            {heavyProducts.length > 0
              ? `${heavyProducts.length} product(s) still keep heavy pictures inside the database. Move them to fast image storage once (the picture quality stays exactly the same).`
              : 'All pictures are in fast image storage.'}
            {migrateMsg && (
              <span className={`block mt-1 font-semibold ${migrateMsg.type === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>
                {migrateMsg.text}
              </span>
            )}
          </div>
          {heavyProducts.length > 0 && (
            <button
              onClick={handleMigrateImages}
              disabled={migrating}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
            >
              {migrating ? 'Moving…' : 'Move images now'}
            </button>
          )}
        </div>
      )}

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
          /* Intentionally DO NOT close on outer backdrop click to prevent accidental loss of typed product data */
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
                    onChange={(e) => {
                      const newP = Number(e.target.value);
                      setFormPrice(newP);
                      setFormTier1Price(newP);
                      setFormTier2Price(Math.round(newP * 2 * 0.9));
                      setFormTier3Price(Math.round(newP * 3 * 0.8));
                    }}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Compare-At Regular Price (Optional)</label>
                  <input
                    type="number"
                    value={formCompareAt || ''}
                    placeholder="e.g. 19500 (Shows strikethrough & Save % badge)"
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

              {/* Size Options (Customizable & Optional for Sarees/Unstitched) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-neutral-900 text-xs">Size Selection (সাইজ অপশন)</span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-xs">
                    <input
                      type="checkbox"
                      checked={formHasSizes}
                      onChange={(e) => setFormHasSizes(e.target.checked)}
                      className="rounded-xs text-[#800000] cursor-pointer"
                    />
                    <span className="font-bold text-[11px] text-neutral-800">
                      {formHasSizes ? 'Sizes Enabled (সাইজ দেখাবে)' : 'No Sizes (শাড়ি/আনস্টিচড - সাইজ দেখাবে না)'}
                    </span>
                  </label>
                </div>

                {formHasSizes ? (
                  <div className="space-y-2">
                    <label className="block text-[11px] text-neutral-600">
                      Custom Sizes (কমা দিয়ে একাধিক সাইজ লিখুন, যেমন: 38, 40, 42 অথবা S, M, L, XL):
                    </label>
                    <input
                      type="text"
                      value={formCustomSizes}
                      onChange={(e) => setFormCustomSizes(e.target.value)}
                      placeholder="e.g. 38, 40, 42 or S, M, L, XL or Free Size"
                      className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-medium text-xs"
                    />
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] text-neutral-400 font-semibold">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setFormCustomSizes('38, 40, 42')}
                        className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] font-semibold text-neutral-700"
                      >
                        38, 40, 42
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCustomSizes('36, 38, 40, 42, 44')}
                        className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] font-semibold text-neutral-700"
                      >
                        36, 38, 40, 42, 44
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCustomSizes('S, M, L, XL, XXL')}
                        className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] font-semibold text-neutral-700"
                      >
                        S, M, L, XL, XXL
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCustomSizes('Free Size')}
                        className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] font-semibold text-neutral-700"
                      >
                        Free Size
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic bg-white p-2.5 rounded-xl border border-neutral-100">
                    সাইজ বন্ধ রাখা হয়েছে। কাস্টমার সরাসরি পণ্যটি সিলেক্ট করে অর্ডার করতে পারবেন।
                  </p>
                )}
              </div>

              {/* Color Options & Photo Swatches (Screenshot 4 Style) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-neutral-900 text-xs">Color Options & Model Swatches (Screenshot 4 Style)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddColorOption}
                    className="px-3 py-1 bg-[#800000] text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-[#600000]"
                  >
                    + Add Color
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  প্রত্যেকটি কালারের নাম এবং মডেল ছবির URL দিন। স্টোরফ্রন্টে সুন্দর স্কয়ার কার্ড এবং গ্রিন টিকমার্ক সহ প্রদর্শিত হবে।
                </p>

                <div className="space-y-3">
                  {formColors.map((col, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-white p-3.5 rounded-2xl border border-neutral-200 space-y-3 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Image Thumbnail Preview */}
                        <div className="w-14 h-14 rounded-xl border border-neutral-300 overflow-hidden bg-neutral-100 shrink-0 relative shadow-xs">
                          {col.imageUrl ? (
                            <img src={col.imageUrl} alt={col.name} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white"
                              style={{ backgroundColor: col.colorHex || '#800000' }}
                            >
                              {col.name.slice(0, 3)}
                            </div>
                          )}
                        </div>

                        {/* Color Name */}
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="block text-[10px] text-neutral-500 font-semibold mb-0.5">Color Name (কালারের নাম)</label>
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => handleUpdateColor(cIdx, 'name', e.target.value)}
                            placeholder="e.g. Royal Crimson, Sky Blue, Mustard Yellow"
                            className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        {/* Color Tone / Hex */}
                        <div className="w-24 shrink-0">
                          <label className="block text-[10px] text-neutral-500 font-semibold mb-0.5">Tone (কালার)</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={col.colorHex || '#800000'}
                              onChange={(e) => handleUpdateColor(cIdx, 'colorHex', e.target.value)}
                              className="w-8 h-8 rounded-lg border border-neutral-300 cursor-pointer p-0"
                            />
                            <span className="text-[10px] font-mono text-neutral-500 truncate">{col.colorHex}</span>
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleRemoveColorOption(cIdx)}
                          disabled={formColors.length <= 1}
                          className="p-2 text-neutral-400 hover:text-red-600 disabled:opacity-20 cursor-pointer"
                          title="Remove Color"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Clickable Photo Selector from Uploaded Gallery Photos */}
                      {formImagesList.length > 0 ? (
                        <div className="pt-2 border-t border-neutral-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-neutral-800">
                              📷 Select Photo for &quot;{col.name || `Color ${cIdx + 1}`}&quot; (আপলোড করা ছবিগুলো থেকে সিলেক্ট করুন):
                            </span>
                            {col.imageUrl && (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Photo Connected ✓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                            {formImagesList.map((uploadedImg, uIdx) => {
                              const isSelectedImg = col.imageUrl === uploadedImg;
                              return (
                                <button
                                  key={uIdx}
                                  type="button"
                                  onClick={() => handleUpdateColor(cIdx, 'imageUrl', uploadedImg)}
                                  className={`relative w-14 h-16 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                    isSelectedImg
                                      ? 'border-emerald-500 ring-2 ring-emerald-400/40 scale-105 shadow-md'
                                      : 'border-neutral-200 hover:border-neutral-400 opacity-60 hover:opacity-100 shadow-xs'
                                  }`}
                                  title={`Select Photo ${uIdx + 1} for ${col.name}`}
                                >
                                  <img src={uploadedImg} alt={`Upload ${uIdx + 1}`} className="w-full h-full object-cover" />
                                  {isSelectedImg ? (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <span className="absolute bottom-0.5 right-1 text-[8px] bg-black/60 text-white px-1 rounded font-bold">
                                      #{uIdx + 1}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-700 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                          নিচের &quot;Product Photographs&quot; সেকশনে ছবি আপলোড করলে এখান থেকেই সরাসরি কালারের ছবি সিলেক্ট করতে পারবেন।
                        </p>
                      )}
                    </div>
                  ))}
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
                  {/* Tier 1: Buy 1 */}
                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-2">
                    <span className="font-bold text-neutral-900 block text-xs">Buy 1 (Standard)</span>
                    <label className="block text-[10px] text-neutral-500">Package Total (৳ BDT)</label>
                    <input
                      type="number"
                      value={formTier1Price || formPrice}
                      onChange={(e) => setFormTier1Price(Number(e.target.value))}
                      className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-bold"
                    />
                    <label className="block text-[10px] text-neutral-500">Text under "Buy 1" (leave empty for default)</label>
                    <input
                      type="text"
                      value={formTier1Subtitle}
                      onChange={(e) => setFormTier1Subtitle(e.target.value)}
                      placeholder={autoTierSubtitle(0, formTier1FreeShipping)}
                      className="w-full p-1.5 border border-neutral-200 rounded-lg text-[10px]"
                    />
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={formTier1FreeShipping}
                        onChange={(e) => setFormTier1FreeShipping(e.target.checked)}
                        className="rounded-xs text-emerald-600"
                      />
                      <span>Free Delivery (ফ্রি ডেলিভারি)</span>
                    </label>
                  </div>

                  {/* Tier 2: Buy 2 */}
                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-2">
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
                    <label className="block text-[10px] text-neutral-500">Text under "Buy 2" (leave empty for default)</label>
                    <input
                      type="text"
                      value={formTier2Subtitle}
                      onChange={(e) => setFormTier2Subtitle(e.target.value)}
                      placeholder={autoTierSubtitle(1, formTier2FreeShipping)}
                      className="w-full p-1.5 border border-neutral-200 rounded-lg text-[10px]"
                    />
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={formTier2FreeShipping}
                        onChange={(e) => setFormTier2FreeShipping(e.target.checked)}
                        className="rounded-xs text-emerald-600"
                      />
                      <span>Free Delivery (ফ্রি ডেলিভারি)</span>
                    </label>
                  </div>

                  {/* Tier 3: Buy 3 */}
                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-2">
                    <span className="font-bold text-neutral-900 block text-xs">Buy 3 (Mega Save)</span>
                    <label className="block text-[10px] text-neutral-500">Package Total (৳ BDT)</label>
                    <input
                      type="number"
                      value={formTier3Price || Math.round(formPrice * 3 * 0.8)}
                      onChange={(e) => setFormTier3Price(Number(e.target.value))}
                      className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-bold"
                    />
                    <label className="block text-[10px] text-neutral-500">Text under "Buy 3" (leave empty for default)</label>
                    <input
                      type="text"
                      value={formTier3Subtitle}
                      onChange={(e) => setFormTier3Subtitle(e.target.value)}
                      placeholder={autoTierSubtitle(2, formTier3FreeShipping)}
                      className="w-full p-1.5 border border-neutral-200 rounded-lg text-[10px]"
                    />
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={formTier3FreeShipping}
                        onChange={(e) => setFormTier3FreeShipping(e.target.checked)}
                        className="rounded-xs text-emerald-600"
                      />
                      <span>Free Delivery (ফ্রি ডেলিভারি)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Product Description (Line breaks, spaces, and paragraphs will appear exactly as typed)
                </label>
                <textarea
                  rows={6}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter detailed description. Enter lines, bullet points, and paragraphs freely..."
                  className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden whitespace-pre-wrap font-sans text-xs leading-relaxed"
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
