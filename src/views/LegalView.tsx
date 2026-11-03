import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Lock, Truck, RefreshCw, Phone, Mail, MapPin } from 'lucide-react';
import { store } from '../services/store';

interface LegalViewProps {
  policyType: 'privacy' | 'terms' | 'deposit';
  onNavigate: (path: string) => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ policyType, onNavigate }) => {
  const settings = store.getSettings();
  const locationText = settings.tangailLocation || settings.address || 'Tangail, Dhaka Division, Bangladesh';

  return (
    <div className="py-12 sm:py-20 bg-white font-sans text-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        
        {/* Breadcrumb / Back button */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center text-xs font-semibold text-neutral-600 hover:text-[#800000] mb-8 transition-colors cursor-pointer gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HYDEE Boutique</span>
        </button>

        {/* Tab switcher at top for easy switching */}
        <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto no-scrollbar gap-2 sm:gap-4 text-xs font-bold">
          <button
            onClick={() => onNavigate('/privacy-policy')}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              policyType === 'privacy'
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
              policyType === 'terms'
                ? 'border-[#800000] text-[#800000]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => onNavigate('/legal/deposit')}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              policyType === 'deposit'
                ? 'border-[#800000] text-[#800000]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Advance COD Deposit Policy</span>
          </button>
        </div>

        {/* PRIVACY POLICY CONTENT */}
        {policyType === 'privacy' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="space-y-2 border-b border-neutral-200 pb-6">
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block">
                HYDEE ATELIER PRIVACY CHARTER
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
                  When you explore our boutique or place a booking, we collect only the necessary details required to fulfill and deliver your luxury garments:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li><strong>Personal Contact Information:</strong> Recipient Full Name, Contact Telephone Number (valid 11-digit Bangladesh mobile number), and optional Email Address for invoices.</li>
                  <li><strong>Shipping & Delivery Destination:</strong> House number, road, area, district, and landmark for courier routing across Dhaka Metropolitan and nationwide divisions.</li>
                  <li><strong>Order & Sizing Preferences:</strong> Garment silhouette selections, custom measurements (chest, length, sleeve), and color selections.</li>
                  <li><strong>Payment Verification Details:</strong> Transaction ID (TrxID) and payment channel (bKash, Nagad, Rocket, Card) used for advance delivery fee deposits. <em>We never ask for or store your personal bKash/Nagad secret PIN or bank OTP.</em></li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  2. How We Utilize Your Information
                </h2>
                <p>Your details are used exclusively for legitimate boutique operations:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li>Verifying and processing your garment order and advance courier fee.</li>
                  <li>Generating secure dispatch consignments with our certified logistics partners (Steadfast Courier & Pathao Express).</li>
                  <li>Sending real-time SMS updates regarding your parcel's tracking code and estimated delivery arrival.</li>
                  <li>Assisting you through our VIP Stylist WhatsApp Concierge for size recommendations or order adjustments.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  3. Delivery Logistics & Safe Third-Party Disclosure
                </h2>
                <p>
                  To deliver packages across Bangladesh, we securely share only your recipient name, contact number, and physical destination with our authorized courier partners (Steadfast and Pathao). These couriers operate under strict service-level agreements and are prohibited from using your contact information for any purpose other than doorstep parcel handover.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  4. Data Security & Storage
                </h2>
                <p>
                  All order records and transaction references are safeguarded with industry-standard encryption protocols. Our digital systems prevent unauthorized access, tampering, or leaks.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  5. Client Data Rights & Contact Information
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
                    <span>{settings.supportEmail || 'support@hydee.com'}</span>
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
        {policyType === 'terms' && (
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
                  1. Order Booking & Advance Delivery Charge Policy
                </h2>
                <p>
                  HYDEE operates with a transparent Cash on Delivery (COD) service throughout Bangladesh. To prevent fraudulent bookings and ensure courier priority routing, all patrons must pay the designated advance delivery fee (e.g. ৳80 Inside Dhaka Metropolitan, ৳150 Outside Dhaka / Nationwide) prior to parcel release.
                </p>
                <p className="mt-2 text-xs text-neutral-600">
                  The remaining garment balance is payable in cash directly to the delivery agent upon doorstep arrival.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  2. Artisanal Craftsmanship & Natural Fabric Tolerance
                </h2>
                <p>
                  Our bespoke Jamdani sarees, tailored kurtis, and royal panjabis are crafted by master weavers using traditional Tangail pit-looms and premium dyed fibres. Minor nuances in thread slubs or color shades are hallmarks of authentic handloom artistry and are celebrated as unique proofs of craftsmanship.
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
                  <li>Garments must remain unworn, unwashed, with all boutique tags intact.</li>
                  <li>We provide swift size replacement or exchange tailored to your specifications.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mb-2">
                  4. Cancellation Policy
                </h2>
                <p>
                  Orders can be modified or cancelled free of charge before the advance delivery fee has been verified and before the parcel has been dispatched to the courier hub. Once a bespoke package is in courier transit, the courier fee is non-refundable.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DEPOSIT POLICY CONTENT */}
        {policyType === 'deposit' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="space-y-2 border-b border-neutral-200 pb-6">
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block">
                DELIVERY PROTOCOL
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
                Advance Courier Fee & COD Model
              </h1>
              <p className="text-xs text-neutral-500">
                How Cash on Delivery works at HYDEE across all 64 districts of Bangladesh
              </p>
            </div>

            <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-[#800000] uppercase tracking-wider block">Step 1</span>
                  <h3 className="font-bold text-neutral-900 mt-1">Book Your Piece</h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    Select your bespoke size and provide your delivery address in Dhaka or nationwide.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-[#800000] uppercase tracking-wider block">Step 2</span>
                  <h3 className="font-bold text-neutral-900 mt-1">Advance Delivery Fee</h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    Pay only the courier shipping charge (৳80/৳150) via bKash or Nagad to secure shipment.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-[#800000] uppercase tracking-wider block">Step 3</span>
                  <h3 className="font-bold text-neutral-900 mt-1">Cash at Doorstep</h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    Receive your package, inspect your garment, and pay the remaining balance in cash to the rider.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
