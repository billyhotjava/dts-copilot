import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Input, Button, Select, Card, Table, Typography, Space, Spin, message } from 'antd'
import { PlayCircleOutlined, SaveOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TextArea } = Input

interface Database {
  id: number
  name: string
}

export default function CardEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'

  const [name, setName] = useState('')
  const [sql, setSql] = useState('')
  const [databaseId, setDatabaseId] = useState<number | undefined>()
  const [databases, setDatabases] = useState<Database[]>([])
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<{ title: string; dataIndex: string; key: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(!isNew)

  useEffect(() => {
    fetch('/api/databases')
      .then(r => r.json())
      .then(res => setDatabases(res.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/cards/${id}`)
        .then(r => r.json())
        .then(res => {
          const card = res.data
          if (card) {
            setName(card.name || '')
            setSql(card.sql || '')
            setDatabaseId(card.databaseId)
          }
        })
        .catch(() => message.error('加载查询失败'))
        .finally(() => setPageLoading(false))
    }
  }, [id, isNew])

  const executeQuery = async () => {
    if (!sql.trim() || !databaseId) {
      message.warning('请选择数据源并输入SQL')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/cards/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId, sql }),
      })
      const data = await response.json()
      const rows = data.data?.rows || []
      const cols = data.data?.columns || []
      setColumns(cols.map((c: string) => ({ title: c, dataIndex: c, key: c })))
      setResults(rows)
    } catch {
      message.error('查询执行失败')
    } finally {
      setLoading(false)
    }
  }

  const saveCard = async () => {
    if (!name.trim()) {
      message.warning('请输入名称')
      return
    }
    try {
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/cards' : `/api/cards/${id}`
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sql, databaseId }),
      })
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    }
  }

  if (pageLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <Title level={4}>{isNew ? '新建查询' : '编辑查询'}</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input placeholder="查询名称" value={name} onChange={e => setName(e.target.value)} />
        <Select
          placeholder="选择数据源"
          value={databaseId}
          onChange={setDatabaseId}
          style={{ width: 300 }}
          options={databases.map(db => ({ label: db.name, value: db.id }))}
        />
        <TextArea
          rows={8}
          placeholder="输入 SQL 查询语句..."
          value={sql}
          onChange={e => setSql(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
        <Space>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={executeQuery} loading={loading}>执行</Button>
          <Button icon={<SaveOutlined />} onClick={saveCard}>保存</Button>
        </Space>
        {results.length > 0 && (
          <Card title="查询结果" size="small">
            <Table columns={columns} dataSource={results} rowKey={(_, i) => String(i)} size="small" scroll={{ x: true }} />
          </Card>
        )}
      </Space>
    </div>
  )
}
