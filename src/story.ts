// Everything Aryan says on the walk lives here. Edit the text freely.
// `from` / `to` are positions along the walk (0 = coffee stall, 1 = the lookout).
// If you move a beat a lot, move its scenery in src/world/World.tsx to match.

import { CLOUD_U, ROOM_U, eu } from './engine'

export type Link = { label: string; href: string }
/** A big number or badge stamped next to the caption. Numbers count up. */
export type Stat = { big: string; small: string }
export type Beat = {
  from: number
  to: number
  kicker: string
  text: string
  links?: Link[]
  meme?: MemeId
  stat?: Stat
}
export type MemeId = 'wetcat' | 'iguess'

export const ME = {
  name: 'Aryan Yadav',
  role: 'Founder, KhaoGully · Full-stack & AI engineer',
  pitch: "I build products end to end, from design to deployment. This portfolio is a short walk: grab a coffee and I'll show you what I've shipped.",
  email: 'aryanyadav.devop@gmail.com',
  linkedin: 'https://www.linkedin.com/in/aryanyadav-dev/',
  github: 'https://github.com/Aryan-yadav15',
  x: 'https://x.com/AryanYadav_15',
  instagram: 'https://instagram.com/aryanyadav.png',
}

// Shown under the title before the walk starts.
export const HIGHLIGHTS = [
  { big: '5,000+', small: 'app installs' },
  { big: '1st', small: 'Deloitte hackathon' },
  { big: 'Deloitte', small: 'internship' },
]

// Dots on the route rail.
export const CHAPTERS = [
  { t: 0, label: 'the stall' },
  { t: 0.09, label: 'rabbit hole' },
  { t: 0.135, label: 'design first' },
  { t: 0.205, label: 'campus' },
  { t: 0.295, label: 'first gig' },
  { t: 0.36, label: 'the win' },
  { t: 0.455, label: 'KhaoGully' },
  { t: 0.61, label: 'engine room' },
  { t: 0.672, label: 'AI lab' },
  { t: 0.772, label: 'more builds' },
  { t: 0.805, label: '3D' },
  { t: 0.94, label: 'your turn' },
]

