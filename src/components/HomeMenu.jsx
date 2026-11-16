import { useEffect, useRef } from 'react'
import Icon from './Icon'

export default function HomeMenu({ onSignOut, onNotifications }) {
  const menuRef = useRef(null)
  useEffect(() => {
    function dismiss(event) {
      const menu = menuRef.current
      if (menu?.open && !menu.contains(event.target)) menu.open = false
    }
    function escape(event) {
      const menu = menuRef.current
      if (event.key === 'Escape' && menu?.open) {
        menu.open = false
        menu.querySelector('summary').focus()
      }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [])
  function choose(action) {
    menuRef.current.open = false
    action?.()
  }
  return <details className="home-menu" ref={menuRef}
    onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
    }}>
    <summary className="avatar-button home-menu-toggle" aria-label="Account menu" title="Menu">
      <Icon name="menu" size={22} />
    </summary>
    <div className="home-menu-options">
      <button type="button" disabled={!onSignOut} onClick={() => choose(onSignOut)}>Sign out</button>
      <button type="button" onClick={() => choose(onNotifications)}>Set notifications</button>
    </div>
  </details>
}
