import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Top Header (Visível apenas em telas pequenas) */}
      <div className={styles.mobileHeader}>
        <button className={styles.hamburgerBtn} onClick={() => setIsOpen(true)}>
          ☰
        </button>
        <div className={styles.mobileLogo}>
          <span style={{ color: 'var(--accent-green)' }}>●</span> Nosso Caixa
        </div>
      </div>

      {/* Backdrop para fechar ao clicar fora no mobile */}
      {isOpen && <div className={styles.backdrop} onClick={closeSidebar} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <span style={{ color: 'var(--accent-green)' }}>●</span> Nosso Caixa
        </div>

        <nav className={styles.nav}>
          <NavLink 
            to="/dashboard" 
            onClick={closeSidebar}
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            Dashboard
          </NavLink>
          
          <NavLink 
            to="/transactions" 
            onClick={closeSidebar}
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            Lançamentos
          </NavLink>
          
          <NavLink 
            to="/groups" 
            onClick={closeSidebar}
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            Meus Grupos
          </NavLink>
        </nav>
      </aside>
    </>
  )
}
