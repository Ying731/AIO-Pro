import { supabase } from './supabase'

export const clearAuthStorage = async () => {
  try {
    // 清理本地存储
    localStorage.clear()
    sessionStorage.clear()
    
    // 清理所有与Supabase相关的存储
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })
    
    // 清理索引数据库中的认证数据
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases()
        databases.forEach(db => {
          if (db.name?.includes('supabase') || db.name?.includes('sb-')) {
            indexedDB.deleteDatabase(db.name)
          }
        })
      } catch (error) {
        console.log('Failed to clear IndexedDB:', error)
      }
    }
    
    // 清理Supabase会话
    await supabase.auth.signOut()
    
    console.log('Auth storage cleared successfully')
  } catch (error) {
    console.error('Error clearing auth storage:', error)
  }
}

export const handleAuthError = async (error: any) => {
  console.error('Authentication error:', error)
  
  if (error?.message?.includes('refresh_token_not_found') || 
      error?.message?.includes('Invalid Refresh Token') ||
      error?.message?.includes('Token has expired')) {
    
    console.log('Detected auth token error, clearing storage...')
    await clearAuthStorage()
    
    // 如果在浏览器环境中，重定向到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/?error=session_expired'
    }
  }
  
  return error
}

export const checkAuthState = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      await handleAuthError(error)
      return null
    }
    
    return session
  } catch (error) {
    await handleAuthError(error)
    return null
  }
}