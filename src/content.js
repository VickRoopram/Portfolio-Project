/**
 * Portfolio content for Vick Does Creative.
 * Edit text, links and images here; the 3D synth in main.js reads from CH.
 * Each channel: { name, col, items:[{ t:title, k:kicker, sum:one-line summary, d:html, img:[], tags:[], links:[[label,url]] }] }
 * sum is plain text for search engines, AI assistants and /portfolio/ (scripts/generate.mjs); the synth shows t, k and d.
 */
/* ───────────── CONTENT ───────────── */
export const im = (n, a) => ({ s: `assets/img/${/\.\w+$/.test(n) ? n : n + '.jpg'}`, a }); // a name without an extension is a .jpg
export const CH = {
  info: {
    name: 'VICK.SYS',
    col: '#d71920',
    items: [
      {
        t: 'Vickhal Roopram, UX & motion designer',
        k: 'UX/UI Designer at Floodlight Studios · South Africa',
        hero: 1,
        d: `<p class="quote">Research like a nerd. Play like a kid. Use the box.</p><p>I'm Vickhal Roopram, Vick for short. I'm a UX/UI designer, illustrator and motion designer from South Africa, and I've been making things since I was 12. That's 15 years so far.</p><p>Fun is my core value as a designer: creative expression and exploration. But I earn the fun. Every project starts with methodical, detailed research, because research is what opens up new paths and better ideas. I do the homework like a nerd so I can play like a kid.</p><p>People say “think outside the box”. I'd rather not think outside it or inside it. I'd use the box. This portfolio is proof: it's made of cardboard and tape, and you can play it.</p><p>I also think of myself as an instrument, not a single-purpose tool. You can play me in different ways, depending on what the project needs.</p>`,
      },
      {
        t: 'UX/UI, 3D motion and AI workflows',
        k: 'Skills from the CV',
        bars: [
          ['UX/UI & visual design · Figma, Adobe CC', 'Advanced', 0.92],
          ['3D & 2D animation · Blender, Spline, After Effects', 'Advanced', 0.88],
          ['AI & workflow automation · Claude, Figma Make, Vercel', 'Advanced', 0.86],
          ['Strategic marketing & design thinking', 'Advanced', 0.84],
          ['Web development · HTML5, CSS, JavaScript, React', 'Average', 0.56],
          ['Microsoft Office', 'Advanced', 0.8],
        ],
        d: `<p>Levels as stated on my CV.</p>`,
      },
      {
        t: 'Figma, Adobe CC, Blender and Spline',
        k: 'Tools I use daily',
        d: `<h3>Design</h3><div class="tags"><span>Figma</span><span>Illustrator</span><span>Photoshop</span><span>InDesign</span><span>Aero</span><span>Dimension</span><span>Zeplin</span></div><h3>Motion & 3D</h3><div class="tags"><span>After Effects</span><span>Animate</span><span>Premiere</span><span>Blender</span><span>Spline</span><span>Fuse</span><span>Procreate</span></div><h3>Build & AI</h3><div class="tags"><span>Claude Design & Code</span><span>Figma Make</span><span>Canva AI</span><span>ChatGPT & Gemini imaging</span><span>Vercel</span><span>Antigravity</span><span>HTML · CSS · JS · React</span></div><h3>Team</h3><div class="tags"><span>Jira</span><span>Slack</span><span>2-week sprints</span><span>Retros</span></div>`,
      },
      {
        t: 'Loeries finalist, Gold Pack bronze, Parliament',
        k: 'Awards & recognition',
        d: `<ol class="tl"><li><time>2020</time><div><b>Loeries Student Portfolio Bootcamp</b><br>Top 3 finalist in Africa.</div></li><li><time>2020</time><div><b>SA Gold Pack Design Awards</b><br>Bronze, plus a Top 100 international entry at WorldStar Student.</div></li><li><time>2020</time><div><b>Parliament presentation</b><br>Systems for SASSA and Home Affairs presented to the South African Parliament for national use.</div></li><li><time>2022</time><div><b>Government prototype review</b><br>A prototyped system reviewed for use in a government initiative.</div></li></ol>`,
        links: [
          [
            'Loeries feature',
            'https://modernmarketing.co.za/the-loeries-partnerships-uplift-next-generation-of-influential-creatives/',
          ],
          [
            'Gold Pack brochure',
            'https://www.studentgoldpack.org.za/files/page/12/sgp_winners_brochure_2020_graphic_design.pdf',
          ],
          ['Bizcommunity', 'https://www.bizcommunity.com/Article/196/614/209332.html'],
        ],
      },
      {
        t: '5 years designing at Floodlight Studios',
        k: 'Work experience',
        d: `<ol class="tl"><li><time>2021–now</time><div><b>Floodlight Studios</b><br>UX/UI Designer, full time. The studio's only UX/UI designer, working on SaaS products.</div></li><li><time>2017–2019</time><div><b>Genesis Printing</b><br>Graphic & Motion Designer, part time.</div></li><li><time>2017–2019</time><div><b>Katz Cakes</b><br>Graphic Designer, part time.</div></li><li><time>2017–2019</time><div><b>Conquering Through Prayer Ministries Int.</b><br>Multimedia Engineer & Motion Designer, part time.</div></li><li><time>Since age 12</time><div><b>Family branding business</b><br>Grew up learning print setup and production at my dad's full-scale branding company.</div></li></ol>`,
      },
      {
        t: 'UCT UX/UI, DUT Visual Communication',
        k: 'Education',
        d: `<ol class="tl"><li><time>2023–2026</time><div><b>Theology degree</b><br>Doxa Deo & SATS</div></li><li><time>2021–2022</time><div><b>UX/UI short course</b><br>University of Cape Town</div></li><li><time>2021</time><div><b>Frontend developer bootcamp</b><br>Codecamp.org</div></li><li><time>2020</time><div><b>Adobe software course</b><br>Adobe MAX</div></li><li><time>2018–2020</time><div><b>National Diploma in Visual Communication</b><br>Durban University of Technology</div></li></ol><p style="font-size:14px;color:var(--mute)">I see myself as a forever student.</p>`,
      },
      { t: 'Family, faith, Jiu-Jitsu and D&D', k: 'Off the clock', life: 1 },
      { t: 'Hire me, brief me or say hello', k: 'Email, phone and socials', contact: 1 },
    ],
  },
  gd: {
    name: 'DESIGN',
    col: '#1fa957',
    items: [
      {
        t: 'A Journey With Kal',
        sum: `An illustrated, animated Instagram diary about living with Kallmann syndrome and acromegaly: informative, a bit funny, and shared by people around the world.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-kal1', 'A Journey With Kal post on an Instagram phone screen'),
          im('gd-kal4', 'Running figure illustration from the series'),
          im('gd-kal5', 'Instagram comments and a shared story about the series'),
        ],
        vid: [
          {
            s: 'assets/vid/gd-kal-smell.mp4',
            p: 'assets/vid/gd-kal-smell.jpg',
            a: 'Animation: Kal surrounded by drifting lines, showing a lost sense of smell and anxiety',
          },
          {
            s: 'assets/vid/gd-kal-vertigo.mp4',
            p: 'assets/vid/gd-kal-vertigo.jpg',
            a: 'Animation: a hallway that sways and warps, showing vertigo',
          },
        ],
        d: `<p>An animated Instagram diary about my life with Kallmann syndrome and acromegaly.<br class="dbr">Simple, informative and a bit funny, so people respect what we deal with<br class="dbr">instead of feeling sorry, and others living with it know they're not alone.</p><h3>The animations</h3><p>Each animation simulates a symptom, from a lost sense of smell to vertigo,<br class="dbr">educating viewers while being fun to watch and learn from.</p><div class="clips"><div class="vid vid-0"></div><div class="vid vid-1"></div></div><div class="fig fig-1"></div><h3>The responses</h3><p>The diary reached people around the world, who shared it and their own stories.<br class="dbr">Even famous motion designers like Ben Marriott commented on it.</p><div class="fig fig-2"></div><div class="tools end"><span><b>Ai</b>Illustrator</span><span><b>Ae</b>After Effects</span><span><b>Ps</b>Photoshop</span><span><b>Pr</b>Premiere Pro</span><span><b>Lr</b>Lightroom</span></div>`,
        links: [['View the full campaign on Instagram', 'https://www.instagram.com/vicsdoesmotion/']],
      },
      {
        t: 'A Noob’s Guide to Building a PC',
        sum: `An 800 × 2000 px infographic of the basic parts of a gaming PC and what each one does.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-pc1', 'The infographic on a tablet beside a smart speaker'),
          im('gd-pc2', 'The infographic open on a laptop'),
          im('gd-pc3', 'The full infographic on a phone screen'),
        ],
        d: `<p>An infographic on the basic parts you need to build a gaming PC,<br class="dbr">and what each one does. It’s 800 × 2000 px, made for laptops and screens,<br class="dbr">and shared on social media and Reddit. I built the PC first. That was the research.</p><div class="fig fig-1"></div><div class="fig fig-2"></div><div class="tools end"><span><b>Ps</b>Photoshop</span><span><b>Ai</b>Illustrator</span><span><b>Id</b>InDesign</span><span><b>C4D</b>Cinema 4D</span><span><b>Ac</b>Acrobat</span></div>`,
      },
      {
        t: 'iMvelo Care',
        sum: `Corporate identity for iMvelo, a mobile spa and wellness centre for women that specialises in care for the elderly.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-im1', 'iMvelo Care logo on a lilac background with paper leaves'),
          im('gd-im2', 'Letterhead, envelope, business cards and pencil'),
          im('gd-im3', 'Z-fold brochure'),
          im('gd-im4', 'iMvelo Care branding on a van'),
          im('gd-im5', 'The website on a desktop, tablet and laptop'),
          im('gd-im6', 'Herbal mint tea pack'),
        ],
        d: `<p>A corporate identity for iMvelo Care, built around a logo they supplied.<br class="dbr">iMvelo is a mobile spa and wellness centre for women in KwaZulu-Natal,<br class="dbr">and it specialises in care for the elderly.</p><h3>The identity</h3><p>It rests on the brand’s values: natural, calm and safe spaces for women, and organic treatments.<br class="dbr">Plant shapes, soft pastels, and a purple and green for natural care.</p><div class="fig fig-1"></div><div class="fig fig-2"></div><h3>Out in the world</h3><p>The identity carries onto the van, the website, the promotion stands<br class="dbr">and the products iMvelo sells.</p><div class="fig fig-3"></div><div class="fig fig-4"></div><div class="fig fig-5"></div><div class="tools end"><span><b>Ai</b>Illustrator</span><span><b>Ps</b>Photoshop</span><span><b>Id</b>InDesign</span><span><b>Lr</b>Lightroom</span></div>`,
      },
      {
        t: 'Takkie Wash & Squeaky Kleen',
        sum: `Team lead on a rebrand of two cleaning brands for a new in-store partnership, so customers can tell which brand does what.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-tk3', 'Two posters: Don’t trip, we got you, and Busy? We’ll take care of your dirty business'),
          im('gd-tk2', 'The Takkie Wash and Squeaky Kleen logos with their colours'),
          im('gd-tk4', 'A-board sign: Shoes handled. Clothes spun.'),
        ],
        vid: [
          {
            s: 'assets/vid/gd-tk-call.mp4',
            p: 'assets/vid/gd-tk-call.jpg',
            a: 'Animation: Call us, with the phone number, on Takkie Wash blue',
          },
          {
            s: 'assets/vid/gd-tk-address.mp4',
            p: 'assets/vid/gd-tk-address.jpg',
            a: 'Animation: the shop address on Squeaky Kleen yellow',
          },
        ],
        d: `<p>I led a team on a brand strategy for two cleaning businesses that had just joined forces.<br class="dbr">Customers couldn’t tell which brand did what,<br class="dbr">so we made each one its own brand and made the partnership known.</p><h3>Two brands</h3><p>Colour and copy keep them apart: Takkie Wash does shoes, Squeaky Kleen does clothes.<br class="dbr">Short, punchy lines make each cleaning service obvious.</p><div class="fig fig-1"></div><div class="fig fig-2"></div><h3>In motion</h3><p>Two animated loops give the number and the address, one in each brand’s colour.</p><div class="clips"><div class="vid vid-0"></div><div class="vid vid-1"></div></div><div class="tools end"><span><b>Ai</b>Illustrator</span><span><b>Id</b>InDesign</span><span><b>Ae</b>After Effects</span><span><b>Ps</b>Photoshop</span></div>`,
      },
      {
        t: 'Clover Festive Display',
        sum: `In-store festive display for Clover and its Win-a-Car promotion, built on Clover’s line “Way Better Shared”.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-cl1', 'Key visual poster: Way Better Shared, with the condensed milk tin and Win a new car'),
          im('gd-cl2', 'A festive table of desserts made to share, with the Clover tin'),
          im('gd-cl3', 'Pallet display mock-up: tins stacked into a festive tree'),
        ],
        d: `<p>A festive in-store promotion for Clover’s sweetened condensed milk and its Win-a-Car competition.<br class="dbr">It runs on Clover’s line, Way Better Shared:<br class="dbr">the festive season told through meals made to share.</p><h3>The key visual</h3><p>The poster puts the tin and a dessert to share up front, with the new car to win below.</p><div class="fig fig-1"></div><h3>The pallet display</h3><p>A rough mock-up of the in-store pallet: Clover tins stacked into a festive tree.</p><div class="fig fig-2"></div><div class="tools end"><span><b>Ps</b>Photoshop</span><span><b>Lr</b>Lightroom</span><span><b>Ai</b>Illustrator</span></div>`,
      },
      {
        t: 'Pulse Hybrid Inverter',
        sum: `Packaging for a backup power inverter that has to sell itself in store. Bronze at the 2020 SA Gold Pack Design Awards and a Top 100 international entry.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-pu1', 'Three Pulse Hybrid Inverter boxes'),
          im('gd-pu2', 'Front of the box: Pulse, heart of productivity, 6000 watts'),
          im('gd-pu3', 'Scanning the QR code on the box with a phone'),
          im('gd-pu4', 'The Pulse FAQ chat on WhatsApp'),
        ],
        d: `<p>Packaging for a backup power inverter that has to sell itself in store,<br class="dbr">with no sales rep and no manual, and show it’s part of a bigger solar kit.<br class="dbr">Bronze at the 2020 SA Gold Pack awards and a Top 100 international entry.</p><h3>The idea</h3><p>I created Pulse, a brand about protecting people’s productivity, with the inverter at its heart.<br class="dbr">It’s for small businesses and homeowners.</p><div class="fig fig-1"></div><h3>The features</h3><p>A simple line system guides you around the box. A QR code opens a live wattage calculator,<br class="dbr">and there’s a number to call, WhatsApp or SMS. Yes, I used the box.</p><div class="fig fig-2"></div><div class="fig fig-3"></div><div class="tools end"><span><b>Id</b>InDesign</span><span><b>Ps</b>Photoshop</span><span><b>Ai</b>Illustrator</span><span><b>Bl</b>Blender</span><span><b>C4D</b>Cinema 4D</span></div>`,
        tags: ['Bronze · Gold Pack 2020'],
      },
      {
        t: 'Saddler Repositioning',
        sum: `Repositioning Saddler from a white-label business to an on-trend fashion accessory brand: “Your World. Your Way.”`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-sd1', 'Key visual poster: Your World. Your Way.'),
          im('gd-sd2', 'A woman in a black denim jacket against a mural'),
          im('gd-sd3', 'Logo development: the original logo, the corporate logo and the product badge'),
          im('gd-sd4', 'Instagram posts for follower engagement and product ranges'),
        ],
        vid: [
          {
            s: 'assets/vid/gd-sd-story.mp4',
            p: 'assets/vid/gd-sd-story.jpg',
            a: 'Animated Instagram story: Your World, Your Way. Made to represent you.',
          },
        ],
        d: `<p>Saddler is a family-owned brand with a 30-year history, positioned as Smart Heritage.<br class="dbr">The brief: reposition it as a modern fashion accessory brand.<br class="dbr">The new line: Your World. Your Way.</p><h3>The new position</h3><p>A go-to lifestyle and fashion accessory brand, for the urbanite and the fashion enthusiast.<br class="dbr">Quality accessories made to represent you, wherever you’re going.</p><div class="fig fig-1"></div><h3>The look</h3><p>The brown is the brand’s past and a new blue is its fashion future.<br class="dbr">The horseshoe stays, because it’s already the sign on Saddler’s buildings.</p><div class="fig fig-2"></div><h3>The campaign</h3><p>Instagram stories and posts carry the line, from giveaways to new collections.</p><div class="clips"><div class="vid vid-0"></div></div><div class="fig fig-3"></div><div class="tools end"><span><b>Ai</b>Illustrator</span><span><b>Lr</b>Lightroom</span><span><b>Id</b>InDesign</span><span><b>Ps</b>Photoshop</span></div>`,
      },
      {
        t: 'Retro Grade',
        sum: `A T-shirt range I designed to celebrate 50-plus years of gaming and esports, and the two-page publication that presents it.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-rg1', 'Retro Grade pixel-art logo and character'),
          im('gd-rg2', 'Design process: game reference, photo reference, final illustration and mock-up'),
          im('gd-rg3', 'The two-page spread'),
          im('gd-rg4', 'The spread printed in a magazine'),
        ],
        d: `<p>A two-page magazine spread for a product I designed:<br class="dbr">T-shirts that celebrate 50-plus years of gaming and esports,<br class="dbr">based on the games that defined their genres.</p><h3>The research</h3><p>I looked at Memphis design, modern cyberpunk illustration and pixel art,<br class="dbr">for a retro style with a modern spin. The research was extremely enjoyable.</p><div class="fig fig-1"></div><h3>The spread</h3><p>Each design goes from a game reference and a photo reference to the final illustration and mock-up.</p><div class="fig fig-2"></div><div class="fig fig-3"></div><div class="tools end"><span><b>Ai</b>Illustrator</span><span><b>Ps</b>Photoshop</span><span><b>Id</b>InDesign</span><span><b>Ac</b>Acrobat</span></div>`,
      },
      {
        t: 'Jonsson Workwear: Siyapusha',
        sum: `Group lead on the campaign strategy to launch Jonsson’s lifestyle footwear, The Kalahari’s, which drove the launch collateral and a packaging redesign.`,
        case: 1,
        introFirst: 1,
        img: [
          im('gd-jw1', 'The redesigned shoebox with a line drawing of the Kalahari’s'),
          im('gd-jw2', 'Line drawings of the shoe on colour panels'),
          im('gd-jw3', 'Customising the box in three steps'),
          im('gd-jw4', 'The box standing on its end'),
        ],
        d: `<p>I led the group that planned the relaunch of Jonsson Workwear’s Kalahari’s, a veldskoen.<br class="dbr">The Khoisan made the shoe to go greater distances, and farmers made it the shoe we know today.<br class="dbr">So the relaunch sells one value the shoe and the brand share: reliability.</p><h3>Go anywhere</h3><p>The pack sells a reliable journey: hard work, quality and moving forward.<br class="dbr">The name, Siyapusha, says the same. Built for the pressure.</p><div class="fig fig-1"></div><h3>Your own box</h3><p>Order online and the box can carry an illustration of a picture you choose,<br class="dbr">so it becomes a collector’s piece.</p><div class="fig fig-2"></div><div class="fig fig-3"></div><div class="tools end"><span><b>Ai</b>Illustrator</span><span><b>Ps</b>Photoshop</span><span><b>Id</b>InDesign</span></div>`,
      },
    ],
  },
  ux: {
    name: 'UX / UI DESIGN',
    col: '#3d9ad8',
    items: [
      /* Case studies from Behance (21 Nov 2026). In d: <div class="fig fig-N"></div> places img[N] there as a picture you can enlarge, <div class="ill ill-N"></div> as a small
     illustration (step cards); the rest go in the gallery. Wrap a part in <div class="desk-only"> or <div class="mob-only"> to show it on the desktop/tablet card or the phone only.
     vid:[{s,p,a}] with <div class="vid vid-N"></div> places a muted loop; wrap loops in <div class="clips"> to sit them side by side.
     acc:'#hex' gives one project its own marker colour (headings, step titles, labels). case:1 opens a wide card (images over 3/4 of the screen on desktop and tablet), with the title above the first image, uncropped */
      {
        t: 'Plug Our Potholes',
        sum: `UX/UI case study: a community app, developed with Floodlight Studios, where people report potholes, vote for the next area and donate to fix their own roads.`,
        k: '',
        case: 1,
        img: [
          im('ux-pop1', 'Plug Our Potholes logo over an illustrated broken road'),
          im('ux-pop2', 'Plug Our What?? About section'),
          im('ux-pop3', 'How it works in five steps'),
          im('ux-pop4', 'Style guide: text and colour styles'),
          im('ux-pop5', 'Mobile screens'),
          im('ux-pop-s1', 'Reporting a pothole on a phone map'),
          im('ux-pop-s2', 'Voting for the next area'),
          im('ux-pop-s3', 'Donating rand by card'),
          im('ux-pop-s4', 'Road crew filling a pothole'),
          im('ux-pop-s5', 'Sharing the countdown'),
        ],
        d: `<p><b>The problem:</b> badly maintained roads and constant damage to our cars.<br class="dbr">We'd all had enough, but complaining doesn't fill a pothole.</p><p><b>What I made:</b> a space where communities come together to&nbsp;donate&nbsp;cash and fix their own roads. Developed with Floodlight Studios.</p><div class="fig fig-1"></div><div class="desk-only"><div class="fig fig-2"></div></div><div class="mob-only"><h3>How it works</h3><div class="steps ill-steps"><div><div class="ill ill-5"></div><b>01 REPORT</b>Share your location or search a road to report a pothole.</div><div><div class="ill ill-6"></div><b>02 VOTE</b>Vote for the next area you want fixed.</div><div><div class="ill ill-7"></div><b>03 DONATE</b>Put some hard-earned rand towards fixing the roads.</div><div><div class="ill ill-8"></div><b>04 TRACK</b>See how much has been raised and how many potholes are left.</div><div><div class="ill ill-9"></div><b>05 COUNTDOWN</b>Watch the countdown to filling day and share it with others.</div></div></div><h3>Style guide</h3><p>Loud yellow, near-black and chunky Sora type make every screen bold and consistent,<br class="dbr">with clear button and error states. Isometric illustrations add the flare,<br class="dbr">so reporting something terrible feels almost fun.</p><div class="fig fig-3"></div><h3>The screens</h3><p>Report it, vote for it, fund it, then watch it get filled. Local&nbsp;slang&nbsp;like "Potholes&nbsp;are&nbsp;just&nbsp;kak" talks the way drivers do, and the&nbsp;Everyday&nbsp;Heroes&nbsp;list thanks neighbours by name, building a community.</p><div class="fig fig-4"></div>`,
      },
      {
        t: 'Fleet Receiving',
        sum: `UX/UI case study: Fleet, a stand-alone receiving system for a distribution centre that tracks every touch point of an offload, so bottlenecks show up.`,
        k: '',
        case: 1,
        acc: '#1f6ed4',
        img: [
          im('ux-fleet-cover', 'Fleet logo on a soft blue pattern'),
          im('ux-fleet6', 'User flow for the primary user'),
          im('ux-fleet-process', 'The process: every screen of the app laid out'),
          im('ux-fleet7', 'UI iterations: version one, version two and final'),
          im('ux-fleet1', 'Fleet app screens: active trucks, login, quality control and security'),
          im('ux-fleet4', 'Web admin panel: synchronisation and dashboard'),
          im('ux-fleet5', 'The Fleet dashboard on a tablet and the app on a phone'),
          im('ux-fleet-s1.png', 'Laptop with a tick'),
          im('ux-fleet-s2.png', 'Light bulb'),
          im('ux-fleet-s3.png', 'Person'),
          im('ux-fleet-s4.png', 'Warehouse door'),
          im('ux-fleet-s5.png', 'Map pin'),
          im('ux-fleet-d1.svg', 'Doodle: a delivery truck racing a stopwatch'),
          im('ux-fleet-d2.svg', 'Doodle: a magnifying glass with a question mark over a route'),
          im('ux-fleet-d3.svg', 'Doodle: a phone with a chart, a tick and a map pin'),
        ],
        d: `<div class="beats"><div><div class="ill ill-12"></div><small>The challenge</small><h4>Quantities, quality &amp; bottlenecks</h4><p>A distribution centre runs on how many items it can offload per hour. One slow delivery delays the rest of the day.</p></div><div><div class="ill ill-13"></div><small>The unseen problem</small><h4>Where do bottlenecks start?</h4><p>The receiving team couldn't see where delays began, or how one badly run delivery affects the day.</p></div><div><div class="ill ill-14"></div><small>What I made</small><h4>Fleet, a receiving system</h4><p>A stand-alone system tracking each touch point of receiving, so bottlenecks show up across the whole offload cycle.</p></div></div><h3>User flow</h3><p>Progressive disclosure and a clear, ordered structure<br class="dbr">kept the primary user flow simple, easy to navigate and easy to discover.</p><div class="fig fig-2"></div><div class="fig fig-1"></div><h3>Iterations</h3><p>With a concise layout and structure in place, we explored every option<br class="dbr">for colour, copy and styling, keeping to the brand's look and feel<br class="dbr">while staying accessible to users.</p><div class="fig fig-3"></div><h3>The app</h3><div class="steps ill-steps feat"><div><div class="ill ill-7"></div><b>EASE OF USE</b>A simple, clear interface.</div><div><div class="ill ill-8"></div><b>SCANNING</b>Fast data capture, with every point of offload and quality control tracked.</div><div><div class="ill ill-9"></div><b>USER ROLES</b>Each role in the delivery gets its own view for tracking and reporting.</div><div><div class="ill ill-10"></div><b>YARD ENTRY & EXIT</b>Security scans the licence disk and logs arrival and departure times.</div><div><div class="ill ill-11"></div><b>RECEIVING</b>Metrics captured throughout the offload, from quality control to truck departure.</div></div><div class="fig fig-4"></div><h3>Web admin panel</h3><p>App data syncs into a live dashboard: average offload time, deliveries processed,<br class="dbr">bay efficiency and delivery tracking, for daily and monthly comparison.<br class="dbr">Admins manage permissions, user lists and reports from the same place.</p><div class="fig fig-5"></div><div class="fig fig-6"></div><div class="tags end"><span>Figma</span><span>Illustrator</span></div>`,
      },
    ],
  },
  mo: {
    name: 'MOTION & 3D',
    col: '#ff5d1a',
    items: [
      {
        t: 'A Journey With Kal',
        sum: `Short animations about life with two rare genetic disorders, made funny so they're easier to relate to.`,
        k: 'Animated shorts',
        img: [im('g10', 'Animated story grid'), im('g9', 'Character animation')],
        d: `<p>Short animations about life with two rare genetic disorders, made funny so they're easier to relate to. The full series is on my creative Instagram and on Behance.</p>`,
        links: [
          ['Instagram · @vicsdoesmotion', 'https://www.instagram.com/vicsdoesmotion/'],
          ['Behance', 'https://www.behance.net/vickhalroopram'],
        ],
      },
      {
        t: '“Yoh!” in motion',
        sum: `A character GIF animated frame by frame in comic halftone, timed so the word lands like a punchline.`,
        k: 'Comic-texture GIF',
        img: [im('g35', 'Animation frames'), im('g33', 'Key frame')],
        d: `<p>A character GIF built frame by frame in comic halftone, timed so the word lands like a punchline. Timing took longer than drawing. It usually does.</p>`,
      },
      {
        t: '3D & animation toolkit',
        sum: `2D and 3D animation, from personal projects to freelance work. This playable 3D synth is one example.`,
        k: '2D · 3D · video',
        d: `<p>I've animated for most of my life, from personal illustration projects to freelance work, in 2D and 3D. This synth is a small example: a 3D instrument you can play, drawn on twos.</p>`,
        tags: ['After Effects', 'Animate', 'Premiere', 'Blender', 'Spline', 'Fuse', 'Dimension', 'Procreate'],
      },
      {
        t: 'Genesis Printing',
        sum: `Graphic and motion designer, part time (2017–2019): animated promos alongside print-ready production.`,
        k: 'Graphic & Motion Designer · 2017–2019',
        d: `<p>Part-time motion and graphic work for a print business: animated promos alongside print-ready production.</p>`,
      },
      {
        t: 'Church media & production',
        sum: `Multimedia engineer and motion designer (2017–2019): live visuals, service graphics and video for Conquering Through Prayer Ministries International.`,
        k: 'Multimedia Engineer · 2017–2019',
        d: `<p>Multimedia engineering and motion design for Conquering Through Prayer Ministries International: live visuals, service graphics and video. I've also worked with Olive Tree Church's production team across its sites.</p>`,
      },
      {
        t: '@vicsdoesmotion',
        sum: `My creative Instagram, where animation, illustration and motion experiments get tested in public.`,
        k: 'Creative Instagram',
        d: `<p>My creative account. It's where the animation, illustration and motion experiments go to be tested in public.</p>`,
        links: [
          ['Instagram · @vicsdoesmotion', 'https://www.instagram.com/vicsdoesmotion/'],
          ['Behance', 'https://www.behance.net/vickhalroopram'],
        ],
      },
    ],
  },
  life: {
    name: 'VICK.LIFE',
    col: '#e0338f',
    items: [
      {
        t: 'The Creative',
        k: 'Persona 1 · green',
        d: `<p>I love to draw. I'm always learning and see myself as a forever student. At 198 cm I'm hard to miss in a room, and usually the one sketching in the corner.</p>`,
        tags: ['Drawing', 'Illustration', 'Lifelong learning'],
      },
      {
        t: 'The Fighter',
        k: 'Persona 2 · blue',
        d: `<p>I train and compete in Jiu-Jitsu. On the mat, as in design, technique and patience beat brute force.</p>`,
        links: [['Competition record', 'https://smoothcomp.com/en/event/22190/toplist/100777/73305']],
        tags: ['Jiu-Jitsu'],
      },
      {
        t: 'The Adventurer',
        k: 'Persona 3 · pink',
        d: `<p>Hikes, time in nature and Dungeons & Dragons with friends. I love dogs. I'm also happily in a relationship with Lindy, and close to my parents and three brothers.</p>`,
        tags: ['Hiking', 'Dungeons & Dragons', 'Dogs', 'Family'],
      },
    ],
  },
};
export const LINKS = [
  ['Behance', 'https://www.behance.net/vickhalroopram'],
  ['Instagram (creative)', 'https://www.instagram.com/vicsdoesmotion/'],
  ['LinkedIn', 'https://www.linkedin.com/in/vickhal-roopram/'],
  ['Instagram (personal)', 'https://www.instagram.com/vickroopram/'],
  ['Threads', 'https://www.threads.com/@vickroopram'],
  ['X', 'https://x.com/RoopramVickhal'],
];

