import React from 'react';
import { Metadata } from 'next';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Laptop Rental Price in Delhi NCR | Monthly & Daily Plans',
  description: 'View laptop rental pricing in Delhi NCR. Affordable monthly and daily rental plans for Dell, HP, Lenovo, and Apple MacBook. Zero maintenance cost.',
  alternates: {
    canonical: 'https://techinpedia.com/laptop-rental-price',
  }
};

const pricingData = [
  { brand: 'Dell/HP/Lenovo', config: 'Core i3 / 8GB RAM / 256GB SSD', daily: '₹300 - ₹500', weekly: '₹800 - ₹1,200', monthly: '₹1,500 - ₹2,000' },
  { brand: 'Dell/HP/Lenovo', config: 'Core i5 / 8GB RAM / 256GB SSD', daily: '₹400 - ₹600', weekly: '₹1,000 - ₹1,500', monthly: '₹2,000 - ₹2,500' },
  { brand: 'Dell/HP/Lenovo', config: 'Core i5 / 16GB RAM / 512GB SSD', daily: '₹500 - ₹800', weekly: '₹1,500 - ₹2,000', monthly: '₹2,500 - ₹3,500' },
  { brand: 'Dell/HP/Lenovo', config: 'Core i7 / 16GB RAM / 512GB SSD', daily: '₹700 - ₹1,000', weekly: '₹2,000 - ₹2,800', monthly: '₹3,500 - ₹4,500' },
  { brand: 'Apple MacBook Air', config: 'M1 / 8GB RAM / 256GB SSD', daily: '₹1,000 - ₹1,500', weekly: '₹3,000 - ₹4,500', monthly: '₹5,000 - ₹7,000' },
  { brand: 'Apple MacBook Pro', config: 'M1/M2 / 16GB RAM / 512GB SSD', daily: '₹1,500 - ₹2,500', weekly: '₹4,500 - ₹6,500', monthly: '₹8,000 - ₹12,000' },
];

export default function LaptopPricingPage() {
  return (
    <>
      <section className="pt-32 pb-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
              Laptop Rental Price in Delhi NCR
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              We offer highly competitive and transparent pricing for enterprise-grade laptops. 
              Whether you need a basic laptop for data entry or a powerful MacBook for video editing, 
              find the right plan for your budget. Note: Bulk orders receive significant discounts!
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-violet-600 text-white">
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
                      <td className="p-5 text-violet-700 font-bold whitespace-nowrap">{row.monthly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-sm text-slate-500">
              <p>* Prices are indicative and may vary based on exact model availability, tenure length, and bulk quantities. GST is applicable extra as per government norms.</p>
              <p className="mt-2">* A refundable security deposit may be required based on the company profile and order volume.</p>
            </div>
          </div>

          <div className="mt-16 text-center space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Need a Custom Quote for Bulk Ordering?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              If you require 10 or more laptops, our corporate pricing division can offer customized billing cycles and heavily discounted rates.
            </p>
            <div className="flex justify-center">
              <RequestQuoteModal serviceName="Bulk Laptop Rental Pricing" />
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking Helper */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-4">Location & Services</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/laptop-on-rent/delhi" className="text-violet-600 hover:underline">Laptop on Rent in Delhi</Link>
                <Link href="/laptop-on-rent/noida" className="text-violet-600 hover:underline">Laptop on Rent in Noida</Link>
                <Link href="/laptop-on-rent/gurgaon" className="text-violet-600 hover:underline">Laptop on Rent in Gurgaon</Link>
                <Link href="/desktop-rental-price" className="text-slate-500 hover:text-violet-600 hover:underline">Desktop Rental Pricing</Link>
            </div>
        </div>
      </section>
    </>
  );
}
