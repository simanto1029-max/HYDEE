import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Sparkles, Check, Image as ImageIcon, X } from 'lucide-react';
import { store } from '../../services/store';
import { HeroSlide, Product } from '../../types';

export const AdminHomepage: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>(store.getHeroSlides());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Edit slide modal
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideCtaText, setSlideCtaText] = useState('');
  const [slideCtaLink, setSlideCtaLink] = useState('');
  const [slideDesktopImg, setSlideDesktopImg] = useState('');
  const [slideMobileImg, setSlideMobileImg] = useState('');
  const [slideAlign, setSlideAlign] = useState<'left' | 'center' | 'right'>('left');

  const handleOpenEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle);
    setSlideCtaText(slide.ctaText);
    setSlideCtaLink(slide.ctaLink);
    setSlideDesktopImg(slide.desktopImage);
    setSlideMobileImg(slide.mobileImage);
    setSlideAlign(slide.align);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    const updated = slides.map((s) =>
      s.id === editingSlide.id
        ? {
            ...s,
            title: slideTitle,
            subtitle: slideSubtitle,
            ctaText: slideCtaText,
            ctaLink: slideCtaLink,
            desktopImage: slideDesktopImg,
            mobileImage: slideMobileImg || slideDesktopImg,
            align: slideAlign,
          }
        : s
    );

    setSlides(updated);
    store.saveHeroSlides(updated);
    setEditingSlide(null);
    setSavedNotice('Hero slide updated successfully.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleToggleHanger = (productId: string) => {
    const p = store.getProductById(productId);
    if (!p) return;
    store.saveProduct({ ...p, isHangerFeatured: !p.isHangerFeatured });
    setProducts(store.getProducts());
    setSavedNotice(`Updated hanger status for ${p.name}`);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleToggleBestseller = (productId: string) => {
    const p = store.getProductById(productId);
    if (!p) return;
    store.saveProduct({ ...p, isBestSeller: !p.isBestSeller });
    setProducts(store.getProducts());
    setSavedNotice(`Updated bestseller status for ${p.name}`);
    setTimeout(() => setSavedNotice(null), 2500);
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
          Customize campaign hero slides, curate interactive fashion hanger pieces, and assign bestsellers.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Hero Slides Manager */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-neutral-950 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#800000]" />
            <span>Luxury Hero Campaign Slides</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs flex flex-col">
              <div className="relative aspect-16/9 bg-neutral-900">
                <img src={slide.desktopImage} alt={slide.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                  Slide {idx + 1}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-2">
                <div>
                  <h4 className="font-serif font-bold text-neutral-900 text-sm line-clamp-1">{slide.title}</h4>
                  <p className="text-neutral-500 line-clamp-2 mt-1">{slide.subtitle}</p>
                </div>
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 uppercase">CTA: {slide.ctaText}</span>
                  <button
                    onClick={() => handleOpenEditSlide(slide)}
                    className="p-1.5 text-neutral-600 hover:text-[#800000] font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {/* Edit Slide Modal */}
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
                Edit Campaign Slide
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

            <form onSubmit={handleSaveSlide} className="overflow-y-auto p-6 space-y-4 text-xs flex-1 touch-scroll">
              <div>
                <label className="block font-semibold mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={slideSubtitle}
                  onChange={(e) => setSlideSubtitle(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={slideCtaText}
                    onChange={(e) => setSlideCtaText(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">CTA Destination URL</label>
                  <input
                    type="text"
                    value={slideCtaLink}
                    onChange={(e) => setSlideCtaLink(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Desktop Image URL</label>
                <input
                  type="text"
                  required
                  value={slideDesktopImg}
                  onChange={(e) => setSlideDesktopImg(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mobile Image URL (Optional)</label>
                <input
                  type="text"
                  value={slideMobileImg}
                  onChange={(e) => setSlideMobileImg(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl font-mono text-[11px]"
                />
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
                  className="px-5 py-2.5 bg-[#800000] text-white rounded-xl font-semibold uppercase hover:bg-[#660000] cursor-pointer"
                >
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
