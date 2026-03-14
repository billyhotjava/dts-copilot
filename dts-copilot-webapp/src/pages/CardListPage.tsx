import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Table, Button, Typography, Space, Tag, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface CardItem {
  id: number
  name: string
  type?: string
  databaseId?: number
  createdAt?: string
}

export default function CardListPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cards')
      .then(r => r.json())
      .then(res => setData(res.data || []))
      .catch(() => message.error('加载查询列表失败'))
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnsType<CardItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', render: (text, record) => <a onClick={() => navigate(`/questions/${record.id}`)}>{text}</a> },
    { title: '类型', dataIndex: 'type', width: 120, render: (t) => t ? <Tag>{t}</Tag> : '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 200 },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>查询</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/questions/new')}>新建查询</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  )
}
