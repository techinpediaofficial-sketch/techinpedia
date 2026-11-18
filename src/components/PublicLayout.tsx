'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LiveChatWidget from '@/components/LiveChatWidget';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import BackToTopButton from '@/components/BackToTopButton';
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';

interface PublicLayoutProps {
  children: React.ReactNode;
  settingsMap: Record<string, string>;
  waLink: string;
  seoPages?: Array<{ id: string; title: string; slug: string }>;
}

export default function PublicLayout({
  children,
  settingsMap,
  waLink,
  seoPages = [],
}: PublicLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');


  const isMarketplace =
    process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC' ||
    pathname?.startsWith('/vendor') ||
    pathname?.startsWith('/list-business');

  // Set theme appropriately: Urban uses dark slate aesthetic; company public uses light
  useEffect(() => {
    const root = document.documentElement;
    if (isMarketplace) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else if (!isAdmin) {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [isAdmin, isMarketplace, pathname]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <ScrollProgressBar />
      {!isMarketplace && <Header whatsappLink={waLink} />}
      <main className={isMarketplace ? 'flex-grow' : 'flex-grow pt-24 sm:pt-28'}>{children}</main>
      {!isMarketplace && <Footer settings={settingsMap} whatsappLink={waLink} seoPages={seoPages} />}
      {!isMarketplace && <BackToTopButton />}
      {!isMarketplace && <WhatsAppFloatingButton href={waLink} />}
      {!isMarketplace && <LiveChatWidget />}
    </>
  );
}
