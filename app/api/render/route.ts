import { NextRequest, NextResponse } from 'next/server';
import { generatePoster } from '@/lib/poster';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coords, theme, title, subtitle } = body;

    if (!coords || !Array.isArray(coords) || coords.length === 0) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    if (!['light', 'dark', 'accent'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const pngBuffer = await generatePoster({
      coords,
      theme,
      title,
      subtitle
    });

    return new NextResponse(pngBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="trace-poster.png"`
      }
    });
  } catch (error) {
    console.error('Error generating poster:', error);
    return NextResponse.json({ error: 'Failed to generate poster' }, { status: 500 });
  }
}