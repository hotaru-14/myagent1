import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { researchAgent } from './agents/research-agent';

let mastra: Mastra | null = null;

try {
  mastra = new Mastra({
    workflows: { weatherWorkflow },
    agents: { 
      weatherAgent,
      researchAgent
    },
    storage: new LibSQLStore({
      // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
      url: "file:../mastra.db",
    }),
    logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
    }),
  });
} catch (error) {
  console.error('Failed to initialize Mastra:', error);
  // OpenTelemetryエラーの場合でも動作を継続
  if (error instanceof Error && error.message.includes('@opentelemetry/api')) {
    console.warn('OpenTelemetry dependency issue detected, but continuing...');
  }
}

export { mastra };
