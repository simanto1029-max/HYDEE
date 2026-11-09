import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Award, Sparkles, Feather } from 'lucide-react';

interface CraftsmanshipViewProps {
  onNavigate: (path: string) => void;
}

export const CraftsmanshipView: React.FC<CraftsmanshipViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 sm:px-10">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center text-xs text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Atelier
        </button>

        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block mb-2">
            ATELIER VALUES & HERITAGE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-neutral-950">
            Crafted with Devotion in Bangladesh
          </h1>
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed font-light">
            We preserve century-old Bengal weaving traditions while integrating master sartorial tailoring, natural fibres, and zero-compromise finishings.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="p-8 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#800000]">
              <Feather className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-neutral-950">Pit-Loom Weaving</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Our Jamdani and Tussar silks are spun in Rupganj and Rajshahi on ancestral wooden pit looms, requiring up to 45 days of rhythmic hand-weft calculation per individual piece.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#800000]">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-neutral-950">Double-Faced Wool</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              For our signature shackets, virgin wool blends from Italian mills are split and folded by hand along every seam, creating invisible edges and an unlined, featherweight warmth.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#800000]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-neutral-950">The Unboxing Box</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every HYDEE delivery includes our signature matte debossed presentation box, hand-finished wooden hanger, breathable cotton dust bag, and atelier authenticity card.
            </p>
          </div>
        </div>

        {/* Studio Photo & Atelier Statement */}
        <div className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white p-8 sm:p-14 mb-16 shadow-xl">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-amber-300">
              GULSHAN DHAKA ATELIER
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              By Appointment Private Styling
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
              Patrons wishing to consult our head tailors for custom made-to-measure measurements or inspect our seasonal fabrics in person are invited to our private salon in Gulshan, Dhaka.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  window.open('https://wa.me/8801601705804?text=Hello%20HYDEE%20Atelier,%20I%20would%20like%20to%20book%20a%20private%20styling%20appointment.', '_blank');
                }}
                className="bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold px-6 py-3.5 rounded-full uppercase tracking-wider inline-flex items-center gap-2"
              >
                <span>Book Private Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
