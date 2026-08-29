import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { apiFetch } from '../services/api'
import styles from './Profile.module.css'

export function Profile() {
  const { user, setAuth, token } = useAuthStore()
  
  const [name, setName] = useState(user?.name || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar perfil')
      }

      // Atualiza os dados na store do Zustand, mantendo o token
      if (token && data.user) {
        setAuth(token, data.user)
      }
      
      setMessage('Perfil atualizado com sucesso!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais</p>
      </div>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleUpdate}>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail (Apenas leitura)</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
