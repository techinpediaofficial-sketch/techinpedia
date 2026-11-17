'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Smartphone, ExternalLink, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface MobileAppItem {
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
}

const mobileAppsData: MobileAppItem[] = [
  {
    "title": "Admiles Delivery",
    "slug": "admiles-delivery",
    "category": "Multi-Vendor / Food / Shopping / Parcel",
    "shortDesc": "3-in-1 multi-vendor on-demand mobile super app combining restaurant food ordering, e-commerce retail shopping, and courier parcel dispatch.",
    "description": "Admiles Delivery is an all-in-one 3-in-1 on-demand delivery super app developed for multi-vendor commerce, restaurant food delivery, retail e-commerce shopping, and point-to-point courier parcel services. Featuring live GPS driver tracking, dynamic vendor stores, secure payments, and automated rider dispatch.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.naveen.new_mart_user",
    "services": [
      "Android App Development",
      "Multi-Vendor Architecture",
      "Food & E-Commerce Cart",
      "Parcel Delivery Engine",
      "Live GPS Tracking",
      "Payment Gateway"
    ],
    "technologies": [
      "Flutter",
      "Node.js",
      "Express",
      "MySQL",
      "Google Maps API",
      "Socket.io",
      "FCM"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/AXLYIdI4FRdkHtTfvpOO0-dQ9rJgySOp_EJ5watvfIMkzjgrqphQEGqYXAIG4WWBvd42E3bY6IaqaobS4301hx0=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/ETKn_q8RYauJ6FrIer33nPq3nJyx22VjE1eiJNIHTOVqkHQEqmy_xN4c3qG15fkuBNcKzXbSACp8I9ZytbVjtA=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/pQNh8ZV2gSXz0e2NJX9lFaurp4TZCG1QCUY7f0pTvSo5JhyLd9lv7gLN0OjVFlWGP4svC5klPTexxJKAeU4YqQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/oR9p_eGYSgV505zh3arRdk5RAHMzkS7U_LeyXLdyIA14VCIFZ9KqFCc1IrjFwCjeQWlcg78-CLQE5_94-AjWCw=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/NHG9oUeYpnDFw1eS7OLqGmtC27aXPZXyiqiQR_yBo-2s-TsufqeZHKkIOAuNibwbGTRX5iF7EEP-FpAYAFtG=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/SR2sUzXdtQVmilcK_QHL-Jz0xQmqkG0JsAk0kRq6BsNm8utuYNHnX_IPTlLdjPk9xYJ1F1CeVPHn2ap-xIlybQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/f4ytZEJOJhHxRNp7oQhbaqF757VsqRAtKmiLiuG0kASP_sVe8qsnwwoBRbzMGsUb0maZu1pMDc4ooIUw5Zuz=w1200-h800-rw"
    ]
  },
  {
    "title": "Vijaya Bharna Jewellers",
    "slug": "vijaya-bharna-jewellers",
    "category": "Jewellery / E-commerce",
    "shortDesc": "Dedicated Android mobile application developed for Vijaya Bharna Jewellers for browsing exquisite jewellery catalogues.",
    "description": "A dedicated mobile application developed for Vijaya Bharna Jewellers to provide customers with a convenient digital experience for exploring jewellery products and connecting with the business.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.vijayabharna.jewellers",
    "services": [
      "Android App Development",
      "UI Implementation",
      "Product Catalogue",
      "Backend/API Integration",
      "Play Store Publishing"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Database",
      "Mobile UI"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/CE2m2M1weOkVBu2WzhlYlUyRynAoxKGCW9znGDEiSJkeNGm8NZoG6ynMRQDdlflqMLFfejhwMZwqiDBfd4jD3w=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/dwWPaMiNf0raYyM2yPbsW0ph14lvVT4hEgWHj_GZgwlSssS5cdsVzgZh4J_plUZZMUIRNxOZ7n3o1dabPSxpBg=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/l4IeOXdOkePz6ISnstYT1Ady6ibgwegty35vEF6EEeKuCL8rRqQjC3lGUJkKP7sOn-SYap059p194Y4B0wMJnQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/z3EFOsYtwtR69-Qtu2MV8LqaVRfWzB70MKZvq6EBQfCdKd8qKhqQdevEczBVeWF2H06eVAXihsSeU9bLKjQq=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/bzGL7-ncQzjXBud3ChPh0LwS7BwHZomy_r8VjfOYytnqkhvC11OppIsVtSQtrHIZLrsB7zBDzHU8L7gvKHebMg=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/8knZDF5qODqGjSrSW5Kc-WkDW8NlBNODlk4gKho-_1_upVcuPCk7TGe-_d-MY0h3G6sMHa8wJwWxR3wo48lAcKc=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/2uUWvFUwPiK2QOMEBlpjxIimlWckVPuiwWB1--tLKUCDQbnxFUtH4_dvCymIgHswE3p2YwKeiAyfVanQvFyZ=w1200-h800-rw"
    ]
  },
  {
    "title": "Jagmohan Exam Sathi",
    "slug": "jagmohan-exam-sathi",
    "category": "Education / Exam Prep",
    "shortDesc": "Educational mobile application designed to provide students and aspirants with interactive test prep and study materials.",
    "description": "Jagmohan Exam Sathi is an educational mobile application designed to provide students and exam aspirants with a convenient digital platform for learning and exam preparation.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.jagmohanexamsathi.app",
    "services": [
      "Android App Development",
      "Educational Platform",
      "UI/UX Implementation",
      "API Integration",
      "Play Store Deployment"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Database",
      "Mobile UI"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/W-JfZNKwRpfC5uYb1vSeHYgfwcZ_UcdF6nTAPCvJvw_Tc1367qNenguCM1ye8neYn1gqaMHCNK6-R5TSgsJRfw=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/5O1m3I-GMOTMdvp-JtbdFzJe99Q8TA7cFjS2n5JbWsVhaEX_Z7v7s9G_HTFdARrPBnu4mayYgSIObf57wp2RgQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/BvManRZNuC25O85GIwi3T-BZABAdATzi23vklS59Lqr95wztixVsxKE7Uk5anKlBGgGlYEYG0ON_JK2VFzMnsQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/Z19MroUu6VhhwCaBfodkE_4RSc1ZRR7JX6ksgh3z9dZULdm0kp8cKDgzDUGfdFwz7_8R0nS0fyotEz7UZbJYJg=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/W02SKpIKVa9C24VbB9rQNomuOiyPcrcRfmwxdHFMOwB0PK5dNn73zif2MhCuuMfFc2HEKJ5eZ9ykRK9K5--42A=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/QqAOjRTfBvWHUYWWQLFTWK5jvjw49khkOXYo4HHfC3LooMBoYOTDBuZTp3Lu0UinIyHtHTC81OWGNzVGHoELOzs=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/NXU49gOxNhXz8XDb0Z626DesPy1IFxZvfum5x_wKUYQ0O_RHbVJi7SFgG0Z3w5UdR6D8UG4xHEvt7eYPjsEmI-Y=w1200-h800-rw"
    ]
  },
  {
    "title": "IPL Bus",
    "slug": "ipl-bus",
    "category": "Transportation / Bus Services",
    "shortDesc": "Transportation mobile application developed to provide users with a convenient digital experience for inter-city bus route booking.",
    "description": "A transportation-focused mobile application developed to provide users with a convenient digital experience for bus-related services and route tracking.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.iplbus.bmnaveen",
    "services": [
      "Android App Development",
      "Mobile UI Development",
      "API Integration",
      "Service Management",
      "Play Store Deployment"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Database",
      "Mobile UI"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/mhG-rlv865fKLF9eLNCoj2ePcbHpwRiUUk2mCRGd9Fz9E-sFxOVpAvPb9lvCAu0_8mXfmcpudmn6Re8MbRtedM8=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/rI2PvmFGKNdy-iLDIRhJzidC1AzPmsjDa75fcpnwM3CVJzBzTRm23Wm7i5vdeVqIEJ54YB6COS80lwz08CUpyw=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/eXFrtEY0vCFY1l3cCuRQV5S0tV5Bei9D7Z8KkywoS5RDIsASKzm3p1yoyle592G0UAtYa6WxemLHWozDGV7MwQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/I5Gif7ypPLweT6ydL8Uwo2P7ryT6oHE2ysJBCsQRfC1dyPkj0kXAf4EQpweyfyzT-qe5DC4rIEV53JLZpE11nQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/bHtUHMsY_qfWXFM99oKwSHXtlbv8elhyb7pvfS-7jbjFgd9UVRnM4VnGFQrwhMM3JDe256V--4DOhxmgJHtIuw=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/tS-G7oJPBBACGCbfIjVBq7Bq5hiXFWCPcj4iqBqqzgihi3YTkdwCgapjReJSPVViLoTRtfScOaQ0fYAB4xZt=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/YEQcyw5kfaxY5-i7GYFe_mdIqiZK_KKEKmD7lrIaoQpCC7k66z7xeB45gJ8jNlAFcnstGEMAL7pw7lV35f2h2Q=w1200-h800-rw"
    ]
  },
  {
    "title": "BM Naveen Movies",
    "slug": "bm-naveen-movies",
    "category": "Entertainment / Movies",
    "shortDesc": "Entertainment mobile application developed for exploring cinema trailers, new releases, and digital media.",
    "description": "BM Naveen Movies is an entertainment-focused mobile application developed to provide users with a convenient way to explore movie-related content through a dedicated mobile platform.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.movies.bmnaveen",
    "services": [
      "Android App Development",
      "UI/UX Implementation",
      "Movie Content Integration",
      "API Integration",
      "Play Store Deployment"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Database",
      "Mobile UI"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/xHepYwz3Su5xIPh4_6hOhXcV0sLl9O6J0BbhMyKUfcIFjn2t7nsEU9r_qbOuwQNt4q5og64xbBg8YxQWQCpuAQ=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/rRa9sNvcboFL0VW5nOX4dqTOoMmo6O3jP6emSoNv6SLhZGItT2sxwIdUzvOikLP4FO2OYhhqgbcVTrFlsDIcsw=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/eqK2liiHMwz3UnIfdj5TB7JpP2pWWkxqusmD49ARANEJj7cAWtx3S8y8CFkelltV10vNc9yBNzy2Zm3XFZ0iuXU=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/QIfJfNUz_l6pmNBxsEccfdpB5T_O0vt3XpCaz2eyvZwi2Rpp-pkVzmRQzLbITKhp7SbHHtHepeED6vki19Rl6b0=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/EF59MNcfPi7pYNCVu23MxR3mTxi8jekg7WoU2H-fLDvo_CB5T_h_EMD72zJcEfK2Kqd3K6La88HYeAHR8qEF5w=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/q3wUJORsoWs2VbDHbNZyfkKK2uMfQ1RZNjzetqNlefuLhg-qcd0s4SfR4Tf7qyEDg0sSWj_4kANdc50GOSDo2g=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/ImV-tym4djWxmxr1Bwd3nsauKGJ0vMPVALXBN-ZhWs8J8LkRoYghPXmA1OQzrj_nnHGR_QLF3FB6eidTGWJV=w1200-h800-rw"
    ]
  },
  {
    "title": "BM Naveen Taxi",
    "slug": "naveen-taxi",
    "category": "Transportation / Taxi Booking",
    "shortDesc": "On-demand taxi booking and ride dispatch application with real-time driver tracking and automated fare calculation.",
    "description": "BM Naveen Taxi is an on-demand transportation platform developed for taxi booking, ride dispatch, and automated driver tracking.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.naveen.taxi.user",
    "services": [
      "Android App Development",
      "Booking Flow",
      "User Interface Development",
      "Location-Based Features",
      "Play Store Deployment"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Location Services",
      "Database"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/RYkdqIWH9byi2hSuZ0whHb0kBxZgxjKliT0lxbm5JbCbW2oMoGDRQzdmGUOe06kSJlsn8E1pLhp_saQVgQdtnWs=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/6qRrtr5_w_oHUw3R5nSjvz7P-j8vF7QXYK_7vgZeNQRoGmNbPRrh0Yx-bGr4bB5IK0vjSx5x8rXMkDbKVKNa=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/QtdlQb9xtFfz9WmUht9jFxXUNSwhblNwycSVQJtl6YNMSpopE3f6TtaMwsuHFtohD6FOgG-kHpE_lr9SY-xEQA=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/07kEkd5DRLDcqnL7UpWIWdMGuSm-J0cFohqH91rm92zVFsEwvuF-0meBm0r7-fg2c8wJkpwqtF1uj3EnvzDw=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/NPv4LkHGF7QpT2uvQ2W3rUJ2wzQeAhvMjoVinTikf5UVCMJfur4Saq1FnMxMU5b5-QwuHMGeO1z3U47KGohZ6w=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/RUjUEERlOscZ8_jykdcnEl1005JKiauwhF74hQfIUsGYwdjuJ3cC6_rF8hIsxKIeICMddyALTGy5tU_bHBzwEw=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/PR1mJynxuVcSkaRRXD0iCpZZBZvVVdIiNEGjz27X2XZgj36suLIbmuVOJU6XWbsT1AUOwUv3ZVb60hp3DWLLlmA=w1200-h800-rw"
    ]
  },
  {
    "title": "AllOut Enterprise",
    "slug": "allout",
    "category": "Business / Commercial Services",
    "shortDesc": "Enterprise mobile application developed to provide business customers with a seamless portal for commercial operations.",
    "description": "A business-focused mobile application developed to provide customers with a convenient digital platform for accessing commercial services.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.customer.allout",
    "services": [
      "Android App Development",
      "UI/UX Implementation",
      "API Integration",
      "Business Features",
      "Play Store Deployment"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Database",
      "Mobile UI"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/PdUza8C7NlMJVD9l19fiUFD-2L5A9Qzgpj5PCtRlSu9d3cHqekeyA6uRwtqQtA6-ISovnbYAJpDIFS-EJa_85Q=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/6RdlBeqb129_TWweMNHVyXIR3kp0p05eK8tn62jnlh37mXEGaP5Z0FYfpCCK76I5aErunz4DU6S0f68v_Q2vjOQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/vVu34iBBOebfmgLt-zs-wgJ1wsNug0vTwIXJmub6rpkDlLvV2ktd17mzRjUGca6rJi0wN5aHuub2-xBEAoojg9Q=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/jiX1egmY_JI0Y0EqiVcHF3tvj1b0gNVDIeis0ZilSow4QPkqhcZsgjI9P7tKYC3EpBLG4HlRLAy6lneN82jXeQ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/o9t-u4QThzAUDKYZsukhPo-_XMtYDe6aDiXydniFSdqgnIeSpCgZ24mjJyrQZIoF5S8KWknMj-onYasDl5gK5Pc=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/rcqixLIcW7haqUOxykOF_NhAWq920F5PGfL4_hv_PFItoNWbowM7E0nJJS2xLCmoyV4kYJtdNZ9n3_inIySl5Rk=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/un9wa4Cn0IXYrBO65rzqQO7-qHJKVciEshP0yYijqiy_tDg4SZMMbnyqno2xsYbFvkOJIkvhoJDz1eWReQ19oA=w1200-h800-rw"
    ]
  },
  {
    "title": "Namasthe Daily",
    "slug": "namasthe-daily",
    "category": "News & Media Publishing",
    "shortDesc": "Digital news mobile application providing readers with instant localized daily headlines and breaking news alerts.",
    "description": "Namasthe Daily is a digital news application developed to provide users with an accessible mobile platform for discovering and consuming news content.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.namasethedaily.news",
    "services": [
      "Android App Development",
      "News Content Integration",
      "Push Notifications",
      "UI/UX Development",
      "Play Store Deployment"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Push Notifications",
      "Database"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/7qeFAzIUf0kyQtTioM891FW1mw7HqtiYOVcUvjhfN4FspgVdIKH6nalovXJBQrWmBgW5PFLYNzekH77qsANVZg=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/fs1WCiz5krbMXEzWqhpOcEE3FKRCNU84l2SrKVnnFawWbnCNLKGwrbqziDx7uDcY1T5dJdudcUlkZFmB9WWoVg=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/9rHp3zKxXqWAH9EKivvrMpo0e0OKWA6I47oMioLUliX6FvtRTmrWM9FN_iNDc2fAdxP89CRHAF1byqsV2ltJ=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/3EX9iyztCQKC78qmo3IMsLLYEbN5lIax_2kmgKBws9DHUmFYjPVsIChAFFozo_j6zR-1xBcG1iUwjDdI9Vd9VA=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/RAAVKitLhmdsmU5Dvj1yq_swgmpDLr2fHlVsLhxXA-EHm7TE8j212BBl6aYOZkvr0I763XDTrHf3E9Ewu7qfrg=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/tt_VtyBmZ-jniUM9Q4G5CVvgWi6gIBb6zE3AfvD_Ch8IinZWlcLSIHwHSM3DxvzjL0CXj-mPiEvQuymjZqms0Q=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/SzNxqmqPqFJzgjmvLZMj_AOPXbtBvD4x_QebeunCBoU3s3LelFtEuE7-RlKVCwPHY1L3xaXFyq3G3yJFf848Pw=w1200-h800-rw"
    ]
  },
  {
    "title": "JobsChoose Platform",
    "slug": "jobschoose",
    "category": "Jobs & Career Recruitment",
    "shortDesc": "Recruitment and career exploration mobile application connecting job aspirants with companies and active openings.",
    "description": "JobsChoose is a recruitment-focused mobile application developed to provide users with a convenient digital platform for discovering and accessing job opportunities.",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.jobschoose.customer",
    "services": [
      "Android App Development",
      "Job Listing Integration",
      "Search & Discovery Features",
      "UI/UX Development",
      "Play Store Deployment"
    ],
    "technologies": [
      "Android",
      "API Integration",
      "Database",
      "Mobile UI"
    ],
    "featuredImage": "https://play-lh.googleusercontent.com/TkfH-02WTnAKj_NFB-IyLQDT0COkFjgWF3CNKDtgSiQckTRLF8ex5EBvcvAdDRF16PzS1ZXQg6x8ZbLS5m-wfCA=w1200-h800-rw",
    "screenshots": [
      "https://play-lh.googleusercontent.com/zHsgWvGVZYItJpMppCn455UDb44-EgliEAc6a_m0XjeKCU57SskKhJjt6DS0tjWht-CzFkTJpUDcLIGyrLl6BQ8=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/Se4wOiQkqT0FPJRmJAFJ7tgSGXEAFGHzUKyaZf2L-uFy2zmOOcuAuHlZvtdAQ-67raCzBo8zz22xbTP5_zJHZw=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/SU-Vxy5maVtq1BT7jtCkb3W1JPMoVynpmOMRrFPIvhfBUXmeY9PtH87S92gJjGNawWpSXzZRf3UkAOIEI7h8=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/5yCbqeMZmRwQjF1vhVZbpCB3r_uoQ7bRk0iOBs2POPI6QJmo5WRhoZdEeJ1JunQ_Kmz-3V22FqNnK5AcqBkakg0=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/XeGSK-qRFaZq5SY4XnPi-ytsx5TknUOhhmf1iGDQvuZOZy6mLnYhMs-OM3wnKb-S6jsJo31zsi4AWlnMPNM0EuU=w1200-h800-rw",
      "https://play-lh.googleusercontent.com/NkPrXMRR5EoEswCD3xbKkO3G7HgAUrkQg-xQUU61Fx_HPDBE9mmHT0ypPdjXV5jwPdoTRCamgNASQY7TioPQRg=w1200-h800-rw"
    ]
  }
];

