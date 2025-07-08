import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { researchAgent } from './agents/research-agent';
import { culinaryAgent } from './agents/culinary-agent';

let mastra: Mastra | null = null;

mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { 
    weatherAgent,
    researchAgent,
    culinaryAgent
  },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});


export { mastra };
