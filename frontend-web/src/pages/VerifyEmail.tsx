import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { apiFetch } from '../services/api'
import styles from './Auth.module.css'

export function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando seu e-mail...')
  const navigate = useNavigate()
  
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de verificação inválido ou ausente.')
      return
    }

    apiFetch(`/auth/verify-email?token=${token}`, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Erro ao verificar e-mail')
        }
        setStatus('success')
        setMessage('E-mail verificado com sucesso! Você já pode fazer login.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [token])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Verificação de E-mail</h1>
          <p>{status === 'loading' ? 'Aguarde um momento...' : 'Resultado da verificação'}</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {status === 'loading' && <span style={{ color: 'var(--text-secondary)' }}>Carregando...</span>}
          {status === 'success' && <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>{message}</span>}
          {status === 'error' && <span className={styles.error}>{message}</span>}
        </div>

        <div className={styles.links}>
          <Link to="/login" className={styles.button} style={{ textDecoration: 'none', textAlign: 'center' }}>
            Ir para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
