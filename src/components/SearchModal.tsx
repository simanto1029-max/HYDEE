import React, { useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { store } from '../services/store';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const products = store.getPublishedProducts();

  if (!isOpen) return null;

  const results = searchTerm.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <span className="font-serif text-lg font-bold text-neutral-950">
            Search HYDEE Atelier
          </span>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
          <input
            type="text"
            autoFocus
            placeholder="Search Shackets, Silk Panjabis, Hoodies, Sharees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-[#800000] focus:outline-hidden"
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto no-scrollbar space-y-3">
          {searchTerm.trim() && results.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400">
              No garments found matching "{searchTerm}".
            </p>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onClose();
                  onSelectProduct(product.slug);
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">
                      {product.categoryName}
                    </span>
                    <h4 className="font-serif font-semibold text-neutral-900 text-sm line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-xs font-bold text-neutral-900 mt-0.5">
                      ৳{product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
