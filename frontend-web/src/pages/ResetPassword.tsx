import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { apiFetch } from '../services/api'
import styles from './Auth.module.css'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setError('Token inválido ou ausente')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao redefinir senha')
      }

      navigate('/login')
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
          <h1>Nova senha</h1>
          <p>Crie uma nova senha para sua conta</p>
        </div>

        <form className={styles.form} onSubmit={handleReset}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="password">Nova Senha</label>
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

          <button type="submit" className={styles.button} disabled={loading || !token}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/login" className={styles.link}>
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
