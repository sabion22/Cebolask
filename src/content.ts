export const CONTENT_CONFIG = {
  // Configurações Globais de Branding
  branding: {
    appName: "DOCA",
    logoPath: "/logo.png",
    faviconPath: "/favicon.ico", // Basta colocar seu favicon.ico na pasta public
    themeColor: "#0f0f0f",
  },

  // Textos da Interface
  texts: {
    dashboardTitle: "Dashboard",
    tasksTitle: "Quadro de Tarefas",
    calendarTitle: "Agenda Visual",
    clientsTitle: "Central de Clientes",
    officeTitle: "Escritório",
    noTasks: "Nenhuma tarefa pendente :)"
  },

  // Configurações das Tarefas
  tasks: {
    tagColors: [
      { name: 'Urgente', color: '#ff4d4f' },
      { name: 'Vídeo', color: '#722ed1' },
      { name: 'Tráfego', color: '#1890ff' },
      { name: 'Burocrático', color: '#faad14' },
      { name: 'Marketing', color: '#52c41a' },
      { name: 'Design', color: '#eb2f96' },
      { name: 'Dev', color: '#2f54eb' },
    ],
    statusLabels: {
      todo: "A Fazer",
      doing: "Fazendo",
      done: "Concluído"
    }
  },

  // Configurações do Escritório
  office: {
    roomName: "Sede DOCA",
    maxUsers: 4,
    showClients: false, // Futuro: true permitirá vizualizar clientes em outra sala
  }
};
