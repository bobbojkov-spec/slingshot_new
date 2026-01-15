-- ============================================================================
-- RIDE ENGINE PRODUCTS
-- ============================================================================

-- Product 1: Hyperlock Design Upgrade Kit
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Hyperlock Design Upgrade Kit',
    NULL,
    'ride-engine-hyperlock-design-upgrade-kit',
    'WAKE',
    'Spare Parts',
    'active',
    '<h3 class="p1">
<meta charset="utf-8"> <span style="text-decoration: underline;"> <em>Hyperlock Design Upgrade kit shipping late October</em></span>
</h3>
<p> </p>
<h3 class="p1"><strong>Ride Engine Safety Bulletin: Hyperlock Harness</strong></h3>
<p class="p1">Your safety is our highest priority. We are issuing this bulletin to share details about a rare but important issue identified with the Hyperlock harness system and to provide clear steps to ensure your harness continues to perform as intended.</p>
<p class="p1">A very limited number of riders have reported spreader bar slippage under extreme load conditions. While these cases are uncommon, we take every instance seriously. To address this, we have implemented a design upgrade component that fully eliminates the possibility of slippage.</p>
<h3 class="p1"><strong>Potential Risk</strong></h3>
<p class="p1">In the rare event of slippage, the spreader bar may shift or release unexpectedly, which could compromise your connection to the harness and result in a loss of control.</p>
<h3 class="p1"><strong>Your Choice and Confidence</strong></h3>
<p class="p1">Even though this issue is rare, your comfort and peace of mind matter most. If you feel uncertain about using your harness, we encourage you to request and install the free Design Upgrade component for your harness before your next use.</p>
<h3 class="p1"><strong>How to Identify if Your Harness Is Impacted</strong></h3>
<h4>Step 1: Identify Ratchet Receiver Type</h4>
<ul class="ul1">
<li class="li1">
<span class="s1"></span>Impacted harnesses have an open receiver on the ratchet body (see illustration below).</li>
<li class="li1">
<span class="s1"></span>Only the following harness models/years are affected: 2025 production year Hyperlock.</li>
<li class="li1">
<span class="s1"></span>If you are unsure whether your harness is impacted,<a href="https://7-nation.zendesk.com/auth/v2/login/signin?return_to=https%3A%2F%2Fsupport.rideengine.com%2Fhc%2Fen-us%2Farticles%2F41501019091348%2Flive_preview%2F01K5VTZWHNWJG1VCXVFV2R7PK8&amp;theme=hc&amp;locale=en-us&amp;brand_id=360005184152&amp;auth_origin=360005184152%2Ctrue%2Ctrue"> </a><a href="https://support.rideengine.com/hc/en-us/categories/41497786767252-HYPERLOCK-SAFETY-BULLETIN">please visit our support page</a> and our Rider Support team will help you confirm.<br>
</li>
</ul>
<p><img alt="" src="https://cdn.shopify.com/s/files/1/0279/1230/6822/files/5.jpg?v=1758653143"></p>
<h4>Step 2: Identify if T-Nuts are Exposed</h4>
<ul>
<li>If T-Nuts are exposed the HyperLock Design Upgrade Kit can be installed on your harness</li>
<li>If T-Nuts are not exposed please contact our <a rel="noopener" title="Rider Support Team Contact Page" href="https://support.rideengine.com/hc/en-us/requests/new?ticket_form_id=41989517300500" target="_blank">Rider Support</a> Team and they will assist you further.</li>
</ul>
<p><img><img src="https://cdn.shopify.com/s/files/1/0279/1230/6822/files/RE_Service_Bulletin_Hyperlock_-_T-nuts_accessibility_Demo.jpg?v=1759950140" alt=""></p>
<p><br></p>
<p> </p>',
    'Hyperlock Design Upgrade Kit',
    'Hyperlock Design Upgrade kit shipping late October Ride Engine Safety Bulletin: Hyperlock Harness Your safety is our highest priority. We are issuing this bulle',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Hyperlock Design Upgrade Kit',
    '<h3 class="p1">