export default function MobileAppsShowcase() {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-violet-50/20 to-white border-b border-violet-100 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-100/40 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-purple-100/30 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-violet-600" />
            <span>Freelance Mobile App Portfolio</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Apps & Digital Products We&apos;ve Built
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Real-world mobile applications engineered for businesses and startups with authentic Google Play Store screenshots.
          </p>
        </div>

        {/* 9 APPS SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mobileAppsData.map((app, idx) => (
            <div
              key={idx}
              className="group rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden p-6 space-y-4 shadow-sm"
            >
              <div>
                {/* APP ICON & TOP METADATA ROW */}
                <div className="flex items-start justify-between gap-4 pb-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-violet-200 bg-violet-50 p-1.5 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <Image
                        src={app.featuredImage}
                        alt={app.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-[10px] font-bold text-violet-700 uppercase tracking-wider text-right">
                      {app.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold tracking-wide inline-flex items-center gap-1">
                      Google Play Live
                    </span>
                  </div>
                </div>

                {/* APP TITLE & DESCRIPTION */}
                <div className="space-y-2 mt-2">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors leading-snug">
                    {app.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {app.shortDesc}
                  </p>
                </div>

                {/* REAL PLAY STORE SCREENSHOT PREVIEW */}
                {app.screenshots && app.screenshots.length > 0 && (
                  <div className="pt-3">
                    <Link href={`/work/${app.slug}`} className="block group/screen relative h-52 sm:h-56 w-full rounded-2xl overflow-hidden border border-violet-100 bg-slate-50 shadow-inner">
                      <Image
                        src={app.screenshots[0]}
                        alt={`${app.title} Real Play Store Screenshot`}
                        fill
                        className="object-cover object-top group-hover/screen:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold">
                        <span className="px-2.5 py-1 rounded-md bg-white/95 border border-violet-200 text-emerald-700 backdrop-blur-sm shadow-md">
                          Play Store UI
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-white/95 border border-violet-200 text-slate-700 backdrop-blur-sm shadow-md">
                          {app.screenshots.length} Screenshots →
                        </span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* SERVICES DELIVERED TAGS */}
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {app.services.slice(0, 3).map((service, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md bg-violet-50/70 border border-violet-100 text-[10px] text-slate-600 font-medium"
                    >
                      {service}
                    </span>
                  ))}
                  {app.services.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-semibold">
                      +{app.services.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* CARD FOOTER ACTIONS */}
              <div className="pt-4 border-t border-violet-100 flex items-center justify-between mt-4">
                <Link
                  href={`/work/${app.slug}`}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1"
                >
                  <span>Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <a
                  href={app.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all hover:scale-105"
                  title="View on Google Play Store"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Play</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* PORTFOLIO SECTION CTA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border border-violet-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Mobile Product Engineering</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Have an App Idea?
            </h3>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              We turn business ideas into functional, scalable mobile applications. Whether you need an on-demand delivery app, booking platform, e-commerce application, educational platform, or a completely bespoke custom product — TechInPedia engineers it to perfection.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full lg:w-auto">
            <Link
              href="/start-project"
              className="px-7 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-105 text-center flex items-center justify-center gap-2"
            >
              <span>Start Your Project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/work"
              className="px-7 py-4 rounded-xl bg-white border border-violet-200 hover:border-violet-300 text-slate-800 font-bold text-sm transition-all hover:bg-violet-50/70 text-center shadow-sm"
            >
              View More Projects
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
