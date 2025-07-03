import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon, MessageCircle, Bot, Cloud, Search, History, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Mastraツールの情報
  const mastraTools = [
    {
      name: "天気予報ツール",
      description: "最大3日間の詳細な天気予報データを取得",
      icon: Cloud,
      category: "天気",
      features: ["日別予報", "時間別予報", "天体データ", "大気質情報"],
      status: "アクティブ"
    },
    {
      name: "リアルタイム天気ツール", 
      description: "現在の気象状況をリアルタイムで取得",
      icon: Sparkles,
      category: "天気",
      features: ["現在気温", "体感温度", "湿度・気圧", "風データ", "UV指数"],
      status: "アクティブ"
    },
    {
      name: "天気履歴ツール",
      description: "過去7日以内の天気データを取得・分析",
      icon: History,
      category: "天気", 
      features: ["過去データ", "トレンド分析", "比較機能", "時間別履歴"],
      status: "アクティブ"
    },
    {
      name: "地域検索ツール",
      description: "地名から正確な位置情報を特定",
      icon: MapPin,
      category: "天気",
      features: ["地域コード解決", "座標取得", "オートコンプリート"],
      status: "アクティブ"
    },
    {
      name: "ウェブ検索ツール",
      description: "Google Grounding APIを使用したリアルタイム検索",
      icon: Search,
      category: "研究",
      features: ["リアルタイム検索", "信頼性の高い情報源", "グラウンディングメタデータ"],
      status: "アクティブ"
    }
  ];

  // 利用可能なエージェント情報
  const agents = [
    {
      id: "weatherAgent",
      name: "天気エージェント",
      description: "天気情報と活動提案を提供します",
      icon: "🌤️",
      tools: ["天気予報", "リアルタイム天気", "天気履歴", "地域検索"],
      capabilities: ["天気データ取得", "活動提案", "服装アドバイス", "お出かけ情報"],
      status: "オンライン"
    },
    {
      id: "researchAgent", 
      name: "自律的研究エージェント",
      description: "包括的調査とレポート作成を提供します",
      icon: "🔍",
      tools: ["ウェブ検索"],
      capabilities: ["多角的調査", "信頼性評価", "詳細レポート", "検索計画立案"],
      status: "オンライン"
    }
  ];

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* ウェルカムメッセージ */}
      <div className="w-full">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-sm p-4 px-6 rounded-lg text-foreground flex gap-3 items-center">
          <InfoIcon size="20" strokeWidth={2} className="text-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-blue-900">Mastraエージェントプラットフォームへようこそ！</p>
            <p className="text-blue-700 mt-1">高度なAIエージェントとツールで、あらゆるタスクを効率的に実行できます。</p>
          </div>
        </div>
      </div>

      {/* チャットページへのボタン */}
      <div className="text-center">
        <Link href="/chat">
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
            <MessageCircle className="mr-2 h-5 w-5" />
            AIエージェントとチャットを開始
          </Button>
        </Link>
        <p className="text-sm text-gray-600 mt-2">複数のエージェントから選択して、最適なサポートを受けましょう</p>
      </div>

      {/* 利用可能なエージェント */}
      <div>
        <h2 className="font-bold text-2xl mb-4 flex items-center gap-2">
          <Bot className="h-6 w-6 text-purple-600" />
          利用可能なMastraエージェント
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{agent.icon}</span>
                    {agent.name}
                  </div>
                  <Badge variant={agent.status === "オンライン" ? "default" : "secondary"} className="text-xs">
                    {agent.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">使用可能ツール:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">主な機能:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">{capability}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mastraツール一覧 */}
      <div>
        <h2 className="font-bold text-2xl mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          Mastraツール詳細
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mastraTools.map((tool) => (
            <Card key={tool.name} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <tool.icon className="h-5 w-5 text-blue-600" />
                    {tool.name}
                  </div>
                  <Badge variant="default" className="text-xs bg-green-500 text-white">
                    {tool.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant={tool.category === "天気" ? "default" : "secondary"} className="w-fit">
                    {tool.category}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">主な機能:</p>
                    <ul className="text-xs space-y-1">
                      {tool.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
