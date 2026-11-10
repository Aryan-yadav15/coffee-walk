// What the retro TV shows for each stall. Written from each repo's README, docs and dependencies.
// Edit freely: anything here is only ever shown inside the TV.

export type Project = {
  id: string
  title: string
  tagline: string
  /** Small caps line above the title, e.g. where or when it was built. */
  context: string
  about: string
  how: string[]
  stack: string[]
  highlights?: string[]
  links?: { label: string; href: string }[]
  /** Shown when there is no public link to give. */
  note?: string
}

const GH = 'https://github.com/Aryan-yadav15/'

export const PROJECTS: Project[] = [
  {
    id: 'about',
    title: 'Aryan Yadav',
    tagline: 'Full-stack developer, designer, founder. Mostly caffeinated.',
    context: 'the person carrying your coffee',
    about:
      "I build products end to end: the design, the frontend, the backend, the app, and lately the 3D. I started in 2022 wanting one UI component to look right and never really stopped. I'm doing my B.Tech at KIIT, I run KhaoGully, and I like the spot where design and engineering meet: things that look good and are built well under the hood.",
    how: [
      'Design first: Figma, Illustrator, Webflow, and a strong opinion about 4px.',
      'Then the stack: React and Next.js up front, FastAPI and Node behind, Postgres and Supabase underneath.',
      'Mobile with React Native, Kotlin and Jetpack Compose.',
      'AI: retrieval, embeddings, agents, LangChain, Gemini.',
      '3D: Three.js, Blender, Gaussian splatting.',
    ],
    stack: ['TypeScript', 'React', 'Next.js', 'FastAPI', 'Node.js', 'PostgreSQL', 'Supabase', 'React Native', 'Kotlin', 'LangChain', 'Three.js', 'Figma'],
    highlights: ['Founder, KhaoGully', '1st place, Deloitte hackathon', 'Deloitte internship'],
    links: [
      { label: 'GitHub', href: GH.slice(0, -1) },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aryanyadav-dev/' },
      { label: 'Email', href: 'mailto:aryanyadav.devop@gmail.com' },
    ],
  },
  {
    id: 'design',
    title: 'Design first',
    tagline: 'Before the code, there was the poster.',
    context: 'Konnexions · BitsToBugs · 2022 onwards',
    about:
      "I came into engineering through design. I led the graphic design department at Konnexions, KIIT's tech society, and started at BitsToBugs as a UI/UX designer, building interactive web apps in Webflow and Figma. It's why everything I ship still gets a design pass.",
    how: [
      'Posters, brand work and event visuals for a tech society.',
      'UI for embeddable web-player widgets with in-browser sign-in and full song playback.',
      'Design systems that later became the components I build in code.',
    ],
    stack: ['Figma', 'Illustrator', 'Photoshop', 'Webflow', 'Framer', 'Lottie'],
  },
  {
    id: 'campusbuzz',
    title: 'CampusBuzz',
    tagline: 'Every KIIT event, one place.',
    context: 'campus · 2024',
    about:
      'Campus events lived in WhatsApp forwards and posters. CampusBuzz puts them in one app: organisers create events with a poster, category, date and venue, and students browse, enrol and keep track of what they signed up for.',
    how: [
      'Sign-in with Clerk; a Svix-verified webhook mirrors each user into MongoDB.',
      'Organisers create and edit events with react-hook-form and Zod validation.',
      'Posters upload through UploadThing.',
      'Students filter by category, enrol, and see their events on their profile.',
    ],
    stack: ['Next.js 14', 'TypeScript', 'Clerk', 'MongoDB', 'Mongoose', 'UploadThing', 'Zod', 'shadcn/ui', 'Tailwind'],
    links: [
      { label: 'Live site', href: 'https://campus-buzz.vercel.app' },
      { label: 'Code', href: GH + 'CampusBuzz' },
    ],
  },
  {
    id: 'bitstobugs',
    title: 'BitsToBugs',
    tagline: 'Joined as the designer, stayed as the full-stack dev.',
    context: 'first real gig · 2022 onwards',
    about:
      'My first team. I started on UI/UX, then moved to building, styling and deploying websites, design systems, mobile apps and internal tools, working closely with the rest of engineering. I have also built for an advertising agency, a startup, and myself.',
    how: [
      'UI/UX: interactive web apps in Webflow and Figma.',
      'Full stack: production sites and apps in React, Next.js, Framer and Express.',
      'Internal tools for the engineering team.',
    ],
    stack: ['React', 'Next.js', 'Express', 'Framer', 'Webflow', 'Figma'],
    highlights: ['"Incredibly punctual, exceptional work ethics" (Lakshit Verma)'],
  },
  {
    id: 'mailmesh',
    title: 'MailMesh',
    tagline: 'Email order processing, wired up on a canvas.',
    context: 'Deloitte hackathon · 1st place · 2025',
    about:
      'Businesses still take orders over email, and someone copies them out by hand. MailMesh lets you build the processing flow visually: drop email and product nodes on a canvas, configure each one, connect them, and the orders get picked up and tracked. It won the Deloitte hackathon, and the win turned into my Deloitte internship.',
    how: [
      'A node canvas built on React Flow, with a sidebar of node types to drag in.',
      'Email nodes and product nodes each open their own configuration modal.',
      'Edges define how an incoming order email moves through the flow.',
      'Canvas state lives in a Zustand store.',
    ],
    stack: ['Next.js', 'React Flow', 'Zustand', 'Tailwind', 'Radix UI'],
    highlights: ['🏆 1st place', '🎟️ Led to a Deloitte internship'],
    links: [
      { label: 'Live demo', href: 'https://mail-mesh-delloite-hackathon.vercel.app' },
      { label: 'Code', href: GH + 'MailMesh-Delloite-Hackathon' },
    ],
  },
  {
    id: 'hackathons',
    title: 'Hackathon season',
    tagline: 'No sleep, questionable snacks, unlimited confidence.',
    context: 'Deloitte · Walmart · Woodpecker',
    about:
      "Hackathons are where I learned to ship in a weekend. MailMesh won Deloitte's. StockSmart came out of Woodpecker, and I built a storefront for Walmart's. Not every demo survived judging, but every one taught me something.",
    how: ['Deloitte: MailMesh, 1st place.', 'Woodpecker: StockSmart, AI inventory with stock prediction.', 'Walmart: a Next.js storefront.'],
    stack: ['Next.js', 'Gemini', 'Drizzle', 'Neon', 'React Flow'],
    links: [
      { label: 'MailMesh', href: GH + 'MailMesh-Delloite-Hackathon' },
      { label: 'StockSmart', href: GH + 'WoodpeckerStockSmart' },
      { label: 'Walmart build', href: GH + 'WalmartHackathon' },
    ],
  },
  {
    id: 'stocksmart',
    title: 'StockSmart',
    tagline: 'Inventory that tells you what to restock.',
    context: 'Woodpecker hackathon · 2024',
    about:
      'An inventory dashboard for small businesses: track products and budget, then let it predict what is about to run out. Built at the Woodpecker hackathon.',
    how: [
      'Sign-in with Clerk; products and budgets live in Neon serverless Postgres through Drizzle ORM.',
      'A product scraper pulls listing details with Cheerio.',
      'Gemini helps with product insights.',
      'A Python script models stock levels to predict restocks.',
    ],
    stack: ['Next.js', 'Clerk', 'Neon Postgres', 'Drizzle ORM', 'Gemini', 'Cheerio', 'Python'],
    links: [
      { label: 'Live demo', href: 'https://stock-smart-rho.vercel.app' },
      { label: 'Code', href: GH + 'WoodpeckerStockSmart' },
    ],
  },
  {
    id: 'walmart',
    title: 'Walmart storefront',
    tagline: 'A product-browsing storefront, in a weekend.',
    context: 'Walmart hackathon · 2024',
    about: 'A Next.js storefront with a hero, product cards and a product page per item, built during the Walmart hackathon.',
    how: ['Product data in a local module.', 'Dynamic product routes render each item.', 'Card grid and hero section with Tailwind.'],
    stack: ['Next.js', 'React', 'Tailwind', 'Lucide'],
    links: [{ label: 'Code', href: GH + 'WalmartHackathon' }],
  },
  {
    id: 'khaogully',
    title: 'KhaoGully',
    tagline: 'Campus food delivery, pooled.',
    context: 'my startup · live',
    about:
      'Delivery fees kill small campus orders. KhaoGully pools them: everyone on a campus ordering in the same time window, from any of the participating restaurants, gets delivered together to one hotspot, so the delivery cost is shared. It is live, with real restaurants, real riders and 5,000+ installs across platforms.',
    how: [
      'A pool opens for a campus with a collection window, a delivery slot and a hotspot.',
      'Customers order from any participating restaurant and join the pool.',
      'When the pool closes, each restaurant gets its combined order on its dashboard, by push notification and WhatsApp.',
      'Riders pick up and deliver together, GPS-tracked.',
      'Every order is split into subtotal, delivery fee and platform fee, so the economics stay visible.',
    ],
    stack: ['React', 'TypeScript', 'FastAPI', 'Supabase', 'PostgreSQL', 'React Native', 'Expo', 'Python'],
    highlights: ['5,000+ installs', '5 products in production', 'Real deliveries, every day'],
    links: [{ label: 'Open KhaoGully', href: 'https://khaoo-gully-customer-web.vercel.app' }],
  },
  {
    id: 'kg-customer',
    title: 'KhaoGully · Customer app',
    tagline: 'Hungry → ordered, in a few taps.',
    context: 'KhaoGully · 1 of 5',
    about:
      'Where an order starts. Students browse restaurants on their campus, build a cart, join the current pool and check out, with promotional banners and campus email restrictions keeping it local.',
    how: [
      'React frontend with React Router, talking to a FastAPI backend.',
      'Supabase (Postgres) for data, with row-level security policies.',
      'JWT auth with python-jose; passwords hashed with bcrypt.',
      'Pydantic models validate every request.',
    ],
    stack: ['React', 'TypeScript', 'FastAPI', 'Pydantic', 'Supabase', 'Tailwind'],
    links: [
      { label: 'Live app', href: 'https://khaoo-gully-customer-web.vercel.app' },
      { label: 'Code', href: GH + 'khaooGully-customer-web' },
    ],
  },
  {
    id: 'kg-restaurant',
    title: 'KhaoGully · Restaurant dashboard',
    tagline: 'One ping, one tap, pan on.',
    context: 'KhaoGully · 2 of 5',
    about:
      'Restaurant owners see their pooled orders the moment a pool closes, combined per restaurant or one by one, and accept or decline them. They also get earnings and transaction history, after an admin approves their account.',
    how: [
      'FastAPI backend with owner, admin and webhook routes.',
      'Cumulative and individual order views, a decline flow and order history.',
      'Push notifications and a WhatsApp webhook for new pooled orders.',
      'Amounts kept in paise with a full breakdown: subtotal, delivery fee, platform fee.',
    ],
    stack: ['React', 'TypeScript', 'Vite', 'FastAPI', 'Supabase', 'Push notifications', 'WhatsApp webhook'],
    links: [{ label: 'Code', href: GH + 'KhaoGully-restraunt-facing' }],
  },
  {
    id: 'kg-navigator',
    title: 'KhaoGully · Delivery navigator',
    tagline: "The rider's app: route, distance, earnings.",
    context: 'KhaoGully · 3 of 5',
    about:
      'A React Native app for riders. It tracks the delivery live, measures the distance actually travelled, and turns that into earnings per order.',
    how: [
      'Location sampled every 5 seconds, or every 10 m of movement, with Expo Location.',
      'Distance summed with the Haversine formula; jumps under 1 m or over 1 km are thrown out as GPS noise.',
      'Live driver location sent to the fleet API.',
      'On completion, earnings are submitted against the distance travelled.',
    ],
    stack: ['React Native', 'Expo', 'Expo Location', 'React Navigation', 'Axios'],
    links: [{ label: 'Code', href: GH + 'khaao-gully-navigator' }],
  },
  {
    id: 'kg-inventory',
    title: 'KhaoGully · Inventory',
    tagline: 'Nobody sells biryani they do not have.',
    context: 'KhaoGully · 4 of 5',
    about:
      'An admin dashboard for stock and sales. Every sale deducts stock automatically, overselling is blocked, and every movement is kept in an audit trail.',
    how: [
      'Products with SKU, stock, unit price and active status; restock and soft delete.',
      'Multi-product sales that deduct inventory automatically.',
      'Audit trail of every movement: sale, restock, correction, return.',
      'Charts of sales over 7, 14, 30 or 90 days, low-stock alerts, PDF export.',
    ],
    stack: ['Next.js 14', 'Supabase', 'PostgreSQL', 'Chart.js', 'jsPDF', 'Tailwind'],
    links: [{ label: 'Code', href: GH + 'inventory-management' }],
  },
  {
    id: 'kg-economics',
    title: 'KhaoGully · Economics',
    tagline: 'Does each order actually make money?',
    context: 'KhaoGully · 5 of 5',
    about:
      "A business economics dashboard for KhaoGully: what each pooled order brings in once the food, the rider and the platform's cut are accounted for.",
    how: ['A single, dependency-free page.', 'Built around the same subtotal / delivery fee / platform fee split the other apps record.'],
    stack: ['HTML', 'CSS', 'JavaScript'],
    links: [{ label: 'Code', href: GH + 'KhaoGully-economics-dashboard' }],
  },
  {
    id: 'engine',
    title: 'KhaoGully · Under the hood',
    tagline: 'The backend I designed and ran as CTO.',
    context: 'KhaoGully · engine room',
    about:
      'One FastAPI backend serves the customer app, the restaurant dashboard, the rider navigator, the admin console and a partner API, on Supabase Postgres. Campus orders are pooled so a whole hostel shares one delivery.',
    how: [
      'Thin routers over a services layer: pricing, payments, promos, pooling and instant dispatch, with Pydantic v2 models at every edge. 30+ route modules.',
      'A background scheduler closes or extends order pools every 60 seconds and notifies admins.',
      'Razorpay payments, plus a webhook that reconciles any checkout the app never confirmed.',
      "Money, wallet and promo changes run as single SQL statements under row locks, with idempotency keys so a retry can't charge twice.",
      'Delivery areas are H3 hexagon cells. Partners call in with hashed API keys and rate limits.',
      'Under load: blocking database calls moved off the event loop. 20 concurrent requests on one worker went from 12.3 s to 1.4 s.',
      'Separate dev and prod databases, dated migrations tracked in a ledger, and JWT verification against Supabase keys.',
    ],
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'Supabase', 'PostGIS', 'H3', 'Razorpay', 'Web Push', 'Gunicorn'],
    highlights: ['CTO & founder', '12.3 s → 1.4 s under load', 'one backend, five apps'],
    note: 'The backend is private, so there is no code link. Happy to walk through it on a call.',
  },
  {
    id: 'kg-incident',
    title: 'The ₹582 bug',
    tagline: 'Charged, but no order. Found, fixed, and made impossible.',
    context: 'KhaoGully · incident report',
    about:
      'A customer paid ₹582 for three biryanis. Razorpay captured the money, but no order was ever created, and large carts had been failing like this silently for weeks.',
    how: [
      'Big carts were auto-upgraded to instant delivery with a new fee label the database had never been told about, so the order insert broke a check constraint.',
      'Payment was taken before that write, so the customer was charged first.',
      'The webhook safety net fired, rebuilt the order, hit the same rule, and flagged the payment as "captured, no order" instead of losing it.',
      'The fix: the missing migration, a startup check that the database accepts every value the code can emit, and a regression test for it.',
      'Then the whole class of bug: checks that used to fail after payment now run before it, and every migration goes through a ledger so dev and prod stop drifting apart.',
    ],
    stack: ['PostgreSQL', 'FastAPI', 'Razorpay webhooks', 'pytest'],
    highlights: ['root-caused from one payment', 'schema contract checked on boot'],
  },
  {
    id: 'aws',
    title: 'AWS',
    tagline: 'Hands-on in the cloud.',
    context: 'the cloud',
    about: "I'm hands-on with AWS across the core building blocks: networking, compute, containers, storage, messaging and serverless.",
    how: [
      'Networking & access: VPC, IAM.',
      'Compute & containers: EC2, ECS, ECR.',
      'Storage & delivery: S3, CloudFront.',
      'Data & messaging: RDS, SQS.',
      'Serverless: Lambda.',
    ],
    stack: ['EC2', 'ECS', 'Lambda', 'S3', 'RDS', 'SQS', 'CloudFront', 'IAM', 'VPC'],
  },
  {
    id: 'docrag',
    title: 'DocRAG',
    tagline: 'Fresh docs for Copilot. Locally.',
    context: 'AI lab · VS Code extension',
    about:
      'AI coding assistants keep suggesting deprecated APIs because their training data is old. DocRAG crawls a library\'s current docs, embeds them on your own machine, and serves them to you and to Copilot, with no API key.',
    how: [
      'Finds pages from sitemap.xml, or crawls links up to 3 levels deep.',
      'Splits pages into chunks with Cheerio and embeds them locally with all-MiniLM-L6-v2.',
      'Stores chunks and vectors in a SQLite file (sql.js) in VS Code storage.',
      'Search fuses keyword and vector rankings with reciprocal rank fusion.',
      'Copilot chat can call it as the #docrag tool.',
    ],
    stack: ['TypeScript', 'VS Code API', 'Transformers.js', 'MiniLM-L6-v2', 'sql.js', 'Cheerio'],
    links: [{ label: 'Code', href: GH + 'DocAiAssist' }],
  },
  {
    id: 'formfiller',
    title: 'AI Form Filler',
    tagline: 'Laziness, engineered.',
    context: 'AI lab · Chrome extension',
    about:
      'You already told ChatGPT, Claude or Gemini everything about yourself. AI Form Filler captures that context and uses it to answer Google Forms for you, with a review step before anything is filled in.',
    how: [
      'A floating "Capture" button on ChatGPT, Claude and Gemini saves the conversation as context.',
      'On a Google Form, it extracts every question: text, choices, checkboxes, dropdowns, dates, times.',
      'Gemini 2.5 Flash proposes answers as structured JSON, validated with Zod.',
      'You review, then it fills the form with native browser events.',
    ],
    stack: ['TypeScript', 'React', 'Chrome MV3', 'Vite + CRXJS', 'Gemini 2.5 Flash', 'Zod', 'Tailwind'],
    links: [{ label: 'Code', href: GH + 'formfillerAi-Browser-extension' }],
  },
  {
    id: 'nlpsql',
    title: 'NLP → SQL',
    tagline: 'Ask in English. Get real SQL.',
    context: 'AI lab · agent',
    about:
      'A streaming LangChain agent that reads any PostgreSQL schema, writes the query, runs it and explains the result. Point it at a database from the settings panel and just ask.',
    how: [
      'A ReAct agent picks one of four tools: answer, draw the schema, check data quality, or answer from history.',
      'It reads the schema at runtime, so any Postgres database works.',
      'Every step streams to the UI over Server-Sent Events: generating SQL, executing, interpreting.',
      'A sidebar adds up the tokens each request used.',
    ],
    stack: ['Python', 'FastAPI', 'LangChain', 'Gemini', 'PostgreSQL', 'ChromaDB', 'Next.js', 'SSE'],
    links: [{ label: 'Code', href: GH + 'Database-NLP-Query' }],
  },
  {
    id: 'thrift',
    title: 'Thrift Track',
    tagline: 'Price drops, emailed to you.',
    context: 'more builds · 2024',
    about: 'Paste an Amazon or Myntra product link. Thrift Track keeps checking the price, charts its history, and emails you when it drops.',
    how: [
      'Scrapers for Amazon and Myntra product pages (Cheerio, plus Python scripts).',
      'Prices and history stored in MongoDB.',
      'A cron route re-scrapes tracked products.',
      'Nodemailer sends the price-drop alert; Chart.js draws the history.',
    ],
    stack: ['Next.js', 'TypeScript', 'MongoDB', 'Cheerio', 'Nodemailer', 'Chart.js', 'Python'],
    links: [
      { label: 'Live site', href: 'https://thrift-track.vercel.app' },
      { label: 'Code', href: GH + 'Thrift_Track' },
    ],
  },
  {
    id: 'multilang',
    title: 'MultiLang Chat',
    tagline: 'A chat app built for talking across languages.',
    context: 'more builds · 2024',
    about: 'A chat app built around talking with people who speak other languages, with accounts, chats and a paid tier.',
    how: ['Sign-in through NextAuth with a Firebase adapter.', 'Chats stored in Firebase.', 'Pricing page with checkout, and a dark mode.'],
    stack: ['Next.js', 'TypeScript', 'NextAuth', 'Firebase', 'shadcn/ui', 'Tailwind'],
    links: [{ label: 'Code', href: GH + 'MultiLang-ChatApp' }],
  },
  {
    id: '3d',
    title: '3D tours',
    tagline: 'A phone video of a room → a walkable 3D tour in the browser.',
    context: 'lately · research project',
    about:
      'An experiment in turning a phone capture of a real room into a photoreal, walkable Gaussian-splat tour for rental listings. The second capture produced a walkable model: from the filmed viewpoints renders come close to the real photos (LPIPS 0.199), and the remaining softness and ghosting have known causes and fixes.',
    how: [
      'Film the room with locked camera settings, then keep the sharpest frames.',
      'Solve camera positions with COLMAP and sanity-check the floor.',
      'Train a Gaussian splat (gsplat, MCMC) on a rented RTX 3090.',
      'Export to .splat and walk it in the browser with Three.js and Spark.',
    ],
    stack: ['Gaussian splatting', 'COLMAP', 'gsplat', 'Three.js', 'Spark', 'Python', 'FFmpeg'],
    note: 'The repo is private for now. This walk you are on is built with the same Three.js.',
  },
  {
    id: 'toolkit',
    title: 'The toolkit',
    tagline: 'Frontend? Backend? Mobile? Design? 3D? I guess bro.',
    context: 'the stack',
    about: 'Everything I reach for, grouped the way I think about it.',
    how: [
      'AI & ML: Gemini, LangChain, Transformers.js, RAG, vector search, embeddings.',
      'Mobile: Kotlin, Jetpack Compose, Hilt, Room, React Native, Expo, Firebase, Razorpay.',
      'Web: TypeScript, React, Next.js, Tailwind, TanStack Query, Redux, MapLibre, Leaflet.',
      'Backend: FastAPI, Node.js, PostgreSQL, PostGIS, Supabase, Redis, Celery, Prisma, Drizzle, MongoDB, WebSockets, Docker.',
      'Automation: Playwright, UiPath, scraping, schedulers, GitHub Actions.',
      '3D & design: Blender, Gaussian splatting, COLMAP, Three.js, OpenCV, FFmpeg, Figma, Illustrator, Lottie.',
    ],
    stack: ['TypeScript', 'Python', 'Kotlin', 'React', 'FastAPI', 'PostgreSQL', 'Three.js'],
    links: [{ label: 'GitHub', href: GH.slice(0, -1) }],
  },
]

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id)!
