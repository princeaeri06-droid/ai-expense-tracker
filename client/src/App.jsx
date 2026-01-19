import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import ViewExpenses from './pages/ViewExpenses'
import Login from './pages/Login'

function App() {
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