<meta charset="utf-8"> <span style="text-decoration: underline;"> <em>Hyperlock Design Upgrade kit shipping late October</em></span>
</h3>
<p> </p>
<h3 class="p1"><strong>Ride Engine Safety Bulletin: Hyperlock Harness</strong></h3>
<p class="p1">Your safety is our highest priority. We are issuing this bulletin to share details about a rare but important issue identified with the Hyperlock harness system and to provide clear steps to ensure your harness continues to perform as intended.</p>
<p class="p1">A very limited number of riders have reported spreader bar slippage under extreme load conditions. While these cases are uncommon, we take every instance seriously. To address this, we have implemented a design upgrade component that fully eliminates the possibility of slippage.</p>
<h3 class="p1"><strong>Potential Risk</strong></h3>
<p class="p1">In the rare event of slippage, the spreader bar may shift or release unexpectedly, which could compromise your connection to the harness and result in a loss of control.</p>
<h3 class="p1"><strong>Your Choice and Confidence</strong></h3>
<p class="p1">Even though this issue is rare, your comfort and peace of mind matter most. If you feel uncertain about using your harness, we encourage you to request and install the free Design Upgrade component for your harness before your next use.</p>
<h3 class="p1"><strong>How to Identify if Your Harness Is Impacted</strong></h3>
<h4>Step 1: Identify Ratchet Receiver Type</h4>
<ul class="ul1">
<li class="li1">
<span class="s1"></span>Impacted harnesses have an open receiver on the ratchet body (see illustration below).</li>
<li class="li1">
<span class="s1"></span>Only the following harness models/years are affected: 2025 production year Hyperlock.</li>
<li class="li1">
<span class="s1"></span>If you are unsure whether your harness is impacted,<a href="https://7-nation.zendesk.com/auth/v2/login/signin?return_to=https%3A%2F%2Fsupport.rideengine.com%2Fhc%2Fen-us%2Farticles%2F41501019091348%2Flive_preview%2F01K5VTZWHNWJG1VCXVFV2R7PK8&amp;theme=hc&amp;locale=en-us&amp;brand_id=360005184152&amp;auth_origin=360005184152%2Ctrue%2Ctrue"> </a><a href="https://support.rideengine.com/hc/en-us/categories/41497786767252-HYPERLOCK-SAFETY-BULLETIN">please visit our support page</a> and our Rider Support team will help you confirm.<br>
</li>
</ul>
<p><img alt="" src="https://cdn.shopify.com/s/files/1/0279/1230/6822/files/5.jpg?v=1758653143"></p>
<h4>Step 2: Identify if T-Nuts are Exposed</h4>
<ul>
<li>If T-Nuts are exposed the HyperLock Design Upgrade Kit can be installed on your harness</li>
<li>If T-Nuts are not exposed please contact our <a rel="noopener" title="Rider Support Team Contact Page" href="https://support.rideengine.com/hc/en-us/requests/new?ticket_form_id=41989517300500" target="_blank">Rider Support</a> Team and they will assist you further.</li>
</ul>
<p><img><img src="https://cdn.shopify.com/s/files/1/0279/1230/6822/files/RE_Service_Bulletin_Hyperlock_-_T-nuts_accessibility_Demo.jpg?v=1759950140" alt=""></p>
<p><br></p>
<p> </p>',
    'Hyperlock Design Upgrade Kit',
    'Hyperlock Design Upgrade kit shipping late October Ride Engine Safety Bulletin: Hyperlock Harness Your safety is our highest priority. We are issuing this bulle',
    ARRAY[]
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Variant: Default Title
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3260554200',
    0,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/RE_Hyperlock_Design_Upgrade_Studio_04.jpg?v=1758660858',
    'Hyperlock Design Upgrade Kit',
    1,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Image 2
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/Service_Carousel.jpg?v=1759950884',
    'Hyperlock Design Upgrade Kit',
    2,
    false
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 2: Offshore Pack Harness
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Offshore Pack Harness',
    NULL,
    'ride-engine-offshore-pack-harness',
    'WING',
    'Harnesses',
    'active',
    '<p>Long downwind runs or chasing open-ocean swell offer the ultimate glide zone experience, but they also come with inherent risks. Designed for these exposed missions, the Ride Engine Offshore Pack Harness is your essential companion for safety, comfort, and endurance.  </p>
<p>Built on the ultra-light, shadow-like fit of the Free Float 4-Point Suspension Chest Cradle, the Offshore Pack features a 1L hydration bladder for sustained performance and a high-mounted harness line NUG hook, keeping your waist free and clear for unrestricted movement and leashing options. The high-visibility coloring enhances safety, while an EVA-backed harness hook connection ensures long distance comfort.  </p>',
    'Offshore Pack Harness',
    'Long downwind runs or chasing open-ocean swell offer the ultimate glide zone experience, but they also come with inherent risks. Designed for these exposed miss',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Offshore Pack Harness',
    '<p>Long downwind runs or chasing open-ocean swell offer the ultimate glide zone experience, but they also come with inherent risks. Designed for these exposed missions, the Ride Engine Offshore Pack Harness is your essential companion for safety, comfort, and endurance.  </p>
