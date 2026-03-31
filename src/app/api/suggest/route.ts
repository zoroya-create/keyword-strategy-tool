import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { keyword } = await req.json();

  try {
    const url = `https://suggestqueries.google.com/complete/search?q=${encodeURIComponent(keyword)}&hl=ja&client=firefox`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
      },
    });
    const data = await res.json();
    const suggestions: string[] = data[1] ?? [];
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
