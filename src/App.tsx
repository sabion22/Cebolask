import { useState } from 'react'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Clients from './pages/Clients'
import Office from './pages/Office'
import SettingsPage from './pages/Settings'

export type Page = 'dashboard' | 'tasks' | 'calendar' | 'clients' | 'office' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'tasks': return <Tasks />
      case 'calendar': return <Calendar />
      case 'clients': return <Clients />
      case 'office': return <Office />
      case 'settings': return <SettingsPage />
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
