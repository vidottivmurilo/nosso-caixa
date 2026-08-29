import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { apiFetch } from '../services/api'
import styles from './Dashboard.module.css'

interface DashboardSummary {
  total_income: number
  total_expenses: number
  balance: number
  savings_amount: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function Dashboard() {
  const currentGroupId = useAuthStore((state) => state.currentGroupId)
  
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1) // 1 a 12
  const [year, setYear] = useState(currentDate.getFullYear())
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentGroupId) return

    const loadSummary = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await apiFetch(`/dashboard/group/${currentGroupId}/summary?month=${month}&year=${year}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar resumo financeiro')
        }
        
        setSummary(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [currentGroupId, month, year])

  if (!currentGroupId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Nenhum grupo selecionado</h2>
          <p>Para ver o seu resumo financeiro, você precisa selecionar ou criar um grupo (caixinha) primeiro.</p>
          <Link to="/groups" className={styles.button}>Ir para Meus Grupos</Link>
        </div>
      </div>
    )
  }

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ]
  
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const [showPicker, setShowPicker] = useState(false)
  const currentMonthLabel = months.find(m => m.value === month)?.label

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Resumo Financeiro</h1>
          <p>Acompanhe a saúde financeira da sua caixinha</p>
        </div>
        
        <div className={styles.monthSelectorWrapper}>
          <div className={styles.monthSelector}>
            <button onClick={handlePrevMonth} className={styles.monthButton} aria-label="Mês anterior">
              ◀
            </button>
            
            <div className={styles.monthLabel} onClick={() => setShowPicker(!showPicker)}>
              {currentMonthLabel} {year}
            </div>

            <button onClick={handleNextMonth} className={styles.monthButton} aria-label="Mês seguinte">
              ▶
            </button>
          </div>

          {showPicker && (
            <div className={styles.pickerPopover}>
              <div className={styles.pickerHeader}>
                <button onClick={() => setYear((y) => y - 1)}>◀</button>
                <span>{year}</span>
                <button onClick={() => setYear((y) => y + 1)}>▶</button>
              </div>
              <div className={styles.pickerGrid}>
                {months.map((m) => (
                  <button
                    key={m.value}
                    className={`${styles.pickerMonthBtn} ${m.value === month ? styles.active : ''}`}
                    onClick={() => {
                      setMonth(m.value)
                      setShowPicker(false)
                    }}
                  >
                    {m.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && !summary && <div className={styles.loading}>Carregando dados...</div>}

      {summary && !loading && (
        <>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Saldo Mensal</div>
              <div className={`${styles.cardValue} ${summary.balance >= 0 ? styles.income : styles.expense}`}>
                {formatCurrency(summary.balance)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Receitas (Entradas)</div>
              <div className={`${styles.cardValue} ${styles.income}`}>
                {formatCurrency(summary.total_income)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Despesas (Saídas)</div>
              <div className={`${styles.cardValue} ${styles.expense}`}>
                {formatCurrency(summary.total_expenses)}
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ marginBottom: 32 }}>
            <div className={styles.cardTitle}>Metas e Economias (Caixinha)</div>
            <div className={styles.cardValue} style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(summary.savings_amount)}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
              Valor acumulado total para os objetivos deste grupo.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
