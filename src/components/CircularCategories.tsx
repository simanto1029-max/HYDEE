import React from 'react';
import { Category } from '../types';

interface CircularCategoriesProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
}

export const CircularCategories: React.FC<CircularCategoriesProps> = ({
  categories,
  onSelectCategory,
}) => {
  return (
    <section className="py-8 sm:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        {/* Compact Centered Circular Categories Container */}
        <div className="flex items-start justify-center gap-6 sm:gap-10 md:gap-14 overflow-x-auto no-scrollbar py-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="flex flex-col items-center group shrink-0 focus:outline-hidden text-center cursor-pointer"
            >
              {/* Compact Circular Category Frame */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 border border-neutral-300 group-hover:border-[#800000] transition-colors duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Centered Category Label with Capitalized First Letters */}
              <span className="mt-2.5 text-xs sm:text-[13px] font-normal text-neutral-800 group-hover:text-[#800000] transition-colors capitalize tracking-normal">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
