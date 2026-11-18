import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { store } from '../services/store';

// FAQ box in the middle of the product page. Questions and answers come from Admin > Offers & Badges.
export const FaqSection: React.FC = () => {
  const [settings, setSettings] = useState(store.getSettings());
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => store.subscribe(() => setSettings(store.getSettings())), []);

  if (settings.faqEnabled === false) return null;
  const faqs = (settings.faqs || []).filter((f) => f.enabled && f.question.trim() && f.answer.trim());
  if (faqs.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16 max-w-2xl mx-auto">
      <h2 className="text-center font-serif text-xl sm:text-2xl font-bold text-neutral-950 mb-5">
        {settings.faqTitle?.trim() || 'Frequently Asked Questions'}
      </h2>
      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-200 overflow-hidden">
        {faqs.map((f) => {
          const isOpen = openId === f.id;
          return (
            <div key={f.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : f.id)}
                className="w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 cursor-pointer hover:bg-neutral-50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-neutral-900 leading-snug">{f.question}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 -mt-1 text-[13px] text-neutral-700 leading-relaxed whitespace-pre-line">
                  {f.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
