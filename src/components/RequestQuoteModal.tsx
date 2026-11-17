'use client';

import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import ContactFormClient from './ContactFormClient';

export default function RequestQuoteModal({ serviceName, customTrigger, buttonText }: { serviceName: string, customTrigger?: React.ReactNode, buttonText?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {customTrigger ? (
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {customTrigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <span>{buttonText || 'Request a Quote'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-[650px] max-h-[95vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-full shadow-sm transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 sm:p-6 pt-12">
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Request a Quote for {serviceName}</h2>
                <p className="text-slate-600 text-sm">Fill out the form below and our team will get back to you within 2 hours.</p>
              </div>
              <ContactFormClient isModal={true} serviceName={serviceName} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
