import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { apiFetch } from '../services/api'
import styles from './Transactions.module.css'

interface Category {
  id: string
  name: string
  type: string
}

interface Transaction {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  description: string
  date: string
  category: Category
  user: { name: string }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatDate = (isoDate: string) => {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(isoDate))
}

export function Transactions() {
  const currentGroupId = useAuthStore((state) => state.currentGroupId)
  
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [showPicker, setShowPicker] = useState(false)
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [txDesc, setTxDesc] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // AI Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiText, setAiText] = useState('')
  const [isAiSubmitting, setIsAiSubmitting] = useState(false)

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ]
  
  useEffect(() => {
    // Carrega Categorias uma vez
    apiFetch('/categories').then(res => res.json()).then(data => setCategories(data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (!currentGroupId) return
    loadTransactions()
  }, [currentGroupId, month, year])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const response = await apiFetch(`/transactions/group/${currentGroupId}?month=${month}&year=${year}`)
      if (response.ok) {
        setTransactions(await response.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return
    try {
      const response = await apiFetch(`/transactions/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== id))
      }
    } catch (err) {
      console.error('Erro ao excluir', err)
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentGroupId) return
    
    setIsSubmitting(true)
    try {
      const response = await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          group_id: currentGroupId,
          category_id: txCategory,
          amount: parseFloat(txAmount),
          type: txType,
          description: txDesc,
          date: new Date(txDate).toISOString()
        })
      })

      if (response.ok) {
        setIsModalOpen(false)
        loadTransactions() // recarrega a lista
        // reset form
        setTxDesc('')
        setTxAmount('')
      } else {
        const err = await response.json()
        alert(err.error || 'Erro ao criar')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentGroupId || !aiText.trim()) return

    setIsAiSubmitting(true)
    try {
      const response = await apiFetch('/ai/parse-transaction', {
        method: 'POST',
        body: JSON.stringify({
          text: aiText,
          group_id: currentGroupId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsAiModalOpen(false)
        setAiText('')
        loadTransactions() // recarrega a lista com os dados criados pela IA
        alert(`✨ Sucesso! A IA registrou: ${data.ai_raw_data.description} no valor de ${formatCurrency(data.ai_raw_data.amount)}`)
      } else {
        alert(data.error || 'Erro ao processar com a IA')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao usar a Inteligência Artificial')
    } finally {
      setIsAiSubmitting(false)
    }
  }

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) } 
    else { setMonth((m) => m - 1) }
  }

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) } 
    else { setMonth((m) => m + 1) }
  }

  if (!currentGroupId) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: 64 }}>
        <h2>Nenhum grupo selecionado</h2>
        <p>Selecione um grupo para ver seus lançamentos.</p>
        <Link to="/groups" className={styles.addButton} style={{ display: 'inline-block', marginTop: 16 }}>Ir para Grupos</Link>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Lançamentos</h1>
          <p>Gerencie as entradas e saídas do mês</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.monthSelectorWrapper}>
            <div className={styles.monthSelector}>
              <button onClick={handlePrevMonth} className={styles.monthButton}>◀</button>
              
              <div className={styles.monthLabel} onClick={() => setShowPicker(!showPicker)}>
                {months.find(m => m.value === month)?.label} {year}
              </div>

              <button onClick={handleNextMonth} className={styles.monthButton}>▶</button>
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
                      onClick={() => { setMonth(m.value); setShowPicker(false) }}
                    >
                      {m.label.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className={styles.aiButton} onClick={() => setIsAiModalOpen(true)}>
            ✨ Inteligência Artificial
          </button>
          
          <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
            + Novo Lançamento
          </button>
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.emptyList}>Carregando lançamentos...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.emptyList}>Nenhum lançamento neste mês.</div>
        ) : (
          <div>
            {transactions.map(t => (
              <div key={t.id} className={styles.transactionItem}>
                <div className={styles.transactionInfo}>
                  <div className={styles.transactionDesc}>{t.description}</div>
                  <div className={styles.transactionMeta}>
                    <span>{formatDate(t.date)}</span> • 
                    <span className={styles.transactionCategory}>{t.category.name}</span> •
                    <span>Feito por {t.user.name.split(' ')[0]}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={`${styles.transactionAmount} ${t.type === 'INCOME' ? styles.income : styles.expense}`}>
                    {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
                  </div>
                  <button className={styles.deleteButton} onClick={() => handleDelete(t.id)} title="Excluir">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Novo Lançamento</h2>
            <div className={styles.typeSelector}>
              <div 
                className={`${styles.typeOption} ${txType === 'EXPENSE' ? styles.active : ''} ${styles.expense}`}
                onClick={() => setTxType('EXPENSE')}
              >
                Saída (Despesa)
              </div>
              <div 
                className={`${styles.typeOption} ${txType === 'INCOME' ? styles.active : ''} ${styles.income}`}
                onClick={() => setTxType('INCOME')}
              >
                Entrada (Receita)
              </div>
            </div>

            <form onSubmit={handleCreateTransaction}>
              <div className={styles.formGroup}>
                <label>Descrição</label>
                <input required className={styles.input} value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Ex: Mercado, Salário..." />
              </div>
              
              <div className={styles.formGroup}>
                <label>Valor (R$)</label>
                <input required type="number" step="0.01" min="0.01" className={styles.input} value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0.00" />
              </div>

              <div className={styles.formGroup}>
                <label>Data</label>
                <input required type="date" className={styles.input} value={txDate} onChange={e => setTxDate(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label>Categoria</label>
                <select required className={styles.input} value={txCategory} onChange={e => setTxCategory(e.target.value)}>
                  <option value="" disabled>Selecione uma categoria...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAiModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: 8 }}>✨ Assistente Inteligente</h2>
            <p className={styles.aiHint}>
              Digite como se estivesse conversando. A IA vai categorizar e criar o lançamento para você automaticamente!<br/><br/>
              Ex: <i>"Comprei 50 reais de pão no mercado"</i> ou <i>"Recebi 1500 de salário"</i>.
            </p>
            
            {isAiSubmitting ? (
              <div className={styles.aiLoading}>
                <div className={styles.spinner}></div>
                <p>A Inteligência Artificial está pensando...</p>
              </div>
            ) : (
              <form onSubmit={handleAiSubmit}>
                <textarea 
                  className={styles.aiTextArea} 
                  placeholder="Escreva seu gasto ou ganho aqui..."
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  autoFocus
                />
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelButton} onClick={() => setIsAiModalOpen(false)}>Cancelar</button>
                  <button type="submit" className={styles.aiSubmitButton} disabled={!aiText.trim()}>
                    Processar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
