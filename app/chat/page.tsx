'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Send, Bot, User, ArrowLeft, Sparkles, Plus } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/'
      return
    }
    setUser(user)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', 'student')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setConversations(data)
        if (data.length > 0 && !currentConversation) {
          setCurrentConversation(data[0].id)
          loadMessages(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at
        })))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const createNewConversation = async () => {
    try {
      if (!user) return

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          agent_type: 'student',
          title: `新对话 ${new Date().toLocaleString()}`,
          context_data: {}
        })
        .select()
        .single()

      if (!error && data) {
        setConversations([data, ...conversations])
        setCurrentConversation(data.id)
        setMessages([])
        // 添加欢迎消息
        const welcomeMessage = {
          id: 'welcome-' + Date.now(),
          role: 'assistant' as const,
          content: '您好！我是启明星AI学习助手。我可以帮助您解答学习问题、制定学习计划、分析学习进度等。请告诉我您需要什么帮助？',
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
        
        // 保存欢迎消息到数据库
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: data.id,
            role: 'assistant',
            content: welcomeMessage.content,
            metadata: {}
          })
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isLoading) return

    const userMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // 保存用户消息到数据库
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversation,
          role: 'user',
          content: userMessage.content,
          metadata: {}
        })

      // 调用学生AI智能体API
      const response = await fetch('/api/ai/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: currentConversation,
          userId: user.id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const aiResponse: Message = {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, aiResponse])

        // 保存AI响应到数据库
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: currentConversation,
            role: 'assistant',
            content: aiResponse.content,
            metadata: {}
          })
      } else {
        // 出错时显示错误信息
        const errorResponse: Message = {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: '抱歉，我暂时无法回复您的问题。请稍后再试。',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorResponse])
      }

      setIsLoading(false)

    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
    }
  }

  const selectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId)
    loadMessages(conversationId)
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-orange-600 mr-6">
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回仪表板
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <MessageCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI学习助手</h1>
                  <p className="text-sm text-gray-500">智能学习问答与指导</p>
                </div>
              </div>
            </div>
            <button
              onClick={createNewConversation}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新对话
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          {/* 对话列表侧边栏 */}
          <div className="w-80 bg-white rounded-lg shadow-sm border flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">对话历史</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    currentConversation === conv.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900 truncate">{conv.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>还没有对话记录</p>
                  <p className="text-sm">点击"新对话"开始聊天</p>
                </div>
              )}
            </div>
          </div>

          {/* 聊天区域 */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col">
            {currentConversation ? (
              <>
                {/* 消息区域 */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">开始新的对话</h3>
                        <p className="text-gray-500">向AI助手提问，获得个性化的学习指导</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              {message.role === 'assistant' && (
                                <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  message.role === 'user' ? 'text-orange-200' : 'text-gray-500'
                                }`}>
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                              {message.role === 'user' && (
                                <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Bot className="w-4 h-4" />
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* 输入区域 */}
                <div className="border-t p-4">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="输入您的问题..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">选择一个对话</h3>
                  <p className="text-gray-500">从左侧选择对话或创建新对话开始聊天</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}