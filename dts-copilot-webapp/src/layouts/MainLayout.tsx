import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { Layout, Menu } from 'antd'
import { DashboardOutlined, QuestionCircleOutlined, DatabaseOutlined, DesktopOutlined, RobotOutlined } from '@ant-design/icons'
import AiChatDrawer from '../components/ai/AiChatDrawer'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [chatOpen, setChatOpen] = useState(false)

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '首页' },
    { key: '/dashboards', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/questions', icon: <QuestionCircleOutlined />, label: '查询' },
    { key: '/databases', icon: <DatabaseOutlined />, label: '数据源' },
    { key: '/screens', icon: <DesktopOutlined />, label: '大屏' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>
          DTS Copilot
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <RobotOutlined style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => setChatOpen(true)} />
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
      <AiChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </Layout>
  )
}
