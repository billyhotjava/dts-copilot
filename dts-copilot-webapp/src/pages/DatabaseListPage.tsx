import { useEffect, useState } from 'react'
import { Table, Typography, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface DatabaseItem {
  id: number
  name: string
  engine?: string
  host?: string
  port?: number
  dbName?: string
  status?: string
}

export default function DatabaseListPage() {
  const [data, setData] = useState<DatabaseItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/databases')
      .then(r => r.json())
      .then(res => setData(res.data || []))
      .catch(() => message.error('加载数据源列表失败'))
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnsType<DatabaseItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '名称', dataIndex: 'name' },
    { title: '引擎', dataIndex: 'engine', width: 120, render: (t) => t ? <Tag color="blue">{t}</Tag> : '-' },
    { title: '主机', dataIndex: 'host' },
    { title: '端口', dataIndex: 'port', width: 100 },
    { title: '数据库', dataIndex: 'dbName' },
    { title: '状态', dataIndex: 'status', width: 100, render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{s || '未知'}</Tag> },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>数据源</Title>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  )
}
