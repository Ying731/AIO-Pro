'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { getCurrentVersion, isDevelopmentMode } from '@/lib/version'
import UpdateHistoryModal from './UpdateHistoryModal'

export default function VersionDisplay() {
  const [showModal, setShowModal] = useState(false)
  const currentVersion = getCurrentVersion()
  
  // 如果不在开发模式，不显示版本信息
  if (!isDevelopmentMode()) {
    return null
  }

  return (
    <>
      {/* 版本号显示按钮 */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowModal(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          title="查看更新历史"
        >
          <Info className="w-4 h-4" />
          {currentVersion.current}
        </button>
      </div>

      {/* 更新历史弹窗 */}
      <UpdateHistoryModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  )
}