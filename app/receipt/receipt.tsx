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
  team_id?: number;
}

interface ReceiptData {
  id: string;
  payment_id: string | null;
  order_id: string | null;
  events: ReceiptEvent[];
  totalAmount: number;
  date: string;
  status: string;
  team_id?: number;
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { user } = useStore();

  // Fetch actual receipt data from Supabase
  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch user's registrants with payment info and related events
        const { data: registrants, error } = await supabase
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
          .eq('payment_status', 'paid')
          .order('payment_time', { ascending: false });

        if (error) throw error;

        if (!registrants || registrants.length === 0) {
          toast.error('No paid registrations found');
          return;
        }

        // If payment_id is provided, filter by it, otherwise show latest
        let selectedRegistrant = registrants[0];
        if (paymentId) {
          const found = registrants.find((r: any) => r.razorpay_payment_id === paymentId);
          if (found) selectedRegistrant = found;
        }

        // Transform data for receipt display
        const receiptData: ReceiptData = {
          id: selectedRegistrant.razorpay_payment_id || selectedRegistrant.id,
          payment_id: selectedRegistrant.razorpay_payment_id,
          order_id: selectedRegistrant.razorpay_order_id,
          team_id: selectedRegistrant.id, // Add team ID for reference
          events: registrants.map((reg: any) => ({
            name: reg.events?.name || 'Unknown Event',
            team_name: reg.team_name || 'Team',
            participants: reg.registrations?.length || 0,
            amount: reg.paid_amount || reg.events?.price || 0,
            team_id: reg.id, // Add team ID to each event
          })),
          totalAmount: registrants.reduce((sum: number, reg: any) => sum + (reg.paid_amount || 0), 0),
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
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <h1 className="text-4xl font-bold text-yellow-400">
              Registration Confirmed!
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Your registration for Kratos 2k25 has been successfully processed
          </p>
        </motion.div>

        {/* Receipt Card */}
        <motion.div
          ref={receiptRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white text-black rounded-xl overflow-hidden shadow-2xl max-w-2xl mx-auto"
        >
          {/* Header with Logo and Title */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/assets/name.png" 
                alt="Kratos Logo" 
                className="h-16 w-auto mr-4"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">KRATOS 2K25</h1>
                <p className="text-yellow-100">Technical Symposium</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white bg-black/20 px-4 py-2 rounded-lg">
              REGISTRATION RECEIPT
            </h2>
          </div>

          {/* Event Location Banner */}
          <div className="bg-gray-100 px-6 py-3 border-b-2 border-yellow-500">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">VENUE</p>
                <p className="text-lg font-bold text-gray-900">Easwari Engineering College</p>
                <p className="text-sm text-gray-600">Chennai, Tamil Nadu</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Payment ID</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded border">
                    {receipt.payment_id || receipt.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Registration Date</p>
                  <p className="text-lg font-semibold">{receipt.date}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-300 font-semibold">
                    ✅ {receipt.status}
                  </span>
                </div>
              </div>

              {/* Team Verification QR Code - REMOVED AS PER USER REQUEST */}
              {/* QR code now only shown in /qr page for team verification */}
              <div className="flex flex-col items-center justify-center">
                {/* QR Code removed from receipt - use /qr page instead */}
              </div>
            </div>

            {/* Events List */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-yellow-500 pb-2">
                EVENTS REGISTERED
              </h3>
              <div className="space-y-3">
                {receipt.events.map((event, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-600">
                        Team: <span className="font-medium">{event.team_name}</span> • {event.participants} participants
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">₹{event.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <span className="text-xl font-bold text-gray-900">TOTAL AMOUNT</span>
                <span className="text-2xl font-bold text-green-600">₹{receipt.totalAmount}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  🎉 Thank you for registering for KRATOS 2K25! 🎉
                </p>
                <p className="text-xs text-gray-600">
                  Keep this receipt for your records • Generated on {new Date().toLocaleString()}
                </p>
              </div>
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

        {/* Important Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto"
        >
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2" />
            Important Instructions
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span className="text-gray-700">
                  <strong>Save this receipt</strong> for event entry verification
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span className="text-gray-700">
                  Check your email for detailed event information
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span className="text-gray-700">
                  Join our official communication channels
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span className="text-gray-700">
                  Arrive 30 minutes before event start time
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span className="text-gray-700">
                  Bring valid college ID for verification
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium text-center">
              📍 <strong>Venue:</strong> Easwari Engineering College, Chennai | 
              📧 <strong>Support:</strong> kratos2k25@gmail.com
            </p>
          </div>
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
