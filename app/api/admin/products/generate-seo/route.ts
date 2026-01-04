import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, title, description } = body;

    if (!productId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract text from HTML description
    const plainDescription = description?.replace(/<[^>]*>/g, '') || '';

    // Generate SEO data (simplified version - you can enhance with OpenAI/Claude)
    const seo = {
      seo_title: `${title} - Buy Online`,
      seo_description: plainDescription.slice(0, 160) || `Premium ${title}. Shop now for the best deals.`,
      meta_keywords: generateKeywords(title, plainDescription),
      og_title: title,
      og_description: plainDescription.slice(0, 200) || `Check out ${title} - available now!`,
      og_image_url: '', // You can populate from product images
      og_type: 'product',
      canonical_url: '', // You can populate from product handle
      meta_robots: 'index, follow',
      seo_score: calculateSeoScore({
        title,
        description: plainDescription,
        keywords: generateKeywords(title, plainDescription),
      }),
      seo_generated_at: new Date().toISOString(),
    };

    return NextResponse.json({ seo });
  } catch (error: any) {
    console.error('SEO generation failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate SEO' },
      { status: 500 }
    );
  }
}

function generateKeywords(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // Extract potential keywords (words longer than 3 characters)
  const words = text.match(/\b[a-z]{4,}\b/g) || [];
  
  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Get top keywords
  const topKeywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  return topKeywords.join(', ');
}

function calculateSeoScore(data: {
  title: string;
  description: string;
  keywords: string;
}): number {
  let score = 0;

  // Title checks (30 points)
  if (data.title) {
    score += 10; // Has title
    if (data.title.length >= 30 && data.title.length <= 60) score += 10; // Optimal length
    if (data.title.length > 0) score += 10; // Title exists
  }

  // Description checks (40 points)
  if (data.description) {
    score += 15; // Has description
    if (data.description.length >= 120 && data.description.length <= 160) score += 15; // Optimal length
    if (data.description.length >= 50) score += 10; // Minimum length met
  }

  // Keywords checks (20 points)
  if (data.keywords) {
    score += 10; // Has keywords
    const keywordCount = data.keywords.split(',').length;
    if (keywordCount >= 5 && keywordCount <= 10) score += 10; // Optimal keyword count
  }

  // General best practices (10 points)
  if (data.title && data.description && data.keywords) {
    score += 10; // All fields populated
  }

  return Math.min(score, 100);
}

