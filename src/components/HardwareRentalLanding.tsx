import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Truck, Clock, MessageSquare, ArrowRight, Zap, Star } from 'lucide-react';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import { ServiceDetail } from '@/lib/servicesCatalog';
import { ncrLocations } from '@/lib/locations';


export default function HardwareRentalLanding({ service, whatsappLink }: { service: ServiceDetail | any, whatsappLink: string }) {
  
  const laptopSpecs = [
    {
      brand: "Lenovo",
      title: "Lenovo ThinkPad L460 I5 / 8 GB / 256 GB SSD / Ubuntu / 14 Inch /",
      slug: "lenovo-thinkpad-l460-i5-8gb-256gb",
      image: "https://pngimg.com/uploads/laptop/laptop_PNG5915.png",
      alt: "Lenovo ThinkPad L460 i5 Laptop on Rent in India - Best IT Rental Service",
      title_attr: "Rent Lenovo ThinkPad L460 i5 Laptop - Corporate IT Hardware"
    },
    {
      brand: "Apple",
      title: "MacBook Air A2337 M1 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch /",
      slug: "macbook-air-m1-8gb-256gb",
      image: "https://pngimg.com/uploads/macbook/macbook_PNG8.png",
      alt: "Apple MacBook Air M1 Chip Laptop for Rent - High Performance macOS",
      title_attr: "Rent Apple MacBook Air M1 - Professional Mac Rentals"
    },
    {
      brand: "Apple",
      title: "MacBook Pro A2338 M2 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch /",
      slug: "macbook-pro-m2-8gb-256gb",
      image: "https://pngimg.com/uploads/macbook/macbook_PNG65.png",
      alt: "Apple MacBook Pro M2 Chip Rental - Video Editing and Developer Laptop",
      title_attr: "Rent Apple MacBook Pro M2 - Enterprise Mac OS Hardware"
    },
    {
      brand: "Apple",
      title: "MacBook Air M3 M3 CHIP / 8 GB / 512 GB SSD / Mac OS / 13 Inch /",
      slug: "macbook-air-m3-8gb-512gb",
      image: "https://pngimg.com/uploads/macbook/macbook_PNG35.png",
      alt: "MacBook Air M3 Chip Laptop Rental for Business - Latest Apple Tech",
      title_attr: "Rent Latest MacBook Air M3 - Business Hardware Rental"
    },
    {
      brand: "Apple",
      title: "MacBook Max A3185 M4 CHIP / 36 GB / 512 GB SSD / Mac OS / 14 Inch /",
      slug: "macbook-max-m4-36gb-512gb",
      image: "https://pngimg.com/uploads/macbook/macbook_PNG48.png",
      alt: "MacBook Max M4 36GB RAM Rental - Heavy Duty Graphic Design Laptop",
      title_attr: "Rent High-End MacBook Max M4 36GB RAM - Apple IT Rental"
    },
    {
      brand: "Apple",
      title: "MacBook Max A3186 M4 CHIP / 48 GB / 1 TB SSD / Mac OS / 16 Inch /",
      slug: "macbook-max-m4-48gb-1tb",
      image: "https://pngimg.com/uploads/macbook/macbook_PNG8.png",
      alt: "MacBook Max M4 48GB 1TB SSD on Rent - Ultimate Developer Laptop",
      title_attr: "Rent MacBook Max M4 48GB RAM 1TB SSD - Enterprise Rental"
    },
    {
      brand: "HP",
      title: "HP 845 G7 Ryzen 5 / 16 GB / 256 GB SSD / Windows 11 Pro / 14 Inch /",
      slug: "hp-845-g7-ryzen-5-16gb",
      image: "https://pngimg.com/uploads/laptop/laptop_PNG5908.png",
      alt: "HP 845 G7 Ryzen 5 Laptop for Rent - Fast Windows 11 Business Laptop",
      title_attr: "Rent HP Ryzen 5 Windows 11 Laptop - Corporate IT Solutions"
    },
    {
      brand: "ASUS",
      title: "ASUS ROG Strix G15 Ryzen 7 / 16 GB / 512 GB SSD / Windows 11 Pro / 16 Inch",
      slug: "asus-rog-strix-g15-ryzen-7",
      image: "https://pngimg.com/uploads/laptop/laptop_PNG101783.png",
      alt: "ASUS ROG Strix G15 Gaming Laptop on Rent - High Performance Workstation",
      title_attr: "Rent ASUS ROG Strix G15 - Gaming and Workstation Laptop"
    }
  ];

  const computerSpecs = [
    {
      brand: "Dell",
      title: "Dell Optiplex 7040 Core i5 6th Gen / 8GB / 256GB SSD / Win 10 Pro",
      slug: "dell-optiplex-7040-i5",
      image: "/images/hardware/pc1.png",
      alt: "Dell Optiplex 7040 Core i5 Desktop Computer on Rent - Corporate Office PC",
      title_attr: "Rent Dell Optiplex Core i5 Desktop PC - Office IT Hardware"
    },
    {
      brand: "HP",
      title: "HP EliteDesk 800 G3 Core i7 7th Gen / 16GB / 512GB SSD / Win 10 Pro",
      slug: "hp-elitedesk-800-g3-i7",
      image: "/images/hardware/pc2.png",
      alt: "HP EliteDesk 800 G3 Core i7 Computer Rental - High Performance Desktop",
      title_attr: "Rent HP EliteDesk Core i7 - Fast Business Desktop PC"
    },
    {
      brand: "Lenovo",
      title: "Lenovo ThinkCentre M720 Tiny Core i5 8th Gen / 16GB / 256GB NVMe",
      slug: "lenovo-thinkcentre-m720-tiny",
      image: "/images/hardware/pc3.png",
      alt: "Lenovo ThinkCentre Tiny Core i5 Desktop for Rent - Compact Office PC",
      title_attr: "Rent Lenovo ThinkCentre M720 Tiny - Space Saving Desktop PC"
    },
    {
      brand: "Apple",
      title: "iMac 24-inch M1 Chip / 8-Core CPU / 8GB RAM / 256GB SSD",
      slug: "imac-24-inch-m1-8gb",
      image: "/images/hardware/imac.png",
      alt: "Apple iMac 24-inch M1 Chip on Rent - Premium Designer Workstation",
      title_attr: "Rent Apple iMac 24-inch M1 - Professional Mac Desktop"
    },
    {
      brand: "Apple",
      title: "iMac 27-inch Retina 5K Intel Core i7 / 16GB RAM / 512GB SSD",
      slug: "imac-27-inch-5k-i7",
      image: "/images/hardware/imac.png",
      alt: "Apple iMac 27-inch Retina 5K Core i7 Rental - Video Editing Workstation",
      title_attr: "Rent Apple iMac 27-inch 5K - High End Creator Desktop"
    },
    {
      brand: "Dell",
      title: "Dell Precision 3630 Tower Workstation Core i7 / 32GB RAM / 1TB NVMe / RTX 4000",
      slug: "dell-precision-3630-rtx4000",
      image: "/images/hardware/pc4.png",
      alt: "Dell Precision 3630 Tower RTX 4000 Workstation on Rent - 3D Rendering PC",
      title_attr: "Rent Dell Precision 3630 RTX Workstation - Heavy Duty PC"
    },
    {
      brand: "HP",
      title: "HP Z4 G4 Workstation Xeon W-2123 / 32GB RAM / 1TB NVMe / Quadro P2000",
      slug: "hp-z4-g4-xeon-p2000",
      image: "/images/hardware/pc1.png",
      alt: "HP Z4 G4 Xeon Workstation for Rent - AutoCAD and Engineering PC",
      title_attr: "Rent HP Z4 Xeon Workstation - Engineering and CAD PC"
    },
    {
      brand: "Custom PC",
      title: "High-Performance Gaming/Render PC Ryzen 9 / 64GB RAM / 2TB NVMe / RTX 4080",
      slug: "custom-pc-ryzen9-rtx4080",
      image: "/images/hardware/pc2.png",
      alt: "Custom Gaming PC Ryzen 9 RTX 4080 on Rent - Extreme Performance Desktop",
      title_attr: "Rent Custom RTX 4080 Gaming PC - Ultimate Render Machine"
    }
  ];

  const specsToUse = service.slug === 'computer-rental' ? computerSpecs : laptopSpecs;
  const isComputer = service.slug === 'computer-rental';

  const renderGrid = (specs: any[], type: string, title: string, subtitle: string) => (
    <div className="mb-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">{title}</h2>
        <p className="text-slate-600 text-lg">{subtitle}</p>
      </div>

      <div className="border border-slate-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {specs.map((item, idx) => (
            <div key={idx} className="bg-white border-b border-r border-slate-300 flex flex-col group p-4 sm:p-6 transition-colors hover:bg-slate-50 relative">
              
              {/* Absolute Link covering the entire card */}
              <Link href={`/rent/${item.slug}`} className="absolute inset-0 z-0" aria-label={`View details for ${item.title}`} />
              
              {/* Image Container */}
              <div 
                className="relative w-full aspect-square mb-4 bg-white flex items-center justify-center p-2 z-10 pointer-events-none"
                title={item.title_attr}
              >
                <Image 
                  src={item.image} 
                  alt={item.alt || item.title} 
                  fill 
                  className="object-contain" 
                  title={item.title_attr}
                />
              </div>
              
              {/* Title & Specs Block */}
              <div className="mt-auto z-10 pointer-events-none">
                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-4 group-hover:text-violet-700 transition-colors">
                  {item.title}
                </h3>
              </div>
                
              {/* Brand and Click Now */}
              <div className="flex flex-col gap-2.5 text-xs mt-3 z-10 relative">
                <span className="text-slate-500 font-medium truncate">{item.brand} | {type}</span>
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/rent/${item.slug}`}
                    className="flex-1 flex items-center justify-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-2 rounded-lg font-bold transition-colors text-center border border-violet-100"
                  >
                    View Details
                  </Link>
                  <RequestQuoteModal 
                    serviceName={`${item.title} Rental`} 
                    customTrigger={
                      <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-bold transition-colors text-center border border-red-100">
                        Enquiry
                      </button>
                    } 
                  />
                  <a 
                    href={whatsappLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-shrink-0 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors border border-emerald-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-10 lg:pt-16 lg:pb-12 overflow-hidden bg-gradient-to-br from-[#1a0f2e] via-[#2a1744] to-[#1a0f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{service.badge || 'Popular Rental'}</span>
                </div>
                <a
                  href="tel:+919211729690"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 hover:text-white hover:bg-emerald-500/20 text-xs font-bold backdrop-blur-md transition-all shadow-sm"
                >
                  <span>📞 Call: +91 92117 29690</span>
                </a>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                {service.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                {service.shortDescription}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="tel:+919211729690"
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>📞 Call: +91 92117 29690</span>
                </a>
                <RequestQuoteModal serviceName={service.title} />
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-300">Zero Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-300">24/7 Support</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block max-w-md mx-auto w-full">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-square">
                <Image 
                  src={service.slug === 'laptop-rental' ? "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop" : "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=800&auto=format&fit=crop"} 
                  alt={service.title} 
                  fill 
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <p className="text-white font-medium text-sm">"Best rental service for our expanding team. Zero downtime."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Available Brands */}
      <section className="py-12 bg-white border-b border-slate-200 overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: fit-content;
            animation: marquee 30s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">Premium Brands Available on Rent</p>
        </div>
        <div className="relative w-full flex overflow-hidden">
          <div className="animate-marquee flex items-center gap-16 px-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Array of brands repeated twice for seamless loop */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-16 shrink-0">
                <svg viewBox="0 0 384 512" className="h-8 text-slate-900" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <span className="text-2xl font-extrabold text-slate-800 tracking-tight">DELL</span>
                <span className="text-3xl font-extrabold text-slate-800 tracking-tighter italic">hp</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight bg-slate-800 text-white px-2 rounded-sm">Lenovo</span>
                <span className="text-2xl font-extrabold text-slate-800 tracking-tight">ASUS</span>
                <span className="text-2xl font-black text-emerald-700 tracking-widest">acer</span>
                <span className="text-xl font-bold text-slate-800">SAMSUNG</span>
                <span className="text-2xl font-black text-slate-800">MSI</span>
                <span className="text-2xl font-black text-red-600 italic">LG</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Laptops & Computers Grids */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderGrid(
            isComputer ? computerSpecs : laptopSpecs, 
            isComputer ? 'Computer' : 'Laptop',
            "Explore Our Inventory",
            "Top-tier hardware configurations ready for deployment."
          )}

          {renderGrid(
            isComputer ? laptopSpecs : computerSpecs,
            isComputer ? 'Laptop' : 'Computer',
            `Looking for ${isComputer ? 'Laptops' : 'Desktop Computers'}?`,
            `We also offer a wide range of premium ${isComputer ? 'Laptops' : 'Computers'} on rent.`
          )}
        </div>
      </section>

      {/* 4. SEO Content & Description (Full Width) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-8 w-full">Why Choose TechInPedia for {service.title}?</h2>
          <div className="w-full text-lg text-slate-700 leading-loose whitespace-pre-wrap">
            {service.description}
          </div>
        </div>
      </section>

      {/* 5. Specs & Features */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">What You Get</h2>
              <ul className="space-y-4">
                {(service.features || []).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">Deliverables & Tech Stack</h2>
              <div className="flex flex-wrap gap-3 mb-10">
                {(service.technologies || []).map((tech: string, idx: number) => (
                  <span key={idx} className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm font-semibold">
                    {tech}
                  </span>
                ))}
              </div>
              <ul className="space-y-4">
                {(service.deliverables || []).map((del: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-4">
                    <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400 leading-relaxed">{del}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQs & Trust */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {(service.faqs || []).map((faq: any, idx: number) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{faq.q}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO KEYWORDS FOOTER (Visual Content for Rank) */}
      <section className="py-12 bg-white border-t border-slate-200 mb-20 lg:mb-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-xs text-slate-400 leading-relaxed text-center sm:text-left space-y-4">
            <h3 className="font-semibold text-slate-500 mb-2 uppercase tracking-wider">Popular Searches & Service Areas</h3>
            <p>
              Looking for a <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent</strong></Link> or need a <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop on rent</strong></Link>? We are the leading provider for <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop rental</strong></Link> and <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop rental</strong></Link> solutions across India. Whether you need a <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop for rent</strong></Link>, <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop for rent</strong></Link>, or a complete IT setup, our <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop rental service</strong></Link> and <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop rental service</strong></Link> has you covered.
            </p>
            <p>
              We provide <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent Delhi</strong></Link>, <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop on rent Delhi</strong></Link>, <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent Noida</strong></Link>, <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop on rent Noida</strong></Link>, <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent Gurgaon</strong></Link>, <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop on rent Gurgaon</strong></Link>, <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent Faridabad</strong></Link>, <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop on rent Faridabad</strong></Link>, and <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent Ghaziabad</strong></Link> / <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop on rent Ghaziabad</strong></Link>. Get the best deals for <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent in Delhi NCR</strong></Link> and <Link href="/services/computer-rental" className="hover:text-blue-600 transition-colors"><strong>desktop on rent in Delhi NCR</strong></Link>.
            </p>
            <p>
              Confused about <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent vs buying</strong></Link>? Renting saves CapEx! Our <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop rental Delhi NCR</strong></Link> plans are highly flexible. We offer <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent for students</strong></Link>, robust <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>corporate laptop rental</strong></Link> programs, <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop on rent for work from home</strong></Link>, and bulk <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop rental for events</strong></Link>. For tech professionals, we provide <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>laptop rental for developers</strong></Link> and <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>high performance laptop on rent</strong></Link>. Start your <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>bulk laptop rental</strong></Link> or <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>bulk laptop rental Delhi</strong></Link> journey with the most trusted partner for <Link href="/services/laptop-rental" className="hover:text-blue-600 transition-colors"><strong>corporate laptop rental Delhi NCR</strong></Link>.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Sticky Mobile CTA for FB Ads */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:hidden z-50 flex gap-3">
        <a
          href={whatsappLink}
          className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-center flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          <span>WhatsApp Us</span>
        </a>
      </div>

      {/* 1000+ Local SEO Keywords Component */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Available Across Delhi NCR</h2>
            <p className="text-slate-600">We provide fast delivery and on-site support in all these locations. Click on your city to learn more.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ncrLocations && ncrLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={service.slug === 'computer-rental' ? `/desktop-on-rent/${loc.slug}` : `/laptop-on-rent/${loc.slug}`}
                className="bg-white text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-200 shadow-sm transition-all text-center truncate"
              >
                {loc.city}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
