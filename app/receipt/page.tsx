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

        // Get the registrant_id from URL parameters
        const registrantId = searchParams.get('registrant_id')
        console.log('Looking for registrant_id:', registrantId)

        let query = supabase
          .from('registrants')
          .select(`
            *,
            event:events!inner(*)
          `)

        // If registrant_id is provided, filter by it and check ownership
        if (registrantId) {
          query = query.eq('id', registrantId)
          
          const { data: registrationsData, error } = await query
          
          if (error) {
            console.error('Database query error:', error)
            throw error
          }

          console.log('Registration data found:', registrationsData)

          // Check if registration exists and belongs to current user or if payment is completed
          if (registrationsData && registrationsData.length > 0) {
            const registration = registrationsData[0]
            
            // Allow access if user owns the registration OR if payment is completed
            if (registration.user_id === currentUser.id || registration.payment_status === 'completed') {
              const transformedData = registrationsData.map(reg => ({
                ...reg,
                team_size: reg.team_size || 1
              }))

              console.log('Transformed data:', transformedData)
              setRegistrations(transformedData)

              if (transformedData.length > 0) {
                generateQRCode(transformedData[0])
              }
              return
            } else {
              console.error('Registration found but access denied - not owner and payment not completed')
              setRegistrations([])
              return
            }
          }
        } else {
          // If no registrant_id provided, get all user's completed registrations
          query = query.eq('user_id', currentUser.id).eq('payment_status', 'completed')
          
          const { data: registrationsData, error } = await query

          if (error) {
            console.error('Database query error:', error)
            throw error
          }

          console.log('Query results:', registrationsData)

          if (registrationsData && registrationsData.length > 0) {
            const transformedData = registrationsData.map(reg => ({
              ...reg,
              team_size: reg.team_size || 1
            }))

            console.log('Transformed data:', transformedData)
            setRegistrations(transformedData)

            if (transformedData.length > 0) {
              generateQRCode(transformedData[0])
            }
            return
          }
        }

        // If we get here, no data was found
        if (retryCount < maxRetries) {
          console.log(`Retrying... (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => fetchReceiptData(retryCount + 1), retryDelay)
          return
        }
        console.error('No registrations found for:', registrantId ? `registrant_id: ${registrantId}` : `user_id: ${currentUser.id}`)
        setRegistrations([])

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

  const generatePDF = async () => {
    if (registrations.length === 0) return

    const doc = new jsPDF()
    const registration = registrations[0]
    const event = registration.event

    // Orange-Yellow gradient background
    doc.setFillColor(255, 248, 220) // Light cream background
    doc.rect(0, 0, 210, 297, 'F')

    // Professional orange header background
    doc.setFillColor(255, 140, 0) // Dark orange
    doc.rect(0, 0, 210, 50, 'F')

    try {
      // Add KRATOS logo (if available)
      const kratosLogoUrl = '/assets/name.png'
      const response = await fetch(kratosLogoUrl)
      if (response.ok) {
        const logoBlob = await response.blob()
        const logoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(logoBlob)
        })
        doc.addImage(logoDataUrl, 'PNG', 20, 8, 40, 15)
      }
    } catch (error) {
      console.log('Could not load KRATOS logo:', error)
    }

    try {
      // Add Easwari College logo
      const easwariLogoUrl = '/assets/easwari-bw.png'
      const response = await fetch(easwariLogoUrl)
      if (response.ok) {
        const logoBlob = await response.blob()
        const logoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(logoBlob)
        })
        doc.addImage(logoDataUrl, 'PNG', 150, 8, 40, 15)
      }
    } catch (error) {
      console.log('Could not load Easwari logo:', error)
    }

    // Main header text on orange background
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255) // White text on orange
    doc.text('KRATOS 2025', 105, 32, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text('Technical Symposium | Easwari Engineering College', 105, 42, { align: 'center' })

    // Orange accent line
    doc.setDrawColor(255, 165, 0) // Orange
    doc.setLineWidth(3)
    doc.line(20, 55, 190, 55)

    // Receipt title with professional styling
    doc.setFillColor(255, 215, 0) // Golden yellow background
    doc.roundedRect(30, 65, 150, 20, 5, 5, 'F')
    
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('PAYMENT RECEIPT', 105, 78, { align: 'center' })

    // Success indicator with icon
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 139, 34) // Forest green
    doc.text('✓ PAYMENT CONFIRMED', 105, 95, { align: 'center' })

    // Registration details in a styled box
    doc.setFillColor(255, 250, 240) // Light orange background
    doc.setDrawColor(255, 140, 0) // Orange border
    doc.setLineWidth(1)
    doc.roundedRect(20, 105, 170, 90, 5, 5, 'FD')

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 69, 0) // Red-orange
    doc.text('Registration Details', 25, 118)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    const details = [
      `Event: ${event?.name || 'N/A'}`,
      `Event Type: ${event?.event_type === 'team' ? `Team Event (${registration.team_size} members)` : 'Solo Event'}`,
      `Team Name: ${registration.team_name}`,
      `Amount Paid: ₹${registration.paid_amount}`,
      `Payment ID: ${registration.razorpay_payment_id || 'N/A'}`,
      `Event Date: ${event?.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBA'}`,
      `Registration Date: ${new Date(registration.registration_date).toLocaleDateString()}`
    ]

    let yPos = 130
    details.forEach(detail => {
      doc.text(detail, 25, yPos)
      yPos += 10
    })

    // Add QR Code if available
    if (qrCode) {
      try {
        const qrResponse = await fetch(qrCode)
        if (qrResponse.ok) {
          const qrBlob = await qrResponse.blob()
          const qrDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(qrBlob)
          })
          
          // QR Code section
          doc.setFillColor(255, 255, 255) // White background for QR
          doc.setDrawColor(255, 140, 0) // Orange border
          doc.setLineWidth(2)
          doc.roundedRect(135, 200, 55, 65, 5, 5, 'FD')
          
          doc.addImage(qrDataUrl, 'PNG', 140, 205, 45, 45)
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 69, 0)
          doc.text('SCAN QR CODE', 162.5, 258, { align: 'center' })
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(0, 0, 0)
          doc.text('Present at venue', 162.5, 263, { align: 'center' })
        }
      } catch (error) {
        console.log('Could not add QR code to PDF:', error)
      }
    }

    // Contact Information
    if (event?.incharge_name1 || event?.incharge_name2) {
      doc.setFillColor(255, 245, 220) // Light peach background
      doc.setDrawColor(255, 140, 0) // Orange border
      doc.roundedRect(20, 200, 110, 50, 5, 5, 'FD')
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 69, 0)
      doc.text('Contact Information', 25, 213)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      let contactYPos = 225
      
      if (event.incharge_name1 && event.incharge_phone1) {
        doc.text(`${event.incharge_name1}: ${event.incharge_phone1}`, 25, contactYPos)
        contactYPos += 10
      }
      if (event.incharge_name2 && event.incharge_phone2) {
        doc.text(`${event.incharge_name2}: ${event.incharge_phone2}`, 25, contactYPos)
      }
    }

    // Professional footer with orange theme
    doc.setFillColor(255, 140, 0) // Dark orange footer
    doc.rect(0, 275, 210, 22, 'F')
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Thank you for registering with KRATOS 2025!', 105, 284, { align: 'center' })
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text('Association of Computer Engineers | Easwari Engineering College', 105, 291, { align: 'center' })
    doc.text('© 2025 KRATOS - All Rights Reserved', 105, 295, { align: 'center' })

    // Save PDF with professional naming
    doc.save(`KRATOS_2025_Receipt_${registration.team_name}_${registration.id}.pdf`)
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
    const registrantId = searchParams.get('registrant_id')
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">No Registrations Found</h1>
          <p className="text-gray-400 mb-4">
            {registrantId 
              ? `We couldn't find registration with ID: ${registrantId}`
              : "We couldn't find any completed registrations for your account."
            }
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {registrantId 
              ? "This registration may not exist, might be incomplete, or may not belong to your account."
              : "Please complete your payment to view the receipt."
            }
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/profile'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              View My Profile
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Go to Homepage
            </Button>
          </div>
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
            <p>&copy; 2025 KRATOS. All rights reserved.</p>
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