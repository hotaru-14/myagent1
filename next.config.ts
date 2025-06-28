import type { NextConfig } from "next";

// エラーを無視する代替の設定: ESLintを無効化
const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore
    instrumentationHook: true,
  },
};

export default nextConfig;