export const BEATS: Beat[] = [
  {
    from: 0, to: 0.05, kicker: 'hey',
    text: "I'm Aryan. I run a delivery startup, I won the Deloitte hackathon, and I'm carrying two coffees. Walk with me, I'll tell you how I got here.",
  },
  {
    from: 0.057, to: 0.08, kicker: 'quick context',
    text: "I'm from Nagpur, I build products end to end, and I talk with my hands. So, mind the cup.",
  },
  {
    from: 0.085, to: 0.115, kicker: '2022 · the rabbit hole',
    text: 'It started in 2022. I only wanted to make one custom UI component look nice. Then I fell head first into the rabbit hole.',
  },
  {
    from: 0.13, to: 0.155, kicker: 'design first',
    text: 'Before code, I was the design guy. Figma, Illustrator, Webflow. I still care way too much about 4 pixels.',
  },
  {
    from: 0.16, to: 0.188, kicker: 'design first',
    text: 'I led graphic design at Konnexions, our tech society. Posters, brands, the works.',
  },
  {
    from: 0.2, to: 0.228, kicker: 'campus',
    text: "This is KIIT. I'm doing my B.Tech here. Most of the real learning happened after class, though.",
  },
  {
    from: 0.236, to: 0.268, kicker: 'campus',
    text: 'I built CampusBuzz here too: one place for KIIT students to find and manage events.',
    links: [{ label: 'CampusBuzz', href: 'https://campus-buzz.vercel.app' }],
  },
  {
    from: 0.288, to: 0.316, kicker: 'first real gig',
    text: 'BitsToBugs. I joined as a UI/UX designer and stayed as a full-stack developer. Turns out I like owning the whole thing.',
  },
  {
    from: 0.322, to: 0.348, kicker: 'first real gig',
    text: "Since then I've built software for an advertising agency, a startup, and myself. That last client is the pickiest.",
  },
  {
    from: 0.358, to: 0.384, kicker: 'the win',
    text: 'Then hackathons happened. And at the Deloitte hackathon, MailMesh took first place.',
    stat: { big: '1st', small: 'place · Deloitte hackathon' },
    links: [{ label: 'MailMesh', href: 'https://github.com/Aryan-yadav15/MailMesh-Delloite-Hackathon' }],
  },
  {
    from: 0.388, to: 0.41, kicker: 'the win',
    text: 'The prize that mattered: that win turned into an internship at Deloitte.',
    stat: { big: '🎟️', small: 'Deloitte internship, unlocked' },
  },
  {
    from: 0.414, to: 0.432, kicker: 'more hackathons',
    text: 'Then Walmart, Woodpecker and a few more. No sleep, questionable snacks, unlimited confidence.',
    links: [
      { label: 'Walmart build', href: 'https://github.com/Aryan-yadav15/WalmartHackathon' },
      { label: 'StockSmart', href: 'https://github.com/Aryan-yadav15/WoodpeckerStockSmart' },
    ],
  },
  {
    from: 0.436, to: 0.452, kicker: 'more hackathons', meme: 'wetcat',
    text: 'Not all of them went well. Me, when the demo breaks five minutes before judging.',
  },
  {
    from: 0.458, to: 0.482, kicker: 'the big one',
    text: 'Then I stopped building demos and started a company. KhaoGully pools campus food orders, so a whole hostel shares one delivery.',
    links: [{ label: 'Open KhaoGully', href: 'https://khaoo-gully-customer-web.vercel.app' }],
  },
  {
    from: 0.486, to: 0.512, kicker: 'KhaoGully · real numbers',
    text: "It's live. Real restaurants, real riders, real people waiting on real food.",
    stat: { big: '5,000+', small: 'installs across platforms' },
  },
  {
    from: 0.516, to: 0.536, kicker: 'KhaoGully · follow one order',
    text: 'Every order runs through five products I built. Follow that orange parcel.',
    stat: { big: '5', small: 'products in production' },
  },
  {
    from: 0.538, to: 0.55, kicker: '1 · customer app',
    text: "Someone's hungry, scrolling, can't decide. Biryani wins. Order placed.",
    links: [{ label: 'Customer app', href: 'https://github.com/Aryan-yadav15/khaooGully-customer-web' }],
  },
  {
    from: 0.552, to: 0.564, kicker: '2 · restaurant dashboard',
    text: "The order pings the kitchen. One tap to accept, and the pan's already on.",
    links: [{ label: 'Restaurant dashboard', href: 'https://github.com/Aryan-yadav15/KhaoGully-restraunt-facing' }],
  },
  {
    from: 0.566, to: 0.578, kicker: '3 · delivery navigator',
    text: 'A rider gets the pickup and the route. The customer watches the ETA tick down.',
    links: [{ label: 'Navigator', href: 'https://github.com/Aryan-yadav15/khaao-gully-navigator' }],
  },
  {
    from: 0.58, to: 0.592, kicker: '4 · inventory',
    text: "Every order updates stock, so nobody sells biryani they don't have.",
    links: [{ label: 'Inventory', href: 'https://github.com/Aryan-yadav15/inventory-management' }],
  },
  {
    from: 0.594, to: 0.608, kicker: '5 · economics dashboard',
    text: "And the margin on every single order, live. It's how we know the business actually works.",
    links: [{ label: 'Economics dashboard', href: 'https://github.com/Aryan-yadav15/KhaoGully-economics-dashboard' }],
  },
  {
    from: eu(1), to: eu(7), kicker: 'the stack', meme: 'iguess',
    text: 'People ask: "so you do frontend, backend, mobile, design AND 3D?"',
  },
  {
    from: eu(7.5), to: eu(11.5), kicker: 'the stack',
    text: "Honestly? All of it. So I put my whole stack in a claw machine. Win a plush and it tells you where I used it.",
  },
  {
    from: eu(ROOM_U - 13), to: eu(ROOM_U - 7.4), kicker: 'engine room',
    text: "I was KhaoGully's CTO, so let's lift the street and look at what actually runs it. (In a hurry? There's a big skip button.)",
    stat: { big: 'CTO', small: 'founder · KhaoGully' },
  },
  {
    from: eu(ROOM_U - 7), to: eu(ROOM_U - 1.2), kicker: 'engine room · 1 · wire it',
    text: 'Every order goes app → API → pool → restaurant, with Postgres underneath. Tap the glowing part to plug in the next wire.',
  },
  {
    from: eu(ROOM_U - 1), to: eu(ROOM_U + 4.8), kicker: 'engine room · 2 · lunch rush',
    text: 'Then 1 PM hits. Our API choked: database calls were blocking the event loop. I moved them off it, and 20 concurrent requests went from 12.3 s to 1.4 s.',
    stat: { big: '12.3s → 1.4s', small: '20 concurrent requests' },
  },
  {
    from: eu(ROOM_U + 5), to: eu(ROOM_U + 11.8), kicker: 'engine room · 3 · the ₹582 bug',
    text: 'My favourite bug: a customer paid ₹582 and no order appeared. One missing database rule. I fixed it, then made the server refuse to start if code and database ever disagree again.',
  },
  {
    from: eu(CLOUD_U - 3), to: eu(CLOUD_U + 3.5), kicker: 'the cloud',
    text: "And above it all, the cloud. I'm hands-on with AWS: compute, containers, storage, queues, serverless.",
  },
  {
    from: 0.672, to: 0.696, kicker: 'the AI lab',
    text: 'Somewhere in there I went deep on AI. Retrieval, embeddings, agents, the works. Here is what came out of the lab.',
  },
  {
    from: 0.7, to: 0.724, kicker: 'AI lab · 01',
    text: 'DocRAG: a VS Code extension that crawls library docs and hands Copilot fresh context. Keyword and vector search, embeddings computed on your machine.',
    links: [{ label: 'DocRAG', href: 'https://github.com/Aryan-yadav15/DocAiAssist' }],
  },
  {
    from: 0.728, to: 0.75, kicker: 'AI lab · 02',
    text: 'AI Form Filler: a Chrome side panel that fills Google Forms with Gemini, using context from your AI chats. Laziness, engineered.',
    links: [{ label: 'AI Form Filler', href: 'https://github.com/Aryan-yadav15/formfillerAi-Browser-extension' }],
  },
  {
    from: 0.754, to: 0.776, kicker: 'AI lab · 03',
    text: 'NLP → SQL: a streaming agent that reads any Postgres schema, writes the query, runs it and explains the answer.',
    links: [{ label: 'NLP → SQL', href: 'https://github.com/Aryan-yadav15/Database-NLP-Query' }],
  },
  {
    from: 0.772, to: 0.786, kicker: 'more builds',
    text: 'Thrift Track: paste an Amazon or Myntra link, and it emails you when the price drops.',
    links: [{ label: 'Thrift Track', href: 'https://thrift-track.vercel.app' }],
  },
  {
    from: 0.788, to: 0.8, kicker: 'more builds',
    text: 'And MultiLang Chat, for talking with people who speak other languages.',
  },
  {
    from: 0.804, to: 0.842, kicker: 'lately · 3D',
    text: "Lately I'm deep into 3D: turning a phone video of a room into a walkable Gaussian-splat tour. Which is why you're on a walk right now and not reading a PDF.",
  },
  {
    from: 0.865, to: 0.9, kicker: 'the recap',
    text: 'A startup with 5,000+ installs, a hackathon trophy, a Deloitte internship, and a lab full of AI tools. Not bad for someone who just wanted one nice button.',
  },
  {
    from: 0.93, to: 1.1, kicker: 'your turn',
    text: "Coffee's done. If you're building something, I'd like to hear about it.",
    links: [
      { label: 'Email me', href: `mailto:${ME.email}` },
      { label: 'LinkedIn', href: ME.linkedin },
      { label: 'GitHub', href: ME.github },
      { label: 'X', href: ME.x },
    ],
  },
]

export const MEMES: Record<MemeId, { file: string; emoji: string; top: string; bottom: string }> = {
  // Drop the real images in public/memes/ with these file names. Until then a drawn stand-in shows.
  wetcat: { file: 'wet-cat.jpg', emoji: '😿', top: 'demo: breaks', bottom: 'bruh' },
  iguess: { file: 'i-guess-bro.jpg', emoji: '🤷', top: '', bottom: 'i guess bro' },
}
