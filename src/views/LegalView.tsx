import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface LegalViewProps {
  policyType: 'privacy' | 'terms' | 'deposit';
  onNavigate: (path: string) => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ policyType, onNavigate }) => {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 sm:px-10">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center text-xs text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Atelier
        </button>

        {policyType === 'deposit' && (
          <div className="space-y-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
              OFFICIAL ATELIER POLICY
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
              Advance Delivery Deposit & Cash on Delivery Terms
            </h1>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-4 pt-4 border-t border-neutral-100">
              <p>
                HYDEE operates on a transparent <strong>Cash on Delivery with Advance Delivery Deposit</strong> model throughout Bangladesh.
              </p>
              <h3 className="font-serif text-base font-bold text-neutral-900 pt-2">
                1. Required Delivery Charge Advance
              </h3>
              <p>
                To prevent unverified bookings and guarantee priority courier routing, patrons are required to pay only the applicable courier delivery charge in advance (<strong>৳80</strong> Inside Dhaka Metropolitan, <strong>৳120</strong> Dhaka Suburbs, <strong>৳150</strong> Outside Dhaka).
              </p>
              <h3 className="font-serif text-base font-bold text-neutral-900 pt-2">
                2. Doorstep Inspection & Cash Payment
              </h3>
              <p>
                The remaining garment price balance is paid exclusively in cash to the delivery rider after you receive and inspect your bespoke package at your doorstep.
              </p>
              <h3 className="font-serif text-base font-bold text-neutral-900 pt-2">
                3. Exchange & Returns
              </h3>
              <p>
                Should you require a size exchange or adjustment, notify our Dhaka Atelier Concierge within 48 hours of parcel delivery.
              </p>
            </div>
          </div>
        )}

        {policyType === 'privacy' && (
          <div className="space-y-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
              CUSTOMER PRIVACY
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
              Privacy Policy
            </h1>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-4 pt-4 border-t border-neutral-100">
              <p>
                At HYDEE, we hold customer confidentiality to the highest standard. Information collected during checkout (recipient full name, Bangladesh contact number, and delivery destination) is strictly utilized for dispatch through our verified courier partners (Steadfast and Pathao).
              </p>
              <p>
                We never sell, distribute, or expose patron data to third-party marketing entities. Payment credentials processed via mobile banking gateways are end-to-end encrypted.
              </p>
            </div>
          </div>
        )}

        {policyType === 'terms' && (
          <div className="space-y-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
              TERMS OF SERVICE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
              Terms of Atelier Service
            </h1>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-4 pt-4 border-t border-neutral-100">
              <p>
                All garments ordered through the HYDEE online boutique are crafted according to strict artisanal tolerances. Product colors may subtly vary due to natural plant-dyed fibres and master pit-loom dye lots.
              </p>
              <p>
                Orders remain in pending status until the advance delivery fee has been verified through our secure payment gateway or manual transaction reference auditing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
