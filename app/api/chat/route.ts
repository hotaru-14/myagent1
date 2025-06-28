import { mastra } from "@/src/mastra";
import { NextRequest } from "next/server";
import { DEFAULT_AGENT_ID, getAgentById, getAllAgents } from "@/lib/constants/agents";

// Chat API リクエストボディの型定義
interface ChatRequestBody {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  agentId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, agentId = DEFAULT_AGENT_ID } = body;
    
    // リクエストパラメータの基本バリデーション
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Invalid request: messages array is required" }, 
        { status: 400 }
      );
    }
    
    // メッセージ形式の詳細バリデーション
    const invalidMessage = messages.find(msg => 
      !msg || 
      typeof msg !== 'object' || 
      !msg.role || 
      !msg.content ||
      !['user', 'assistant', 'system'].includes(msg.role)
    );
    
    if (invalidMessage) {
      return Response.json(
        { error: "Invalid request: each message must have 'role' and 'content' properties" }, 
        { status: 400 }
      );
    }
    
    // agentIdの形式チェック
    if (typeof agentId !== 'string' || agentId.trim() === '') {
      return Response.json(
        { error: "Invalid request: agentId must be a non-empty string" }, 
        { status: 400 }
      );
    }
    
    // エージェントの存在確認
    const agentConfig = getAgentById(agentId);
    if (!agentConfig) {
      console.warn(`Invalid agent ID requested: ${agentId}`);
      return Response.json(
        { 
          error: "Invalid agent ID", 
          details: `Agent '${agentId}' not found`,
          availableAgents: getAllAgents().map(agent => agent.id)
        }, 
        { status: 404 }
      );
    }
    
    // Mastraインスタンスが利用可能かチェック
    if (!mastra) {
      console.error("Mastra instance not available");
      return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    // 指定されたエージェントを取得
    const agent = mastra.getAgent(agentId);
    
    if (!agent) {
      console.error(`Agent not found in Mastra: ${agentId}`);
      return Response.json(
        { 
          error: "Agent not available", 
          details: `Agent '${agentId}' (${agentConfig.name}) is not available`
        }, 
        { status: 503 }
      );
    }
    
    console.log(`Using agent: ${agentId} (${agentConfig.name}) for ${messages.length} messages`);
    
    // ストリーミングレスポンスを生成
    const stream = await agent.stream(messages);
    
    // AI SDKと互換性のあるストリーミングレスポンスを返す
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    
    // より詳細なエラー情報をログに出力
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return Response.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 