import type { User, Client, Task, Briefing } from './types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alana Vieira' },
  { id: 'u2', name: 'Bruno Costa' },
  { id: 'u3', name: 'Camila Silva' },
];

export const mockClients: Client[] = [
  { id: 'c1', name: 'João Silva', company: 'Techcorp SA', email: 'joao@tech.com', phone: '1199999999' },
  { id: 'c2', name: 'Maria Souza', company: 'Design Studio', email: 'maria@design.com', phone: '2198888888' },
  { id: 'c3', name: 'Pedro Alves', company: 'Marketing Pro', email: 'pedro@mkt.com', phone: '3197777777' },
];

export const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Revisar interface principal',
    description: 'Verificar alinhamentos, espaçamentos e constraste. Garantir minimalismo.',
    status: 'doing',
    priority: 'high',
    assigneeId: 'u1',
    clientId: 'c1',
    dueDate: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 't2',
    title: 'Atualizar contrato de prestação de serviços',
    description: 'Adicionar cláusulas sobre proteção de dados.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u2',
    clientId: 'c2',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    title: 'Publicar briefing da campanha',
    description: 'Publicar no portal do cliente o novo briefing.',
    status: 'done',
    priority: 'low',
    assigneeId: 'u3',
    clientId: 'c3',
    dueDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 't4',
    title: 'Configurar ambiente de homologação',
    description: 'Subir os containers no servidor.',
    status: 'todo',
    priority: 'high',
    assigneeId: 'u1',
    clientId: null,
    dueDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

export const mockBriefings: Briefing[] = [
  {
    id: 'b1',
    clientId: 'c1',
    title: 'Redesign do Sistema Interno',
    content: 'Objetivo: Criar uma interface limpa, apenas em preto e branco. Foco total em legibilidade e performance.',
    createdAt: new Date().toISOString()
  }
];
