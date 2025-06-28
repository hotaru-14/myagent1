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
  const requestStartTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:${requestId}] 📥 Request received at ${new Date().toISOString()}`);
  
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, agentId = DEFAULT_AGENT_ID } = body;
    
    console.log(`[API:${requestId}] 🔍 Request details:`, {
      messagesCount: messages?.length || 0,
      requestedAgentId: agentId,
      userMessage: messages?.[messages.length - 1]?.content?.slice(0, 50) + (messages?.[messages.length - 1]?.content?.length > 50 ? '...' : '') || 'N/A'
    });
    
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
      console.warn(`[API:${requestId}] ❌ Invalid agent ID requested: ${agentId}`);
      console.log(`[API:${requestId}] 📋 Available agents:`, getAllAgents().map(agent => `${agent.id} (${agent.name})`));
      return Response.json(
        { 
          error: "Invalid agent ID", 
          details: `Agent '${agentId}' not found`,
          availableAgents: getAllAgents().map(agent => agent.id)
        }, 
        { status: 404 }
      );
    }
    
    console.log(`[API:${requestId}] ✅ Agent validated:`, {
      agentId: agentConfig.id,
      agentName: agentConfig.name,
      agentIcon: agentConfig.icon
    });
    
    // Mastraインスタンスが利用可能かチェック
    if (!mastra) {
      console.error(`[API:${requestId}] 💥 Mastra instance not available`);
      return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    console.log(`[API:${requestId}] 🔧 Mastra instance confirmed, getting agent...`);
    
    // 指定されたエージェントを取得
    const agent = mastra.getAgent(agentId);
    
    if (!agent) {
      console.error(`[API:${requestId}] 💥 Agent not found in Mastra: ${agentId}`);
      console.log(`[API:${requestId}] 🔍 Mastra agent retrieval failed for: ${agentId}`);
      return Response.json(
        { 
          error: "Agent not available", 
          details: `Agent '${agentId}' (${agentConfig.name}) is not available`
        }, 
        { status: 503 }
      );
    }
    
    console.log(`[API:${requestId}] 🚀 Using agent: ${agentId} (${agentConfig.name}) for ${messages.length} messages`);
    
    // ストリーミング開始時間を記録
    const streamStartTime = Date.now();
    console.log(`[API:${requestId}] 🌊 Starting stream at ${new Date().toISOString()}`);
    
    // ストリーミングレスポンスを生成
    const stream = await agent.stream(messages);
    
    const streamSetupTime = Date.now() - streamStartTime;
    console.log(`[API:${requestId}] ⚡ Stream setup completed in ${streamSetupTime}ms`);
    
    // AI SDKと互換性のあるストリーミングレスポンスを返す
    const response = stream.toDataStreamResponse();
    
    const totalRequestTime = Date.now() - requestStartTime;
    console.log(`[API:${requestId}] ✅ Response sent after ${totalRequestTime}ms (setup: ${streamSetupTime}ms)`);
    
    return response;
  } catch (error) {
    const errorTime = Date.now() - requestStartTime;
    console.error(`[API:${requestId}] 💥 Chat API error after ${errorTime}ms:`, error);
    
    // より詳細なエラー情報をログに出力
    if (error instanceof Error) {
      console.error(`[API:${requestId}] 📋 Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // 最初の3行のみ
      });
    }
    
    console.log(`[API:${requestId}] ❌ Request failed after ${errorTime}ms`);
    
    return Response.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 