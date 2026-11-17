const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  {
    internalName: 'PRODUCT: Lenovo ThinkPad L460',
    title: 'Lenovo ThinkPad L460 i5 Laptop on Rent in India - Best IT Rental Service',
    slug: 'lenovo-thinkpad-l460-i5-laptop-on-rent-in-india',
    metaTitle: 'Lenovo ThinkPad L460 i5 Laptop on Rent in India - Best IT Rental Service',
    metaDescription: 'Rent the Lenovo ThinkPad L460 i5 / 8 GB / 256 GB SSD / Ubuntu / 14 Inch laptop in India. Perfect for professionals and businesses. Fast delivery and best prices.',
    focusKeyword: 'Lenovo ThinkPad L460 i5 Laptop on Rent in India',
    heroHeading: 'Lenovo ThinkPad L460 i5 Laptop on Rent in India',
    heroSubheading: 'Lenovo ThinkPad L460 I5 / 8 GB / 256 GB SSD / Ubuntu / 14 Inch',
    heroImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-1',
        type: 'FEATURES',
        data: {
          heading: 'Laptop Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'Intel Core i5 for smooth multitasking' },
            { title: 'RAM', description: '8 GB RAM for lag-free performance' },
            { title: 'Storage', description: '256 GB SSD for lightning fast boots' },
            { title: 'OS', description: 'Ubuntu / Windows available on request' },
            { title: 'Display', description: '14 Inch crisp display for productivity' },
            { title: 'Brand', description: 'Lenovo - Built for business' }
          ])
        }
      }
    ])
  },
  {
    internalName: 'PRODUCT: Apple MacBook Air M1',
    title: 'Apple MacBook Air M1 Chip Laptop for Rent in India - High Performance macOS',
    slug: 'apple-macbook-air-m1-chip-laptop-for-rent-in-india',
    metaTitle: 'Apple MacBook Air M1 Chip Laptop for Rent in India - High Performance macOS',
    metaDescription: 'Rent the MacBook Air A2337 M1 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch laptop in India. Ideal for developers and executives.',
    focusKeyword: 'Apple MacBook Air M1 Chip Laptop for Rent in India',
    heroHeading: 'Apple MacBook Air M1 Chip Laptop for Rent in India',
    heroSubheading: 'MacBook Air A2337 M1 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch',
    heroImage: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-2',
        type: 'FEATURES',
        data: {
          heading: 'MacBook Air M1 Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'Apple M1 Chip - Revolutionary performance' },
            { title: 'RAM', description: '8 GB Unified Memory' },
            { title: 'Storage', description: '256 GB fast SSD' },
            { title: 'OS', description: 'macOS - Secure and seamless' },
            { title: 'Display', description: '13 Inch Retina Display' }
          ])
        }
      }
    ])
  },
  {
    internalName: 'PRODUCT: Apple MacBook Pro M2',
    title: 'Apple MacBook Pro M2 Chip Rental in India - Video Editing and Developer Laptop',
    slug: 'apple-macbook-pro-m2-chip-rental-in-india',
    metaTitle: 'Apple MacBook Pro M2 Chip Rental in India - Video Editing and Developer Laptop',
    metaDescription: 'Rent the MacBook Pro A2338 M2 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch in India. Best for video editing, developers, and heavy workloads.',
    focusKeyword: 'Apple MacBook Pro M2 Chip Rental in India',
    heroHeading: 'Apple MacBook Pro M2 Chip Rental in India',
    heroSubheading: 'MacBook Pro A2338 M2 CHIP / 8 GB / 256 GB SSD / Mac OS / 13 Inch',
    heroImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-3',
        type: 'FEATURES',
        data: {
          heading: 'MacBook Pro M2 Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'Apple M2 Chip - Next gen power' },
            { title: 'RAM', description: '8 GB Unified Memory' },
            { title: 'Storage', description: '256 GB SSD' },
            { title: 'OS', description: 'macOS' },
            { title: 'Display', description: '13 Inch Liquid Retina' }
          ])
        }
      }
    ])
  },
  {
    internalName: 'PRODUCT: MacBook Air M3',
    title: 'MacBook Air M3 Chip Laptop Rental for Business in India - Latest Apple Tech',
    slug: 'macbook-air-m3-chip-laptop-rental-for-business-in-india',
    metaTitle: 'MacBook Air M3 Chip Laptop Rental for Business in India - Latest Apple Tech',
    metaDescription: 'Rent the latest MacBook Air M3 CHIP / 8 GB / 512 GB SSD / Mac OS / 13 Inch in India. Equip your team with cutting-edge Apple tech on flexible rentals.',
    focusKeyword: 'MacBook Air M3 Chip Laptop Rental in India',
    heroHeading: 'MacBook Air M3 Chip Laptop Rental in India',
    heroSubheading: 'MacBook Air M3 CHIP / 8 GB / 512 GB SSD / Mac OS / 13 Inch',
    heroImage: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-4',
        type: 'FEATURES',
        data: {
          heading: 'MacBook Air M3 Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'Apple M3 Chip - Unmatched efficiency' },
            { title: 'RAM', description: '8 GB Unified Memory' },
            { title: 'Storage', description: '512 GB SSD' },
            { title: 'OS', description: 'macOS' },
            { title: 'Display', description: '13 Inch' }
          ])
        }
      }
    ])
  },
  {
    internalName: 'PRODUCT: MacBook Max M4 36GB',
    title: 'MacBook Max M4 36GB RAM Rental in India - Heavy Duty Graphic Design Laptop',
    slug: 'macbook-max-m4-36gb-ram-rental-in-india',
    metaTitle: 'MacBook Max M4 36GB RAM Rental in India - Heavy Duty Graphic Design Laptop',
    metaDescription: 'Rent the ultra-powerful MacBook Max A3185 M4 CHIP / 36 GB / 512 GB SSD / Mac OS / 14 Inch in India. Perfect for 3D rendering and graphic design.',
    focusKeyword: 'MacBook Max M4 36GB RAM Rental in India',
    heroHeading: 'MacBook Max M4 36GB RAM Rental in India',
    heroSubheading: 'MacBook Max A3185 M4 CHIP / 36 GB / 512 GB SSD / Mac OS / 14 Inch',
    heroImage: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-5',
        type: 'FEATURES',
        data: {
          heading: 'MacBook Max M4 Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'Apple M4 Max Chip - Ultimate performance' },
            { title: 'RAM', description: '36 GB Unified Memory for heavy workloads' },
            { title: 'Storage', description: '512 GB SSD' },
            { title: 'OS', description: 'macOS' },
            { title: 'Display', description: '14 Inch Liquid Retina XDR' }
          ])
        }
      }
    ])
  },
  {
    internalName: 'PRODUCT: MacBook Max M4 48GB',
    title: 'MacBook Max M4 48GB 1TB SSD on Rent in India - Ultimate Developer Laptop',
    slug: 'macbook-max-m4-48gb-1tb-ssd-on-rent-in-india',
    metaTitle: 'MacBook Max M4 48GB 1TB SSD on Rent in India - Ultimate Developer Laptop',
    metaDescription: 'Rent the MacBook Max A3186 M4 CHIP / 48 GB / 1 TB SSD / Mac OS / 16 Inch in India. The ultimate workstation for enterprise developers and creators.',
    focusKeyword: 'MacBook Max M4 48GB on Rent in India',
    heroHeading: 'MacBook Max M4 48GB 1TB SSD on Rent in India',
    heroSubheading: 'MacBook Max A3186 M4 CHIP / 48 GB / 1 TB SSD / Mac OS / 16 Inch',
    heroImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-6',
        type: 'FEATURES',
        data: {
          heading: 'MacBook Max M4 16" Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'Apple M4 Max Chip' },
            { title: 'RAM', description: '48 GB Unified Memory' },
            { title: 'Storage', description: '1 TB SSD massive storage' },
            { title: 'OS', description: 'macOS' },
            { title: 'Display', description: '16 Inch Liquid Retina XDR' }
          ])
        }
      }
    ])
  },
  {
    internalName: 'PRODUCT: HP 845 G7 Ryzen 5',
    title: 'HP 845 G7 Ryzen 5 Laptop for Rent in India - Fast Windows 11 Business Laptop',
    slug: 'hp-845-g7-ryzen-5-laptop-for-rent-in-india',
    metaTitle: 'HP 845 G7 Ryzen 5 Laptop for Rent in India - Fast Windows 11 Business Laptop',
    metaDescription: 'Rent HP 845 G7 Ryzen 5 / 16 GB / 256 GB SSD / Windows 11 Pro / 14 Inch laptop in India. Ideal for corporate environments requiring fast, reliable Windows machines.',
    focusKeyword: 'HP 845 G7 Ryzen 5 Laptop for Rent in India',
    heroHeading: 'HP 845 G7 Ryzen 5 Laptop for Rent in India',
    heroSubheading: 'HP 845 G7 Ryzen 5 / 16 GB / 256 GB SSD / Windows 11 Pro / 14 Inch',
    heroImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-7',
        type: 'FEATURES',
        data: {
          heading: 'HP 845 G7 Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'AMD Ryzen 5' },
            { title: 'RAM', description: '16 GB RAM for power users' },
            { title: 'Storage', description: '256 GB SSD' },
            { title: 'OS', description: 'Windows 11 Pro' },
            { title: 'Display', description: '14 Inch' }
          ])
        }
      }
    ])
  },
  {
    internalName: 'PRODUCT: ASUS ROG Strix G15',
    title: 'ASUS ROG Strix G15 Gaming Laptop on Rent in India - High Performance Workstation',
    slug: 'asus-rog-strix-g15-gaming-laptop-on-rent-in-india',
    metaTitle: 'ASUS ROG Strix G15 Gaming Laptop on Rent in India - High Performance Workstation',
    metaDescription: 'Rent the ASUS ROG Strix G15 Ryzen 7 / 16 GB / 512 GB SSD / Windows 11 Pro / 16 Inch laptop in India. Best gaming laptop rental for heavy rendering and gaming.',
    focusKeyword: 'ASUS ROG Strix G15 Gaming Laptop on Rent in India',
    heroHeading: 'ASUS ROG Strix G15 Gaming Laptop on Rent in India',
    heroSubheading: 'ASUS ROG Strix G15 Ryzen 7 / 16 GB / 512 GB SSD / Windows 11 Pro / 16 Inch',
    heroImage: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1200&auto=format&fit=crop',
    blocks: JSON.stringify([
      {
        id: 'features-8',
        type: 'FEATURES',
        data: {
          heading: 'ASUS ROG Strix G15 Specifications',
          items: JSON.stringify([
            { title: 'Processor', description: 'AMD Ryzen 7' },
            { title: 'RAM', description: '16 GB RAM' },
            { title: 'Storage', description: '512 GB SSD' },
            { title: 'OS', description: 'Windows 11 Pro' },
            { title: 'Display', description: '16 Inch High Refresh Rate Display' },
            { title: 'Graphics', description: 'Dedicated NVIDIA/AMD GPU for rendering' }
          ])
        }
      }
    ])
  }
];

async function main() {
  for (const product of products) {
    const existing = await prisma.seoLandingPage.findUnique({
      where: { slug: product.slug }
    });
    
    if (!existing) {
      await prisma.seoLandingPage.create({
        data: product
      });
      console.log('Created:', product.slug);
    } else {
      await prisma.seoLandingPage.update({
        where: { slug: product.slug },
        data: product
      });
      console.log('Updated:', product.slug);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
