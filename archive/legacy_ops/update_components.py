import json
import os

with open('/Users/adityaverma/Downloads/techinpedia/playstore_assets.json') as f:
    assets = json.load(f)

def get_img(url, size='w1200-h800-rw'):
    if not url: return ''
    return f'{url}={size}'

# 9 Apps data
apps = [
    {
        'title': 'Admiles Delivery',
        'slug': 'admiles-delivery',
        'category': 'Multi-Vendor / Food / Shopping / Parcel',
        'shortDesc': '3-in-1 multi-vendor super app combining restaurant food delivery, retail e-commerce shopping, and point-to-point courier parcel dispatch.',
        'description': 'Admiles Delivery is an all-in-one 3-in-1 on-demand delivery super app developed for multi-vendor commerce, restaurant food delivery, retail e-commerce shopping, and point-to-point courier parcel services. Featuring live GPS driver tracking, dynamic vendor stores, secure payments, and automated rider dispatch.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.naveen.new_mart_user',
        'services': ['Android App Development', 'Multi-Vendor Architecture', 'Food & E-Commerce Cart', 'Parcel Delivery Engine', 'Live GPS Tracking', 'Payment Gateway'],
        'technologies': ['Flutter', 'Node.js', 'Express', 'MySQL', 'Google Maps API', 'Socket.io', 'FCM'],
        'featuredImage': get_img(assets['com.naveen.new_mart_user']['icon']),
        'screenshots': [get_img(s) for s in assets['com.naveen.new_mart_user']['screenshots']]
    },
    {
        'title': 'Vijaya Bharna Jewellers',
        'slug': 'vijaya-bharna-jewellers',
        'category': 'Jewellery / E-commerce',
        'shortDesc': 'Dedicated Android mobile application developed for Vijaya Bharna Jewellers for browsing exquisite jewellery catalogues.',
        'description': 'A dedicated mobile application developed for Vijaya Bharna Jewellers to provide customers with a convenient digital experience for exploring jewellery products and connecting with the business.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.vijayabharna.jewellers',
        'services': ['Android App Development', 'UI Implementation', 'Product Catalogue', 'Backend/API Integration', 'Play Store Publishing'],
        'technologies': ['Android', 'API Integration', 'Database', 'Mobile UI'],
        'featuredImage': get_img(assets['com.vijayabharna.jewellers']['icon']),
        'screenshots': [get_img(s) for s in assets['com.vijayabharna.jewellers']['screenshots']]
    },
    {
        'title': 'Jagmohan Exam Sathi',
        'slug': 'jagmohan-exam-sathi',
        'category': 'Education / Exam Prep',
        'shortDesc': 'Educational mobile application designed to provide students and aspirants with interactive test prep and study materials.',
        'description': 'Jagmohan Exam Sathi is an educational mobile application designed to provide students and exam aspirants with a convenient digital platform for learning and exam preparation.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.jagmohanexamsathi.app',
        'services': ['Android App Development', 'Educational Platform', 'UI/UX Implementation', 'API Integration', 'Play Store Deployment'],
        'technologies': ['Android', 'API Integration', 'Database', 'Mobile UI'],
        'featuredImage': get_img(assets['com.jagmohanexamsathi.app']['icon']),
        'screenshots': [get_img(s) for s in assets['com.jagmohanexamsathi.app']['screenshots']]
    },
    {
        'title': 'IPL Bus',
        'slug': 'ipl-bus',
        'category': 'Transportation / Bus Services',
        'shortDesc': 'Transportation mobile application developed to provide users with a convenient digital experience for inter-city bus route booking.',
        'description': 'A transportation-focused mobile application developed to provide users with a convenient digital experience for bus-related services and route tracking.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.iplbus.bmnaveen',
        'services': ['Android App Development', 'Mobile UI Development', 'API Integration', 'Service Management', 'Play Store Deployment'],
        'technologies': ['Android', 'API Integration', 'Database', 'Mobile UI'],
        'featuredImage': get_img(assets['com.iplbus.bmnaveen']['icon']),
        'screenshots': [get_img(s) for s in assets['com.iplbus.bmnaveen']['screenshots']]
    },
    {
        'title': 'BM Naveen Movies',
        'slug': 'bm-naveen-movies',
        'category': 'Entertainment / Movies',
        'shortDesc': 'Entertainment mobile application developed for exploring cinema trailers, new releases, and digital media.',
        'description': 'BM Naveen Movies is an entertainment-focused mobile application developed to provide users with a convenient way to explore movie-related content through a dedicated mobile platform.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.movies.bmnaveen',
        'services': ['Android App Development', 'UI/UX Implementation', 'Movie Content Integration', 'API Integration', 'Play Store Deployment'],
        'technologies': ['Android', 'API Integration', 'Database', 'Mobile UI'],
        'featuredImage': get_img(assets['com.movies.bmnaveen']['icon']),
        'screenshots': [get_img(s) for s in assets['com.movies.bmnaveen']['screenshots']]
    },
    {
        'title': 'BM Naveen Taxi',
        'slug': 'naveen-taxi',
        'category': 'Transportation / Taxi Booking',
        'shortDesc': 'On-demand taxi booking and ride dispatch application with real-time driver tracking and automated fare calculation.',
        'description': 'BM Naveen Taxi is an on-demand transportation platform developed for taxi booking, ride dispatch, and automated driver tracking.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.naveen.taxi.user',
        'services': ['Android App Development', 'Booking Flow', 'User Interface Development', 'Location-Based Features', 'Play Store Deployment'],
        'technologies': ['Android', 'API Integration', 'Location Services', 'Database'],
        'featuredImage': get_img(assets['com.naveen.taxi.user']['icon']),
        'screenshots': [get_img(s) for s in assets['com.naveen.taxi.user']['screenshots']]
    },
    {
        'title': 'AllOut Enterprise',
        'slug': 'allout',
        'category': 'Business / Commercial Services',
        'shortDesc': 'Enterprise mobile application developed to provide business customers with a seamless portal for commercial operations.',
        'description': 'A business-focused mobile application developed to provide customers with a convenient digital platform for accessing commercial services.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.customer.allout',
        'services': ['Android App Development', 'UI/UX Implementation', 'API Integration', 'Business Features', 'Play Store Deployment'],
        'technologies': ['Android', 'API Integration', 'Database', 'Mobile UI'],
        'featuredImage': get_img(assets['com.customer.allout']['icon']),
        'screenshots': [get_img(s) for s in assets['com.customer.allout']['screenshots']]
    },
    {
        'title': 'Namasthe Daily',
        'slug': 'namasthe-daily',
        'category': 'News & Media Publishing',
        'shortDesc': 'Digital news mobile application providing readers with instant localized daily headlines and breaking news alerts.',
        'description': 'Namasthe Daily is a digital news application developed to provide users with an accessible mobile platform for discovering and consuming news content.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.namasethedaily.news',
        'services': ['Android App Development', 'News Content Integration', 'Push Notifications', 'UI/UX Development', 'Play Store Deployment'],
        'technologies': ['Android', 'API Integration', 'Push Notifications', 'Database'],
        'featuredImage': get_img(assets['com.namasethedaily.news']['icon']),
        'screenshots': [get_img(s) for s in assets['com.namasethedaily.news']['screenshots']]
    },
    {
        'title': 'JobsChoose Platform',
        'slug': 'jobschoose',
        'category': 'Jobs & Career Recruitment',
        'shortDesc': 'Recruitment and career exploration mobile application connecting job aspirants with companies and active openings.',
        'description': 'JobsChoose is a recruitment-focused mobile application developed to provide users with a convenient digital platform for discovering and accessing job opportunities.',
        'playStoreUrl': 'https://play.google.com/store/apps/details?id=com.jobschoose.customer',
        'services': ['Android App Development', 'Job Listing Integration', 'Search & Discovery Features', 'UI/UX Development', 'Play Store Deployment'],
        'technologies': ['Android', 'API Integration', 'Database', 'Mobile UI'],
        'featuredImage': get_img(assets['com.jobschoose.customer']['icon']),
        'screenshots': [get_img(s) for s in assets['com.jobschoose.customer']['screenshots']]
    },
]

