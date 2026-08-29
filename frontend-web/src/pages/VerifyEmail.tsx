import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../services/api'
import styles from './Auth.module.css'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao verificar e-mail')
      }

      setSuccess('E-mail verificado com sucesso! Redirecionando para o login...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Por favor, informe seu e-mail para reenviar o código.')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao reenviar código')
      }

      setSuccess('Código reenviado com sucesso! Verifique seu e-mail.')
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
          <h1>Verificar E-mail</h1>
          <p>Digite o código de 6 dígitos enviado para você</p>
        </div>

        <form className={styles.form} onSubmit={handleVerify}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div style={{ color: 'var(--accent-green)', textAlign: 'center', fontSize: 14, fontWeight: 500 }}>{success}</div>}

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
            <label htmlFor="code">Código de Verificação</label>
            <input
              id="code"
              type="text"
              maxLength={6}
              className={styles.input}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Processando...' : 'Verificar conta'}
          </button>
        </form>

        <div className={styles.links}>
          <button 
            type="button" 
            onClick={handleResend} 
            disabled={loading}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent-green)', 
              fontWeight: 500, 
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Não recebeu? Reenviar código
          </button>
          
          <Link to="/login" className={styles.link} style={{ marginTop: 8 }}>
            Ir para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