<p>Built on the ultra-light, shadow-like fit of the Free Float 4-Point Suspension Chest Cradle, the Offshore Pack features a 1L hydration bladder for sustained performance and a high-mounted harness line NUG hook, keeping your waist free and clear for unrestricted movement and leashing options. The high-visibility coloring enhances safety, while an EVA-backed harness hook connection ensures long distance comfort.  </p>',
    'Offshore Pack Harness',
    'Long downwind runs or chasing open-ocean swell offer the ultimate glide zone experience, but they also come with inherent risks. Designed for these exposed miss',
    ARRAY['Harness', 'Wing']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Link to wing-foil-harnesses category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'wing-foil-harnesses'
  ON CONFLICT DO NOTHING;

  -- Variant: S / High Visibility Yellow
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3260510001',
    16000,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: M / High Visibility Yellow
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3260510003',
    16000,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: L / High Visibility Yellow
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3260510005',
    16000,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/REOffshoreBagFront.jpg?v=1755548616',
    'Offshore Pack Harness',
    1,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Image 2
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/REOffshoreBagBack.jpg?v=1755548616',
    'Offshore Pack Harness',
    2,
    false
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 3: Air Box Mini Electric Pump
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Air Box Mini Electric Pump',
    NULL,
    'ride-engine-air-box-mini-electric-pump',
    'WAKE',
    'Pumps',
    'active',
    '<p>The technology evolution for kites, wings, and boards has rapidly improved to enhance your experience on the water. However, perhaps the most critical component required to get on the water -the pump- has remained unchanged since the days of flip phones. Not anymore. Gone are the times of struggling with manual pumping, thanks to the Air Box: Ride Engine''s rechargeable electric pump. Engineered alongside a top electric pump manufacturer, the Air Box has a powerful two-stage system that automatically switches from low-pressure, high-volume pumping to high-pressure, low-volume delivering the fastest inflation possible.</p>
<p>Eliminate the worry of over or under inflating your gear when you set your desired air pressure on the Air Box. The smart inflation technology has real-time pressure monitoring, ensuring an automatic shut-off once the pump reaches the selected pressure. Powered by a lithium-ion battery cell, it can inflate four to six kites or wings, and three SUPs on a single charge.</p>
<ul>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Size </span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">139mm X 125mm X 69mm</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Battery</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> 4500mAh 14.8V</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Max PSI</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> 20psi</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Types of Motors</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> Brushless DC</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">High Volume</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none white-space-prewrap"> </span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Motor Max PSI</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> 1.8psi</span></strong></li>
</ul>
<p>INCLUDES:<span> </span>Air Box Mini, Hose (3''), 4 Nozzles, bag, USB-C Charging Cable</p>',
    'Air Box Mini Electric Pump',
    'The technology evolution for kites, wings, and boards has rapidly improved to enhance your experience on the water. However, perhaps the most critical component',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Air Box Mini Electric Pump',
    '<p>The technology evolution for kites, wings, and boards has rapidly improved to enhance your experience on the water. However, perhaps the most critical component required to get on the water -the pump- has remained unchanged since the days of flip phones. Not anymore. Gone are the times of struggling with manual pumping, thanks to the Air Box: Ride Engine''s rechargeable electric pump. Engineered alongside a top electric pump manufacturer, the Air Box has a powerful two-stage system that automatically switches from low-pressure, high-volume pumping to high-pressure, low-volume delivering the fastest inflation possible.</p>
