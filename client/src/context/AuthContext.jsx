import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [isAuthenticated, setIsAuthenticated] = useState(!!token)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      setIsAuthenticated(true)
    } else {
      localStorage.removeItem('token')
      setIsAuthenticated(false)
    }
  }, [token])

  const logout = () => {
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