/* Extra channels: CV & contact, life, about, tools, experimental */
CH.cv = {
  name: 'CV & CONTACT',
  col: '#ff5d1a',
  items: [
    {
      t: 'Full CV',
      k: 'Vickhal Roopram · UX & Motion Designer',
      d: `<p>Both pages of my CV: experience, awards, education, skills and references. The short version of the homework.</p>`,
      img: [im('cv1', 'CV page 1'), im('cv2', 'CV page 2')],
    },
    { t: 'Hire me, brief me or say hello', k: 'Email, phone and socials', contact: 1 },
    {
      t: 'Behance',
      k: 'Vickhal Roopram',
      d: `<p>The full case studies, with the working shown. Plus illustration and motion.</p>`,
      links: [['behance.net/vickhalroopram', 'https://www.behance.net/vickhalroopram']],
    },
    {
      t: 'Instagram',
      k: '@vicsdoesmotion · @vickroopram',
      d: `<p>One account for animation and illustration. One for everything else, mostly dogs and hikes.</p>`,
      links: [
        ['@vicsdoesmotion', 'https://www.instagram.com/vicsdoesmotion/'],
        ['@vickroopram', 'https://www.instagram.com/vickroopram/'],
      ],
    },
    {
      t: 'LinkedIn',
      k: 'Vickhal Roopram',
      d: `<p>Work history, in a sensible font.</p>`,
      links: [['linkedin.com/in/vickhal-roopram', 'https://www.linkedin.com/in/vickhal-roopram/']],
    },
    {
      t: 'More socials',
      k: 'Threads · X · Facebook',
      links: [
        ['Threads · @vickroopram', 'https://www.threads.com/@vickroopram'],
        ['X · @RoopramVickhal', 'https://x.com/RoopramVickhal'],
        ['Facebook', 'https://www.facebook.com/vickhal.roopram.77/'],
      ],
    },
  ],
};
{
  CH.life.items = [
    {
      t: 'Family',
      k: 'Parents & three brothers',
      d: `<p>I come from a close family: both my parents and three brothers. My dad runs a full-scale branding company, which is where my design life started at 12.</p>`,
    },
    {
      t: 'Lindy',
      k: 'My partner',
      d: `<p>My partner, and a big part of my world. She has heard every idea on this site at least twice.</p>`,
    },
    {
      t: 'Faith',
      k: 'Non-denominational Christian',
      d: `<p>I'm a non-denominational Protestant Christian, finishing a theology degree at Doxa Deo & SATS (2023–2026). Faith shapes why I create, not only what I create.</p>`,
    },
    {
      t: 'Jiu-Jitsu',
      k: 'Training & competing',
      d: `<p>I train and compete. On the mat, as in design, technique and patience beat brute force.</p>`,
      links: [['Competition record', 'https://smoothcomp.com/en/event/22190/toplist/100777/73305']],
    },
    { t: 'Hiking & nature', k: 'Outdoors', d: `<p>Long walks uphill, for fun. It's research with better views.</p>` },
    {
      t: 'Dungeons & Dragons',
      k: 'Tabletop',
      d: `<p>Worlds, characters and stories built together around a table. It's also where I learned to plan for players who ignore the plan.</p>`,
    },
    { t: 'Dogs', k: 'Best friends', d: `<p>I love dogs. No further research needed.</p>` },
    {
      t: 'Drawing',
      k: 'Always sketching',
      d: `<p>I'm always sketching. Everything on this site started in pencil.</p>`,
    },
  ];
  const I = (t, k, d, x = {}) => ({ t, k, d: `<p>${d}</p>`, ...x });
  CH.ab = {
    name: 'ABOUT',
    col: '#d71920',
    items: [
      CH.info.items[0],
      I(
        'Vick Does Creative',
        'Why that name',
        "I can't pick one label. Artist, designer, animator, fighter, builder, developer: I've been all of them before lunch. What I actually do is take the resources, context and knowledge in front of me and rework them into something that solves the problem. So I just say it plainly: <b>I am creative.</b>",
      ),
      I(
        'Since age 12',
        '15 years of making',
        "My dad owns a full-scale branding company. Other kids had chores. I had print jobs to set up. I learned production before I learned to drive, and I've been working creatively ever since.",
      ),
      I(
        'Indian, South African',
        '27 · 198 cm',
        "I'm Indian, born and raised in South Africa. At 198 cm I'm hard to miss, so look for the tall one in the corner with a sketchbook.",
      ),
      I(
        'Forever student',
        'Always learning',
        'I never finish learning, and I like it that way. Right now that means a theology degree alongside full-time design work. Faith shapes why I create, not only what I create.',
      ),
    ],
  };
  CH.tl = {
    name: 'TOOLS',
    col: '#7c4ddb',
    items: [
      ['Figma', 'Home base', 'Screens, prototypes, design systems and Figma Make.'],
      ['Illustrator & Photoshop', 'Visual design', 'Identity, illustration and image work.'],
      ['InDesign, Aero & Dimension', 'Layout & 3D mock-ups', 'Editorial layouts, AR and packaging mock-ups.'],
      ['After Effects & Premiere', 'Motion & video', 'Animated promos, motion graphics and edits.'],
      ['Animate', '2D animation', 'Frame-by-frame and character animation.'],
      ['Blender & Spline', '3D', 'Modelling, scenes and interactive 3D.'],
      ['Procreate', 'Drawing', 'Sketching and illustration on iPad.'],
      ['Zeplin & Jira', 'Handoff & sprints', 'Developer handoff linked to Jira tickets in 2-week sprints.'],
      ['Claude & AI tools', 'AI workflow', 'Claude Design & Code, ChatGPT, Gemini and Canva AI.'],
      ['Vercel & Antigravity', 'Shipping', 'Building and deploying sites and apps.'],
      ['HTML, CSS, JS & React', 'Code', 'Front-end foundations from the Codecamp bootcamp.'],
      ['Slack & Microsoft Office', 'Team', 'Day-to-day communication and documents.'],
    ].map((a) => I(...a)),
  };
  CH.xp = {
    name: 'EXPERIMENTAL',
    col: '#d14fa8',
    items: [
      I(
        'VR-17 Portfolio Synth',
        '3D · WebGL · Web Audio',
        'This portfolio: a playable 3D synthesizer built with Three.js and the Web Audio API, designed from a Figma synth, then rebuilt in cardboard. I was told to think outside the box. I used it.',
        {
          sum: 'This portfolio: a playable 3D synthesizer built with Three.js and the Web Audio API, designed in Figma and rebuilt in cardboard.',
        },
      ),
      I(
        'Retro Grade pixel art',
        'Pixel illustration',
        'Pixel-art characters and scenes from the Retro Grade project. Every pixel placed by hand, like a very patient mosaic.',
        {
          sum: 'Hand-placed pixel-art characters and scenes from the Retro Grade project.',
          img: [im('g53', 'Pixel art'), im('g52', 'Magazine mock-up')],
        },
      ),
      I('Open slot', 'Experimental · coming soon', "Reserved for the next experiment. I'm doing the homework."),
      I('Open slot', 'Experimental · coming soon', "Reserved for the next experiment. I'm doing the homework."),
    ],
  };
}

