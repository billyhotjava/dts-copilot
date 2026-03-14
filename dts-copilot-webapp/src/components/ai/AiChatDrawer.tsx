import { useState, useRef, useEffect } from 'react'
import { Drawer, Input, Button, List, Typography, Space, Spin } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Paragraph } = Typography

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiChatDrawerProps {
  open: boolean
  onClose: () => void
}

export default function AiChatDrawer({ open, onClose }: AiChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/copilot/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content, context: '' }),
      })
      const data = await response.json()
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.data?.result || data.error || '无响应',
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '请求失败，请检查服务连接' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer title="AI 助手" open={open} onClose={onClose} width={420} styles={{ body: { display: 'flex', flexDirection: 'column', padding: 0 } }}>
      <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item style={{ border: 'none', padding: '8px 0' }}>
              <Space align="start">
                {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</Paragraph>
              </Space>
            </List.Item>
          )}
        />
        {loading && <Spin size="small" style={{ display: 'block', margin: '8px auto' }} />}
      </div>
      <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="输入消息..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1 }}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} loading={loading} />
        </Space.Compact>
      </div>
    </Drawer>
  )
}
