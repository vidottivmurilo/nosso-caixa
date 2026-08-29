import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './Navbar.module.css'

export function Navbar() {
  const { user, logout, currentGroupId } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // TODO: Fetch the actual group name using currentGroupId from API or Store
  const groupName = currentGroupId ? 'Grupo Selecionado' : 'Selecione um Grupo'

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <header className={styles.navbar}>
      <div className={styles.groupSelector}>
        <span className={styles.label}>Grupo Atual</span>
        <span className={styles.groupName}>{groupName}</span>
      </div>

      <div className={styles.profile}>
        <div className={styles.greeting}>
          Olá, <strong>{user?.name || 'Usuário'}</strong>
        </div>
        
        <div 
          className={styles.avatar} 
          onClick={() => navigate('/profile')}
          title="Meu Perfil"
        >
          {initial}
        </div>
        
        <button className={styles.logout} onClick={handleLogout} title="Sair">
          Sair
        </button>
      </div>
    </header>
  )
}
