import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Table, Button, Typography, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface Dashboard {
  id: number
  name: string
  description?: string
  createdAt?: string
}

export default function DashboardListPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboards')
      .then(r => r.json())
      .then(res => setData(res.data || []))
      .catch(() => message.error('加载仪表盘列表失败'))
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnsType<Dashboard> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', render: (text, record) => <a onClick={() => navigate(`/dashboards/${record.id}`)}>{text}</a> },
    { title: '描述', dataIndex: 'description' },
    { title: '创建时间', dataIndex: 'createdAt', width: 200 },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>仪表盘</Title>
        <Button type="primary" icon={<PlusOutlined />}>新建仪表盘</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  )
}
