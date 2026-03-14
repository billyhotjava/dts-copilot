import { Routes, Route } from 'react-router'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './layouts/MainLayout'
import EmbedLayout from './layouts/EmbedLayout'
import DashboardListPage from './pages/DashboardListPage'
import DashboardDetailPage from './pages/DashboardDetailPage'
import CardListPage from './pages/CardListPage'
import CardEditorPage from './pages/CardEditorPage'
import DatabaseListPage from './pages/DatabaseListPage'
import ScreenListPage from './pages/ScreenListPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const isEmbed = new URLSearchParams(window.location.search).has('embed')
  const Layout = isEmbed ? EmbedLayout : MainLayout

  return (
    <ConfigProvider locale={zhCN}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboards" element={<DashboardListPage />} />
          <Route path="dashboards/:id" element={<DashboardDetailPage />} />
          <Route path="questions" element={<CardListPage />} />
          <Route path="questions/new" element={<CardEditorPage />} />
          <Route path="questions/:id" element={<CardEditorPage />} />
          <Route path="databases" element={<DatabaseListPage />} />
          <Route path="screens" element={<ScreenListPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}

export default App
