#!/usr/bin/env node
/**
 * Collection to Product Type Mapper
 * 
 * This script helps you map the scraped Slingshot collections
 * to your existing product_types in the database.
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Load scraped collections
const collections = require('../slingshot-collections/all-collections.json');

// Exact slug matches (collection slug = product type slug)
const EXACT_MATCHES = [
    'kites',
    'twin-tips',
    'surfboards',
    'kite-accessories',
    'pumps',
    'kite-parts',
    'wings',
    'wing-parts',
    'wakeboards',
    'wake-boots',
    'foil-boards',
    'foil-packages',
    'foil-front-wings'
];

// Slug transformations (collection slug → product type slug)
const SLUG_MAPPING = {
    'bars': 'kite-bars',
    'foot-straps': 'footstraps',
    'trainer-kites': 'trainer-kite',
    'wakesurf': 'wakesurfers',
    // Web specials that map to existing types
    'web-specials-foil-masts': 'foil-masts',
    'web-specials-foil-stabilizers': 'foil-stabilizers',
    'web-specials-foil-parts': 'foil-parts'
};

async function analyzeMapping() {
    console.log('🔍 Analyzing Collection → Product Type Mapping\n');

    try {
        // Get all product types from database
        const result = await pool.query(
            'SELECT id, name, slug, handle FROM product_types ORDER BY name'
        );
        const productTypes = result.rows;

        console.log(`📊 Database Product Types: ${productTypes.length}`);
        console.log(`📊 Scraped Collections: ${collections.length}\n`);

        // Create lookup maps
        const productTypesBySlug = new Map(
            productTypes.map(pt => [pt.slug, pt])
        );

        // Categorize collections
        const exactMatches = [];
        const mappedMatches = [];
        const unmapped = [];

        for (const collection of collections) {
            const collectionSlug = collection.slug;

            // Check exact match
            if (EXACT_MATCHES.includes(collectionSlug) && productTypesBySlug.has(collectionSlug)) {
                const pt = productTypesBySlug.get(collectionSlug);
                exactMatches.push({
                    collection,
                    productType: pt,
                    matchType: 'exact'
                });
            }
            // Check mapped match
            else if (SLUG_MAPPING[collectionSlug]) {
                const targetSlug = SLUG_MAPPING[collectionSlug];
                if (productTypesBySlug.has(targetSlug)) {
                    const pt = productTypesBySlug.get(targetSlug);
                    mappedMatches.push({
                        collection,
                        productType: pt,
                        matchType: 'mapped',
                        originalSlug: collectionSlug,
                        mappedSlug: targetSlug
                    });
                } else {
                    unmapped.push(collection);
                }
            }
            // No match
            else {
                unmapped.push(collection);
            }
        }

        // Display results
        console.log('✅ EXACT MATCHES (' + exactMatches.length + ' collections)\n');
        exactMatches.forEach(({ collection, productType }) => {
            console.log(`  ${collection.slug.padEnd(30)} → ${productType.name}`);
        });

        console.log('\n🔄 MAPPED MATCHES (' + mappedMatches.length + ' collections)\n');
        mappedMatches.forEach(({ collection, productType, originalSlug, mappedSlug }) => {
            console.log(`  ${originalSlug.padEnd(30)} → ${mappedSlug.padEnd(25)} (${productType.name})`);
        });

        console.log('\n❌ UNMAPPED COLLECTIONS (' + unmapped.length + ' collections)\n');
        unmapped.forEach(collection => {
            const typeLabel = collection.slug.includes('main') ? '[HERO]' :
                collection.slug.includes('web-specials') ? '[PROMO]' :
                    '[SUBCATEGORY]';
            console.log(`  ${typeLabel.padEnd(15)} ${collection.slug.padEnd(35)} - ${collection.title}`);
        });

        // Generate mapping output for database import
        console.log('\n\n📋 DATABASE IMPORT MAPPING\n');
        console.log('Use this mapping for your import script:\n');

        const allMappings = [
            ...exactMatches.map(m => ({
                collectionSlug: m.collection.slug,
                collectionTitle: m.collection.title,
                productTypeId: m.productType.id,
                productTypeName: m.productType.name,
                productTypeSlug: m.productType.slug
            })),
            ...mappedMatches.map(m => ({
                collectionSlug: m.collection.slug,
                collectionTitle: m.collection.title,
                productTypeId: m.productType.id,
                productTypeName: m.productType.name,
                productTypeSlug: m.productType.slug
            }))
        ];

        console.log('const COLLECTION_TO_PRODUCT_TYPE = {');
        allMappings.forEach(m => {
            console.log(`  '${m.collectionSlug}': '${m.productTypeId}', // ${m.productTypeName}`);
        });
        console.log('};');

        // Save to file
        const outputPath = path.join(__dirname, 'collection-product-type-mapping.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            exactMatches,
            mappedMatches,
            unmapped,
            mappingForImport: allMappings
        }, null, 2));

        console.log(`\n✅ Full mapping saved to: ${outputPath}`);

        // Summary
        console.log('\n📈 SUMMARY');
        console.log(`  Total Collections:        ${collections.length}`);
        console.log(`  Exact Matches:            ${exactMatches.length}`);
        console.log(`  Mapped Matches:           ${mappedMatches.length}`);
        console.log(`  Total Mappable:           ${exactMatches.length + mappedMatches.length} (${Math.round((exactMatches.length + mappedMatches.length) / collections.length * 100)}%)`);
        console.log(`  Unmapped:                 ${unmapped.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

// Run analysis
analyzeMapping();
