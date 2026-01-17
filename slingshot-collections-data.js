/**
 * Slingshot Sports Collection Data
 * 
 * This file contains the scraped data from the browser subagent.
 * Use this data to download hero images and create database entries.
 */

// Data extracted from browser scraping (Batches 1-3 + Web Specials)
const SLINGSHOT_COLLECTIONS = [
    // Batch 1: Kite Collections (15 items)
    {
        "title": "KITE",
        "subtitle": "High-performance kites for big air, freestyle, and freeride sessions.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Headers_MachineV3.jpg?v=1755639283&width=2400",
        "slug": "kite-main",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/kite-main"
    },
    {
        "title": "Kites",
        "subtitle": "High-performance kites for big air, freestyle, and freeride sessions.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Kites_811c1c75-f10f-4556-a95f-e4224f319d53.jpg?v=1757694352&width=2400",
        "slug": "kites",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/kites"
    },
    {
        "title": "Twin Tips",
        "subtitle": "Versatile twin tip boards for all-around kiteboarding performance.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_TwinTips.jpg?v=1757694353&width=2400",
        "slug": "twin-tips",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/twin-tips"
    },
    {
        "title": "Bars",
        "subtitle": "Precision control bars for kiteboarding.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Bars.jpg?v=1757694352&width=2400",
        "slug": "bars",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/bars"
    },
    {
        "title": "Surfboards",
        "subtitle": "Directional surfboards for wave riding.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Surfboards.jpg?v=1757694353&width=2400",
        "slug": "surfboards",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/surfboards"
    },
    {
        "title": "Kite Foil Boards",
        "subtitle": "Specialized boards for kite foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_KiteFoilBoards.jpg?v=1757694352&width=2400",
        "slug": "kite-foil-boards",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/kite-foil-boards"
    },
    {
        "title": "Kite Foils",
        "subtitle": "Complete foil systems for kiteboarding.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_KiteFoils.jpg?v=1757694352&width=2400",
        "slug": "kite-foils",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/kite-foils"
    },
    {
        "title": "Kite Accessories",
        "subtitle": "Essential accessories for your kite setup.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_KiteAccessories.jpg?v=1757694352&width=2400",
        "slug": "kite-accessories",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/kite-accessories"
    },
    {
        "title": "Foot Straps",
        "subtitle": "Comfortable and secure foot straps.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_FootStraps.jpg?v=1757694352&width=2400",
        "slug": "foot-straps",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/foot-straps"
    },
    {
        "title": "Trainer Kites",
        "subtitle": "Learn to kite with trainer kites.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_TrainerKites.jpg?v=1757694353&width=2400",
        "slug": "trainer-kites",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/trainer-kites"
    },
    {
        "title": "Pumps",
        "subtitle": "High-pressure pumps for inflatable kites.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Pumps.jpg?v=1757694353&width=2400",
        "slug": "pumps",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/pumps"
    },
    {
        "title": "Kite Parts",
        "subtitle": "Replacement parts and upgrades.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_KiteParts.jpg?v=1757694352&width=2400",
        "slug": "kite-parts",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/kite-parts"
    },
    {
        "title": "Apparel",
        "subtitle": "Slingshot branded apparel and gear.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Apparel.jpg?v=1757694352&width=2400",
        "slug": "apparel",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/apparel"
    },
    {
        "title": "Big Air",
        "subtitle": "Gear optimized for big air performance.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_BigAir.jpg?v=1757694352&width=2400",
        "slug": "big-air",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/big-air"
    },
    {
        "title": "Wave Mastery",
        "subtitle": "Equipment for wave riding excellence.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WaveMastery.jpg?v=1757694353&width=2400",
        "slug": "wave-mastery",
        "category": "Kite",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wave-mastery"
    },

    // Batch 2: Wing & Wake Collections (15 items)
    {
        "title": "WING",
        "subtitle": "Cutting-edge hydrofoils, wings, and boards for effortless glide and speed. Push your limits.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Wing_62df29e1-1a6a-404a-9bc9-7aa43cb9f768.jpg?v=1757695322&width=2400",
        "slug": "wing-main",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-main"
    },
    {
        "title": "Wings",
        "subtitle": "High-performance wing foiling wings.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Wings.jpg?v=1757695322&width=2400",
        "slug": "wings",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wings"
    },
    {
        "title": "Wing Boards",
        "subtitle": "Performance wing foil boards for all skill levels and conditions.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WingBoards_8b666d55-25a0-4173-b27f-fc0f12724801.jpg?v=1757695406&width=2400",
        "slug": "wing-boards",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-boards"
    },
    {
        "title": "Wing SUP Boards",
        "subtitle": "Stand-up paddle boards optimized for wing foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WingSUP.jpg?v=1757695322&width=2400",
        "slug": "wing-sup-boards",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-sup-boards"
    },
    {
        "title": "Wing Foils",
        "subtitle": "Complete foil systems for wing foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WingFoils.jpg?v=1757695322&width=2400",
        "slug": "wing-foils",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-foils"
    },
    {
        "title": "Wing Accessories",
        "subtitle": "Essential accessories for wing foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WingAccessories.jpg?v=1757695322&width=2400",
        "slug": "wing-accessories",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-accessories"
    },
    {
        "title": "Board Mounting Systems",
        "subtitle": "Mounting systems for foil boards.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_BoardMounting.jpg?v=1757695322&width=2400",
        "slug": "board-mounting-systems",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/board-mounting-systems"
    },
    {
        "title": "Wing Parts",
        "subtitle": "Replacement parts for wings and foils.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WingParts.jpg?v=1757695322&width=2400",
        "slug": "wing-parts",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-parts"
    },
    {
        "title": "Flow State",
        "subtitle": "Gear for the ultimate flow state experience.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_FlowState.jpg?v=1757695322&width=2400",
        "slug": "wing-flow-state",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-flow-state"
    },
    {
        "title": "Glide Zone",
        "subtitle": "Equipment for maximum glide performance.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_GlideZone.jpg?v=1757695322&width=2400",
        "slug": "wing-glide-zone",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wing-glide-zone"
    },
    {
        "title": "Quick Flite",
        "subtitle": "Fast and easy setup for wing foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_QuickFlite.jpg?v=1757695322&width=2400",
        "slug": "quick-flite",
        "category": "Wing",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/quick-flite"
    },
    {
        "title": "WAKE",
        "subtitle": "Pro-level wakeboards and boots designed for the park and boat. Unrivaled pop, flex, and control.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Wake2.jpg?v=1757618481&width=2400",
        "slug": "wake-main",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-main"
    },
    {
        "title": "Wakeboards",
        "subtitle": "Industry-leading wakeboards for cable and boat sessions.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeJibbers_5835e22a-babb-4202-816b-40fb494b6465.jpg?v=1757631155&width=2400",
        "slug": "wakeboards",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wakeboards"
    },
    {
        "title": "Wake Boots",
        "subtitle": "Comfortable and supportive wakeboard boots.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeBoots.jpg?v=1757618481&width=2400",
        "slug": "wake-boots",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-boots"
    },
    {
        "title": "Wake Foil Boards",
        "subtitle": "Boards designed for wake foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeFoilBoards.jpg?v=1757618481&width=2400",
        "slug": "wake-foil-boards",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-foil-boards"
    },

    // Batch 3: More Wake & Foil Collections (15 items)
    {
        "title": "Wake Foils",
        "subtitle": "Complete foil systems for wake foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeFoils.jpg?v=1757618481&width=2400",
        "slug": "wake-foils",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-foils"
    },
    {
        "title": "Wakesurf",
        "subtitle": "Wakesurf boards for endless waves.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Wakesurf.jpg?v=1757618481&width=2400",
        "slug": "wakesurf",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wakesurf"
    },
    {
        "title": "Wake Accessories",
        "subtitle": "Essential accessories for wakeboarding.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeAccessories.jpg?v=1757618481&width=2400",
        "slug": "wake-accessories",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-accessories"
    },
    {
        "title": "Gummy Straps",
        "subtitle": "Comfortable gummy strap bindings.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_GummyStraps.jpg?v=1757618481&width=2400",
        "slug": "gummy-straps",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/gummy-straps"
    },
    {
        "title": "Wake Parts",
        "subtitle": "Replacement parts for wake gear.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeParts.jpg?v=1757618481&width=2400",
        "slug": "wake-parts",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-parts"
    },
    {
        "title": "Jibbers",
        "subtitle": "Boards optimized for cable park jibbing.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Jibbers.jpg?v=1757618481&width=2400",
        "slug": "jibbers",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/jibbers"
    },
    {
        "title": "Senders",
        "subtitle": "Boards built for sending it.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Senders.jpg?v=1757618481&width=2400",
        "slug": "senders",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/senders"
    },
    {
        "title": "Cable Quick Start",
        "subtitle": "Everything you need to start cable riding.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_CableQuickStart.jpg?v=1757618481&width=2400",
        "slug": "cable-quick-start",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/cable-quick-start"
    },
    {
        "title": "Wake Glide Zone",
        "subtitle": "Gear for smooth wake foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeGlideZone.jpg?v=1757618481&width=2400",
        "slug": "wake-glide-zone",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-glide-zone"
    },
    {
        "title": "Dock Pump",
        "subtitle": "Gear for dock pumping and wake foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_DockPump.jpg?v=1757618481&width=2400",
        "slug": "dock-pump",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/dock-pump"
    },
    {
        "title": "Wake Foil Quick Start",
        "subtitle": "Complete packages for wake foiling beginners.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_WakeFoilQuickStart.jpg?v=1757618481&width=2400",
        "slug": "wake-foil-quick-start",
        "category": "Wake",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/wake-foil-quick-start"
    },
    {
        "title": "FOIL",
        "subtitle": "Performance-driven foils for kite, wake, surf, and wing foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_Stabilizers_3ede260f-a78d-455a-9c54-e830c2d2b67d.jpg?v=1755639285&width=2400",
        "slug": "foil-main",
        "category": "Foil",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/foil-main"
    },
    {
        "title": "Foil Boards",
        "subtitle": "Specialized boards for foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_FoilBoards.jpg?v=1755639285&width=2400",
        "slug": "foil-boards",
        "category": "Foil",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/foil-boards"
    },
    {
        "title": "Foil Packages",
        "subtitle": "Complete foil packages ready to ride.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_FoilPackages.jpg?v=1755639285&width=2400",
        "slug": "foil-packages",
        "category": "Foil",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/foil-packages"
    },
    {
        "title": "Foil Front Wings",
        "subtitle": "High-performance front wings for foiling.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/2026SS_Website_Collections_FrontWings.jpg?v=1755639285&width=2400",
        "slug": "foil-front-wings",
        "category": "Foil",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/foil-front-wings"
    },

    // Batch 5: Web Specials (10 items)
    {
        "title": "WEB SPECIALS - FOIL",
        "subtitle": "Exclusive specials on foil gear for every riding style and experience level.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/SLINGWING-HARD-HANDLE-HERO-PISTOL.jpg?v=1677278440&width=2400",
        "slug": "web-specials-foils",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-foils"
    },
    {
        "title": "Web Specials - Foil Front Wings",
        "subtitle": "Discounted foil front wings.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_FrontWings.jpg?v=1677278440&width=2400",
        "slug": "web-specials-foil-front-wings",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-foil-front-wings"
    },
    {
        "title": "Web Specials - Foil Masts",
        "subtitle": "Discounted foil masts.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_Masts.jpg?v=1677278440&width=2400",
        "slug": "web-specials-foil-masts",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-foil-masts"
    },
    {
        "title": "Web Specials - Foil Stabilizers",
        "subtitle": "Discounted foil stabilizers.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_Stabilizers.jpg?v=1677278440&width=2400",
        "slug": "web-specials-foil-stabilizers",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-foil-stabilizers"
    },
    {
        "title": "Web Specials - Foil Packages",
        "subtitle": "Discounted complete foil packages.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_FoilPackages.jpg?v=1677278440&width=2400",
        "slug": "web-specials-foil-packages",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-foil-packages"
    },
    {
        "title": "Web Specials - Windsurf Foils",
        "subtitle": "Discounted windsurf foil gear.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_Windsurf.jpg?v=1677278440&width=2400",
        "slug": "web-specials-foil-windsurf",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-foil-windsurf"
    },
    {
        "title": "Web Specials - Foil Parts",
        "subtitle": "Discounted foil replacement parts.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_FoilParts.jpg?v=1677278440&width=2400",
        "slug": "web-specials-foil-parts",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-foil-parts"
    },
    {
        "title": "Web Specials - Kite",
        "subtitle": "Discounted kite gear and equipment.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_Kite.jpg?v=1677278440&width=2400",
        "slug": "web-specials-kite",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-kite"
    },
    {
        "title": "Web Specials - Kites",
        "subtitle": "Discounted kites.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_Kites.jpg?v=1677278440&width=2400",
        "slug": "web-specials-kites",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-kites"
    },
    {
        "title": "Web Specials - Kite Bars",
        "subtitle": "Discounted kite control bars.",
        "heroImageUrl": "https://slingshotsports.com/cdn/shop/files/WebSpecials_Bars.jpg?v=1677278440&width=2400",
        "slug": "web-specials-kite-bars",
        "category": "Web Specials",
        "collectionUrl": "https://slingshotsports.com/en-eu/collections/web-specials-kite-bars"
    }
];

module.exports = { SLINGSHOT_COLLECTIONS };
