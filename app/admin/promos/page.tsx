"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase/client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Promo {
  id: string
  title: string
  discount_percent: number
  is_active: boolean
  start_date: string
  end_date: string
}

export default function AdminPromosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/login')
      return
    }
    fetchPromos()
  }, [session, status])

  const fetchPromos = async () => {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setPromos(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo?')) return
    
    const { error } = await supabase
      .from('promos')
      .delete()
      .eq('id', id)
    
    if (!error) {
      fetchPromos()
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-light">Manage Promotions</h1>
        <Link href="/admin/promos/new">
          <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
            + Add New Promo
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Title</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Discount</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Period</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {promos.map((promo) => (
              <tr key={promo.id}>
                <td className="px-6 py-4">{promo.title}</td>
                <td className="px-6 py-4">{promo.discount_percent}%</td>
                <td className="px-6 py-4 text-sm">
                  {new Date(promo.start_date).toLocaleDateString('id-ID')} - {new Date(promo.end_date).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <Link href={`/admin/promos/${promo.id}`}>
                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  </Link>
                  <button 
                    onClick={() => handleDelete(promo.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}