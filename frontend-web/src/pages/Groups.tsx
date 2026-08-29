import React, { useEffect, useState } from 'react'
import { apiFetch } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import styles from './Groups.module.css'

interface Group {
  id: string
  name: string
  role?: string
  my_role?: string
}

export function Groups() {
  const { currentGroupId, setCurrentGroup } = useAuthStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(data)
        
        // Corrige automaticamente se o usuário tiver ID mas não o Nome salvo na sessão
        const activeGroup = data.find((g: any) => g.id === useAuthStore.getState().currentGroupId)
        if (activeGroup && !useAuthStore.getState().currentGroupName) {
          useAuthStore.getState().setCurrentGroup(activeGroup.id, activeGroup.name)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar grupos', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName) return
    try {
      const res = await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName })
      })
      if (res.ok) {
        setNewGroupName('')
        setIsModalOpen(false)
        fetchGroups() // Recarrega a lista
      }
    } catch (err) {
      console.error('Erro ao criar grupo', err)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Meus Grupos</h1>
          <p>Selecione um grupo ativo ou crie uma nova caixinha</p>
        </div>
        <button className={styles.newGroupBtn} onClick={() => setIsModalOpen(true)}>
          + Novo Grupo
        </button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          Você ainda não faz parte de nenhum grupo. Crie um para começar!
        </div>
      ) : (
        <div className={styles.grid}>
          {groups.map((g) => {
            const isActive = currentGroupId === g.id
            return (
              <div key={g.id} className={`${styles.groupCard} ${isActive ? styles.active : ''}`}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupName}>{g.name}</span>
                  {isActive && <span className={styles.badge}>Ativo</span>}
                </div>
                <div className={styles.role}>
                  Papel: {(g.role || g.my_role) === 'OWNER' ? 'Dono' : 'Membro'}
                </div>
                
                {!isActive && (
                  <button className={styles.selectBtn} onClick={() => setCurrentGroup(g.id, g.name)}>
                    Acessar este grupo
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Criar novo grupo</h2>
            <form className={styles.modalForm} onSubmit={handleCreateGroup}>
              <div className={styles.inputGroup}>
                <label>Nome do grupo</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Ex: Finanças da Casa"
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Salvar Grupo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
