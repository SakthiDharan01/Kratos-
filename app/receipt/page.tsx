'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Download, CheckCircle, Calendar, Users, IndianRupee, Clock, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { jsPDF } from 'jspdf'

interface Event {
  id: string
  name: string
  description: string
  price: number
  event_date: string
  time_slot: string | null
  venue: string | null
  event_type: 'solo' | 'team'
  min_team_size: number
  max_team_size: number
  incharge_name1: string | null
  incharge_phone1: string | null
  incharge_name2: string | null
  incharge_phone2: string | null
}

interface Registration {
  id: string
  event_id: string
  team_name: string
  payment_status: string
  paid_amount: number
  registration_date: string
  payment_time: string | null
  razorpay_payment_id: string | null
  razorpay_order_id: string | null
  event: Event
  team_size: number
}

function ReceiptContent() {
  const searchParams = useSearchParams()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [qrError, setQrError] = useState<string>('')

  useEffect(() => {
    const fetchReceiptData = async (retryCount = 0) => {
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          console.error('No user found')
          return
        }

        setUser(currentUser)

        // Use inner join to get event data along with registration data
        const { data: registrationsData, error } = await supabase
          .from('registrants')
          .select(`
            *,
            event:events!inner(*)
          `)
          .eq('user_id', currentUser.id)
          .eq('payment_status', 'completed')

        if (error) {
          throw error
        }

        if (!registrationsData || registrationsData.length === 0) {
          if (retryCount < maxRetries) {
            console.log(`Retrying... (${retryCount + 1}/${maxRetries})`)
            setTimeout(() => fetchReceiptData(retryCount + 1), retryDelay)
            return
          }
          console.error('No completed registrations found')
          setRegistrations([])
          return
        }

        // Transform the data to match our interface
        const transformedData = registrationsData.map(reg => ({
          ...reg,
          team_size: reg.team_size || 1
        }))

        setRegistrations(transformedData)

        // Generate QR code for the first registration
        if (transformedData.length > 0) {
          generateQRCode(transformedData[0])
        }

      } catch (error) {
        console.error('Error fetching receipt data:', error)
        if (retryCount < maxRetries) {
          console.log(`Retrying... (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => fetchReceiptData(retryCount + 1), retryDelay)
        } else {
          setRegistrations([])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchReceiptData()
  }, [])

  const generateQRCode = async (registration: Registration) => {
    try {
      const qrData = {
        registrationId: registration.id,
        eventName: registration.event?.name,
        teamName: registration.team_name,
        participantEmail: user?.email,
        paymentId: registration.razorpay_payment_id,
        amount: registration.paid_amount,
        eventDate: registration.event?.event_date,
        teamSize: registration.team_size
      }

      const qrString = JSON.stringify(qrData)
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`)
      
      if (response.ok) {
        setQrCode(response.url)
        setQrError('')
      } else {
        throw new Error('Failed to generate QR code')
      }
    } catch (error) {
      console.error('QR Code generation error:', error)
      setQrError('Failed to generate QR code')
    }
  }

  const generatePDF = () => {
    if (registrations.length === 0) return

    const doc = new jsPDF()
    const registration = registrations[0]
    const event = registration.event

    // Header with improved design
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('KRATOS 2K25', 105, 25, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Technical Symposium - Easwari Engineering College', 105, 35, { align: 'center' })
    
    // Draw header line
    doc.setDrawColor(255, 215, 0) // Gold color
    doc.setLineWidth(2)
    doc.line(20, 42, 190, 42)
    
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Event Registration Receipt', 105, 55, { align: 'center' })

    // Success indicator
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 167, 69) // Green color
    doc.text('✓ Payment Confirmed', 105, 65, { align: 'center' })

    // Registration Details
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Registration Details:', 20, 85)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const details = [
      `Event: ${event?.name || 'N/A'}`,
      `Description: ${event?.description || 'N/A'}`,
      `Date: ${event?.event_date ? new Date(event.event_date).toLocaleDateString() : 'Invalid Date'}`,
      `Type: ${event?.event_type === 'team' ? `Team Event (${registration.team_size} members)` : 'Solo Event'}`,
      `Amount Paid: ₹${registration.paid_amount}`,
      `Payment ID: ${registration.razorpay_payment_id || 'N/A'}`,
      `Team Name: ${registration.team_name}`,
      `Registration Date: ${new Date(registration.registration_date).toLocaleDateString()}`
    ]

    let yPos = 95
    details.forEach(detail => {
      doc.text(detail, 20, yPos)
      yPos += 10
    })

    // Contact Information
    if (event?.incharge_name1 || event?.incharge_name2) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Contact Information:', 20, yPos + 15)
      yPos += 25
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      if (event.incharge_name1 && event.incharge_phone1) {
        doc.text(`${event.incharge_name1}: ${event.incharge_phone1}`, 20, yPos)
        yPos += 8
      }
      if (event.incharge_name2 && event.incharge_phone2) {
        doc.text(`${event.incharge_name2}: ${event.incharge_phone2}`, 20, yPos)
        yPos += 8
      }
    }

    // Footer with better styling
    doc.setDrawColor(255, 215, 0) // Gold color
    doc.setLineWidth(1)
    doc.line(20, 270, 190, 270)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Thank you for registering with KRATOS 2K25!', 105, 280, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Keep this receipt for your records. Show the QR code at the event venue.', 105, 288, { align: 'center' })
    doc.text('© 2024 KRATOS 2K25 - Easwari Engineering College', 105, 295, { align: 'center' })

    // Save PDF
    doc.save(`KRATOS_Receipt_${registration.team_name}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your receipt...</p>
        </div>
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">No Registrations Found</h1>
          <p className="text-gray-400 mb-8">
            We couldn't find any completed registrations for your account.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Kratos Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src="/assets/name.png" 
                alt="Kratos Logo" 
                className="h-20 w-auto"
              />
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
                <p className="text-gray-400">Your registration is confirmed</p>
              </div>
            </div>
          </div>

          {/* Registration Cards */}
          <div className="space-y-6">
            {registrations.map((registration) => {
              const event = registration.event

              return (
                <div key={registration.id} className="bg-gray-800 rounded-lg border border-yellow-400/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">{event?.name || 'Event Name'}</h2>
                        <p className="text-gray-400">Registration ID: {registration.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">₹{registration.paid_amount}</div>
                        <div className="text-sm text-gray-400">
                          {registration.payment_time 
                            ? new Date(registration.payment_time).toLocaleString()
                            : new Date(registration.registration_date).toLocaleString()
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Event Details */}
                      <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
                        
                        <div className="space-y-3 mb-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                            <p className="text-gray-300">{event?.description || 'No description available'}</p>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-yellow-400" />
                            <span>{event?.event_date ? new Date(event.event_date).toLocaleDateString() : 'Invalid Date'}</span>
                          </div>
                          
                          {event?.time_slot && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              <span>
                                {event.time_slot === 'morning' ? 'Morning Session' : 
                                 event.time_slot === 'afternoon' ? 'Afternoon Session' : 
                                 'Full Day Session'}
                              </span>
                            </div>
                          )}

                          {event?.venue && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <MapPin className="w-4 h-4 text-yellow-400" />
                              <span>{event.venue}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-gray-300">
                            <Users className="w-4 h-4 text-yellow-400" />
                            <span>
                              {event?.event_type === 'team' 
                                ? `Team Event (${registration.team_size} members)` 
                                : 'Solo Event'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <IndianRupee className="w-4 h-4 text-yellow-400" />
                            <span>₹{registration.paid_amount}</span>
                          </div>
                        </div>

                        {/* Team Information */}
                        {event?.event_type === 'team' && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Team Information</h4>
                            <div className="text-gray-300 text-sm">
                              <span>Team Name: <strong>{registration.team_name}</strong></span>
                            </div>
                          </div>
                        )}

                        {/* Contact Information */}
                        {(event?.incharge_name1 || event?.incharge_name2) && (
                          <div className="border-t border-gray-700 pt-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Contact Information</h4>
                            <div className="space-y-1">
                              {event?.incharge_name1 && event?.incharge_phone1 && (
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                  <Phone className="w-3 h-3 text-yellow-400" />
                                  <span>{event.incharge_name1}: {event.incharge_phone1}</span>
                                </div>
                              )}
                              {event?.incharge_name2 && event?.incharge_phone2 && (
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                  <Phone className="w-3 h-3 text-yellow-400" />
                                  <span>{event.incharge_name2}: {event.incharge_phone2}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* QR Code Section */}
                      <div className="lg:w-1/3 flex flex-col items-center justify-center p-6">
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <div className="w-32 h-32 flex items-center justify-center">
                            {qrCode ? (
                              <img 
                                src={qrCode} 
                                alt="QR Code" 
                                className="w-full h-full object-contain"
                              />
                            ) : qrError ? (
                              <div className="text-red-500 text-sm text-center">
                                {qrError}
                              </div>
                            ) : (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm text-center mb-4">
                          Scan this QR code for event verification
                        </p>
                        <Button
                          onClick={generatePDF}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 mt-8">
            <p>&copy; 2024 Kratos. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading receipt...</p>
        </div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  )
}