<p>Eliminate the worry of over or under inflating your gear when you set your desired air pressure on the Air Box. The smart inflation technology has real-time pressure monitoring, ensuring an automatic shut-off once the pump reaches the selected pressure. Powered by a lithium-ion battery cell, it can inflate four to six kites or wings, and three SUPs on a single charge.</p>
<ul>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Size </span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">139mm X 125mm X 69mm</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Battery</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> 4500mAh 14.8V</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Max PSI</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> 20psi</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Types of Motors</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> Brushless DC</span></strong></li>
<li class="cvGsUA direction-ltr align-start para-style-body" style="font-weight: bold;"><strong><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">High Volume</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none white-space-prewrap"> </span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none">Motor Max PSI</span><span class="a_GcMg font-feature-liga-off font-feature-clig-off font-feature-calt-off text-decoration-none text-strikethrough-none"> 1.8psi</span></strong></li>
</ul>
<p>INCLUDES:<span> </span>Air Box Mini, Hose (3''), 4 Nozzles, bag, USB-C Charging Cable</p>',
    'Air Box Mini Electric Pump',
    'The technology evolution for kites, wings, and boards has rapidly improved to enhance your experience on the water. However, perhaps the most critical component',
    ARRAY['Accessories', 'airbox', 'pumps']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Variant: Default Title
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3260550000',
    24900,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/AirBoxMiniWeb01.jpg?v=1755269324',
    'Air Box Mini Electric Pump',
    1,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Image 2
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/AirBoxMiniWeb02.jpg?v=1755269335',
    'Air Box Mini Electric Pump',
    2,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 3
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/AirBoxMiniWeb03_7e57a74a-318f-44ea-b7ea-77ce2e8065e4.jpg?v=1755269803',
    'Air Box Mini Electric Pump',
    3,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 4
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/AirBoxMiniWeb04.jpg?v=1755269803',
    'Air Box Mini Electric Pump',
    4,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 5
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/AirBoxMiniWeb05.jpg?v=1755269803',
    'Air Box Mini Electric Pump',
    5,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 6
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/RE_AIRBOX_MINI_USB_VIEW.jpg?v=1756228699',
    'Air Box Mini Electric Pump',
    6,
    false
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 4: Gnar Dolphin Tee
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Gnar Dolphin Tee',
    NULL,
    'ride-engine-gnar-dolphin-tee',
    'WAKE',
    'Apparel',
    'active',
    '<p>The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.<br><br>• 50% polyester, 25% combed ring-spun cotton, 25% rayon<br>• Fabric weight: 3.4 oz/yd² (115.3 g/m²)<br>• Pre-shrunk for extra durability<br>• 40 singles<br>• Regular fit<br>• Side-seamed construction<br>• Blank product sourced from Guatemala, Nicaragua, Honduras, or the US</p>',
    'Gnar Dolphin Tee',
    'The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.• ',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Gnar Dolphin Tee',
    '<p>The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.<br><br>• 50% polyester, 25% combed ring-spun cotton, 25% rayon<br>• Fabric weight: 3.4 oz/yd² (115.3 g/m²)<br>• Pre-shrunk for extra durability<br>• 40 singles<br>• Regular fit<br>• Side-seamed construction<br>• Blank product sourced from Guatemala, Nicaragua, Honduras, or the US</p>',
    'Gnar Dolphin Tee',
    'The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.• ',
    ARRAY['Apparel', 'Printful', 'Shirts']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Link to apparel category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'apparel'
  ON CONFLICT DO NOTHING;

  -- Link to t-shirts category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 't-shirts'
  ON CONFLICT DO NOTHING;

  -- Variant: Solid Black Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6584',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid Black Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6585',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid Black Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6586',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid Black Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6587',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid Black Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6588',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid Black Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6589',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid Black Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6590',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Charcoal-Black Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6504',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Charcoal-Black Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6505',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Charcoal-Black Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6506',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Charcoal-Black Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6507',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Charcoal-Black Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6508',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Charcoal-Black Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6509',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Charcoal-Black Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6510',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Navy Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6552',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Navy Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6553',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Navy Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6554',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Navy Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6555',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Navy Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6556',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Navy Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6557',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Navy Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6558',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6576',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6577',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6578',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6579',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6580',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6581',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6582',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Grey Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6536',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Grey Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6537',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Grey Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6538',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Grey Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6539',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Grey Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6540',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Grey Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6541',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Grey Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '5642766_6542',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-solid-black-triblend-front-6842255d89b91.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    1,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Image 2
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-solid-black-triblend-back-6842255d8b00c.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    2,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 3
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-charcoal-black-triblend-front-6842255d8bcd2.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    3,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 4
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-charcoal-black-triblend-back-6842255d8d2f2.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    4,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 5
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-navy-triblend-front-6842255d9006e.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    5,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 6
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-navy-triblend-back-6842255d9421d.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    6,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 7
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-red-triblend-front-6842255d98fcd.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    7,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 8
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-red-triblend-back-6842255d9ccf9.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    8,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 9
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-grey-triblend-front-6842255da02f3.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    9,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 10
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-grey-triblend-back-6842255da41f8.jpg?v=1749165417',
    'Gnar Dolphin Tee',
    10,
    false
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 5: Ride With Pride Tee
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Ride With Pride Tee',
    NULL,
    'ride-engine-ride-with-pride-tee',
    'WAKE',
    'Apparel',
    'active',
    '<p>The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.<br><br>• 50% polyester, 25% combed ring-spun cotton, 25% rayon<br>• Fabric weight: 3.4 oz/yd² (115.3 g/m²)<br>• Pre-shrunk for extra durability<br>• 40 singles<br>• Regular fit<br>• Side-seamed construction<br>• Blank product sourced from Guatemala, Nicaragua, Honduras, or the US<br></p>',
    'Ride With Pride Tee',
    'The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.• ',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Ride With Pride Tee',
    '<p>The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.<br><br>• 50% polyester, 25% combed ring-spun cotton, 25% rayon<br>• Fabric weight: 3.4 oz/yd² (115.3 g/m²)<br>• Pre-shrunk for extra durability<br>• 40 singles<br>• Regular fit<br>• Side-seamed construction<br>• Blank product sourced from Guatemala, Nicaragua, Honduras, or the US<br></p>',
    'Ride With Pride Tee',
    'The tri-blend fabric creates a vintage, fitted look. And extreme durability makes this t-shirt withstand repeated washings and still remain super comfortable.• ',
    ARRAY['Apparel', 'Printful', 'Shirts']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Link to apparel category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'apparel'
  ON CONFLICT DO NOTHING;

  -- Link to t-shirts category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 't-shirts'
  ON CONFLICT DO NOTHING;

  -- Variant: Red Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6576',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6577',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6578',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6579',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6580',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6581',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Red Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6582',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Mauve Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_9761',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Mauve Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_9762',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Mauve Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_9763',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Mauve Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_9764',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Mauve Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_9765',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Mauve Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_9766',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Oatmeal Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6821',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Oatmeal Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6822',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Oatmeal Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6823',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Oatmeal Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6824',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Oatmeal Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6825',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Oatmeal Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6826',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Oatmeal Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6827',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: White Fleck Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6608',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: White Fleck Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6609',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: White Fleck Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6610',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: White Fleck Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6611',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: White Fleck Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6612',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: White Fleck Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6613',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: White Fleck Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_6614',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid White Triblend / XS
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_16792',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid White Triblend / S
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_16793',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid White Triblend / M
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_16794',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid White Triblend / L
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_16795',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid White Triblend / XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_16796',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid White Triblend / 2XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_16797',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Solid White Triblend / 3XL
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '7595911_16798',
    2999,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-mauve-triblend-front-684225086eaff.jpg?v=1749165332',
    'Ride With Pride Tee',
    1,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Image 2
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-red-triblend-front-6842250871e7c.jpg?v=1749165333',
    'Ride With Pride Tee',
    2,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 3
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-red-triblend-back-6842250872a25.jpg?v=1749165333',
    'Ride With Pride Tee',
    3,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 4
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-mauve-triblend-back-68422508740b9.jpg?v=1749165332',
    'Ride With Pride Tee',
    4,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 5
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-oatmeal-triblend-front-6842250876aea.jpg?v=1749165333',
    'Ride With Pride Tee',
    5,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 6
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-oatmeal-triblend-back-684225087a9ca.jpg?v=1749165333',
    'Ride With Pride Tee',
    6,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 7
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-white-fleck-triblend-front-684225087e458.jpg?v=1749165333',
    'Ride With Pride Tee',
    7,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 8
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-white-fleck-triblend-back-6842250882c48.jpg?v=1749165333',
    'Ride With Pride Tee',
    8,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 9
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-solid-white-triblend-front-684225088601f.jpg?v=1749165332',
    'Ride With Pride Tee',
    9,
    false
  )
  ON CONFLICT DO NOTHING;

  -- Image 10
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/unisex-tri-blend-t-shirt-solid-white-triblend-back-684225088a758.jpg?v=1749165332',
    'Ride With Pride Tee',
    10,
    false
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 6: Basis Quick Dry Long Sleeve
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Basis Quick Dry Long Sleeve',
    NULL,
    'ride-engine-basis-quick-dry-long-sleeve',
    'WAKE',
    'Water Wear',
    'active',
    '<p>Crafted from a moisture-wicking, quick-drying semi-perforated fabric, the Basis boasts an impressive UPF rating of 50+. Its 4-way stretch and performance-oriented fit ensure durability and sun protection, making it suitable for beachside activities as well as epic long session on the water. </p>
