import json

areas = [
    # Delhi South & Central
    "Connaught Place", "Nehru Place", "Karol Bagh", "Okhla", "Vasant Kunj", "Saket", "Hauz Khas", "Malviya Nagar", 
    "Lajpat Nagar", "South Extension", "Greater Kailash", "Defence Colony", "Green Park", "Chittaranjan Park", "Alaknanda",
    "Mehrauli", "Chhatarpur", "Vasant Vihar", "RK Puram", "Moti Bagh", "Dhaula Kuan", "Sarita Vihar", "Jasola", "Kalkaji", "Govindpuri",
    # Delhi West & North
    "Janakpuri", "Rohini", "Pitampura", "Punjabi Bagh", "Rajouri Garden", "Tilak Nagar", "Uttam Nagar", "Paschim Vihar",
    "Shalimar Bagh", "Ashok Vihar", "Kamla Nagar", "Model Town", "Civil Lines", "Mukherjee Nagar", "GTB Nagar", "Timarpur",
    "Kashmiri Gate", "Chandni Chowk", "Daryaganj", "Paharganj", "Rajendra Place", "Patel Nagar", "Kirti Nagar", "Moti Nagar",
    "Ramesh Nagar", "Subhash Nagar", "Hari Nagar",
    # Delhi East
    "Laxmi Nagar", "Mayur Vihar", "Shahdara", "Preet Vihar", "Anand Vihar", "Patparganj", "Vivek Vihar", "Dilshad Garden",
    "Geeta Colony", "Krishna Nagar", "Gandhi Nagar", "Seelampur", "Yamuna Vihar",
    # Delhi Outskirts/Other
    "Delhi Cantt", "Mahipalpur", "Kapashera", "Najafgarh", "Narela", "Bawana", "Badli", "Jahangirpuri", "Adarsh Nagar",
    "Palam", "Mahavir Enclave", "Sagarpur", "Manglapuri", "Bindapur", "Sitapuri", "Dabri", "Vikaspuri", "Mohan Garden",
    "Nawada", "Kakrola", "Matiala", "Goyla Dairy", "Shyam Vihar", "Mundka", "Tikri Kalan", "Nangloi",
    # Noida
    "Noida Sector 1", "Noida Sector 2", "Noida Sector 3", "Noida Sector 4", "Noida Sector 5", "Noida Sector 10",
    "Noida Sector 15", "Noida Sector 16", "Noida Sector 18", "Atta Market Noida", "Noida Sector 62", "Noida Sector 63",
    "Noida Sector 135", "Noida Sector 142", "Noida Expressway", "Greater Noida", "Knowledge Park Greater Noida",
    "Alpha Greater Noida", "Beta Greater Noida", "Gamma Greater Noida", "Delta Greater Noida", "Omega Greater Noida", 
    "Noida Extension", "Gaur City Noida",
    # Gurgaon
    "Cyber City Gurgaon", "Udyog Vihar Gurgaon", "DLF Phase 1", "DLF Phase 2", "DLF Phase 3", "DLF Phase 4", "DLF Phase 5",
    "Golf Course Road Gurgaon", "Sohna Road", "MG Road Gurgaon", "Sushant Lok", "Palam Vihar", "Gurgaon Sector 14",
    "Gurgaon Sector 15", "Gurgaon Sector 29", "Gurgaon Sector 39", "Gurgaon Sector 44", "Gurgaon Sector 45", "Gurgaon Sector 50",
    "Manesar", "IMT Manesar", "South City Gurgaon", "Nirvana Country",
    # Ghaziabad
    "Indirapuram", "Vaishali", "Vasundhara", "Kaushambi", "Raj Nagar Extension", "Crossing Republik", "Mohan Nagar", 
    "Sahibabad", "Surya Nagar", "Brij Vihar", "Kavi Nagar", "Sanjay Nagar", "Govindpuram",
    # Faridabad
    "NIT Faridabad", "Faridabad Sector 15", "Faridabad Sector 16", "Faridabad Sector 21", "Green Field Colony", 
    "Surajkund", "Ballabgarh", "Spring Field Colony", "Ashoka Enclave"
]

# Add pincodes
delhi_pincodes = [f"1100{str(i).zfill(2)}" for i in range(1, 97)] # 110001 to 110096
noida_pincodes = ["201301", "201303", "201304", "201307", "201309", "201310"]
gurgaon_pincodes = ["122001", "122002", "122003", "122008", "122011", "122018", "122050"]
ghaziabad_pincodes = ["201001", "201002", "201005", "201009", "201010", "201014"]
faridabad_pincodes = ["121001", "121002", "121003", "121004", "121006"]

all_locations = areas + delhi_pincodes + noida_pincodes + gurgaon_pincodes + ghaziabad_pincodes + faridabad_pincodes

keywords = []
for loc in all_locations:
    keywords.append(f"Laptop on rent in {loc}")
    keywords.append(f"Computer on rent in {loc}")
    keywords.append(f"Desktop on rent in {loc}")
    keywords.append(f"MacBook on rent in {loc}")
    keywords.append(f"IT rental in {loc}")

with open("/Users/adityaverma/Downloads/techinpedia/src/components/LocalSeoLinks.tsx", "w") as f:
    f.write(f'''import React from 'react';
import Link from 'next/link';

export default function LocalSeoLinks() {{
  const keywords = {json.dumps(keywords)};
  
  return (
    <section className="py-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <details className="group cursor-pointer">
          <summary className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 list-none flex items-center justify-between hover:text-violet-600 transition-colors">
            <span>Explore All Our Service Locations in Delhi NCR (1000+ Areas & Pincodes)</span>
            <span className="text-violet-600 group-open:rotate-180 transition-transform duration-300">▼</span>
          </summary>
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-96 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-transparent">
            {{keywords.map((kw, idx) => {{
              const isLaptop = kw.toLowerCase().includes('laptop') || kw.toLowerCase().includes('macbook');
              const url = isLaptop ? '/services/laptop-rental' : '/services/computer-rental';
              return (
                <Link 
                  key={{idx}} 
                  href={{url}} 
                  className="text-[11px] text-slate-400 hover:text-violet-600 truncate transition-colors"
                  title={{kw}}
                >
                  {{kw}}
                </Link>
              );
            }})}}
          </div>
        </details>
      </div>
    </section>
  );
}}
''')
