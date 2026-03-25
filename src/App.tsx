import { useState } from 'react'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Clients from './pages/Clients'

export type Page = 'dashboard' | 'tasks' | 'calendar' | 'clients'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'tasks': return <Tasks />
      case 'calendar': return <Calendar />
      case 'clients': return <Clients />
      default: return <Dashboard />
    }
  }

  return (
    <ProtectedRoute>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </ProtectedRoute>
  )
}

export default App