<h3>Features:</h3>
<ul>
<li>UPF 50+ protection from the sun’s rays.</li>
<li>4-way stretch quick dry material.<br>
</li>
<li>Thumb hole sleeve providing stay in place performance.</li>
<li>Performance comfort fit.</li>
</ul>',
    'Basis Quick Dry Long Sleeve',
    'Crafted from a moisture-wicking, quick-drying semi-perforated fabric, the Basis boasts an impressive UPF rating of 50+. Its 4-way stretch and performance-orient',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Basis Quick Dry Long Sleeve',
    '<p>Crafted from a moisture-wicking, quick-drying semi-perforated fabric, the Basis boasts an impressive UPF rating of 50+. Its 4-way stretch and performance-oriented fit ensure durability and sun protection, making it suitable for beachside activities as well as epic long session on the water. </p>
<h3>Features:</h3>
<ul>
<li>UPF 50+ protection from the sun’s rays.</li>
<li>4-way stretch quick dry material.<br>
</li>
<li>Thumb hole sleeve providing stay in place performance.</li>
<li>Performance comfort fit.</li>
</ul>',
    'Basis Quick Dry Long Sleeve',
    'Crafted from a moisture-wicking, quick-drying semi-perforated fabric, the Basis boasts an impressive UPF rating of 50+. Its 4-way stretch and performance-orient',
    ARRAY['Clothing', 'water wear']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Link to apparel category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'apparel'
  ON CONFLICT DO NOTHING;

  -- Link to water-wear category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'water-wear'
  ON CONFLICT DO NOTHING;

  -- Variant: S / Granite Grey
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250723011',
    8900,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: M / Granite Grey
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250723013',
    8900,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: L / Granite Grey
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250723015',
    8900,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: XL / Granite Grey
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250723017',
    8900,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/REquickdryfront2.jpg?v=1756146299',
    'Basis Quick Dry Long Sleeve',
    1,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Image 2
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/REquickdryback2.jpg?v=1756146299',
    'Basis Quick Dry Long Sleeve',
    2,
    false
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 7: RE Foot Strap Replacement Hardware Kit
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'RE Foot Strap Replacement Hardware Kit',
    NULL,
    'ride-engine-re-foot-strap-replacement-hardware-kit',
    'WAKE',
    'Spare Parts',
    'active',
    '<div class="product-block">
