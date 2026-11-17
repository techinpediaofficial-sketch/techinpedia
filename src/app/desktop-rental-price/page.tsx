import React from 'react';
import { Metadata } from 'next';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Desktop Rental Price in Delhi NCR | Monthly & Daily PC Plans',
  description: 'View desktop computer rental pricing in Delhi NCR. Affordable monthly and daily rental plans for Dell, HP, Lenovo PCs and Custom GPU Workstations.',
  alternates: {
    canonical: 'https://techinpedia.com/desktop-rental-price',
  }
};

const pricingData = [
  { brand: 'Custom / Assembled PC', config: 'Core i3 / 8GB RAM / 256GB SSD', daily: '₹200 - ₹300', weekly: '₹600 - ₹900', monthly: '₹1,000 - ₹1,500' },
  { brand: 'Dell / HP / Lenovo', config: 'Core i3 / 8GB RAM / 256GB SSD', daily: '₹250 - ₹400', weekly: '₹700 - ₹1,000', monthly: '₹1,200 - ₹1,800' },
  { brand: 'Dell / HP / Lenovo', config: 'Core i5 / 8GB RAM / 256GB SSD', daily: '₹350 - ₹500', weekly: '₹900 - ₹1,200', monthly: '₹1,500 - ₹2,000' },
  { brand: 'Dell / HP / Lenovo', config: 'Core i5 / 16GB RAM / 512GB SSD', daily: '₹400 - ₹600', weekly: '₹1,200 - ₹1,800', monthly: '₹2,000 - ₹2,500' },
  { brand: 'Dell / HP / Lenovo', config: 'Core i7 / 16GB RAM / 512GB SSD', daily: '₹600 - ₹900', weekly: '₹1,800 - ₹2,500', monthly: '₹3,000 - ₹4,000' },
  { brand: 'Workstation / Gaming PC', config: 'Core i7/i9 / 32GB RAM / RTX GPU', daily: '₹1,500 - ₹2,500', weekly: '₹4,000 - ₹7,000', monthly: '₹6,000 - ₹10,000' },
  { brand: 'Apple iMac', config: 'Retina Display / 8GB RAM / 256GB', daily: '₹1,200 - ₹2,000', weekly: '₹3,500 - ₹5,000', monthly: '₹6,000 - ₹8,000' },
];

export default function DesktopPricingPage() {
  return (
    <>
      <section className="pt-32 pb-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
              Desktop Rental Price in Delhi NCR
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Equip your office, BPO, or design studio without the huge CapEx. We offer the most competitive desktop and computer rental pricing in Delhi NCR. 
              Our plans include full setup, monitors, and free on-site maintenance.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-5 font-semibold">Brand / Series</th>
                    <th className="p-5 font-semibold">Configuration</th>
                    <th className="p-5 font-semibold whitespace-nowrap">Daily Rate</th>
                    <th className="p-5 font-semibold whitespace-nowrap">Weekly Rate</th>
                    <th className="p-5 font-semibold whitespace-nowrap">Monthly Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pricingData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 font-medium text-slate-900">{row.brand}</td>
                      <td className="p-5 text-slate-600 text-sm">{row.config}</td>
                      <td className="p-5 text-slate-600 font-medium whitespace-nowrap">{row.daily}</td>
                      <td className="p-5 text-slate-600 font-medium whitespace-nowrap">{row.weekly}</td>
                      <td className="p-5 text-blue-700 font-bold whitespace-nowrap">{row.monthly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-sm text-slate-500">
              <p>* Prices are indicative and may vary based on exact monitor size (19" vs 24"), exact GPU specifications, and bulk quantities. GST is applicable extra.</p>
              <p className="mt-2">* Full Desktop sets include the CPU tower, LED monitor, keyboard, mouse, and power cables.</p>
            </div>
          </div>

          <div className="mt-16 text-center space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Need 20+ Desktops for a Call Center or BPO?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              For bulk requirements, our BPO specialists provide networking setup and heavily discounted volume pricing.
            </p>
            <div className="flex justify-center">
              <RequestQuoteModal serviceName="Bulk Desktop Rental Pricing" />
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking Helper */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-4">Location & Services</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/desktop-on-rent/delhi" className="text-blue-600 hover:underline">Desktop on Rent in Delhi</Link>
                <Link href="/desktop-on-rent/noida" className="text-blue-600 hover:underline">Desktop on Rent in Noida</Link>
                <Link href="/desktop-on-rent/gurgaon" className="text-blue-600 hover:underline">Desktop on Rent in Gurgaon</Link>
                <Link href="/laptop-rental-price" className="text-slate-500 hover:text-blue-600 hover:underline">Laptop Rental Pricing</Link>
            </div>
        </div>
      </section>
    </>
  );
}
