'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import Layout from '@/components/Layout'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Types for clarity
interface EventAnalytics {
  id: string
  name: string
  total_registrations: number
  total_participants: number
}

interface RegistrationRow {
  id: string
  team_name: string
  event_id: string
  event_name: string
  leader_name: string
  leader_email: string
  registration_date: string
  team_size: number
  status: string
  participants: Participant[]
}

interface Participant {
  id: string
  name: string
  email: string
  is_leader: boolean
}

const ADMIN_EMAILS = [
  'sakthi@example.com',
  'admin@kratos.com',
  'test@localhost.com',
  // Add your email here
  'officialsakthidharan@gmail.com',
]

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useStore()

  // Auth guard
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    
    // Temporarily disable admin check for testing
    // if (!ADMIN_EMAILS.includes(user.email || '')) {
    //   router.push('/')
    //   return
    // }
    
    setAuthorized(true)
    setLoading(false)
  }, [user, isAuthenticated, router])

  // Data state
  const [analytics, setAnalytics] = useState<EventAnalytics[]>([])
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])

  // Filters
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Modal
  const [viewParticipants, setViewParticipants] = useState<Participant[] | null>(null)

  // Fetch initial data
  useEffect(() => {
    if (!authorized) return

    fetchEvents()
    fetchAnalytics()
    fetchRegistrations()
  }, [authorized])

  // Fetch analytics per event
  const fetchAnalytics = async () => {
    try {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, name')
      
      if (eventsError) throw eventsError

      const analytics = await Promise.all(
        (events || []).map(async (event) => {
          const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('id, registrants(*)')
            .eq('event_id', event.id)

          if (regError) throw regError

          const total_registrations = registrations?.length || 0
          const total_participants = registrations?.reduce((sum, reg) => 
            sum + (reg.registrants?.length || 0), 0) || 0

          return {
            id: event.id,
            name: event.name,
            total_registrations,
            total_participants
          }
        })
      )

      setAnalytics(analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  // Fetch events list for filter
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
      
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  // Fetch registrations helper
  const fetchRegistrations = async () => {
    try {
      let query = supabase
        .from('registrations')
        .select(`
          id,
          team_name,
          event_id,
          status,
          created_at,
          events(name),
          registrants(id, name, email, is_leader)
        `)
        .order('created_at', { ascending: false })

      if (filterEvent && filterEvent !== 'all') query = query.eq('event_id', filterEvent)
      if (filterStatus && filterStatus !== 'all') query = query.eq('status', filterStatus)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data, error } = await query

      if (error) throw error
      if (!data) return

      const rows = data.map((reg: any) => ({
        id: reg.id,
        team_name: reg.team_name,
        event_id: reg.event_id,
        event_name: reg.events?.name || '',
        leader_name: reg.registrants?.find((p: any) => p.is_leader)?.name || '',
        leader_email: reg.registrants?.find((p: any) => p.is_leader)?.email || '',
        registration_date: reg.created_at,
        team_size: reg.registrants?.length || 0,
        status: reg.status,
        participants: reg.registrants || [],
      }))
      
      setRegistrations(rows)
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  // Derived filtered data
  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      const term = searchTerm.toLowerCase()
      return (
        (filterEvent === 'all' || r.event_id === filterEvent) &&
        (filterStatus === 'all' || r.status === filterStatus) &&
        (!dateFrom || r.registration_date >= dateFrom) &&
        (!dateTo || r.registration_date <= dateTo) &&
        (r.team_name.toLowerCase().includes(term) || r.leader_email.toLowerCase().includes(term))
      )
    })
  }, [registrations, filterEvent, filterStatus, dateFrom, dateTo, searchTerm])

  // CSV export
  const exportCSV = () => {
    if (filtered.length === 0) {
      alert('No data to export')
      return
    }

    const rows = filtered.flatMap((r) =>
      r.participants.map((p) => ({
        team_id: r.id,
        team_name: r.team_name,
        event_name: r.event_name,
        leader_name: r.leader_name,
        leader_email: r.leader_email,
        participant_name: p.name,
        participant_email: p.email,
        is_leader: p.is_leader,
        registration_date: r.registration_date,
        status: r.status,
      }))
    )
    
    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map((row) => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kratos-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <Layout><div className="flex justify-center items-center h-64">Loading...</div></Layout>
  if (!authorized) return <Layout><div className="flex justify-center items-center h-64">Access Denied</div></Layout>

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">Kratos 2k25 Event Management</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analytics.map((a) => (
            <Card key={a.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-400 text-lg">{a.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-gray-300">Total Registrations: <span className="text-white font-semibold">{a.total_registrations}</span></p>
                  <p className="text-gray-300">Total Participants: <span className="text-white font-semibold">{a.total_participants}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger className="bg-gray-900 border-gray-600">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-gray-900 border-gray-600">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-gray-900 border-gray-600"
                placeholder="From Date"
              />
              
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-gray-900 border-gray-600"
                placeholder="To Date"
              />

              <Input
                type="text"
                placeholder="Search team or leader"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900 border-gray-600"
              />

              <div className="flex gap-2">
                <Button onClick={fetchRegistrations} variant="outline" size="sm">
                  Apply Filters
                </Button>
                <Button onClick={exportCSV} className="bg-yellow-600 hover:bg-yellow-700" size="sm">
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400">Registrations ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Team</th>
                    <th className="text-left p-3 text-gray-300">Event</th>
                    <th className="text-left p-3 text-gray-300">Leader</th>
                    <th className="text-left p-3 text-gray-300">Email</th>
                    <th className="text-left p-3 text-gray-300">Date</th>
                    <th className="text-left p-3 text-gray-300">Size</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                    <th className="text-left p-3 text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="p-3 text-white">{r.team_name}</td>
                      <td className="p-3 text-gray-300">{r.event_name}</td>
                      <td className="p-3 text-gray-300">{r.leader_name}</td>
                      <td className="p-3 text-gray-300">{r.leader_email}</td>
                      <td className="p-3 text-gray-300">{format(new Date(r.registration_date), 'MMM dd, yyyy')}</td>
                      <td className="p-3 text-gray-300">{r.team_size}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          r.status === 'paid' ? 'bg-green-600 text-white' :
                          r.status === 'pending' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button
                          onClick={() => setViewParticipants(r.participants)}
                          variant="outline"
                          size="sm"
                          className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No registrations found matching the filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants Modal */}
      <Dialog open={!!viewParticipants} onOpenChange={() => setViewParticipants(null)}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Team Participants</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300">Name</th>
                  <th className="text-left p-3 text-gray-300">Email</th>
                  <th className="text-left p-3 text-gray-300">Role</th>
                </tr>
              </thead>
              <tbody>
                {viewParticipants?.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700">
                    <td className="p-3 text-white">{p.name}</td>
                    <td className="p-3 text-gray-300">{p.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.is_leader ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {p.is_leader ? 'Leader' : 'Member'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
