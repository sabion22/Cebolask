import { createChatCompletion, createStreamingChatCompletion } from './openRouter';
import type { ChatMessage } from './openRouter';
import { DEFAULT_AGENTS } from '../types';
import type { Agent, AgentMessage } from '../types';
import type { Client, Task, Briefing, Objective, User } from '../types';

export interface AgentContext {
  clients: Client[];
  tasks: Task[];
  briefings: Briefing[];
  objectives: Objective[];
  users: User[];
}

export function buildKnowledgeBase(context: AgentContext, agent: Agent): string {
  const { clients, tasks, briefings, objectives, users } = context;

  let knowledge = '# CONHECIMENTO DO AGENTE\n\n';

  knowledge += '## EQUIPE DA AGÊNCIA\n';
  users.forEach(user => {
    knowledge += `- ${user.name}\n`;
  });
  knowledge += '\n';

  if (agent.knowledgeSources.includes('clients')) {
    knowledge += '## CLIENTES\n';
    clients.forEach(client => {
      knowledge += `### ${client.company}\n`;
      knowledge += `- Nome: ${client.name}\n`;
      knowledge += `- Empresa: ${client.company}\n`;
      knowledge += `- Email: ${client.email}\n`;
      knowledge += `- Telefone: ${client.phone}\n`;
      knowledge += `- Segmento: ${client.segment || 'Não informado'}\n`;
      knowledge += `- Website: ${client.website || 'Não informado'}\n`;
      knowledge += `- WhatsApp: ${client.whatsapp || 'Não informado'}\n`;
      if (client.notes) knowledge += `- Notas: ${client.notes}\n`;
      knowledge += '\n';
    });
  }

  if (agent.knowledgeSources.includes('tasks')) {
    knowledge += '## TAREFAS\n';
    tasks.forEach(task => {
      knowledge += `### ${task.title}\n`;
      knowledge += `- Status: ${task.status}\n`;
      knowledge += `- Prioridade: ${task.priority}\n`;
      if (task.description) knowledge += `- Descrição: ${task.description}\n`;
      knowledge += `- Data de entrega: ${task.dueDate}\n`;
      if (task.status !== 'done') {
        knowledge += `- ANDAMENTO: Esta tarefa ainda não foi concluída\n`;
      }
      knowledge += '\n';
    });
  }

  if (agent.knowledgeSources.includes('briefings')) {
    knowledge += '## BRIEFINGS\n';
    briefings.forEach(briefing => {
      const client = clients.find(c => c.id === briefing.clientId);
      knowledge += `### ${briefing.title}\n`;
      knowledge += `- Cliente: ${client?.company || 'Não identificado'}\n`;
      if (briefing.content) {
        const contentPreview = briefing.content.slice(0, 500);
        knowledge += `- Conteúdo: ${contentPreview}${briefing.content.length > 500 ? '...' : ''}\n`;
      }
      knowledge += '\n';
    });
  }

  if (agent.knowledgeSources.includes('objectives')) {
    knowledge += '## OBJETIVOS / TIMELINE\n';
    objectives.forEach(obj => {
      const client = clients.find(c => c.id === obj.clientId);
      knowledge += `### ${obj.title}\n`;
      knowledge += `- Cliente: ${client?.company || 'Não identificado'}\n`;
      knowledge += `- Status: ${obj.status}\n`;
      knowledge += `- Início: ${obj.startDate}\n`;
      knowledge += `- Término: ${obj.endDate}\n`;
      knowledge += `- Categoria: ${obj.category.name}\n`;
      knowledge += '\n';
    });
  }

  return knowledge;
}

export function buildSystemPrompt(agent: Agent, context: AgentContext): string {
  const knowledgeBase = buildKnowledgeBase(context, agent);

  return `${agent.systemPrompt}

${knowledgeBase}

---

Regras importantes:
1. Use os dados do conhecimento base para responder com precisão
2. Se não souber algo, seja honesto e peça mais informações
3. Mantenha um tom profissional mas amigável
4. Quando citar dados, indique a fonte (ex: "Segundo os dados do sistema...")
5. Se precisar de informações específicas que não estão no sistema, peça ao usuário`;
}

export async function sendMessageToAgent(
  agent: Agent,
  userMessage: string,
  history: AgentMessage[],
  context: AgentContext,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const systemPrompt = buildSystemPrompt(agent, context);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  if (onChunk) {
    let fullResponse = '';
    for await (const chunk of createStreamingChatCompletion({
      model: agent.model,
      messages,
      temperature: agent.temperature,
    })) {
      fullResponse += chunk;
      onChunk(chunk);
    }
    return fullResponse;
  }

  return createChatCompletion({
    model: agent.model,
    messages,
    temperature: agent.temperature,
  });
}

export { DEFAULT_AGENTS };