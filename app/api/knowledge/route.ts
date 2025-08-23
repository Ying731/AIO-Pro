import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json()

    // 这里应该使用向量搜索，但由于没有配置embedding服务，
    // 我们使用关键词匹配作为简化实现
    const { data: knowledgeItems, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
      .eq('status', 'published')
      .limit(5)

    if (error) {
      console.error('Knowledge search error:', error)
      return NextResponse.json({ success: false, results: [] })
    }

    // 根据相关性排序（简化实现）
    const sortedResults = knowledgeItems?.sort((a, b) => {
      const scoreA = calculateRelevanceScore(query, a)
      const scoreB = calculateRelevanceScore(query, b)
      return scoreB - scoreA
    }) || []

    return NextResponse.json({
      success: true,
      results: sortedResults.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content.substring(0, 300) + '...',
        category: item.category,
        tags: item.tags,
        relevanceScore: calculateRelevanceScore(query, item)
      }))
    })

  } catch (error) {
    console.error('Knowledge search API error:', error)
    return NextResponse.json(
      { error: '搜索知识库时出现错误' },
      { status: 500 }
    )
  }
}

function calculateRelevanceScore(query: string, item: any): number {
  const queryLower = query.toLowerCase()
  let score = 0

  // 标题匹配得分最高
  if (item.title?.toLowerCase().includes(queryLower)) {
    score += 10
  }

  // 内容匹配
  const contentMatches = (item.content?.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length
  score += contentMatches * 2

  // 标签匹配
  const tagMatches = item.tags?.filter((tag: string) => tag.toLowerCase().includes(queryLower)).length || 0
  score += tagMatches * 5

  // 分类匹配
  if (item.category?.toLowerCase().includes(queryLower)) {
    score += 3
  }

  return score
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const tag = url.searchParams.get('tag')

    let query = supabaseAdmin
      .from('knowledge_base')
      .select('id, title, category, tags, created_at, updated_at')
      .eq('status', 'published')

    if (category) {
      query = query.eq('category', category)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Knowledge list error:', error)
      return NextResponse.json({ success: false, items: [] })
    }

    return NextResponse.json({
      success: true,
      items: data || []
    })

  } catch (error) {
    console.error('Knowledge list API error:', error)
    return NextResponse.json(
      { error: '获取知识库列表时出现错误' },
      { status: 500 }
    )
  }
}