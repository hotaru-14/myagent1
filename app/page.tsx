import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-8 text-center space-y-8">
        {/* 天気マークとタイトル */}
        <div className="space-y-4">
          <div className="text-8xl">🌤️</div>
          <h1 className="text-4xl font-bold text-gray-900">AI Agent Selection</h1>
          <p className="text-lg text-gray-600">
            複数のAIエージェントから選択して、様々なタスクを実行できます。
            天気エージェント、汎用エージェント、分析エージェントなど、目的に応じてエージェントを切り替えながら会話できます。
          </p>
        </div>
        
        {/* チャットボタン */}
        <div className="space-y-4">
          <Link href="/chat">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg">
              エージェントと話す 💬
            </Button>
          </Link>
          <p className="text-sm text-gray-500">
            複数のエージェントから選択して、最適なサポートを受けましょう
          </p>
        </div>
      </div>
    </main>
  );
}
