import { useQuery, useMutation } from '@tanstack/react-query'
import { authService } from '../services/auth.service'
import { queryKeys } from '../lib/queryKeys'
import { useAuthContext } from '../context/AuthContext'

export const useAuth = () => {
  const { token, setToken, isAuthenticated, logout } = useAuthContext()

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authService.getMe,
    enabled: !!token
  })

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout()
    }
  })

  return {
    token,
    setToken,
    user,
    isAuthenticated,
    isLoading,
    logout: () => logoutMutation.mutate()
  }
}
