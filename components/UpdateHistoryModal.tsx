'use client'

import { useState } from 'react'
import { X, Clock, CheckCircle2, AlertCircle, Zap, GitBranch } from 'lucide-react'
import { UpdateRecord, getUpdateHistory, getCurrentVersion } from '@/lib/version'

interface UpdateHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const typeIcons = {
  feature: <Zap className="w-4 h-4" />,
  bugfix: <AlertCircle className="w-4 h-4" />,
  improvement: <CheckCircle2 className="w-4 h-4" />,
  breaking: <GitBranch className="w-4 h-4" />
}

const typeColors = {
  feature: 'bg-blue-100 text-blue-700 border-blue-200',
  bugfix: 'bg-red-100 text-red-700 border-red-200',
  improvement: 'bg-green-100 text-green-700 border-green-200',
  breaking: 'bg-orange-100 text-orange-700 border-orange-200'
}

const typeNames = {
  feature: '新功能',
  bugfix: '缺陷修复',
  improvement: '优化改进',
  breaking: '重大变更'
}

export default function UpdateHistoryModal({ isOpen, onClose }: UpdateHistoryModalProps) {
  const currentVersion = getCurrentVersion()
  const updateHistory = getUpdateHistory()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">更新历史</h2>
              <p className="text-sm text-gray-600">
                当前版本: {currentVersion.current} • {currentVersion.buildDate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {updateHistory.map((record, index) => (
              <div key={record.version} className="mb-8 last:mb-0">
                {/* 版本头部 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${typeColors[record.type]}`}>
                      {typeIcons[record.type]}
                      {typeNames[record.type]}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {record.version} - {record.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 ml-auto">
                    <Clock className="w-4 h-4 mr-1" />
                    {record.date}
                  </div>
                </div>

                {/* 更新内容 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ml-4">
                  {/* 功能描述 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">主要更新</h4>
                    <ul className="space-y-2">
                      {record.description.map((desc, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* TODO列表 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">开发进度</h4>
                    <ul className="space-y-2">
                      {record.todos.map((todo, idx) => {
                        const isCompleted = todo.startsWith('✅')
                        const isInProgress = todo.startsWith('🔄')
                        const isPending = todo.startsWith('⏳')
                        
                        return (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 flex-shrink-0">
                              {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                              {isInProgress && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>}
                              {isPending && <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}
                              {!isCompleted && !isInProgress && !isPending && <div className="w-4 h-4 rounded-full bg-gray-200"></div>}
                            </span>
                            <span className={`${isCompleted ? 'text-gray-600 line-through' : isInProgress ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                              {todo.replace(/^[✅🔄⏳]\s*/, '')}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>

                {/* 分隔线 */}
                {index < updateHistory.length - 1 && (
                  <div className="mt-8 border-b border-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}