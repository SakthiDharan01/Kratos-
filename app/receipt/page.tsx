'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Download, CheckCircle, Calendar, Users, IndianRupee, Clock, MapPin, Phone, Mail } from 'lucide-react'
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
  events: Event
}

function ReceiptContent() {
  const searchParams = useSearchParams()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({})

  useEffect(() => {
    const fetchReceiptData = async (retryCount = 0) => {
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds
      
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          console.error('No authenticated user found')
          setLoading(false)
          return
        }

        setUser(currentUser)

        // Get user profile for name
        const { data: profile } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', currentUser.id)
          .single()

        if (profile) {
          setUser({ ...currentUser, ...profile })
        }

        // Fetch user's registrations with event details from the registrants table
        // The registrants table contains team-level registrations with payment info
        const { data: userRegistrations, error } = await supabase
          .from('registrants')
          .select(`
            id,
            team_name,
            payment_status,
            paid_amount,
            registration_date,
            payment_time,
            razorpay_payment_id,
            razorpay_order_id,
            event_id,
            events (
              id,
              name,
              description,
              price,
              event_date,
              time_slot,
              venue,
              event_type,
              min_team_size,
              max_team_size,
              incharge_name1,
              incharge_phone1,
              incharge_name2,
              incharge_phone2
            )
          `)
          .eq('user_id', currentUser.id)
          .in('payment_status', ['paid', 'completed'])
          .order('registration_date', { ascending: false })

        if (error) {
          console.error('Error fetching registrations:', error)
          setLoading(false)
          return
        }

        // If no registrations found and we haven't exhausted retries, try again
        if ((!userRegistrations || userRegistrations.length === 0) && retryCount < maxRetries) {
          console.log(`No registrations found, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            fetchReceiptData(retryCount + 1)
          }, retryDelay)
          return
        }

        setRegistrations((userRegistrations || []) as any[])

        // Generate QR codes for each registration
        const qrPromises = (userRegistrations || []).map(async (registration) => {
          try {
            const qrData = {
              registrationId: registration.id,
              eventId: registration.event_id,
              eventName: (registration.events as any)?.[0]?.name || 'Unknown Event',
              userName: profile?.name || currentUser.email,
              userPhone: profile?.phone || 'Not provided',
              teamSize: 1, // Default team size for now
              registrationDate: registration.registration_date,
              paymentId: registration.razorpay_payment_id
            }

            const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`)
            
            if (response.ok) {
              return {
                eventId: registration.event_id,
                qrCodeUrl: response.url
              }
            }
            return null
          } catch (error) {
            console.error('Error generating QR code for event:', registration.event_id, error)
            return null
          }
        })

        const qrResults = await Promise.all(qrPromises)
        const qrCodesMap: {[key: string]: string} = {}
        
        qrResults.forEach(result => {
          if (result) {
            qrCodesMap[result.eventId] = result.qrCodeUrl
          }
        })

        setQrCodes(qrCodesMap)
        setLoading(false)
      } catch (error) {
        console.error('Error in fetchReceiptData:', error)
        
        // If error occurred and we haven't exhausted retries, try again
        if (retryCount < maxRetries) {
          console.log(`Retrying due to error in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            fetchReceiptData(retryCount + 1)
          }, retryDelay)
        } else {
          setLoading(false)
        }
      }
    }

    fetchReceiptData()
  }, [])

  const downloadPDF = async () => {
    if (registrations.length === 0) return

    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let currentPage = 0

      for (let i = 0; i < registrations.length; i++) {
        const registration = registrations[i]
        const event = (registration.events as any)?.[0] || {}

        // Add new page for each event (except the first one)
        if (i > 0) {
          pdf.addPage()
        }
        currentPage++

        // Header
        pdf.setFontSize(20)
        pdf.setFont('helvetica', 'bold')
        pdf.text('KRATOS 2K25 - Event Registration Receipt', pageWidth / 2, 30, { align: 'center' })
        
        // Event details
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Event: ${event.name}`, 20, 60)
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Description: ${event.description}`, 20, 75)
        pdf.text(`Date: ${new Date(event.event_date).toLocaleDateString()}`, 20, 90)
        
        if (event.time_slot) {
          const timeSlotText = event.time_slot === 'morning' ? 'Morning Session' : 
                              event.time_slot === 'afternoon' ? 'Afternoon Session' : 
                              'Full Day Session'
          pdf.text(`Time: ${timeSlotText}`, 20, 105)
        }

        if (event.venue) {
          pdf.text(`Venue: ${event.venue}`, 20, 120)
        }

        // Registration details
        pdf.setFont('helvetica', 'bold')
        pdf.text('Registration Details:', 20, 140)
        
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Registration ID: ${registration.id}`, 20, 155)
        pdf.text(`Participant: ${user?.name || user?.email || 'N/A'}`, 20, 170)
        
        if (user?.phone) {
          pdf.text(`Phone: ${user.phone}`, 20, 185)
        }

        if (event.event_type === 'team') {
          pdf.text(`Team Size: ${1} members`, 20, 200)
        } else {
          pdf.text(`Event Type: Solo Participation`, 20, 200)
        }

        pdf.text(`Amount Paid: ₹${registration.paid_amount}`, 20, 215)
        pdf.text(`Payment Status: ${registration.payment_status.toUpperCase()}`, 20, 230)
        
        if (registration.razorpay_payment_id) {
          pdf.text(`Payment ID: ${registration.razorpay_payment_id}`, 20, 245)
        }

        // Contact information
        if (event.incharge_name1 || event.incharge_name2) {
          pdf.setFont('helvetica', 'bold')
          pdf.text('Contact Information:', 20, 265)
          
          pdf.setFont('helvetica', 'normal')
          let contactY = 280
          
          if (event.incharge_name1 && event.incharge_phone1) {
            pdf.text(`Event Incharge: ${event.incharge_name1} - ${event.incharge_phone1}`, 20, contactY)
            contactY += 15
          }
          
          if (event.incharge_name2 && event.incharge_phone2) {
            pdf.text(`Co-Incharge: ${event.incharge_name2} - ${event.incharge_phone2}`, 20, contactY)
          }
        }

        // QR Code
        const qrCodeUrl = qrCodes[event.id]
        if (qrCodeUrl) {
          try {
            // Convert QR code URL to base64
            const qrResponse = await fetch(qrCodeUrl)
            const qrBlob = await qrResponse.blob()
            
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx?.drawImage(img, 0, 0)
                
                // Add QR code to PDF
                const qrDataUrl = canvas.toDataURL('image/png')
                pdf.addImage(qrDataUrl, 'PNG', pageWidth - 80, 60, 60, 60)
                
                // QR code label
                pdf.setFontSize(10)
                pdf.setFont('helvetica', 'normal')
                pdf.text('Scan for verification', pageWidth - 80, 130, { align: 'left' })
                
                resolve(true)
              }
              img.onerror = reject
              img.src = qrCodeUrl
            })
          } catch (error) {
            console.error('Error adding QR code to PDF:', error)
            // Add placeholder text if QR code fails
            pdf.setFontSize(10)
            pdf.text('QR Code unavailable', pageWidth - 80, 90)
          }
        }

        // Footer
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'italic')
        pdf.text('Thank you for registering with KRATOS 2K25!', pageWidth / 2, pageHeight - 20, { align: 'center' })
        pdf.text(`Page ${currentPage} of ${registrations.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      }

      // Save the PDF
      pdf.save('kratos-2k25-registration-receipt.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your receipts...</p>
        </div>
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Registrations Found</h1>
          <p className="text-gray-400 mb-6">You haven't completed any event registrations yet.</p>
          <a
            href="/"
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded transition-colors"
          >
            Browse Events
          </a>
        </div>
      </div>
    )
  }

  const totalAmount = registrations.reduce((sum, reg) => sum + reg.paid_amount, 0)

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">Event Registration Receipt</h1>
          <p className="text-gray-300">KRATOS 2K25 - Your registered events</p>
        </div>

        {/* Summary Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-yellow-400/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Registration Summary</h2>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-yellow-400">{registrations.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-green-400">₹{totalAmount}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Status</p>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-bold">Confirmed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Event Receipts */}
        <div className="space-y-6">
          {registrations.map((registration, index) => {
            const event = (registration.events as any)?.[0] || {}
            return (
              <div key={registration.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">{event.name}</h3>
                        <p className="text-gray-300 text-sm mb-3">{event.description}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        Confirmed
                      </span>
                    </div>

                    {/* Event Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-yellow-400" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      
                      {event.time_slot && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span>
                            {event.time_slot === 'morning' ? 'Morning Session' : 
                             event.time_slot === 'afternoon' ? 'Afternoon Session' : 
                             'Full Day Session'}
                          </span>
                        </div>
                      )}

                      {event.venue && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-yellow-400" />
                          <span>{event.venue}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span>
                          {event.event_type === 'team' 
                            ? `Team Event (Team Size: ${registration.team_name})` 
                            : 'Solo Event'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <IndianRupee className="w-4 h-4 text-yellow-400" />
                        <span>₹{registration.paid_amount}</span>
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(event.incharge_name1 || event.incharge_name2) && (
                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Contact Information</h4>
                        <div className="space-y-1">
                          {event.incharge_name1 && event.incharge_phone1 && (
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                              <Phone className="w-3 h-3 text-yellow-400" />
                              <span>{event.incharge_name1}: {event.incharge_phone1}</span>
                            </div>
                          )}
                          {event.incharge_name2 && event.incharge_phone2 && (
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                              <Phone className="w-3 h-3 text-yellow-400" />
                              <span>{event.incharge_name2}: {event.incharge_phone2}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="lg:w-48 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg mb-2">
                      {qrCodes[event.id] ? (
                        <img 
                          src={qrCodes[event.id]} 
                          alt={`QR Code for ${event.name}`}
                          className="w-32 h-32"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs text-center">QR Code Loading...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 text-center">Scan for verification</p>
                  </div>
                </div>

                {/* Registration Details */}
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Registration ID</p>
                      <p className="text-white font-mono">{registration.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Registration Date</p>
                      <p className="text-white">{new Date(registration.registration_date).toLocaleDateString()}</p>
                    </div>
                    {registration.razorpay_payment_id && (
                      <div>
                        <p className="text-gray-400">Payment ID</p>
                        <p className="text-white font-mono">{registration.razorpay_payment_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-gray-800 rounded-lg border border-yellow-400/20">
          <p className="text-gray-300 mb-2">Thank you for registering with KRATOS 2K25!</p>
          <p className="text-gray-400 text-sm">
            Keep this receipt for your records. Show the QR code at the event venue for verification.
          </p>
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
          <p className="text-white">Loading receipt...</p>
        </div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  )
}