<div class="rte">
<p>Replacement footstrap hardware pack for all Ride Engine straps. Package Includes:</p>
<p>- 4 x Phillips head footstraps screws. M6 x 23mm self-tapping screws<br>- 4 x Phillips head footstraps screws. M6 x 22mm machine screws<br>- 4 x washerx</p>
</div>
</div>',
    'RE Foot Strap Replacement Hardware Kit',
    'Replacement footstrap hardware pack for all Ride Engine straps. Package Includes: - 4 x Phillips head footstraps screws. M6 x 23mm self-tapping screws- 4 x Phil',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'RE Foot Strap Replacement Hardware Kit',
    '<div class="product-block">
<div class="rte">
<p>Replacement footstrap hardware pack for all Ride Engine straps. Package Includes:</p>
<p>- 4 x Phillips head footstraps screws. M6 x 23mm self-tapping screws<br>- 4 x Phillips head footstraps screws. M6 x 22mm machine screws<br>- 4 x washerx</p>
</div>
</div>',
    'RE Foot Strap Replacement Hardware Kit',
    'Replacement footstrap hardware pack for all Ride Engine straps. Package Includes: - 4 x Phillips head footstraps screws. M6 x 23mm self-tapping screws- 4 x Phil',
    ARRAY[]
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Variant: Default Title
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3232400000',
    800,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/windsurf-strap-hardware-slingshot-sports-224777.jpg?v=1738349815',
    'RE Foot Strap Replacement Hardware Kit',
    1,
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 8: Hyperlock Rope Conversion Kit
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Hyperlock Rope Conversion Kit',
    NULL,
    'ride-engine-hyperlock-rope-conversion-kit',
    'KITE',
    'Spreader Bars',
    'active',
    '<p>Seeking absolute freedom? The Sliding Rope Conversion Kit for the Hyperlock system offers enhanced maneuverability, allowing smoother directional changes while riding waves. It enables riders to effortlessly engage in toe side riding and facilitates mastery in hydrofoiling. Equipped with a mini-loop connection, extended slider, and stainless-steel ring for increased durability, this kit ensures a seamless experience.</p>