/* The menu behind the burger (editable in /admin).
   items: the top level, in order. go = home | about | projects (opens the Projects list) | contact | mode:<key> (one section's projects) | link (href).
   projects: the sections listed under Projects, with the name the menu shows for each. */
export const MENU = {
  items: [
    { label: 'Home', go: 'home' },
    { label: 'About', go: 'about' },
    { label: 'Projects', go: 'projects' },
    { label: 'Contact', go: 'contact' },
  ],
  projects: [
    { key: 'gd', label: 'Graphic design' },
    { key: 'ux', label: 'UI/UX design' },
    { key: 'mo', label: 'Motion & 3D' },
    { key: 'tl', label: 'Tools' },
    { key: 'xp', label: 'Experimental' },
  ],
};

/* Things left lying on the workbench (organisms/keepsakes.js).
   polaroids: eight snapshots of Vick's life, personality and faith. Give one an image (img: 'assets/img/<file>.jpg') and a caption (cap);
   until it has an image it shows a pencil placeholder. note: longer copy for the hover tip (optional).
   todo: the sticky note's list; done: true ticks the box. */
export const DESK = {
  polaroids: [
    { img: '', cap: 'faith', note: '' },
    { img: '', cap: 'family', note: '' },
    { img: '', cap: 'on the mats', note: '' },
    { img: '', cap: 'game night', note: '' },
    { img: '', cap: 'up a mountain', note: '' },
    { img: '', cap: 'the dogs', note: '' },
    { img: '', cap: 'sketchbook', note: '' },
    { img: '', cap: 'me, mostly', note: '' },
  ],
  todo: [
    { t: 'make the logo bigger', done: true },
    { t: 'win an Awwward' },
    { t: 'name my layers properly' },
    { t: 'dark mode (obviously)', done: true },
    { t: 'delete final_FINAL_v7' },
    { t: 'kern everything. twice.' },
    { t: 'hear “love it, no changes”' },
    { t: 'touch grass' },
  ],
};

