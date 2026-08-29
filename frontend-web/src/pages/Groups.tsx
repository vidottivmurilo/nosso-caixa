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

  const [inviteModalGroupId, setInviteModalGroupId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteModalGroupId || !inviteEmail) return
    
    setIsInviting(true)
    try {
      const res = await apiFetch(`/groups/${inviteModalGroupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail })
      })
      const data = await res.json()
      
      if (res.ok) {
        alert('Convite enviado com sucesso!')
        setInviteModalGroupId(null)
        setInviteEmail('')
      } else {
        alert(data.error || 'Erro ao convidar usuário')
      }
    } catch (err) {
      console.error('Erro ao convidar', err)
      alert('Erro de conexão ao tentar convidar')
    } finally {
      setIsInviting(false)
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
                
                {(g.role || g.my_role) === 'OWNER' && (
                  <button className={styles.inviteBtn} onClick={() => setInviteModalGroupId(g.id)} style={{ marginBottom: isActive ? 0 : 8 }}>
                    + Convidar Membro
                  </button>
                )}

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

      {inviteModalGroupId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Convidar Membro</h3>
            <form onSubmit={handleInvite}>
              <div className={styles.inputGroup}>
                <label>E-mail do usuário</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  autoFocus
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => { setInviteModalGroupId(null); setInviteEmail(''); }} className={styles.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isInviting || !inviteEmail}>
                  {isInviting ? 'Convidando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
