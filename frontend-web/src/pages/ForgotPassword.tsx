import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../services/api'
import styles from './Auth.module.css'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao solicitar recuperação')
      }

      setSuccess('Se o e-mail existir, você receberá um link de recuperação.')
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
          <h1>Recuperar senha</h1>
          <p>Enviaremos as instruções para o seu e-mail</p>
        </div>

        <form className={styles.form} onSubmit={handleForgot}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div style={{ color: 'var(--accent-green)', textAlign: 'center', fontSize: 14 }}>{success}</div>}

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

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar instruções'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/login" className={styles.link}>
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
