export interface User {
  id: string;
  name: string;
  avatar?: string;
  avatarStyle?: 'glass' | 'icons' | 'identicon' | 'initials' | 'rings' | 'shapes' | 'thumbs';
  lastActive?: string;
  isOnline?: boolean;
  role: 'admin' | 'user' | 'client';
}

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** @deprecated Use assigneeIds. Kept for Firestore backward compat. */
  assigneeId: string;
  /** Multiple assignees (source of truth). */
  assigneeIds: string[];
  clientId: string | null;
  startDate?: string;
  dueDate: string;
  finishedAt?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: { name: string; color: string }[];
  links?: string[];
}

/** Helper: normalise legacy docs that only have assigneeId */
export function normalizeTask(raw: any): Task {
  const assigneeIds: string[] = raw.assigneeIds && raw.assigneeIds.length
    ? raw.assigneeIds
    : raw.assigneeId
      ? [raw.assigneeId]
      : [];
  return {
    ...raw,
    assigneeIds,
    assigneeId: assigneeIds[0] || raw.assigneeId || '',
  } as Task;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  logo?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  cnpj?: string;
  segment?: string;
  contactRole?: string;
  tags?: { name: string; color: string }[];
  color?: string;
  industry?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  clientId: string;
  name: string;
  folderId: string | null;
  order: number;
  createdAt: string;
}

export interface Strategy {
  id: string;
  clientId: string;
  month: string; // Format: "YYYY-MM"
  payload?: string;
  bgPayload?: string;
  elements?: any[]; // legacy
  appState?: any; // legacy
  createdAt: string;
  updatedAt?: string;
}

export interface Briefing {
  id: string;
  clientId: string;
  folderId: string | null;
  title: string;
  content: string;
  icon?: string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Objective {
  id: string;
  clientId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'done';
  taskId?: string;
  category: { name: string; color: string };
  visibility: 'internal' | 'public';
  createdBy: string;
  creatorRole: 'admin' | 'user' | 'client';
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  targetId?: string;
  createdAt: string;
}

export type NotificationType = 'task_assigned' | 'task_nudge' | 'task_completed' | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  type: NotificationType;
  actorId?: string;
  entityId?: string;
  tags?: string[];
  createdAt: string;
  readAt?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  knowledgeSources: string[];
}

export interface AgentKnowledge {
  id: string;
  agentId: string;
  type: 'client' | 'task' | 'briefing' | 'upload' | 'objective';
  content: string;
  name: string;
  createdAt: string;
}

export interface UploadedDocument {
  id: string;
  agentId: string;
  fileName: string;
  content: string;
  size: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  agentId: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}

export type AgentId = 'copy_maker' | 'suporte' | 'site_builder' | 'pesquisador';

export const DEFAULT_AGENTS: Agent[] = [
  {
id: 'copy_maker',
    name: 'Copy Maker',
    description: 'Especialista em criar copies e textos para campanhas de ads',
    icon: '✏️',
    systemPrompt: `Você é um copywriter especialista em campanhas de anúncios digitais e marketing de Performance da DOCA. Sua especialidade é criar copies persuasivos e de alta conversão.

IMPORTANTE: Quandober dados de clientes, NÃO liste os dados cruamente. Em vez disso, use as informações para customizar suas recomendações de forma estratégica.

O que você faz:
1. Pergunte sobre o produto/serviço, público-alvo e objetivo da campanha
2. Crie 3 variações de copy (curto ate20 palavras, médio 20-50 palavras, longo 50-100 palavras)
3. Para cada variação, explique o porquê da abordagem
4. Adapte o tom de voz conforme o segmento

Responda em português brasileiro, de forma direta e prática.`,
model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0.7,
    knowledgeSources: ['clients', 'tasks', 'briefings']
  },
  {
    id: 'suporte',
    name: 'Suporte',
    description: 'Consultor geral que conhece todos os clientes e processos da agência',
    icon: '🎯',
    systemPrompt: `Você é o consultor geral da DOCA, uma agência digital completa. Você ajuda a equipe com dúvidas sobre clientes, tarefas e processos.

IMPORTANTE: Quandober dados NUNCA liste-os cruamente. Sempre faÇa um resumo executivo eresponda as perguntasdeforma conversada e útil.

O que você faz:
- Resumir status de projetos em poucas linhas
- Identificar pendências e提醒 a equipe
- Explicar contexto histórico quando necessário
- Sugerir próximos passos

Quando não souber algo, seja honesto e peça mais informações.`,
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0.5,
    knowledgeSources: ['clients', 'tasks', 'briefings', 'objectives', 'users']
  },
  {
    id: 'site_builder',
    name: 'Site Builder',
    description: 'Desenvolvedor que cria estruturas de landing pages e sites',
    icon: '🛠️',
    systemPrompt: `Você é um山镇fullstack especializado em criar landing pages e sitesde alta conversão da DOCA.

IMPORTANTE: Quandober dados do briefing, NUNCA copie textecruo. Em vez disso, analise e crie propostas estruturadas.

O que você faz:
1. Pergunte: cliente, público-alvo, objetivo da página
2. Estruture a arquitetura da página (seções necessárias)
3. Crie sugeridoes de copy para cada seção
4. Forneça código quando solicitado

Responda de forma estruturada, criando fluxos e recomendações.`,
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0.6,
    knowledgeSources: ['clients', 'briefings']
  },
  {
    id: 'pesquisador',
    name: 'Pesquisador',
    description: 'Ajuda com análise estratégica e brainstorming',
    icon: '🔍',
    systemPrompt: `Você é um consultor estratégico da DOCA queajuda com análise de mercado e brainstorming.

IMPORTANTE: Você não tem acesso à internet em tempo real. Use seuconhecimento base para ajudar.

O que você faz:
- Analisar tendências com base no que já sabe
- Fazer brainstorming de ideias
- Sugerir abordagens estratégicas
- Questionar e ajudar a estruturar pensamentos

Importante: Seja honesto sobre o que não sabe e fooque emadicionar valor com seuconhecimento demarketing e tecnologia.`,
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0.4,
    knowledgeSources: ['clients', 'objectives']
  }
];
