import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Spin, Typography } from 'antd'
import { DashboardOutlined, QuestionCircleOutlined, DatabaseOutlined, DesktopOutlined } from '@ant-design/icons'

const { Title } = Typography

interface Stats {
  dashboards: number
  questions: number
  databases: number
  screens: number
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({ dashboards: 0, questions: 0, databases: 0, screens: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dashRes, cardRes, dbRes, screenRes] = await Promise.allSettled([
          fetch('/api/dashboards').then(r => r.json()),
          fetch('/api/cards').then(r => r.json()),
          fetch('/api/databases').then(r => r.json()),
          fetch('/api/screens').then(r => r.json()),
        ])
        setStats({
          dashboards: dashRes.status === 'fulfilled' ? (dashRes.value.data?.length ?? 0) : 0,
          questions: cardRes.status === 'fulfilled' ? (cardRes.value.data?.length ?? 0) : 0,
          databases: dbRes.status === 'fulfilled' ? (dbRes.value.data?.length ?? 0) : 0,
          screens: screenRes.status === 'fulfilled' ? (screenRes.value.data?.length ?? 0) : 0,
        })
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>欢迎使用 DTS Copilot</Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="仪表盘" value={stats.dashboards} prefix={<DashboardOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="查询" value={stats.questions} prefix={<QuestionCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="数据源" value={stats.databases} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="大屏" value={stats.screens} prefix={<DesktopOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
