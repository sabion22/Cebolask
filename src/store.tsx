import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './contexts/AuthContext';
import type { Task, Client, User, Briefing, AppNotification } from './types';

// removed mock fallbacks

interface AppState {
  tasks: Task[];
  clients: Client[];
  users: User[];
  briefings: Briefing[];
  notifications: AppNotification[];
}

interface StoreContextType extends AppState {
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  moveTaskStatus: (id: string, newStatus: Task['status']) => Promise<void>;
  createClient: (client: Omit<Client, 'id'>) => Promise<void>;
  createBriefing: (briefing: Omit<Briefing, 'id' | 'createdAt'>) => Promise<void>;
  updateBriefing: (id: string, updates: Partial<Briefing>) => Promise<void>;
  deleteBriefing: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  notifyUser: (userId: string, message: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Subscrições via onSnapshot (Realtime com Firebase)
  useEffect(() => {
    if (!currentUser) return; // Só busca se estiver logado

    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(collection(db, 'tasks'), (snap) => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as Task)));
    }));

    unsubs.push(onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ ...d.data(), id: d.id } as Client)));
    }));

    unsubs.push(onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    }));

    unsubs.push(onSnapshot(collection(db, 'briefings'), (snap) => {
      setBriefings(snap.docs.map(d => ({ ...d.data(), id: d.id } as Briefing)));
    }));

    unsubs.push(onSnapshot(collection(db, 'notifications'), (snap) => {
      setNotifications(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification)));
    }));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [currentUser]);

  // Sincronizar usuário logado com a coleção 'users' do Firestore
  useEffect(() => {
    if (!currentUser) return;

    const syncUser = async () => {
      // Usamos setDoc com merge: true para garantir que o doc existe sem sobrescrever campos extras se houver
      await setDoc(doc(db, 'users', currentUser.uid), {
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário Novo'
      }, { merge: true });
    };

    syncUser();
  }, [currentUser]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const createTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newTask: Task = { ...task, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'tasks', id), newTask);

    // Se assinado para alguém específico (e não ele mesmo), gera notificação real🔥
    if (task.assigneeId && task.assigneeId !== currentUser?.uid) {
      const notifId = generateId();
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: task.assigneeId,
        message: `Nova tarefa atribuída a você: ${task.title}`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await updateDoc(doc(db, 'tasks', id), updates);
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      await updateDoc(doc(db, 'tasks', id), {
        status: task.status === 'done' ? 'todo' : 'done'
      });
    }
  };

  const moveTaskStatus = async (id: string, newStatus: Task['status']) => {
    await updateDoc(doc(db, 'tasks', id), { status: newStatus });
  };

  const createClient = async (client: Omit<Client, 'id'>) => {
    const id = generateId();
    const newClient: Client = { ...client, id };
    await setDoc(doc(db, 'clients', id), newClient);
  };

  const createBriefing = async (briefing: Omit<Briefing, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newBriefing: Briefing = { ...briefing, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'briefings', id), newBriefing);
  };

  const updateBriefing = async (id: string, updates: Partial<Briefing>) => {
    await updateDoc(doc(db, 'briefings', id), updates);
  };

  const deleteBriefing = async (id: string) => {
    await deleteDoc(doc(db, 'briefings', id));
  };

  const markNotificationRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const notifyUser = async (userId: string, message: string) => {
    const notifId = generateId();
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      userId,
      message,
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <StoreContext.Provider value={{
      tasks, clients, users, briefings, notifications,
      createTask, updateTask, deleteTask, toggleTaskStatus, moveTaskStatus,
      createClient, createBriefing, updateBriefing, deleteBriefing, markNotificationRead, notifyUser
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
