'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Search, BookOpen, Edit, Trash2, Save, X } from 'lucide-react'
import Link from 'next/link'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export default function KnowledgeManagePage() {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<KnowledgeItem>>({})
  const [user, setUser] = useState<any>(null)

  const categories = ['学习方法', '课程指导', '专业知识', '职业规划', '技能培养', '考试指导']

  useEffect(() => {
    checkUser()
    loadKnowledgeItems()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/'
      return
    }
    setUser(user)
  }

  const loadKnowledgeItems = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setKnowledgeItems(data)
      }
    } catch (error) {
      console.error('Error loading knowledge items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const startEditing = (item?: KnowledgeItem) => {
    if (item) {
      setEditingItem(item)
    } else {
      setEditingItem({
        title: '',
        content: '',
        category: categories[0],
        tags: [],
        status: 'draft'
      })
    }
    setIsEditing(true)
  }

  const saveKnowledgeItem = async () => {
    try {
      if (!editingItem.title || !editingItem.content) {
        alert('请填写标题和内容')
        return
      }

      const itemData = {
        ...editingItem,
        updated_at: new Date().toISOString()
      }

      if (editingItem.id) {
        // 更新现有项目
        const { error } = await supabase
          .from('knowledge_base')
          .update(itemData)
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        // 创建新项目
        const { error } = await supabase
          .from('knowledge_base')
          .insert([{
            ...itemData,
            author_id: user?.id,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      setIsEditing(false)
      setEditingItem({})
      loadKnowledgeItems()
      
    } catch (error) {
      console.error('Error saving knowledge item:', error)
      alert('保存失败，请重试')
    }
  }

  const deleteKnowledgeItem = async (id: string) => {
    if (!confirm('确定要删除这个知识条目吗？')) return

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadKnowledgeItems()
    } catch (error) {
      console.error('Error deleting knowledge item:', error)
      alert('删除失败，请重试')
    }
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
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">知识库管理</h1>
                  <p className="text-sm text-gray-500">管理AI助手的知识内容</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => startEditing()}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加知识
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isEditing ? (
          <>
            {/* 搜索和筛选 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="搜索知识条目..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">所有分类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 知识列表 */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">加载中...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无知识条目</h3>
                  <p className="text-gray-500">点击"添加知识"开始创建第一个知识条目</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'published' ? '已发布' : '草稿'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          创建于 {new Date(item.created_at).toLocaleDateString()}
                          {item.updated_at !== item.created_at && 
                            ` • 更新于 ${new Date(item.updated_at).toLocaleDateString()}`
                          }
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-2 text-gray-400 hover:text-orange-600 rounded-md hover:bg-orange-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteKnowledgeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* 编辑模式 */
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem.id ? '编辑知识条目' : '添加知识条目'}
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditingItem({})
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2 inline" />
                  取消
                </button>
                <button
                  onClick={saveKnowledgeItem}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  <Save className="w-4 h-4 mr-2 inline" />
                  保存
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={editingItem.title || ''}
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="输入知识条目标题"
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select
                    value={editingItem.category || ''}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={editingItem.status || 'draft'}
                    onChange={(e) => setEditingItem({...editingItem, status: e.target.value as 'draft' | 'published'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">发布</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <input
                  type="text"
                  value={(editingItem.tags || []).join(', ')}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="用逗号分隔多个标签，如：学习方法, 时间管理, 效率提升"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                <textarea
                  value={editingItem.content || ''}
                  onChange={(e) => setEditingItem({...editingItem, content: e.target.value})}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="输入详细的知识内容，支持Markdown格式"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}