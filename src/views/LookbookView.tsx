import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface LookbookViewProps {
  onNavigate: (path: string) => void;
}

export const LookbookView: React.FC<LookbookViewProps> = ({ onNavigate }) => {
  const editorialShots = [
    {
      title: 'The Maroon Wool Shacket in Gulshan',
      subtitle: 'Structured 520 GSM Virgin Wool drape over tonal monochrome mock-neck.',
      image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85',
      category: 'Outerwear',
      link: '/products/atelier-double-faced-maroon-wool-shacket',
    },
    {
      title: 'Midnight Organza Jamdani Gala',
      subtitle: '84-count pure silk organza with metallic charcoal weft handwoven in Rupganj.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85',
      category: 'Sharees',
      link: '/products/monochrome-midnight-jamdani-organza-sharee',
    },
    {
      title: 'Tussar Wild Silk Resham Panjabi',
      subtitle: 'Tone-on-tone hand embroidery along mandarin placket with rhodium buttons.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85',
      category: 'Heritage Festive',
      link: '/products/bespoke-hand-embroidered-tussar-silk-panjabi',
    },
    {
      title: 'Architectural Boxy French Terry',
      subtitle: '480 GSM pure combed cotton hoodie with tailored unstructured hood drop.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85',
      category: 'Modern Loungewear',
      link: '/products/french-terry-minimalist-heavyweight-hoodie',
    },
  ];

  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center text-xs text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Atelier
        </button>

        <div className="max-w-3xl mb-16">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block mb-2">
            ATELIER EDITORIAL 2026
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-neutral-950 leading-tight">
            Winter / Spring Lookbook: Form, Texture & Heritage
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-4 leading-relaxed font-light">
            Captured across historical Dhaka architecture and contemporary modernist spaces. A study in the intersection of traditional Bangladeshi handloom weaves and sharp European tailoring.
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {editorialShots.map((shot, idx) => (
            <div key={idx} className="group space-y-4 cursor-pointer" onClick={() => onNavigate(shot.link)}>
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-neutral-100 shadow-sm">
                <img
                  src={shot.image}
                  alt={shot.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-sm">
                  {shot.category}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-neutral-950 group-hover:text-[#800000] transition-colors">
                  {shot.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 leading-relaxed">
                  {shot.subtitle}
                </p>
                <div className="inline-flex items-center text-xs font-semibold text-[#800000] mt-3 group-hover:translate-x-1 transition-transform">
                  <span>View Garment Archive</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
