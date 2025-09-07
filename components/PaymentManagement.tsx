'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentRecord {
  id: number
  registrant_id: number
  razorpay_order_id: string
  razorpay_payment_id: string
  paid_amount: number
  payment_status: string
  payment_method: string
  payment_time: string
  created_at: string
  registrants: {
    team_name: string
    events: {
      name: string
    }
  }
}

export function PaymentManagement() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          registrants!inner(
            team_name,
            events!inner(name)
          )
        `)
        .order('payment_time', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Records</CardTitle>
        <CardDescription>
          View all payment transactions and their status
        </CardDescription>
        <Button onClick={fetchPayments} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No payment records found</p>
            <p className="text-sm text-gray-400 mt-2">
              Payments will appear here after successful transactions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">
                        {(payment.registrants.events as any)?.name || 'Unknown Event'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Team: {payment.registrants.team_name || 'No Team Name'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">₹{payment.paid_amount}</p>
                      <p className="text-xs text-gray-500">{payment.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          payment.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : payment.payment_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.payment_status.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.payment_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Payment ID: {payment.razorpay_payment_id}</p>
                    <p>Order ID: {payment.razorpay_order_id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
