const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const realNewsData = [
  {
    cat: 'Software',
    title: 'React 19 Introduces Groundbreaking Concurrency Features',
    content: `<p>The React core team has officially unveiled React 19, bringing a slew of concurrency features that fundamentally change how developers manage state and rendering. With the introduction of built-in transitions and asynchronous rendering patterns, applications can now remain highly responsive even during heavy data processing.</p><p>A major highlight is the stabilization of Server Components, allowing developers to ship zero-javascript server-rendered components out of the box. This drastically reduces bundle sizes and improves SEO metrics for large-scale web applications.</p><h3>Why it matters</h3><ul><li>Improved core web vitals for end users.</li><li>Simpler data-fetching paradigms.</li><li>Native support for asynchronous components.</li></ul><p>Developers are encouraged to start migrating using the newly provided codemod tools to ensure a smooth transition from React 18.</p>`
  },
  {
    cat: 'Hardware',
    title: 'Nvidia RTX 5090 Leaked Specifications Point to Massive Performance Leap',
    content: `<p>Recent supply chain leaks have revealed the alleged specifications for Nvidia's upcoming flagship consumer GPU, the RTX 5090. Based on the new Blackwell architecture, the card is rumored to feature over 24,000 CUDA cores and 32GB of cutting-edge GDDR7 memory.</p><p>If the leaks hold true, the RTX 5090 could offer a 60% to 70% rasterization performance uplift over the current RTX 4090, with even larger gains in path-traced rendering and AI workloads. This would cement Nvidia's dominance in both the enthusiast gaming sector and the prosumer AI development space.</p><h3>Key Takeaways</h3><ul><li>Expected late Q4 release.</li><li>Significant increase in power consumption (TBP ~500W).</li><li>First consumer GPU to utilize GDDR7 memory standards.</li></ul>`
  },
  {
    cat: 'Stock Market',
    title: 'S&P 500 Reaches Historic Highs Driven by AI Sector Growth',
    content: `<p>The S&P 500 index has shattered previous records, closing at an all-time high this week. The rally is primarily being fueled by the "Magnificent Seven" tech stocks, with companies heavily invested in Artificial Intelligence seeing the most significant gains.</p><p>Market analysts point to surging demand for semiconductor chips, cloud computing infrastructure, and generative AI enterprise software as the core catalysts. Despite ongoing concerns regarding inflation and interest rates, investor confidence in tech-driven productivity growth remains overwhelmingly positive.</p><p>Experts caution that while the bullish trend is strong, market corrections are inevitable, urging retail investors to maintain diversified portfolios.</p>`
  },
  {
    cat: 'Global News',
    title: 'European Union Passes Landmark Comprehensive AI Act',
    content: `<p>The European Parliament has officially passed the AI Act, establishing the world's first comprehensive legal framework for artificial intelligence. The legislation categorizes AI systems based on risk, outright banning applications deemed to have an "unacceptable risk," such as social scoring systems and specific types of biometric categorization.</p><p>High-risk AI systems, including those used in critical infrastructure, law enforcement, and employment, will face strict compliance and transparency requirements before they can be deployed in the EU market. Foundation models and generative AI (like ChatGPT) must also adhere to transparency guidelines and copyright laws.</p><p>This landmark act is expected to set a global standard for AI regulation, much like the GDPR did for data privacy.</p>`
  },
  {
    cat: 'Study',
    title: 'Top 5 Tech Skills Employers Are Looking For in 2024',
    content: `<p>As the tech landscape rapidly evolves, the skills required to secure top-tier engineering and IT roles are shifting. According to a recent industry survey spanning over 500 tech companies, employers are prioritizing specialized knowledge over general programming abilities.</p><p>The top skills in demand include:</p><ol><li><strong>Generative AI & Prompt Engineering:</strong> Integrating LLMs into business applications.</li><li><strong>Cloud Architecture (AWS/Azure):</strong> Designing resilient and scalable cloud-native systems.</li><li><strong>Cybersecurity:</strong> Zero-trust architecture and threat mitigation.</li><li><strong>Data Engineering:</strong> Building robust ETL pipelines and managing big data infrastructure.</li><li><strong>DevOps & MLOps:</strong> Automating deployment pipelines for both software and machine learning models.</li></ol><p>Professionals looking to upskill are advised to focus on practical, project-based learning to demonstrate competence in these critical areas.</p>`
  }
];

// Replicate these realistic articles to hit 50 count with slight variations to avoid completely duplicate identical strings
let extendedNews = [];
const categoriesMap = {
    'Software': realNewsData[0],
    'Hardware': realNewsData[1],
    'Stock Market': realNewsData[2],
    'Global News': realNewsData[3],
    'Study': realNewsData[4],
};

const allCats = ['Software', 'Study', 'Stock Market', 'Global News', 'Hardware'];
let count = 0;

for (let i = 0; i < 50; i++) {
    const cat = allCats[i % 5];
    const baseArticle = categoriesMap[cat];
    const version = Math.floor(i / 5) + 1;
    
    let title = baseArticle.title;
    if (version > 1) {
        title = `${baseArticle.title.split(' ')[0]} Update ${version}: ${baseArticle.title.substring(baseArticle.title.indexOf(' ') + 1)}`;
    }

    extendedNews.push({
        cat: cat,
        title: title,
        content: baseArticle.content + `<p><em>This is an extended report covering the latest developments in ${cat.toLowerCase()} industry metrics. Stay tuned for further updates in our next quarter review. (Update ID: ${Math.random().toString(36).substring(7)})</em></p>`
    });
}

async function seed() {
    console.log("Deleting old demo news...");
    await prisma.newsPost.deleteMany({});
    
    console.log("Seeding Real News Posts...");
    for (let i = 0; i < extendedNews.length; i++) {
        const item = extendedNews[i];
        
        let slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        slug = slug.substring(0, 50) + '-' + Math.floor(1000 + Math.random() * 9000);
        
        try {
            await prisma.newsPost.create({
                data: {
                    title: item.title,
                    slug: slug,
                    excerpt: `Comprehensive coverage on ${item.title}. Read the full article for in-depth analysis and industry insights.`,
                    content: item.content,
                    category: item.cat,
                    status: 'PUBLISHED',
                    publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
                    author: 'TechInPedia Editorial',
                    seoTitle: `${item.title.substring(0, 50)} | TechInPedia`,
                    seoDescription: `Latest updates and detailed analysis on ${item.title.substring(0, 100)}.`
                }
            });
            console.log(`Created: ${item.title}`);
        } catch(e) {
            console.log(`Failed to create: ${item.title}`, e.message);
        }
    }
    console.log("Seeding complete.");
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
