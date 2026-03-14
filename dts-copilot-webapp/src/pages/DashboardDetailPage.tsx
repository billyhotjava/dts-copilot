import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Card, Col, Row, Spin, Typography, Empty, message } from 'antd'

const { Title, Text } = Typography

interface DashboardCard {
  id: number
  name: string
  description?: string
}

interface DashboardDetail {
  id: number
  name: string
  description?: string
  cards?: DashboardCard[]
}

export default function DashboardDetailPage() {
  const { id } = useParams()
  const [dashboard, setDashboard] = useState<DashboardDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboards/${id}`)
      .then(r => r.json())
      .then(res => setDashboard(res.data || null))
      .catch(() => message.error('加载仪表盘详情失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  if (!dashboard) return <Empty description="仪表盘不存在" />

  return (
    <div>
      <Title level={4}>{dashboard.name}</Title>
      {dashboard.description && <Text type="secondary">{dashboard.description}</Text>}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {(dashboard.cards || []).length === 0 ? (
          <Col span={24}><Empty description="暂无卡片" /></Col>
        ) : (
          dashboard.cards!.map(card => (
            <Col key={card.id} xs={24} sm={12} lg={8}>
              <Card title={card.name} hoverable>
                <Text type="secondary">{card.description || '无描述'}</Text>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  )
}
