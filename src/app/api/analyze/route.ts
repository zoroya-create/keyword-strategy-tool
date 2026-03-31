import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const { target, services, usp, url } = await req.json();

  // URLからページコンテンツ取得
  let pageContent = "";
  if (url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const pageRes = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KeywordBot/1.0)" },
      });
      clearTimeout(timeout);
      const html = await pageRes.text();
      pageContent = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);
    } catch {
      pageContent = "";
    }
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `あなたはAI検索時代（GEO・LLMO対応）のSEO専門家です。以下のビジネス情報${pageContent ? "とホームページのテキスト" : ""}を分析して、見込み客がGoogleやAI検索で検索するキーワードをリストアップしてください。

【ビジネス情報】
- ターゲット顧客: ${target}
- 商品・サービス: ${services}
- 選ばれる理由（USP）: ${usp}
${pageContent ? `\n【ホームページ内容（抜粋）】\n${pageContent}` : ""}

【重要な前提】
現代のAI検索（Google AI Overview・Perplexity等）は地名との完全一致ではなく、悩み・意図・文脈で記事を選ぶ。
そのため「地名×業種」の掛け合わせキーワードより、「悩みの核心を突くキーワード」を優先すること。
地域系は全体の1〜2割に留め、残りは意図・悩みベースで構成する。

以下のJSON形式のみで出力してください（説明文は不要）：
{
  "keywords": [
    {
      "category": "カテゴリ名",
      "keyword": "キーワード（1〜3語）",
      "intent": "検索意図の説明",
      "priority": "高"
    }
  ]
}

カテゴリと配分の目安：
- 悩み・課題系（全体の30%）：ターゲットが抱える具体的な痛みや不満
- 方法・解決策系（全体の25%）：how to・やり方・手順を調べるキーワード
- 比較・選択系（全体の20%）：どれがいい・違い・選び方
- 購買・依頼系（全体の15%）：料金・依頼・おすすめなど購入意図あり
- 地域・業種特化系（全体の10%）：地名は本当に必要な場合のみ最小限

ルール：
- 20〜25個のキーワードを生成する
- priorityは「高」「中」「低」のいずれか（悩み系・解決策系を高に設定しやすくする）
- keywordは日本語で1〜3語、Googleで実際に検索されそうなもの
- intentは20字以内で簡潔に`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found");
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ keywords: [] }, { status: 500 });
  }
}
