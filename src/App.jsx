import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Home'
import MeetingEdit from './components/MeetingEdit'
import MeetingPreview from './components/MeetingPreview'
import Login from './components/Login'

// 受保护的路由组件
function ProtectedRoute({ children, isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 检查登录状态
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('app_authenticated') === 'true'
      setIsAuthenticated(authStatus)
    }
    checkAuth()
  }, [])

  const handleLogin = () => {
    localStorage.setItem('app_authenticated', 'true')
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('app_authenticated')
    setIsAuthenticated(false)
  }

  return (
    <Router>
      <Routes>
        {/* 登录页面 */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        
        {/* 受保护的路由 */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/meeting/:id"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MeetingEdit />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/meeting/:id/preview"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MeetingPreview />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
