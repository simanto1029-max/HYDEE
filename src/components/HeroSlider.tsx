import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HeroSlide } from '../types';

interface HeroSliderProps {
  slides?: HeroSlide[];
  onNavigate: (path: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ onNavigate }) => {
  return (
    <section className="relative w-full bg-white overflow-hidden border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Luxury Headline & Narrative */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 bg-neutral-50 border border-neutral-200/80 rounded-full px-3.5 py-1 text-xs text-[#800000] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#800000]" />
              <span>Autumn / Festive Atelier 2026</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] font-normal text-neutral-950 leading-[1.08] tracking-tight">
                Sartorial Grace, <br />
                <span className="italic font-light text-[#800000]">Crafted in Silk.</span>
              </h1>
              
              <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed max-w-lg">
                Bespoke couture and contemporary silhouettes tailored from fine mulberry silks, hand-combed wool, and heritage weaves. Delivered to your doorstep across Bangladesh with cash on delivery and secure prepayment.
              </p>
            </div>

            {/* Editorial Action Buttons in Title Case */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('/products')}
                className="bg-[#800000] hover:bg-[#5c0000] text-white text-xs sm:text-[13px] font-semibold tracking-wider px-8 py-4 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('hanger');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 hover:border-neutral-900 text-xs sm:text-[13px] font-medium tracking-wide px-7 py-4 rounded-full transition-all duration-200 active:scale-95 cursor-pointer"
              >
                View Hanger Wardrobe
              </button>
            </div>

            {/* Refined Minimalist Atelier Badges */}
            <div className="pt-6 border-t border-neutral-100 flex items-center space-x-8 text-xs text-neutral-500">
              <div>
                <span className="font-semibold text-neutral-900 block text-sm">100% Bespoke</span>
                <span>Dhaka Atelier Crafted</span>
              </div>
              <div className="w-[1px] h-8 bg-neutral-200" />
              <div>
                <span className="font-semibold text-neutral-900 block text-sm">Doorstep Inspection</span>
                <span>Verified Cash On Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Hero Campaign Visual */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-2xl shadow-neutral-900/10 border border-neutral-100 group">
              <img
                src="/assets/the_drop_hero.png"
                alt="HYDEE Luxury Campaign"
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-103"
              />
              
              {/* Subtle Atelier Tag */}
              <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-xs text-neutral-900 text-xs px-4 py-2 rounded-full shadow-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#800000]" />
                <span>The Seasonal Drop · Limited Release</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
