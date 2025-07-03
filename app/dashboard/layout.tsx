import { EnvVarWarning } from "@/components/layout/env-var-warning";
import { AuthButton } from "@/components/features/auth/auth-button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Bot, Home, MessageCircle, Settings } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors">
                <Bot className="h-5 w-5" />
                Mastra AIエージェント
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-1 px-3 py-1 rounded-md bg-white/50 hover:bg-white/70 transition-colors text-gray-700 hover:text-gray-900">
                  <Home className="h-4 w-4" />
                  ホーム
                </Link>
                <Link href="/chat" className="flex items-center gap-1 px-3 py-1 rounded-md bg-purple-500 hover:bg-purple-600 transition-colors text-white">
                  <MessageCircle className="h-4 w-4" />
                  チャット
                </Link>
                <Link href="/dashboard" className="flex items-center gap-1 px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-600 transition-colors text-white">
                  <Settings className="h-4 w-4" />
                  ダッシュボード
                </Link>
              </div>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <p className="flex items-center gap-2 text-gray-600">
              <Bot className="h-4 w-4 text-purple-600" />
              Powered by{" "}
              <a
                href="https://mastra.ai"
                target="_blank"
                className="font-bold hover:underline text-purple-600"
                rel="noreferrer"
              >
                Mastra AI Framework
              </a>
            </p>
            <p className="text-gray-500">
              &{" "}
              <a
                href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                target="_blank"
                className="font-bold hover:underline text-blue-600"
                rel="noreferrer"
              >
                Supabase
              </a>
            </p>
            <ThemeSwitcher />
          </div>
        </footer>
      </div>
    </main>
  );
}
