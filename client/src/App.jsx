import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import ViewExpenses from './pages/ViewExpenses'
import Login from './pages/Login'

function App() {
  useEffect(() => {
    console.log('App initialized', {
      apiBase: import.meta.env.VITE_API_BASE_URL,
      mode: import.meta.env.MODE,
      storageAvailable: typeof localStorage !== 'undefined',
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<AddExpense />} />
          <Route path="view" element={<ViewExpenses />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App


