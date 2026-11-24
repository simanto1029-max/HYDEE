import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Sparkles, Check, Image as ImageIcon, X, Upload, Eye, EyeOff } from 'lucide-react';
import { store } from '../../services/store';
import { HeroSlide, Product } from '../../types';
import { storeImageDataUrl } from '../../services/imageStorage';

// Reads a picked picture, keeps it sharp (up to 2000px wide) and puts a white background behind transparent parts
const prepareBannerImage = (file: File, maxWidth = 2000, quality = 0.88): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const original = String(e.target?.result || '');
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(original);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(original);
      img.src = original;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

export const AdminHomepage: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>(store.getHeroSlides());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [savedNotice, setSavedNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Add / edit banner modal
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideCtaText, setSlideCtaText] = useState('');
  const [slideCtaLink, setSlideCtaLink] = useState('');
  const [slideDesktopImg, setSlideDesktopImg] = useState('');
  const [slideMobileImg, setSlideMobileImg] = useState('');
  const [slideAlign, setSlideAlign] = useState<'left' | 'center' | 'right'>('left');
  const [slideTheme, setSlideTheme] = useState<'light' | 'dark'>('light');
  const [slideShowText, setSlideShowText] = useState(false);
  const [slideHeight, setSlideHeight] = useState<'auto' | 'compact' | 'medium' | 'tall'>('compact');
  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = store.getCategories();

  const showNotice = (type: 'ok' | 'error', text: string) => {
    setSavedNotice({ type, text });
    setTimeout(() => setSavedNotice(null), 4500);
  };

  // Keep the list in step with the database after a refresh
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setSlides(store.getHeroSlides());
      setProducts(store.getProducts());
    });
    return () => unsubscribe();
  }, []);

  const resetForm = (slide?: HeroSlide) => {
    setSlideTitle(slide?.title || '');
    setSlideSubtitle(slide?.subtitle || '');
    setSlideCtaText(slide?.ctaText || '');
    setSlideCtaLink(slide?.ctaLink || '');
    setSlideDesktopImg(slide?.desktopImage || '');
    setSlideMobileImg(slide?.mobileImage && slide.mobileImage !== slide.desktopImage ? slide.mobileImage : '');
    setSlideAlign(slide?.align || 'left');
    setSlideTheme(slide?.textTheme || 'light');
    setSlideShowText(slide?.showText === true);
    setSlideHeight(slide?.height || 'compact');
    setUploadWarning(null);
  };

  const handleOpenNewSlide = () => {
    const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 1;
    const fresh: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '',
      desktopImage: '',
      mobileImage: '',
      align: 'left',
      textTheme: 'light',
      isActive: true,
      order: nextOrder,
    };
    resetForm();
    setIsNewSlide(true);
    setEditingSlide(fresh);
  };

  const handleOpenEditSlide = (slide: HeroSlide) => {
    resetForm(slide);
    setIsNewSlide(false);
    setEditingSlide(slide);
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>, which: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(which);
    setUploadWarning(null);
    try {
      const prepared = await prepareBannerImage(file);
      if (!prepared) throw new Error('Could not read this picture.');
      const stored = await storeImageDataUrl(prepared);
      if (which === 'desktop') setSlideDesktopImg(stored.url);
      else setSlideMobileImg(stored.url);
      if (stored.warning) setUploadWarning(stored.warning);
    } catch (err: any) {
      setUploadWarning(err?.message || 'Upload failed. Please try another picture.');
    } finally {
      setUploading(null);
    }
  };

  const persistSlides = async (updated: HeroSlide[], okText: string) => {
    setSlides(updated);
    const result = await store.saveHeroSlides(updated);
    showNotice(result.success ? 'ok' : 'error', result.success ? `${okText} ${result.message}` : result.message);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    if (!slideDesktopImg.trim()) {
      setUploadWarning('Please upload a banner picture first.');
      return;
    }
    setIsSaving(true);

    const saved: HeroSlide = {
      ...editingSlide,
      title: slideTitle.trim(),
      subtitle: slideSubtitle.trim(),
      ctaText: slideCtaText.trim(),
      ctaLink: slideCtaLink.trim(),
      desktopImage: slideDesktopImg.trim(),
      mobileImage: slideMobileImg.trim() || slideDesktopImg.trim(),
      align: slideAlign,
      textTheme: slideTheme,
      showText: slideShowText,
      height: slideHeight,
    };
    const updated = isNewSlide ? [...slides, saved] : slides.map((s) => (s.id === saved.id ? saved : s));

    await persistSlides(updated, isNewSlide ? 'Banner added.' : 'Banner updated.');
    setIsSaving(false);
    setEditingSlide(null);
  };

  const handleToggleActive = (slide: HeroSlide) => {
    const updated = slides.map((s) => (s.id === slide.id ? { ...s, isActive: !s.isActive } : s));
    persistSlides(updated, slide.isActive ? 'Banner hidden from the homepage.' : 'Banner is live on the homepage.');
  };

  const handleDeleteSlide = (slide: HeroSlide) => {
    if (!window.confirm('এই ব্যানারটি মুছে ফেলবেন?')) return;
    persistSlides(slides.filter((s) => s.id !== slide.id), 'Banner deleted.');
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const sorted = [...slides].sort((x, y) => x.order - y.order);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    persistSlides(sorted.map((sl, i) => ({ ...sl, order: i + 1 })), 'Order changed.');
  };

  const handleToggleHanger = (productId: string) => {
    const p = store.getProductById(productId);
    if (!p) return;
    store.saveProduct({ ...p, isHangerFeatured: !p.isHangerFeatured });
    setProducts(store.getProducts());
    showNotice('ok', `Updated hanger status for ${p.name}`);
  };

  const handleToggleBestseller = (productId: string) => {
    const p = store.getProductById(productId);
    if (!p) return;
    store.saveProduct({ ...p, isBestSeller: !p.isBestSeller });
    setProducts(store.getProducts());
    showNotice('ok', `Updated bestseller status for ${p.name}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingSlide) {
        setEditingSlide(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingSlide]);

  const sortedSlides = [...slides].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
          CURATION STUDIO
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
          Homepage Visual Architecture
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Choose the homepage banners, curate interactive fashion hanger pieces, and assign bestsellers.
        </p>
      </div>

      {savedNotice && (
        <div
          className={`p-3 border text-xs rounded-xl flex items-center gap-2 ${
            savedNotice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{savedNotice.text}</span>
        </div>
      )}

      {/* Hero Banner Manager */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#800000]" />
              <span>Homepage Hero Banners</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
              এখানে যে ছবিগুলো দেবেন শুধু সেগুলোই হোমপেজের উপরে দেখাবে (নিজে থেকে প্রোডাক্ট ছবি আসবে না)। ছবি যেমন আপলোড করবেন ঠিক তেমনই দেখাবে: কোনো গোল কোণা, বর্ডার বা ছায়া থাকবে না। সাদা ব্যাকগ্রাউন্ডের ছবি দিলে সেটা ওয়েবসাইটের সাথে মিশে যাবে। কোনো ব্যানার না থাকলে হিরো জায়গাটা দেখাবেই না।
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewSlide}
            className="px-4 py-2.5 bg-[#800000] hover:bg-[#660000] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>

        {sortedSlides.length === 0 ? (
          <div className="p-10 text-center text-xs text-neutral-500 bg-white border border-dashed border-neutral-300 rounded-2xl">
            এখনো কোনো ব্যানার নেই। উপরে <strong>Add Banner</strong> চাপ দিয়ে ছবি আপলোড করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col ${
                  slide.isActive ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
                }`}
              >
                <div className="relative bg-neutral-100">
                  <img src={slide.desktopImage} alt={slide.title || 'Banner'} className="w-full h-auto block" />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                    Banner {idx + 1}
                  </span>
                  <span
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      slide.isActive ? 'bg-emerald-600 text-white' : 'bg-neutral-700 text-white'
                    }`}
                  >
                    {slide.isActive ? 'LIVE' : 'HIDDEN'}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-3">
                  <div className="min-h-[2rem]">
                    <h4 className="font-semibold text-neutral-900 text-sm line-clamp-1">
                      {slide.title || '(শুধু ছবি, কোনো লেখা নেই)'}
                    </h4>
                    {slide.ctaLink && (
                      <p className="text-neutral-500 mt-1 font-mono text-[10px] truncate">Click → {slide.ctaLink}</p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                        title="Move earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === sortedSlides.length - 1}
                        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                        title="Move later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(slide)}
                        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                        title={slide.isActive ? 'Hide from homepage' : 'Show on homepage'}
                      >
                        {slide.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSlide(slide)}
                        className="px-2.5 py-1.5 text-neutral-700 hover:text-[#800000] hover:bg-red-50 rounded-md font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide)}
                        className="p-1.5 text-neutral-400 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer"
                        title="Delete banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MOVE & SLIDE Interactive Hanger Curations */}
      <div className="space-y-4 pt-6 border-t border-neutral-200">
        <div>
          <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#800000]" />
            <span>MOVE & SLIDE Hanger Rail Selection</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Toggle which couture pieces hang on the signature 3D boutique rack on the homepage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const isHanger = p.isHangerFeatured;
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                  isHanger
                    ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <div className="flex items-center space-x-3 truncate pr-2">
                  <img src={p.images[0]} alt={p.name} className="w-10 h-12 object-cover rounded-md bg-neutral-100 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-neutral-900 truncate">{p.name}</p>
                    <span className="text-[10px] text-neutral-400">৳{p.price.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleHanger(p.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase transition-colors shrink-0 ${
                    isHanger
                      ? 'bg-[#800000] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {isHanger ? 'On Rail' : 'Hidden'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bestseller Manual Selection */}
      <div className="space-y-4 pt-6 border-t border-neutral-200">
        <div>
          <h3 className="font-serif text-lg font-bold text-neutral-950">
            Best-Selling Garments Showcase
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Choose which curated garments appear in the Best-Selling products grid.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const isBest = p.isBestSeller;
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                  isBest
                    ? 'bg-rose-50/40 border-rose-300 ring-1 ring-[#800000]'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <div className="flex items-center space-x-3 truncate pr-2">
                  <img src={p.images[0]} alt={p.name} className="w-10 h-12 object-cover rounded-md bg-neutral-100 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-neutral-900 truncate">{p.name}</p>
                    <span className="text-[10px] text-neutral-400">{p.categoryName}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleBestseller(p.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase transition-colors shrink-0 ${
                    isBest
                      ? 'bg-[#800000] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {isBest ? 'Bestseller' : 'Standard'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Banner Modal */}
      {editingSlide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSlide(null);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg font-bold text-neutral-950">
                {isNewSlide ? 'Add Homepage Banner' : 'Edit Homepage Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="overflow-y-auto p-6 space-y-5 text-xs flex-1 touch-scroll">
              {/* Desktop picture */}
              <div>
                <label className="block font-semibold mb-1">Banner picture (Desktop + Mobile) *</label>
                <p className="text-[11px] text-neutral-500 mb-2">
                  ছবির সাইজ ১৬০০×৬০০ বা তার কাছাকাছি (চওড়া ছবি) দিলে ভালো দেখায়। যে ছবি দেবেন পুরোটাই দেখাবে, কাটা পড়বে না।
                </p>
                {slideDesktopImg && (
                  <div className="mb-2 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                    <img src={slideDesktopImg} alt="Banner preview" className="w-full h-auto block" />
                  </div>
                )}
                <label
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 font-semibold cursor-pointer hover:bg-neutral-50 ${
                    uploading === 'desktop' ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading === 'desktop' ? 'Uploading…' : slideDesktopImg ? 'Change picture' : 'Upload picture'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePickImage(e, 'desktop')} />
                </label>
              </div>

              {/* Mobile picture */}
              <div>
                <label className="block font-semibold mb-1">Mobile picture (ঐচ্ছিক)</label>
                <p className="text-[11px] text-neutral-500 mb-2">
                  না দিলে উপরের ছবিটাই মোবাইলে দেখাবে। মোবাইলের জন্য আলাদা (যেমন বর্গাকার) ছবি চাইলে এখানে দিন।
                </p>
                {slideMobileImg && (
                  <div className="mb-2 w-40 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                    <img src={slideMobileImg} alt="Mobile preview" className="w-full h-auto block" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 font-semibold cursor-pointer hover:bg-neutral-50 ${
                      uploading === 'mobile' ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploading === 'mobile' ? 'Uploading…' : slideMobileImg ? 'Change' : 'Upload mobile picture'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePickImage(e, 'mobile')} />
                  </label>
                  {slideMobileImg && (
                    <button type="button" onClick={() => setSlideMobileImg('')} className="text-neutral-500 hover:text-red-700 font-semibold cursor-pointer">
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Banner height */}
              <div>
                <label className="block font-semibold mb-1">ব্যানারের উচ্চতা (Height)</label>
                <select
                  value={slideHeight}
                  onChange={(e) => setSlideHeight(e.target.value as 'auto' | 'compact' | 'medium' | 'tall')}
                  className="w-full p-3 border border-neutral-200 rounded-xl bg-white"
                >
                  <option value="compact">Compact (ছোট, উপর-নিচের ফাঁকা জায়গা কেটে যাবে) ← সাধারণত এটাই ভালো</option>
                  <option value="medium">Medium (মাঝারি)</option>
                  <option value="tall">Tall (লম্বা)</option>
                  <option value="auto">Auto (পুরো ছবি, কিছুই কাটবে না)</option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                  ছবির উপরে-নিচে সাদা ফাঁকা জায়গা বেশি থাকলে Compact দিন। ছবির কোনো অংশ কেটে গেলে Medium / Tall / Auto বেছে নিন।
                </p>
              </div>

              {uploadWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl leading-relaxed">{uploadWarning}</div>
              )}

              {/* Click link */}
              <div>
                <label className="block font-semibold mb-1">ব্যানারে ক্লিক করলে কোথায় যাবে? (ঐচ্ছিক)</label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setSlideCtaLink(e.target.value);
                  }}
                  className="w-full p-3 border border-neutral-200 rounded-xl mb-2 bg-white"
                >
                  <option value="">— বেছে নিন (প্রোডাক্ট / ক্যাটাগরি) —</option>
                  <option value="/products">সব প্রোডাক্ট (Shop)</option>
                  {categories.map((c) => (
                    <option key={`c-${c.id}`} value={`/categories/${c.slug}`}>
                      ক্যাটাগরি: {c.name}
                    </option>
                  ))}
                  {products
                    .filter((p) => !p.isArchived)
                    .map((p) => (
                      <option key={`p-${p.id}`} value={`/products/${p.slug}`}>
                        প্রোডাক্ট: {p.name}
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  value={slideCtaLink}
                  onChange={(e) => setSlideCtaLink(e.target.value)}
                  placeholder="/products/your-product  অথবা  https://..."
                  className="w-full p-3 border border-neutral-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              {/* Optional text on the picture */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slideShowText}
                    onChange={(e) => setSlideShowText(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#800000]"
                  />
                  <span>
                    <span className="font-semibold block">ছবির উপরে লেখা ও বাটন দেখাব</span>
                    <span className="text-[11px] text-neutral-500">
                      ছবিতে আগে থেকেই লেখা থাকলে এটা বন্ধ রাখুন, নাহলে লেখার উপর লেখা পড়ে যাবে।
                    </span>
                  </span>
                </label>
                <div className={slideShowText ? '' : 'opacity-50'}>
                  <label className="block font-semibold mb-1">Headline</label>
                  <input
                    type="text"
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subtitle</label>
                  <textarea
                    rows={2}
                    value={slideSubtitle}
                    onChange={(e) => setSlideSubtitle(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Button text</label>
                  <input
                    type="text"
                    value={slideCtaText}
                    onChange={(e) => setSlideCtaText(e.target.value)}
                    placeholder="যেমন: Shop Now"
                    className="w-full p-3 border border-neutral-200 rounded-xl bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Text position</label>
                    <select
                      value={slideAlign}
                      onChange={(e) => setSlideAlign(e.target.value as 'left' | 'center' | 'right')}
                      className="w-full p-3 border border-neutral-200 rounded-xl bg-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Text colour</label>
                    <select
                      value={slideTheme}
                      onChange={(e) => setSlideTheme(e.target.value as 'light' | 'dark')}
                      className="w-full p-3 border border-neutral-200 rounded-xl bg-white"
                    >
                      <option value="light">White (dark picture)</option>
                      <option value="dark">Black (light picture)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2.5 border rounded-xl hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploading !== null}
                  className="px-5 py-2.5 bg-[#800000] text-white rounded-xl font-semibold uppercase hover:bg-[#660000] cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