/* Who Vick is, as plain facts from the CV, for search engines and AI assistants. scripts/generate.mjs turns this and CH
   into the page's title, description and structured data (index.html), /portfolio/, llms.txt, robots.txt and sitemap.xml.
   Only facts Vick has supplied. Change it here, then run `npm run generate`. */
export const PROFILE = {
  url: 'https://vick-does-creative.netlify.app/',
  name: 'Vickhal Roopram',
  short: 'Vick',
  brand: 'Vick Does Creative',
  role: 'UX/UI, illustration and motion designer',
  jobTitle: 'UX/UI Designer',
  employer: 'Floodlight Studios',
  country: 'South Africa',
  countryCode: 'ZA',
  email: 'vickhal10@gmail.com',
  tagline: 'Research like a nerd. Play like a kid. Use the box.',
  /* the search result: page title (under 60 characters) and description (under 160) */
  title: 'Vickhal Roopram · UX/UI & Motion Designer, South Africa',
  description:
    "I'm Vickhal Roopram, a UX/UI and motion designer in South Africa. UX case studies, branding, packaging and animation, in a portfolio you can play.",
  /* the one-paragraph introduction on /portfolio/ and in llms.txt */
  intro:
    "I'm Vickhal Roopram (Vick), a UX/UI, illustration and motion designer from South Africa. I'm the UX/UI designer at Floodlight Studios, a studio that builds SaaS products, and I've been designing since I was 12. Every project starts with research, because research is what opens up better ideas. Then I make it fun to use.",
  image: 'assets/ui/og-image.jpg',
  imageAlt:
    'The welcome sheet of Vick Does Creative: a hand-drawn cardboard synth on a desk, with the name Vickhal Roopram',
  skills: [
    'UX/UI design',
    'Prototyping',
    'Design systems',
    'Motion design',
    '2D and 3D animation',
    'Illustration',
    'Graphic design',
    'Branding',
    'Packaging design',
    'Design thinking',
    'AI workflow automation',
    'Figma',
    'Adobe Creative Cloud',
    'After Effects',
    'Blender',
    'Spline',
  ],
  work: [
    ['UX/UI Designer', 'Floodlight Studios', '2021', ''],
    ['Graphic & Motion Designer', 'Genesis Printing', '2017', '2019'],
    ['Graphic Designer', 'Katz Cakes', '2017', '2019'],
    ['Multimedia Engineer & Motion Designer', 'Conquering Through Prayer Ministries International', '2017', '2019'],
  ],
  education: [
    ['National Diploma in Visual Communication', 'Durban University of Technology', '2018–2020'],
    ['UX/UI short course', 'University of Cape Town', '2021–2022'],
    ['Frontend developer bootcamp', 'Codecamp.org', '2021'],
    ['Theology degree', 'Doxa Deo & SATS', '2023–2026'],
  ],
  awards: [
    'Loeries Student Portfolio Bootcamp: Top 3 finalist in Africa (2020)',
    'SA Gold Pack Design Awards: Bronze, and a Top 100 international entry at WorldStar Student (2020)',
    'Systems for SASSA and Home Affairs presented to the South African Parliament (2020)',
    'Prototype reviewed for a South African government initiative (2022)',
  ],
};