<p><strong>Sizing</strong></p>
<ul>
<li>Small: 8" Spreader Bars
<ul>
<li>Fits XS - S Hyperlock Harnesses</li>
</ul>
</li>
<li>Large: 10" Spreader bars
<ul>
<li>Fits M-XL Hyperlock Harnesses</li>
</ul>
</li>
</ul>
<p><strong>Features</strong></p>
<ul>
<li>5mm Dyneema flying line cored rope.</li>
<li>5mm Dyneema mini-loop.</li>
</ul>
<p><strong>Kit Includes</strong></p>
<ul>
<li>Rope slider</li>
<li>Mini loop</li>
<li>Stainless mounting bar</li>
</ul>',
    'Hyperlock Rope Conversion Kit',
    'Seeking absolute freedom? The Sliding Rope Conversion Kit for the Hyperlock system offers enhanced maneuverability, allowing smoother directional changes while ',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Hyperlock Rope Conversion Kit',
    '<p>Seeking absolute freedom? The Sliding Rope Conversion Kit for the Hyperlock system offers enhanced maneuverability, allowing smoother directional changes while riding waves. It enables riders to effortlessly engage in toe side riding and facilitates mastery in hydrofoiling. Equipped with a mini-loop connection, extended slider, and stainless-steel ring for increased durability, this kit ensures a seamless experience.</p>
<p><strong>Sizing</strong></p>
<ul>
<li>Small: 8" Spreader Bars
<ul>
<li>Fits XS - S Hyperlock Harnesses</li>
</ul>
</li>
<li>Large: 10" Spreader bars
<ul>
<li>Fits M-XL Hyperlock Harnesses</li>
</ul>
</li>
</ul>
<p><strong>Features</strong></p>
<ul>
<li>5mm Dyneema flying line cored rope.</li>
<li>5mm Dyneema mini-loop.</li>
</ul>
<p><strong>Kit Includes</strong></p>
<ul>
<li>Rope slider</li>
<li>Mini loop</li>
<li>Stainless mounting bar</li>
</ul>',
    'Hyperlock Rope Conversion Kit',
    'Seeking absolute freedom? The Sliding Rope Conversion Kit for the Hyperlock system offers enhanced maneuverability, allowing smoother directional changes while ',
    ARRAY['harness parts', 'Hyperlock', 'Kite', 'Parts', 'Spreader Bar']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Link to spreader-bars category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'spreader-bars'
  ON CONFLICT DO NOTHING;

  -- Variant: Small
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250522004',
    6000,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variant: Large
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250522003',
    6000,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/3250522003_HYPERLOCKROPECONVERSION_25X_MAIN_1.jpg?v=1727221136',
    'Hyperlock Rope Conversion Kit',
    1,
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 9: Hyperlock Closed Metal Loop Replacement
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Hyperlock Closed Metal Loop Replacement',
    NULL,
    'ride-engine-hyperlock-closed-metal-loop-replacement',
    'KITE',
    'Spreader Bars',
    'active',
    '<p>For those seeking the utmost secure connection between the chicken loop and harness, the Hyperlock Closed Metal Loop is the answer. It eradicates any chance of false hooking or accidental unhooking. Made from durable 8mm steel and engineered with optimal geometry for all chicken loops, it’s easy to install and ensures reliable performance.</p>
<p><strong>Features</strong></p>
<ul>
<li>8mm stainless steel loop.</li>
<li>Pre-curved loop geometry.</li>
</ul>',
    'Hyperlock Closed Metal Loop Replacement',
    'For those seeking the utmost secure connection between the chicken loop and harness, the Hyperlock Closed Metal Loop is the answer. It eradicates any chance of ',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Hyperlock Closed Metal Loop Replacement',
    '<p>For those seeking the utmost secure connection between the chicken loop and harness, the Hyperlock Closed Metal Loop is the answer. It eradicates any chance of false hooking or accidental unhooking. Made from durable 8mm steel and engineered with optimal geometry for all chicken loops, it’s easy to install and ensures reliable performance.</p>
