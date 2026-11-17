import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, ShieldCheck, Clock, CheckCircle2, MapPin, MemoryStick, Cpu, HardDrive, Monitor, MessageSquare, ChevronLeft } from 'lucide-react';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import { ncrLocations } from '@/lib/locations';

const ALL_PRODUCTS = [
  {
    brand: "Lenovo",
    title: "Lenovo ThinkPad L460 I5 / 8 GB / 256 GB SSD / Ubuntu / 14 Inch /",
    slug: "lenovo-thinkpad-l460-i5-8gb-256gb",
    image: "https://pngimg.com/uploads/laptop/laptop_PNG5915.png",
    specs: { cpu: "Intel Core i5", ram: "8 GB RAM", storage: "256 GB SSD", os: "Ubuntu", display: "14 Inch" },
    desc: "A reliable corporate laptop built for intense work environments. Offers solid performance and a highly durable chassis."
  },
  {
    brand: "Apple",
    title: "MacBook Air A2337 M1 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch /",
    slug: "macbook-air-m1-8gb-256gb",
    image: "https://pngimg.com/uploads/macbook/macbook_PNG8.png",
    specs: { cpu: "Apple M1 Chip", ram: "8 GB Unified", storage: "256 GB SSD", os: "macOS", display: "13.3 Inch Retina" },
    desc: "Lightweight yet incredibly powerful. The M1 chip delivers extraordinary performance and up to 18 hours of battery life."
  },
  {
    brand: "Apple",
    title: "MacBook Pro A2338 M2 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch /",
    slug: "macbook-pro-m2-8gb-256gb",
    image: "https://pngimg.com/uploads/macbook/macbook_PNG65.png",
    specs: { cpu: "Apple M2 Chip", ram: "8 GB Unified", storage: "256 GB SSD", os: "macOS", display: "13.3 Inch Retina" },
    desc: "Designed for pros. Features an active cooling system to sustain pro-level performance for video editing and coding."
  },
  {
    brand: "Apple",
    title: "MacBook Air M3 CHIP / 8 GB / 512 GB SSD / Mac OS / 13 Inch /",
    slug: "macbook-air-m3-8gb-512gb",
    image: "https://pngimg.com/uploads/macbook/macbook_PNG35.png",
    specs: { cpu: "Apple M3 Chip", ram: "8 GB Unified", storage: "512 GB SSD", os: "macOS", display: "13 Inch Liquid Retina" },
    desc: "The next generation of Apple Silicon. Lightning fast for business multitasking and creative projects."
  },
  {
    brand: "Apple",
    title: "MacBook Max A3185 M4 CHIP / 36 GB / 512 GB SSD / Mac OS / 14 Inch /",
    slug: "macbook-max-m4-36gb-512gb",
    image: "https://pngimg.com/uploads/macbook/macbook_PNG48.png",
    specs: { cpu: "Apple M4 Max", ram: "36 GB Unified", storage: "512 GB SSD", os: "macOS", display: "14 Inch Liquid Retina XDR" },
    desc: "Extreme performance for massive workflows. Perfect for 3D rendering, machine learning, and heavy video production."
  },
  {
    brand: "Apple",
    title: "MacBook Max A3186 M4 CHIP / 48 GB / 1 TB SSD / Mac OS / 16 Inch /",
    slug: "macbook-max-m4-48gb-1tb",
    image: "https://pngimg.com/uploads/macbook/macbook_PNG8.png",
    specs: { cpu: "Apple M4 Max", ram: "48 GB Unified", storage: "1 TB SSD", os: "macOS", display: "16 Inch Liquid Retina XDR" },
    desc: "The ultimate developer and creator machine. Unmatched power and storage for the most demanding enterprise tasks."
  },
  {
    brand: "HP",
    title: "HP 845 G7 Ryzen 5 / 16 GB / 256 GB SSD / Windows 11 Pro / 14 Inch /",
    slug: "hp-845-g7-ryzen-5-16gb",
    image: "https://pngimg.com/uploads/laptop/laptop_PNG5908.png",
    specs: { cpu: "AMD Ryzen 5", ram: "16 GB RAM", storage: "256 GB SSD", os: "Windows 11 Pro", display: "14 Inch FHD" },
    desc: "A sleek, business-ready Windows laptop. Powerful multi-core performance with comprehensive security features."
  },
  {
    brand: "ASUS",
    title: "ASUS ROG Strix G15 Ryzen 7 / 16 GB / 512 GB SSD / Windows 11 Pro / 16 Inch",
    slug: "asus-rog-strix-g15-ryzen-7",
    image: "https://pngimg.com/uploads/laptop/laptop_PNG101783.png",
    specs: { cpu: "AMD Ryzen 7", ram: "16 GB RAM", storage: "512 GB SSD", os: "Windows 11 Pro", display: "16 Inch 144Hz" },
    desc: "High-performance workstation and gaming laptop. Ideal for graphic designers, architects, and power users."
  },
  {
    brand: "Dell",
    title: "Dell Optiplex 7040 Core i5 6th Gen / 8GB / 256GB SSD / Win 10 Pro",
    slug: "dell-optiplex-7040-i5",
    image: "/images/hardware/pc1.png",
    specs: { cpu: "Intel Core i5", ram: "8 GB RAM", storage: "256 GB SSD", os: "Windows 10 Pro", display: "Monitor Not Included" },
    desc: "Space-saving commercial desktop providing business-class management and security."
  },
  {
    brand: "HP",
    title: "HP EliteDesk 800 G3 Core i7 7th Gen / 16GB / 512GB SSD / Win 10 Pro",
    slug: "hp-elitedesk-800-g3-i7",
    image: "/images/hardware/pc2.png",
    specs: { cpu: "Intel Core i7", ram: "16 GB RAM", storage: "512 GB SSD", os: "Windows 10 Pro", display: "Monitor Not Included" },
    desc: "Enterprise-class performance and security in a highly manageable desktop."
  },
  {
    brand: "Lenovo",
    title: "Lenovo ThinkCentre M720 Tiny Core i5 8th Gen / 16GB / 256GB NVMe",
    slug: "lenovo-thinkcentre-m720-tiny",
    image: "/images/hardware/pc3.png",
    specs: { cpu: "Intel Core i5 8th Gen", ram: "16 GB RAM", storage: "256 GB NVMe SSD", os: "Windows 11 Pro", display: "Tiny Form Factor" },
    desc: "Ultra-compact PC that packs a punch. Can be mounted anywhere, saving desk space."
  },
  {
    brand: "Apple",
    title: "iMac 24-inch M1 Chip / 8-Core CPU / 8GB RAM / 256GB SSD",
    slug: "imac-24-inch-m1-8gb",
    image: "/images/hardware/imac.png",
    specs: { cpu: "Apple M1 Chip", ram: "8 GB Unified", storage: "256 GB SSD", os: "macOS", display: "24 Inch 4.5K Retina" },
    desc: "Stunning all-in-one desktop. Brilliant display combined with the incredibly fast M1 chip."
  },
  {
    brand: "Apple",
    title: "iMac 27-inch Retina 5K Intel Core i7 / 16GB RAM / 512GB SSD",
    slug: "imac-27-inch-5k-i7",
    image: "/images/hardware/imac.png",
    specs: { cpu: "Intel Core i7", ram: "16 GB RAM", storage: "512 GB SSD", os: "macOS", display: "27 Inch 5K Retina" },
    desc: "The ultimate creative canvas. Breathtaking 5K display and powerful Intel processing."
  },
  {
    brand: "Dell",
    title: "Dell Precision 3630 Tower Workstation Core i7 / 32GB RAM / 1TB NVMe / RTX 4000",
    slug: "dell-precision-3630-rtx4000",
    image: "/images/hardware/pc4.png",
    specs: { cpu: "Intel Core i7", ram: "32 GB RAM", storage: "1 TB NVMe SSD", os: "Windows 11 Pro", display: "RTX 4000 GPU" },
    desc: "Professional workstation designed for heavy CAD, rendering, and data analysis."
  },
  {
    brand: "HP",
    title: "HP Z4 G4 Workstation Xeon W-2123 / 32GB RAM / 1TB NVMe / Quadro P2000",
    slug: "hp-z4-g4-xeon-p2000",
    image: "/images/hardware/pc1.png",
    specs: { cpu: "Intel Xeon W", ram: "32 GB ECC RAM", storage: "1 TB NVMe SSD", os: "Windows 11 Pro for Workstations", display: "Quadro P2000 GPU" },
    desc: "Mission-critical reliability. Built for continuous operation in engineering and design environments."
  },
  {
    brand: "Custom PC",
    title: "High-Performance Gaming/Render PC Ryzen 9 / 64GB RAM / 2TB NVMe / RTX 4080",
    slug: "custom-pc-ryzen9-rtx4080",
    image: "/images/hardware/pc2.png",
    specs: { cpu: "AMD Ryzen 9", ram: "64 GB High-Speed RAM", storage: "2 TB NVMe SSD", os: "Windows 11 Pro", display: "NVIDIA RTX 4080 GPU" },
    desc: "Uncompromising performance. Custom-built for intense 3D rendering, simulation, and maximum frame rates."
  }
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = ALL_PRODUCTS.find(p => p.slug === slug);
  if (!product) return {};

  const title = `Rent ${product.title} | TechInPedia`;
  const description = `Rent ${product.title} starting today. Fast delivery across Delhi NCR, Zero Maintenance, and Free IT Support. Specifications: ${product.specs.cpu}, ${product.specs.ram}, ${product.specs.storage}.`;
  
  return {
    title,
    description,
    keywords: [`rent ${product.brand} laptop`, `${product.title} on rent`, `rent ${product.brand} desktop`, `laptop on rent Delhi NCR`],
    openGraph: {
      title,
      description,
      images: [{ url: product.image }]
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = ALL_PRODUCTS.find(p => p.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumb */}
        <Link href="/services/laptop-rental" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Rentals</span>
        </Link>

        {/* Product Hero */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Image Gallery Area */}
            <div className="bg-white p-8 md:p-16 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100 relative">
              <span className="absolute top-6 left-6 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">In Stock</span>
              <div className="relative w-full max-w-md aspect-square">
                <Image src={product.image} alt={product.title} fill className="object-contain" priority />
              </div>
            </div>

            {/* Product Info */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-2 text-sm font-bold text-emerald-600 uppercase tracking-widest">{product.brand}</div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">{product.title}</h1>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {product.desc}
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-700 w-24">Processor:</span>
                  <span className="text-slate-600">{product.specs.cpu}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MemoryStick className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-700 w-24">Memory:</span>
                  <span className="text-slate-600">{product.specs.ram}</span>
                </div>
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-700 w-24">Storage:</span>
                  <span className="text-slate-600">{product.specs.storage}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-700 w-24">Display:</span>
                  <span className="text-slate-600">{product.specs.display}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                <RequestQuoteModal serviceName={`Rental: ${product.title}`} />
                <a
                  href="https://wa.me/919818768680"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-center shadow-lg shadow-green-500/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>WhatsApp Enquriy</span>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Deliverability & Perks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Fast & Free Delivery</h3>
            <p className="text-slate-600 text-sm">We provide lightning-fast, secure delivery across all major locations in Delhi NCR directly to your office or home.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Maintenance Cost</h3>
            <p className="text-slate-600 text-sm">All our rented devices come with complete hardware warranty. If it breaks down, we replace or fix it for free.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 IT Support</h3>
            <p className="text-slate-600 text-sm">Facing an issue? Our dedicated IT support team is just a call away to assist you with OS and hardware troubleshooting.</p>
          </div>
        </div>

        {/* Locations Section */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
              <MapPin className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-extrabold mb-4">Available for Delivery in Delhi NCR</h2>
            <p className="text-slate-400 max-w-2xl">
              Need this device urgently? We have dedicated logistics for fast deployment in the following areas. Click on your specific location to see local rental services.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ncrLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/laptop-on-rent/${loc.slug}`}
                className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 text-sm font-semibold px-4 py-3 rounded-xl transition-all text-center truncate"
              >
                {loc.city}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
