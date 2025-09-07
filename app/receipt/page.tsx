"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Share2, CheckCircle, Calendar, Hash } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptEvent {
  name: string;
  team_name: string;
  participants: number;
  amount: number;
}

interface ReceiptData {
  id: string;
  payment_id: string | null;
  order_id: string | null;
  events: ReceiptEvent[];
  totalAmount: number;
  date: string;
  status: string;
  registrant_id?: number; // Add registrant ID for QR code
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { user } = useStore();

  // Fetch actual receipt data from Supabase
  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        toast.error('User not authenticated');
        return;
      }

      console.log('Fetching receipt data for user:', user.id);
      console.log('Payment ID from URL:', paymentId);

      try {
        setLoading(true);
        
        // Fetch user's registrants with payment info and related events
        let query = supabase
          .from('registrants')
          .select(`
            id,
            team_name,
            payment_status,
            paid_amount,
            razorpay_payment_id,
            razorpay_order_id,
            registration_date,
            payment_time,
            events(id, name, price),
            registrations(name, email)
          `)
          .eq('user_id', user.id)
          .eq('payment_status', 'paid');

        // If specific payment_id is requested, filter by it
        if (paymentId) {
          query = query.eq('razorpay_payment_id', paymentId);
          console.log('Filtering by payment_id:', paymentId);
        }

        const { data: registrants, error } = await query.order('payment_time', { ascending: false });

        console.log('Query result:', { registrants, error });

        if (error) throw error;

        if (!registrants || registrants.length === 0) {
          console.log('No registrants found for user:', user.id, 'payment_id:', paymentId);
          
          // Debug: Check all registrants for this user
          const { data: allRegistrants } = await supabase
            .from('registrants')
            .select('id, payment_status, razorpay_payment_id, team_name')
            .eq('user_id', user.id);
          
          console.log('All registrants for user:', allRegistrants);
          
          if (paymentId) {
            toast.error('Receipt not found for this payment ID');
          } else {
            toast.error('No paid registrations found');
          }
          return;
        }

        console.log('Found registrants:', registrants);

        // Use first registrant (or the specific one if payment_id was provided)
        const selectedRegistrant = registrants[0];
        console.log('Selected registrant:', selectedRegistrant);

        // Transform data for receipt display - only show registrations from this payment
        const receiptData: ReceiptData = {
          id: selectedRegistrant.razorpay_payment_id || selectedRegistrant.id,
          payment_id: selectedRegistrant.razorpay_payment_id,
          order_id: selectedRegistrant.razorpay_order_id,
          registrant_id: selectedRegistrant.id, // Add for QR code generation
          events: registrants.map((reg: any) => ({
            name: reg.events?.name || 'Unknown Event',
            team_name: reg.team_name || 'Team',
            participants: reg.registrations?.length || 0,
            amount: reg.paid_amount || reg.events?.price || 0,
          })),
          totalAmount: registrants.reduce((sum: number, reg: any) => sum + (reg.paid_amount || reg.events?.price || 0), 0),
          date: selectedRegistrant.payment_time 
            ? new Date(selectedRegistrant.payment_time).toLocaleDateString()
            : new Date(selectedRegistrant.registration_date).toLocaleDateString(),
          status: 'Confirmed',
        };

        setReceipt(receiptData);

      } catch (error: any) {
        console.error('Error fetching receipt data:', error);
        toast.error('Failed to load receipt data');
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [user, paymentId]);

  // Generate QR code for team verification
  useEffect(() => {
    if (receipt && receipt.registrant_id) {
      const teamVerificationUrl = `${window.location.origin}/qr?id=${receipt.registrant_id}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(teamVerificationUrl)}`);
    }
  }, [receipt]);

  const downloadReceipt = async () => {
    if (!receipt || !receiptRef.current) return;
    
    setIsGeneratingPdf(true);
    toast.info("Generating PDF...");

    try {
      // Temporarily modify styles for better PDF rendering
      const element = receiptRef.current;
      const originalStyle = element.style.cssText;
      
      // Apply PDF-friendly styles
      element.style.background = 'white';
      element.style.color = 'black';
      element.style.padding = '20px';
      element.style.width = '210mm';
      element.style.maxWidth = 'none';
      
      // Generate canvas from the receipt element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      // Restore original styles
      element.style.cssText = originalStyle;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit A4
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = pdfWidth - 20; // Leave 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Save the PDF
      const fileName = `Kratos2k25-Receipt-${receipt.payment_id || receipt.id}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shareReceipt = async () => {
    if (!receipt || !receiptRef.current) return;
    
    setIsGeneratingPdf(true);
    toast.info("Generating PDF for sharing...");

    try {
      // Temporarily modify styles for better PDF rendering
      const element = receiptRef.current;
      const originalStyle = element.style.cssText;
      
      // Apply PDF-friendly styles
      element.style.background = 'white';
      element.style.color = 'black';
      element.style.padding = '20px';
      element.style.width = '210mm';
      element.style.maxWidth = 'none';
      
      // Generate canvas from the receipt element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      // Restore original styles
      element.style.cssText = originalStyle;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = 210;
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Convert PDF to blob for sharing
      const pdfBlob = pdf.output('blob');
      const fileName = `Kratos2k25-Receipt-${receipt.payment_id || receipt.id}.pdf`;
      
      if (navigator.share && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            title: "Kratos 2k25 Receipt",
            text: "🎉 Successfully registered for Kratos 2k25!",
            files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
          });
          toast.success("PDF shared successfully!");
        } catch (err) {
          console.log("Error sharing PDF", err);
          // Fallback to download
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success("PDF downloaded (sharing not supported)");
        }
      } else {
        // Fallback: download the PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded (sharing not supported on this device)");
      }
    } catch (error) {
      console.error('Error generating PDF for sharing:', error);
      toast.error("Failed to generate PDF for sharing. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading receipt...</div>
        </div>
      </Layout>
    );
  }

  if (!receipt) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Receipt not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <h1 className="text-4xl font-bold text-yellow-400">
              Registration Confirmed!
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Thank you for registering for Kratos 2k25
          </p>
        </motion.div>

        {/* Receipt Card */}
        <motion.div
          ref={receiptRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 border border-gray-700 rounded-xl p-8"
        >
          {/* Receipt Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">
              REGISTRATION RECEIPT
            </h2>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
          </div>

          {/* Receipt Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Hash className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm">Payment ID</p>
                  <p className="text-white font-mono">
                    {receipt.payment_id || receipt.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white">{receipt.date}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30">
                  {receipt.status}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              {qrCodeUrl && (
                <div className="text-center">
                  <img
                    src={qrCodeUrl}
                    alt="Team Verification QR Code"
                    className="w-32 h-32 border border-gray-600 rounded-lg"
                  />
                  <p className="text-gray-400 text-xs mt-2">
                    Scan for team verification
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-yellow-400">
              Events Registered
            </h3>
            {receipt.events.map((event, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div>
                  <p className="text-white font-semibold">{event.name}</p>
                  <p className="text-gray-400 text-sm">
                    Team: {event.team_name} • {event.participants} participants
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">₹{event.amount}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-white">Total Amount</span>
              <span className="text-yellow-400">₹{receipt.totalAmount}</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center space-x-4"
        >
          <button
            onClick={downloadReceipt}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-400 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={shareReceipt}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>{isGeneratingPdf ? 'Preparing...' : 'Share PDF'}</span>
          </button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-900/30 border border-blue-700 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-blue-400 mb-4">
            What's Next?
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                You'll receive event details and updates via email
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Join our Discord/WhatsApp group for announcements
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Bring this receipt (digital or printed) to the event
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Layout>
    }>
      <ReceiptContent />
    </Suspense>
  );
}