<p><strong>Features</strong></p>
<ul>
<li>8mm stainless steel loop.</li>
<li>Pre-curved loop geometry.</li>
</ul>',
    'Hyperlock Closed Metal Loop Replacement',
    'For those seeking the utmost secure connection between the chicken loop and harness, the Hyperlock Closed Metal Loop is the answer. It eradicates any chance of ',
    ARRAY['harness parts', 'Hyperlock', 'Kite', 'Parts', 'Spreader Bar']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Link to spreader-bars category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'spreader-bars'
  ON CONFLICT DO NOTHING;

  -- Variant: Default Title
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250522002',
    5100,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/3250522002_HYPERLOCKCLOSEDMETALLOOPREPLACEMENT_25X_MAIN_1.jpg?v=1727221372',
    'Hyperlock Closed Metal Loop Replacement',
    1,
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Product 10: Hyperlock Windsurf Metal Hook Replacement
DO $$
DECLARE product_uuid UUID;
BEGIN
  INSERT INTO products (
    id, title, subtitle, canonical_slug, sport, product_type,
    status, description_rich, seo_meta_title, seo_meta_description,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'Hyperlock Windsurf Metal Hook Replacement',
    NULL,
    'ride-engine-hyperlock-windsurf-metal-hook-replacement',
    'KITE',
    'Spreader Bars',
    'active',
    '<p>Harnesses equipped with the Ride Engine Hyperlock feature top-tier performance and comfort. With a simple transition to the Hyperlock Windsurf Metal Hook, tailored for windsurfing, you unlock the benefits of effortless entry and exit, along with the most intuitive and functional on-the-fly harness adjustment available.</p>
<p><strong>Features</strong></p>
<ul>
<li>8mm stainless steel hook.</li>
<li>Windsurf specific hook geometry.</li>
</ul>',
    'Hyperlock Windsurf Metal Hook Replacement',
    'Harnesses equipped with the Ride Engine Hyperlock feature top-tier performance and comfort. With a simple transition to the Hyperlock Windsurf Metal Hook, tailo',
    NOW(),
    NOW()
  )
  ON CONFLICT (canonical_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description_rich = EXCLUDED.description_rich,
    updated_at = NOW()
  RETURNING id INTO product_uuid;

  -- English translation
  INSERT INTO product_translations (
    id, product_id, language_code, title, description_html,
    seo_title, seo_description, tags
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'en',
    'Hyperlock Windsurf Metal Hook Replacement',
    '<p>Harnesses equipped with the Ride Engine Hyperlock feature top-tier performance and comfort. With a simple transition to the Hyperlock Windsurf Metal Hook, tailored for windsurfing, you unlock the benefits of effortless entry and exit, along with the most intuitive and functional on-the-fly harness adjustment available.</p>
<p><strong>Features</strong></p>
<ul>
<li>8mm stainless steel hook.</li>
<li>Windsurf specific hook geometry.</li>
</ul>',
    'Hyperlock Windsurf Metal Hook Replacement',
    'Harnesses equipped with the Ride Engine Hyperlock feature top-tier performance and comfort. With a simple transition to the Hyperlock Windsurf Metal Hook, tailo',
    ARRAY['harness parts', 'Hyperlock', 'Kite', 'Parts', 'Spreader Bar']
  )
  ON CONFLICT (product_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    description_html = EXCLUDED.description_html;

  -- Link to Ride Engine brand collection
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'ride-engine'
  ON CONFLICT DO NOTHING;

  -- Link to spreader-bars category
  INSERT INTO product_categories (product_id, category_id, sort_order)
  SELECT product_uuid, c.id, 0
  FROM categories c
  WHERE c.slug = 'spreader-bars'
  ON CONFLICT DO NOTHING;

  -- Variant: Default Title
  INSERT INTO product_variants (
    id, product_id, sku, price_eur_cents, compare_price_eur_cents,
    weight_grams, barcode, stock_quantity, is_available
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    '3250522001',
    5100,
    NULL,
    0,
    '',
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    price_eur_cents = EXCLUDED.price_eur_cents,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Image 1
  INSERT INTO product_images (
    id, product_id, url, alt_text, sort_order, is_primary
  )
  VALUES (
    gen_random_uuid(),
    product_uuid,
    'https://cdn.shopify.com/s/files/1/0279/1230/6822/files/3250522001_HYPERLOCKWSHOOKREPLACEMENT_25X_MAIN_1.jpg?v=1727221620',
    'Hyperlock Windsurf Metal Hook Replacement',
    1,
    true
  )
  ON CONFLICT DO NOTHING;
END $$;
