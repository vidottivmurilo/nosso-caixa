import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import styles from './MainLayout.module.css'

export function MainLayout() {
  const { token, currentGroupId } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Opcional: Se não tiver grupo selecionado e não estiver na rota de grupos, 
  // pode forçar o redirecionamento, mas por enquanto vamos manter flexível.

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.contentArea}>
        <Navbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
