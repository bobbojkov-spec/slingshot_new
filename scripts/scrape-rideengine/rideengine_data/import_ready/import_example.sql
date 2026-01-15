-- Categories
INSERT INTO categories (id, name, slug, parent_id, level, sort_order) VALUES
(1, 'Harnesses', 'harnesses', NULL, 1, 1),
(2, 'Hyperlock System', 'hyperlock-system', 1, 2, 1),
(3, 'Wing Foil Harnesses', 'wing-foil-harnesses', 1, 2, 2),
(4, 'Spreader Bars', 'spreader-bars', 1, 2, 3),
(5, 'Parts & Accessories', 'harness-parts-accessories', 1, 2, 4),
(6, 'Performance PWC', 'performance-pwc', NULL, 1, 6),
(7, 'PWC Collars & Pontoons', 'pwc-collars-pontoons', 6, 2, 1),
(8, 'Performance Sleds', 'performance-sleds', 6, 2, 2),
(9, 'Inflation & Accessories', 'inflation-accessories', NULL, 1, 9),
(10, 'E-Inflation (Air Box)', 'e-inflation', 9, 2, 1),
(11, 'Manual Pumps', 'manual-pumps', 9, 2, 2),
(12, 'Leashes', 'leashes', 9, 2, 3),
(13, 'Foot Straps', 'foot-straps', 9, 2, 4),
(14, 'Vehicle Accessories', 'vehicle-accessories', 9, 2, 5),
(15, 'Protection', 'protection', NULL, 1, 15),
(16, 'Impact Vests', 'impact-vests', 15, 2, 1),
(17, 'Helmets', 'helmets', 15, 2, 2),
(18, 'Hand/Knee Protection', 'hand-knee-protection', 15, 2, 3),
(19, 'Bags', 'bags', NULL, 1, 19),
(20, 'Wheeled Travel', 'wheeled-travel-bags', 19, 2, 1),
(21, 'Board Bags', 'board-bags', 19, 2, 2),
(22, 'Day Protection', 'day-protection', 19, 2, 3),
(23, 'Wetsuits', 'wetsuits', NULL, 1, 23),
(24, 'Men's', 'mens-wetsuits', 23, 2, 1),
(25, 'Women's', 'womens-wetsuits', 23, 2, 2),
(26, 'Wetsuit Accessories', 'wetsuit-accessories', 23, 2, 3),
(27, 'Apparel', 'apparel', NULL, 1, 27),
(28, 'Robes & Ponchos', 'robes-ponchos', 27, 2, 1),
(29, 'Technical Jackets', 'technical-jackets', 27, 2, 2),
(30, 'Water Wear', 'water-wear', 27, 2, 3),
(31, 'Hoodies', 'hoodies', 27, 2, 4),
(32, 'T-Shirts', 't-shirts', 27, 2, 5),
(33, 'Hats', 'hats', 27, 2, 6);


-- Products (example - adjust to your schema)
-- Note: You'll need to adjust this based on your actual database schema

-- Product: Hyperlock Design Upgrade Kit
INSERT INTO products (shopify_id, title, handle, vendor, product_type, description, status)
VALUES (
    7464152170630,
    'Hyperlock Design Upgrade Kit',
    'hyperlock-design-upgrade-kit',
    'Ride Engine',
    'Spare Parts',
    'Hyperlock Design Upgrade kit shipping late October Ride Engine Safety Bulletin: Hyperlock Harness Your safety is our highest priority. We are issuing this bulletin to share details about a rare but im...',
    'active'
);


-- Product: Offshore Pack Harness
INSERT INTO products (shopify_id, title, handle, vendor, product_type, description, status)
VALUES (
    7447655284870,
    'Offshore Pack Harness',
    'offshore-pack-harness',
    'Ride Engine',
    'Harnesses',
    'Long downwind runs or chasing open-ocean swell offer the ultimate glide zone experience, but they also come with inherent risks. Designed for these exposed missions, the Ride Engine Offshore Pack Harn...',
    'active'
);


-- Product: Air Box Mini Electric Pump
INSERT INTO products (shopify_id, title, handle, vendor, product_type, description, status)
VALUES (
    7447646437510,
    'Air Box Mini Electric Pump',
    'air-box-mini-electric-pump',
    'Ride Engine',
    'Pumps',
    'The technology evolution for kites, wings, and boards has rapidly improved to enhance your experience on the water. However, perhaps the most critical component required to get on the water -the pump-...',
    'active'
);


-- Product: Gnar Dolphin Tee
INSERT INTO products (shopify_id, title, handle, vendor, product_type, description, status)
VALUES (
    7405414711430,
    'Gnar Dolphin Tee',
    'gnar-dolphin-tee',
    'Ride Engine',
    'Apparel',
    'The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.• 50% polyester, 25% combed ring-spun cott...',
    'active'
);


-- Product: Ride With Pride Tee
INSERT INTO products (shopify_id, title, handle, vendor, product_type, description, status)
VALUES (
    7405414613126,
    'Ride With Pride Tee',
    'ride-with-pride-tee',
    'Ride Engine',
    'Apparel',
    'The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.• 50% polyester, 25% combed ring-spun cott...',
    'active'
);
