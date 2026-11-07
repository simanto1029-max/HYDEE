import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Phone, Mail, MapPin, Banknote, CheckCircle } from 'lucide-react';
import { store } from '../services/store';

interface LegalViewProps {
  policyType: 'privacy' | 'terms' | 'deposit';
  onNavigate: (path: string) => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ policyType, onNavigate }) => {
  const settings = store.getSettings();
  const locationText = settings.tangailLocation || settings.address || 'Tangail, Dhaka Division, Bangladesh';
  const effectivePolicy = policyType === 'deposit' ? 'terms' : policyType;

  return (
    <div className="py-12 sm:py-20 bg-white font-sans text-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        
        {/* Breadcrumb / Back button */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center text-xs font-semibold text-neutral-600 hover:text-[#800000] mb-8 transition-colors cursor-pointer gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HYDEE</span>
        </button>

        {/* Tab switcher at top */}
        <div className="flex border-b border-neutral-200 mb-8 gap-4 text-xs font-bold">
          <button
            onClick={() => onNavigate('/privacy-policy')}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              effectivePolicy === 'privacy'
                ? 'border-[#800000] text-[#800000]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => onNavigate('/terms')}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              effectivePolicy === 'terms'
                ? 'border-[#800000] text-[#800000]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </button>
        </div>

        {/* PRIVACY POLICY CONTENT */}
        {effectivePolicy === 'privacy' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="space-y-2 border-b border-neutral-200 pb-6">
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block">
                HYDEE PRIVACY CHARTER
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
                Official Privacy Policy
              </h1>
              <p className="text-xs text-neutral-500">
                Last updated: November 2026 · Governed by the Laws of Bangladesh · Main Atelier, {locationText}
              </p>
            </div>

            <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-800 space-y-1">
                <span className="font-bold block text-[#800000]">Our Privacy Promise:</span>
                <p className="text-xs">
                  At <strong>HYDEE</strong>, we treat customer privacy with the utmost confidentiality. We do not sell, rent, monetize, or expose customer personal data to third-party telemarketers or external entities. Your information is strictly utilized to process, tailor, and dispatch your bespoke orders safely to your doorstep.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  1. Information We Collect
                </h2>
                <p>
                  When you explore our store or place an order, we collect only the necessary details required to fulfill and deliver your luxury garments:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li><strong>Personal Contact Information:</strong> Recipient Full Name, Contact Telephone Number (valid 11-digit Bangladesh mobile number), and optional Email Address for invoices.</li>
                  <li><strong>Shipping & Delivery Destination:</strong> House number, road, area, district, and landmark for courier routing across Dhaka Metropolitan and nationwide divisions.</li>
                  <li><strong>Order & Sizing Preferences:</strong> Garment silhouette selections, custom measurements (chest, length, sleeve), and color selections.</li>
                  <li><strong>Payment Verification Details:</strong> Transaction ID (TrxID) and payment channel (bKash or Nagad) when opting for 100% full prepayment. For Cash on Delivery, no payment details are collected online. <em>We never ask for or store your personal bKash/Nagad secret PIN or bank OTP.</em></li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  2. How We Use Your Information
                </h2>
                <p>
                  Your information is exclusively utilized for:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li>Direct order fulfillment, packing, and courier shipping to your address.</li>
                  <li>Customer service updates and doorstep parcel coordination via WhatsApp or telephone.</li>
                  <li>Generating genuine VAT/tax receipts and maintaining order warranty archives.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  3. Client Data Rights & Contact Information
                </h2>
                <p>
                  You have the right to request a summary of your stored order data, update your address, or ask for account anonymization at any time by contacting our atelier:
                </p>
                <div className="mt-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-neutral-900 block flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#800000]" /> Phone Hotline:
                    </span>
                    <span>{settings.hotlinePhone || '+880 1700-000000'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#800000]" /> Support Email:
                    </span>
                    <span>{settings.supportEmail || 'support@hydee.shop'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#800000]" /> Main Atelier:
                    </span>
                    <span>{locationText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TERMS & CONDITIONS CONTENT */}
        {effectivePolicy === 'terms' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="space-y-2 border-b border-neutral-200 pb-6">
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block">
                HYDEE TERMS OF ATELIER SERVICE
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
                Terms & Conditions
              </h1>
              <p className="text-xs text-neutral-500">
                Effective November 2026 · HYDEE Atelier ({locationText})
              </p>
            </div>

            <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  1. Payment Options: Cash On Delivery & 100% Prepayment
                </h2>
                <p>
                  HYDEE offers two seamless and straightforward payment options for all customers across Bangladesh:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                    <span className="font-bold text-neutral-950 flex items-center gap-1.5 text-xs">
                      <Banknote className="w-4 h-4 text-[#800000]" />
                      <span>1. Cash On Delivery (COD)</span>
                    </span>
                    <p className="text-xs text-neutral-600">
                      No advance payment or deposit is required to place your order. You pay the full bill (product price plus standard shipping fee) in cash directly to the delivery courier upon receiving your parcel at your doorstep.
                    </p>
                  </div>
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                    <span className="font-bold text-neutral-950 flex items-center gap-1.5 text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>2. Advance Full Payment (100% Pre-paid)</span>
                    </span>
                    <p className="text-xs text-neutral-600">
                      Pay the full order value in advance via bKash or Nagad. You will have 0% cash to pay when the courier arrives at your doorstep.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  2. Artisanal Craftsmanship & Natural Fabric Tolerance
                </h2>
                <p>
                  Our bespoke ensembles, Jamdani sarees, and signature silhouettes are crafted by master weavers using traditional Tangail handloom methods and premium dyed fibres. Minor nuances in thread slubs or color shades are natural hallmarks of authentic handloom artistry.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  3. Doorstep Inspection & 48-Hour Exchange Guarantee
                </h2>
                <p>
                  Customers have the right to open and inspect the package in the presence of the courier rider. If an item does not match your ordered size or has a rare tailoring defect:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li>Notify our WhatsApp concierge or customer hotline within 48 hours of parcel receipt.</li>
                  <li>Garments must remain unworn, unwashed, with all tags intact.</li>
                  <li>We provide swift size replacement or exchange tailored to your specifications.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  4. Cancellation Policy
                </h2>
                <p>
                  Cash on Delivery orders can be modified or cancelled free of charge before the parcel has been dispatched to the courier hub by simply contacting our helpline or WhatsApp concierge.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
