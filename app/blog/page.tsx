"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase/client"
import Link from "next/link"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  category: string
  image_url: string
  created_at: string
  views: number
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setPosts(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Blog Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-5xl font-light text-center">Our Blog</h1>
          <p className="text-center text-gray-600 mt-4">Unveil the artistry of perfumery through insightful articles</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts yet.</p>
            <p className="text-gray-400">Stay tuned for inspiring articles!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id}>
                <div className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="relative h-56 bg-gray-200">
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/75 text-white px-3 py-1 rounded-full text-xs">
                      {post.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-gray-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>By {post.author || 'Admin'}</span>
                      <span>{new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="mt-3 flex items-center text-gray-400 text-sm">
                      <span>👁️ {post.views || 0} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}