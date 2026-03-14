import { useEffect, useState } from 'react'
import { Table, Button, Typography, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface ScreenItem {
  id: number
  name: string
  description?: string
  createdAt?: string
}

export default function ScreenListPage() {
  const [data, setData] = useState<ScreenItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/screens')
      .then(r => r.json())
      .then(res => setData(res.data || []))
      .catch(() => message.error('加载大屏列表失败'))
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnsType<ScreenItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description' },
    { title: '创建时间', dataIndex: 'createdAt', width: 200 },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>大屏</Title>
        <Button type="primary" icon={<PlusOutlined />}>新建大屏</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  )
}