# 1. Update src/components/MobileAppsShowcase.tsx
mobile_showcase_code = f"""'use client';

import Link from 'next/link';
import Image from 'next/image';
import {{ ArrowRight, Smartphone, ExternalLink, Sparkles, CheckCircle2, ShieldCheck }} from 'lucide-react';

export interface MobileAppItem {{
  id?: string;
  title: string;
  slug: string;
  category: string;
  shortDesc: string;
  description: string;
  playStoreUrl: string;
  services: string[];
  technologies: string[];
  featuredImage: string;
  screenshots?: string[];
}}

const mobileAppsData: MobileAppItem[] = {json.dumps(apps, indent=2)};

export default function MobileAppsShowcase() {{
  return (
    <section className="py-24 bg-slate-950 border-b border-slate-800 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Freelance Mobile App Portfolio</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Apps & Digital Products We&apos;ve Built
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Real-world mobile applications developed for businesses, startups, and entrepreneurs with authentic Google Play Store screenshots.
          </p>
        </div>

        {/* 9 APPS SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {{mobileAppsData.map((app, idx) => (
            <div
              key={{idx}}
              className="group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:shadow-[0_15px_40px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col justify-between overflow-hidden p-6 space-y-4"
            >
              <div>
                {/* APP ICON & TOP METADATA ROW */}
                <div className="flex items-start justify-between gap-4 pb-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-slate-700/80 bg-slate-950 p-1.5 shadow-xl shadow-slate-950 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <Image
                        src={{app.featuredImage}}
                        alt={{app.title}}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-emerald-400 uppercase tracking-wider text-right">
                      {{app.category}}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold tracking-wide inline-flex items-center gap-1">
                      Google Play Live
                    </span>
                  </div>
                </div>

                {/* APP TITLE & DESCRIPTION */}
                <div className="space-y-2 mt-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                    {{app.title}}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {{app.shortDesc}}
                  </p>
                </div>

                {/* REAL PLAY STORE SCREENSHOT PREVIEW */}
                {{app.screenshots && app.screenshots.length > 0 && (
                  <div className="pt-3">
                    <Link href={{`/work/${{app.slug}}`}} className="block group/screen relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                      <Image
                        src={{app.screenshots[0]}}
                        alt={{`${{app.title}} Real Play Store Screenshot`}}
                        fill
                        className="object-cover object-top group-hover/screen:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-emerald-400 backdrop-blur-sm">
                          Play Store UI
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-300 backdrop-blur-sm">
                          {{app.screenshots.length}} Real Screens →
                        </span>
                      </div>
                    </Link>
                  </div>
                )}}

                {/* SERVICES DELIVERED TAGS */}
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {{app.services.slice(0, 3).map((service, sIdx) => (
                    <span
                      key={{sIdx}}
                      className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-medium"
                    >
                      {{service}}
                    </span>
                  ))}}
                  {{app.services.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-semibold">
                      +{{app.services.length - 3}} more
                    </span>
                  )}}
                </div>
              </div>

              {/* CARD FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between mt-4">
                <Link
                  href={{`/work/${{app.slug}}`}}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  <span>Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <a
                  href={{app.playStoreUrl}}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs inline-flex items-center gap-1.5 transition-all hover:scale-105"
                  title="View on Google Play Store"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Play</span>
                </a>
              </div>
            </div>
          ))}}
        </div>

        {/* PORTFOLIO SECTION CTA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-emerald-900/40 border border-blue-800/40 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Mobile Product Engineering</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Have an App Idea?
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We turn business ideas into functional, scalable mobile applications. Whether you need a 3-in-1 delivery app, booking platform, e-commerce application, educational platform, transportation solution, or a completely custom product — TechInPedia India can help bring your idea to life.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full lg:w-auto">
            <Link
              href="/start-project"
              className="px-7 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-105 text-center flex items-center justify-center gap-2"
            >
              <span>Start Your Project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/work"
              className="px-7 py-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold text-sm transition-all hover:bg-slate-900 text-center"
            >
              View More Projects
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}}
"""

with open('/Users/adityaverma/Downloads/techinpedia/src/components/MobileAppsShowcase.tsx', 'w') as f:
    f.write(mobile_showcase_code)

print('Updated src/components/MobileAppsShowcase.tsx')
