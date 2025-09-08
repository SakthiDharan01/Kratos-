"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Share2, CheckCircle, Calendar, Hash, MapPin, Phone, Mail, Users } from "lucide-react";
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
  const registrantId = searchParams.get("registrant_id"); // New parameter for direct registrant access
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
      console.log('Registrant ID from URL:', registrantId);

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
        
        // If specific registrant_id is requested, filter by it
        if (registrantId) {
          query = query.eq('id', registrantId);
          console.log('Filtering by registrant_id:', registrantId);
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
  }, [user, paymentId, registrantId]);

  // Generate QR code for team verification
  useEffect(() => {
    if (receipt && receipt.registrant_id) {
      // Generate QR code with just the registrant ID for scanning at college
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${receipt.registrant_id}`);
    }
  }, [receipt]);

  const downloadReceipt = async () => {
    if (!receipt) return;
    
    setIsGeneratingPdf(true);
    toast.info("Generating PDF...");

    try {
      // Create PDF with professional layout
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      
      // Header Background
      pdf.setFillColor(255, 107, 53); // Orange gradient start
      pdf.rect(0, 0, pageWidth, 60, 'F');
      
      // Logo placeholder (we'll use text since embedding images requires additional setup)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin, 15, 20, 20, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text('LOGO', margin + 10, 27, { align: 'center' });
      
      // Header Text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KRATOS 2K25', margin + 30, 25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Technical Symposium', margin + 30, 32);
      pdf.text('Easwari Engineering College', margin + 30, 39);
      
      // Receipt Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGISTRATION RECEIPT', pageWidth - margin, 25, { align: 'right' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Official Receipt', pageWidth - margin, 32, { align: 'right' });
      
      // Venue Banner
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 60, pageWidth, 15, 'F');
      pdf.setDrawColor(255, 107, 53);
      pdf.setLineWidth(2);
      pdf.line(0, 75, pageWidth, 75);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Easwari Engineering College, Ramapuram, Chennai - 600089, Tamil Nadu', pageWidth / 2, 70, { align: 'center' });
      
      // Content area starts
      let yPos = 90;
      
      // Receipt Details
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 107, 53);
      pdf.text('Receipt Details', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      // Payment ID
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment ID:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.payment_id || receipt.id, margin + 30, yPos);
      yPos += 8;
      
      // Date
      pdf.setFont('helvetica', 'bold');
      pdf.text('Registration Date:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.date, margin + 40, yPos);
      yPos += 8;
      
      // Status
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(34, 197, 94); // Green
      pdf.text('✓ ' + receipt.status, margin + 20, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 15;
      
      // Team Details Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 107, 53);
      pdf.text('Team Details', margin, yPos);
      yPos += 10;
      
      // Draw border for team details
      pdf.setDrawColor(229, 231, 235);
      pdf.setFillColor(249, 250, 251);
      const teamSectionHeight = receipt.events.length * 25 + 10;
      pdf.rect(margin, yPos - 5, contentWidth, teamSectionHeight, 'FD');
      
      receipt.events.forEach((event, index) => {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(event.name, margin + 5, yPos + 5);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Team Name: ${event.team_name}`, margin + 5, yPos + 12);
        pdf.text(`Participants: ${event.participants} members`, margin + 5, yPos + 19);
        
        // Amount
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 107, 53);
        pdf.text(`₹${event.amount}`, pageWidth - margin - 5, yPos + 12, { align: 'right' });
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text('Registration Fee', pageWidth - margin - 5, yPos + 19, { align: 'right' });
        
        yPos += 25;
        
        if (index < receipt.events.length - 1) {
          pdf.setDrawColor(229, 231, 235);
          pdf.line(margin + 5, yPos - 5, pageWidth - margin - 5, yPos - 5);
        }
      });
      
      yPos += 10;
      
      // Total Amount
      pdf.setDrawColor(255, 107, 53);
      pdf.setLineWidth(2);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Total Amount Paid', margin, yPos);
      pdf.setTextColor(255, 107, 53);
      pdf.text(`₹${receipt.totalAmount}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 20;
      
      // Contact Information
      pdf.setFillColor(31, 41, 55);
      pdf.rect(margin, yPos, contentWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Contact Information', pageWidth / 2, yPos + 8, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Email: updates.kratos@gmail.com', margin + 10, yPos + 18);
      pdf.text('Phone: +91 98765 43210', margin + 10, yPos + 26);
      
      pdf.setFontSize(10);
      pdf.setTextColor(203, 213, 225);
      pdf.text('For event updates and queries, please reach out to us', pageWidth / 2, yPos + 32, { align: 'center' });
      
      yPos += 45;
      
      // QR Code placeholder (text based since we can't easily embed images)
      if (receipt.registrant_id) {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(pageWidth - margin - 40, 90, 35, 35, 'FD');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.text('QR CODE', pageWidth - margin - 22.5, 105, { align: 'center' });
        pdf.text('Team Verification', pageWidth - margin - 22.5, 110, { align: 'center' });
        pdf.text(`ID: ${receipt.registrant_id}`, pageWidth - margin - 22.5, 115, { align: 'center' });
      }
      
      // Footer
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('This is an official receipt for KRATOS 2K25 Technical Symposium', pageWidth / 2, pageHeight - 20, { align: 'center' });
      pdf.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      
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
    if (!receipt) return;
    
    setIsGeneratingPdf(true);
    toast.info("Generating PDF for sharing...");

    try {
      // Create PDF with professional layout (same as download)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      
      // Header Background
      pdf.setFillColor(255, 107, 53);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      
      // Logo placeholder
      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin, 15, 20, 20, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text('LOGO', margin + 10, 27, { align: 'center' });
      
      // Header Text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KRATOS 2K25', margin + 30, 25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Technical Symposium', margin + 30, 32);
      pdf.text('Easwari Engineering College', margin + 30, 39);
      
      // Receipt Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGISTRATION RECEIPT', pageWidth - margin, 25, { align: 'right' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Official Receipt', pageWidth - margin, 32, { align: 'right' });
      
      // Venue Banner
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 60, pageWidth, 15, 'F');
      pdf.setDrawColor(255, 107, 53);
      pdf.setLineWidth(2);
      pdf.line(0, 75, pageWidth, 75);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Easwari Engineering College, Ramapuram, Chennai - 600089, Tamil Nadu', pageWidth / 2, 70, { align: 'center' });
      
      // Content area starts
      let yPos = 90;
      
      // Receipt Details
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 107, 53);
      pdf.text('Receipt Details', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      // Payment ID
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment ID:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.payment_id || receipt.id, margin + 30, yPos);
      yPos += 8;
      
      // Date
      pdf.setFont('helvetica', 'bold');
      pdf.text('Registration Date:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.date, margin + 40, yPos);
      yPos += 8;
      
      // Status
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(34, 197, 94);
      pdf.text('✓ ' + receipt.status, margin + 20, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 15;
      
      // Team Details Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 107, 53);
      pdf.text('Team Details', margin, yPos);
      yPos += 10;
      
      // Draw border for team details
      pdf.setDrawColor(229, 231, 235);
      pdf.setFillColor(249, 250, 251);
      const teamSectionHeight = receipt.events.length * 25 + 10;
      pdf.rect(margin, yPos - 5, contentWidth, teamSectionHeight, 'FD');
      
      receipt.events.forEach((event, index) => {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(event.name, margin + 5, yPos + 5);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Team Name: ${event.team_name}`, margin + 5, yPos + 12);
        pdf.text(`Participants: ${event.participants} members`, margin + 5, yPos + 19);
        
        // Amount
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 107, 53);
        pdf.text(`₹${event.amount}`, pageWidth - margin - 5, yPos + 12, { align: 'right' });
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text('Registration Fee', pageWidth - margin - 5, yPos + 19, { align: 'right' });
        
        yPos += 25;
        
        if (index < receipt.events.length - 1) {
          pdf.setDrawColor(229, 231, 235);
          pdf.line(margin + 5, yPos - 5, pageWidth - margin - 5, yPos - 5);
        }
      });
      
      yPos += 10;
      
      // Total Amount
      pdf.setDrawColor(255, 107, 53);
      pdf.setLineWidth(2);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Total Amount Paid', margin, yPos);
      pdf.setTextColor(255, 107, 53);
      pdf.text(`₹${receipt.totalAmount}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 20;
      
      // Contact Information
      pdf.setFillColor(31, 41, 55);
      pdf.rect(margin, yPos, contentWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Contact Information', pageWidth / 2, yPos + 8, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Email: updates.kratos@gmail.com', margin + 10, yPos + 18);
      pdf.text('Phone: +91 98765 43210', margin + 10, yPos + 26);
      
      pdf.setFontSize(10);
      pdf.setTextColor(203, 213, 225);
      pdf.text('For event updates and queries, please reach out to us', pageWidth / 2, yPos + 32, { align: 'center' });
      
      yPos += 45;
      
      // QR Code placeholder
      if (receipt.registrant_id) {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(pageWidth - margin - 40, 90, 35, 35, 'FD');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.text('QR CODE', pageWidth - margin - 22.5, 105, { align: 'center' });
        pdf.text('Team Verification', pageWidth - margin - 22.5, 110, { align: 'center' });
        pdf.text(`ID: ${receipt.registrant_id}`, pageWidth - margin - 22.5, 115, { align: 'center' });
      }
      
      // Footer
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('This is an official receipt for KRATOS 2K25 Technical Symposium', pageWidth / 2, pageHeight - 20, { align: 'center' });
      pdf.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      
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
          className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-200"
        >
          {/* Professional Header with Logo */}
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src="/assets/Badge.png"
                  alt="Kratos Logo"
                  className="w-16 h-16 bg-white rounded-lg p-2"
                />
                <div>
                  <h1 className="text-3xl font-bold">KRATOS 2K25</h1>
                  <p className="text-xl opacity-90">Technical Symposium</p>
                  <p className="text-sm opacity-80">Easwari Engineering College</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold">REGISTRATION RECEIPT</h2>
                <p className="text-sm opacity-90">Official Receipt</p>
              </div>
            </div>
          </div>

          {/* Event Venue Banner */}
          <div className="bg-gray-50 border-b-4 border-orange-500 px-8 py-4">
            <div className="flex items-center justify-center space-x-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">Easwari Engineering College</p>
                <p className="text-sm text-gray-600">Ramapuram, Chennai - 600089, Tamil Nadu</p>
              </div>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-8">
            {/* Receipt Details Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Hash className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Payment ID</p>
                    <p className="text-gray-900 font-mono text-lg">
                      {receipt.payment_id || receipt.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Registration Date</p>
                    <p className="text-gray-900 text-lg">{receipt.date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Payment Status</p>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-green-100 text-green-800 border border-green-200 font-semibold">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {receipt.status}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                {qrCodeUrl && (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                      <img
                        src={qrCodeUrl}
                        alt="Team Verification QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                    <p className="text-gray-600 text-sm mt-2 font-medium">
                      Scan for team verification
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Team Details Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-bold text-gray-900">Team Details</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                {receipt.events.map((event, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Team Name:</p>
                            <p className="font-semibold text-gray-900">{event.team_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Participants:</p>
                            <p className="font-semibold text-gray-900">{event.participants} members</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-orange-600">₹{event.amount}</p>
                        <p className="text-sm text-gray-600">Registration Fee</p>
                      </div>
                    </div>
                    {index < receipt.events.length - 1 && <hr className="mt-4 border-gray-200" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="border-t-4 border-orange-500 pt-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">Total Amount Paid</span>
                <span className="text-3xl font-bold text-orange-600">₹{receipt.totalAmount}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">Email Support</p>
                    <p className="font-semibold">updates.kratos@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">Phone Support</p>
                    <p className="font-semibold">+91 98765 43210</p>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4 pt-4 border-t border-gray-600">
                <p className="text-sm text-gray-300">
                  For event updates and queries, please reach out to us
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                This is an official receipt for KRATOS 2K25 Technical Symposium
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Generated on {new Date().toLocaleString()}
              </p>
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
