import { Outlet } from 'react-router'

export default function EmbedLayout() {
  return (
    <div style={{ padding: 16 }}>
      <Outlet />
    </div>
  )
}
