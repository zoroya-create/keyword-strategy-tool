"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Copy, Check, Search, Loader2, ChevronRight } from "lucide-react";

type Keyword = {
  category: string;
  keyword: string;
  intent: string;
  priority: "高" | "中" | "低";
};

type FormData = {
  target: string;
  services: string;
  usp: string;
  url: string;
};

const PRIORITY_COLORS = {
  高: "bg-red-100 text-red-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-gray-100 text-gray-600",
};

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    target: "",
    services: "",
    usp: "",
    url: "",
  });
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [suggestLoading, setSuggestLoading] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("全て");
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const fetchSuggests = useCallback(async (kwList: Keyword[]) => {
    await Promise.all(
      kwList.map(async ({ keyword }) => {
        setSuggestLoading((prev) => new Set([...prev, keyword]));
        try {
          const res = await fetch("/api/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword }),
          });
          const data = await res.json();
          setSuggestions((prev) => ({ ...prev, [keyword]: data.suggestions }));
        } finally {
          setSuggestLoading((prev) => {
            const next = new Set(prev);
            next.delete(keyword);
            return next;
          });
        }
      })
    );
  }, []);

  const handleSubmit = async () => {
    if (!formData.target && !formData.services) {
      setError("ターゲット顧客または商品・サービスを入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    setKeywords([]);
    setSuggestions({});
    setActiveCategory("全て");

    try {
      if (formData.url) {
        setLoadingStep("ホームページを読み込んでいます...");
      }
      setLoadingStep("Geminiでキーワードを生成中...");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      const kwList: Keyword[] = data.keywords ?? [];
      setKeywords(kwList);
      setLoading(false);

      if (kwList.length > 0) {
        setLoadingStep("Googleサジェストを取得中...");
        await fetchSuggests(kwList);
      }
    } catch {
      setError("エラーが発生しました。APIキーを確認してください。");
      setLoading(false);
    }
  };

  const categories = ["全て", ...Array.from(new Set(keywords.map((k) => k.category)))];
  const filtered = activeCategory === "全て" ? keywords : keywords.filter((k) => k.category === activeCategory);

  const copyAll = async () => {
    const all = keywords.map((k) => k.keyword).join("\n");
    await copyToClipboard(all, "all");
  };

  const copyAllWithSuggests = async () => {
    const lines: string[] = [];
    keywords.forEach((k) => {
      lines.push(k.keyword);
      const sugs = suggestions[k.keyword] ?? [];
      sugs.forEach((s) => lines.push(`  ${s}`));
    });
    await copyToClipboard(lines.join("\n"), "all-suggests");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Logo bar (white) */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <Image
            src="/zoroya-logo.png"
            alt="ぞろ屋"
            width={180}
            height={64}
            className="object-contain"
          />
        </div>
      </div>

      {/* Blue header */}
      <header className="text-white px-6 py-6" style={{ backgroundColor: "#14487E" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Search className="w-6 h-6 text-blue-300" />
            <h1 className="text-2xl font-bold">SEOキーワード戦略ツール</h1>
          </div>
          <p className="text-blue-200 text-sm ml-9">
            ビジネス戦略 × ホームページ分析 → 見込み客が検索するキーワードを自動生成
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold">1</span>
                ビジネス情報を入力
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ターゲット顧客 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    rows={3}
                    placeholder="例：30〜50代の整体院・接骨院の経営者"
                    value={formData.target}
                    onChange={(e) => setFormData((p) => ({ ...p, target: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    商品・サービス <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    rows={3}
                    placeholder="例：ホームページ制作・Web集客支援・SEO対策"
                    value={formData.services}
                    onChange={(e) => setFormData((p) => ({ ...p, services: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    選ばれる理由（USP）
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    rows={2}
                    placeholder="例：成果報酬型・AI活用・地域No.1実績"
                    value={formData.usp}
                    onChange={(e) => setFormData((p) => ({ ...p, usp: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ホームページURL
                  </label>
                  <input
                    type="url"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                  />
                  <p className="text-xs text-slate-400 mt-1">URLを入力するとサイト内容も分析します</p>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  style={{ background: "linear-gradient(to right, #5C35D9, #00B4B4)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {loadingStep}
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      分析開始
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {keywords.length === 0 && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">ビジネス情報を入力して「分析開始」をクリックしてください</p>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="space-y-4">
                {/* Actions bar */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-semibold text-indigo-700 text-lg">{keywords.length}</span>
                      キーワード生成完了
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyAll}
                        className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        {copiedKey === "all" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        キーワードのみコピー
                      </button>
                      <button
                        onClick={copyAllWithSuggests}
                        className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {copiedKey === "all-suggests" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        サジェスト込みでコピー
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        activeCategory === cat
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {cat}
                      {cat !== "全て" && (
                        <span className="ml-1 opacity-70">
                          ({keywords.filter((k) => k.category === cat).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Keyword cards */}
                <div className="space-y-3">
                  {filtered.map((kw) => (
                    <div
                      key={kw.keyword}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{kw.category}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_COLORS[kw.priority]}`}>
                            優先度：{kw.priority}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(kw.keyword, `kw-${kw.keyword}`)}
                          className="shrink-0 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          title="キーワードをコピー"
                        >
                          {copiedKey === `kw-${kw.keyword}` ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span
                          className="font-semibold text-slate-800 text-base cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => copyToClipboard(kw.keyword, `kw-${kw.keyword}`)}
                          title="クリックでコピー"
                        >
                          {kw.keyword}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 ml-6 mb-3">{kw.intent}</p>

                      {/* Suggests */}
                      <div className="ml-6">
                        {suggestLoading.has(kw.keyword) ? (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            サジェスト取得中...
                          </div>
                        ) : (suggestions[kw.keyword] ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {(suggestions[kw.keyword] ?? []).slice(0, 8).map((s) => (
                              <button
                                key={s}
                                onClick={() => copyToClipboard(s, `sug-${s}`)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                  copiedKey === `sug-${s}`
                                    ? "bg-green-50 border-green-300 text-green-700"
                                    : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                }`}
                                title="クリックでコピー"
                              >
                                {copiedKey === `sug-${s}` ? "✓ コピー済み" : s}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">サジェストなし</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 px-4 border-t border-slate-200 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ぞろ屋合同会社. All rights reserved.
      </footer>
    </div>
  );
}
