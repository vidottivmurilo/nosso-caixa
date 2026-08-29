import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import styles from './Auth.module.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`)
          return
        }
        throw new Error(data.error || data.message || 'Erro ao realizar login')
      }

      // Salva o token e o usuário no estado global (Zustand)
      setAuth(data.token, data.user)
      
      // Redireciona para o painel restrito
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Bem-vindo de volta</h1>
          <p>Acesse o Nosso Caixa para gerenciar suas finanças</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>
            Esqueceu sua senha?
          </Link>
          <span style={{ color: 'var(--text-secondary)' }}>
            Ainda não tem conta? <Link to="/register" className={styles.link}>Criar conta</Link>
          </span>
        </div>
      </div>
    </div>
  )
}
