const { PrismaClient, ContentStatus } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = ['Software', 'Study', 'Stock Market', 'Global News', 'Hardware'];

const sampleNews = [
    { cat: 'Software', title: 'Next.js 14 Introduces Turbopack as Default Compiler' },
    { cat: 'Software', title: 'React 19 Hooks Rethink State Management' },
    { cat: 'Software', title: 'AI Code Assistants Reshaping Developer Productivity' },
    { cat: 'Software', title: 'Rust Becomes Top Choice for Systems Programming' },
    { cat: 'Software', title: 'Python 3.13 Dropping the GIL' },
    { cat: 'Software', title: 'Vue 3 Ecosystem Continues Rapid Expansion' },
    { cat: 'Software', title: 'WebAssembly Opens New Doors for Web Apps' },
    { cat: 'Software', title: 'The Rise of Serverless Databases in 2024' },
    { cat: 'Software', title: 'GraphQL vs REST: The Endless Debate' },
    { cat: 'Software', title: 'Why Go is the Language of Choice for Cloud Native' },

    { cat: 'Hardware', title: 'Nvidia RTX 5090 Leaked Specifications Shock the Industry' },
    { cat: 'Hardware', title: 'Apple M4 Ultra Chip Promises Desktop Grade Performance' },
    { cat: 'Hardware', title: 'AMD Ryzen 9000 Series Dominates Multi-Core Benchmarks' },
    { cat: 'Hardware', title: 'Intel Lunar Lake Aims to Take Back Mobile Crown' },
    { cat: 'Hardware', title: 'The Evolution of DDR5 RAM and What it Means for Gamers' },
    { cat: 'Hardware', title: 'Solid State Batteries: The Future of Laptops?' },
    { cat: 'Hardware', title: 'Quantum Computing Hardware Breakthrough at IBM' },
    { cat: 'Hardware', title: 'TSMC Begins 2nm Chip Production' },
    { cat: 'Hardware', title: 'How ARM Processors Are Taking Over Data Centers' },
    { cat: 'Hardware', title: 'The Rise of NPU (Neural Processing Units) in Modern PCs' },

    { cat: 'Stock Market', title: 'S&P 500 Hits All-Time High Driven by Tech Rally' },
    { cat: 'Stock Market', title: 'Nvidia Becomes Most Valuable Company Globally' },
    { cat: 'Stock Market', title: 'Indian Stock Market Surpasses Hong Kong in Value' },
    { cat: 'Stock Market', title: 'Cryptocurrency Markets Rally Ahead of Bitcoin Halving' },
    { cat: 'Stock Market', title: 'Fed Interest Rate Cuts Unlikely Before Q3' },
    { cat: 'Stock Market', title: 'EV Stocks Tumble as Demand Cools Down' },
    { cat: 'Stock Market', title: 'IPO Market Heating Up with Tech Unicorns' },
    { cat: 'Stock Market', title: 'Gold Prices Surge Amid Global Uncertainty' },
    { cat: 'Stock Market', title: 'AI Startups Are the New Darlings of Wall Street' },
    { cat: 'Stock Market', title: 'Real Estate Investment Trusts (REITs) Making a Comeback' },

    { cat: 'Global News', title: 'Global Tech Summit Addresses AI Regulation' },
    { cat: 'Global News', title: 'European Union Passes Comprehensive AI Act' },
    { cat: 'Global News', title: 'India Unveils New Semiconductor Manufacturing Hub' },
    { cat: 'Global News', title: 'SpaceX Successfully Lands Starship' },
    { cat: 'Global News', title: 'Renewable Energy Overtakes Fossil Fuels in EU' },
    { cat: 'Global News', title: 'Major Cybersecurity Breach Affects Millions Globally' },
    { cat: 'Global News', title: 'Tech Giants Pledge to Combat Deepfakes in Elections' },
    { cat: 'Global News', title: 'The Global Microchip Shortage is Finally Over' },
    { cat: 'Global News', title: 'International Space Station to be Deorbited by 2030' },
    { cat: 'Global News', title: 'Japan Lands Precision Rover on the Moon' },

    { cat: 'Study', title: 'Top 10 High-Paying Tech Skills to Learn in 2024' },
    { cat: 'Study', title: 'How to Build a Career in Data Science' },
    { cat: 'Study', title: 'The Ultimate Guide to Passing the AWS Solutions Architect Exam' },
    { cat: 'Study', title: 'Why Prompt Engineering is the Job of the Future' },
    { cat: 'Study', title: 'Harvard Offers Free CS50 Introduction to AI with Python' },
    { cat: 'Study', title: 'Mastering System Design Interviews: Tips and Tricks' },
    { cat: 'Study', title: 'Best Open Source Projects for Beginners to Contribute To' },
    { cat: 'Study', title: 'How to Balance Full-Time Job and Upskilling' },
    { cat: 'Study', title: 'Bootcamps vs Computer Science Degrees: What Employers Want' },
    { cat: 'Study', title: 'Understanding Algorithms: A Visual Guide for Beginners' }
];

async function seed() {
    console.log("Seeding News Posts...");
    for (let i = 0; i < sampleNews.length; i++) {
        const item = sampleNews[i];
        
        // create slug from title and truncate to max 64 chars total
        let slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        // We append a random 4 digit number, so base slug can be at most 59 chars
        slug = slug.substring(0, 58) + '-' + Math.floor(1000 + Math.random() * 9000);
        
        const contentHtml = `
            <h2>${item.title}</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.</p>
            <h3>Key Highlights</h3>
            <ul>
                <li>Innovation and continuous improvement.</li>
                <li>Impact on the global ecosystem.</li>
                <li>Future prospects and challenges.</li>
            </ul>
            <p>Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit odio. Proin quis tortor orci. Etiam at risus et justo dignissim congue. Donec congue lacinia dui, a porttitor lectus condimentum laoreet.</p>
        `;

        try {
            await prisma.newsPost.create({
                data: {
                    title: item.title,
                    slug: slug,
                    excerpt: `A brief overview of the latest news regarding ${item.title}. Read more to find out the implications and detailed analysis.`,
                    content: contentHtml,
                    category: item.cat,
                    status: 'PUBLISHED',
                    publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random date in past
                    author: 'TechInPedia Editorial',
                    seoTitle: `${item.title.substring(0, 50)} | TechInPedia`,
                    seoDescription: `Get the latest updates and detailed analysis on ${item.title.substring(0, 100)}.`
                }
            });
            console.log(`Created: ${item.title}`);
        } catch(e) {
            console.log(`Skipped (maybe already exists): ${item.title}`);
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
