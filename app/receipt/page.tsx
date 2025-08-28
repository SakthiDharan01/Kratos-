"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Download,
  Share,
  QrCode,
  IndianRupee,
  Calendar,
  Users,
} from "lucide-react";
import QRCode from "qrcode";

interface ReceiptData {
  id: string;
  events: Array<{
    name: string;
    participants: number;
    amount: number;
  }>;
  totalAmount: number;
  date: string;
  status: string;
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("id");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Mock receipt data - do replace with actual data fetching
  useEffect(() => {
    if (receiptId) {
      const mockReceipt: ReceiptData = {
        id: receiptId,
        events: [
          { name: "Code Hunt", participants: 3, amount: 300 },
          { name: "Hackathon", participants: 4, amount: 2000 },
        ],
        totalAmount: 2300,
        date: new Date().toLocaleDateString(),
        status: "Confirmed",
      };
      setReceipt(mockReceipt);

      // Generate QR code
      const receiptUrl = `${window.location.origin}/receipt?id=${receiptId}`;
      QRCode.toDataURL(receiptUrl).then(setQrCodeUrl).catch(console.error);
    }
  }, [receiptId]);

  const handleShare = () => {
    const text = `🎉 Successfully registered for TechFest 2024!\n\nReceipt ID: ${receiptId}\nTotal Amount: ₹${receipt?.totalAmount}\n\nView receipt: ${window.location.href}`;

    if (navigator.share) {
      navigator.share({
        title: "Kratos 2024 Registration Receipt",
        text: text,
        url: window.location.href,
      });
    } else {
      // Fallback to WhatsApp share
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleDownload = () => {
    // Simple implementation - in production, generate a PDF
    const content = `
TechFest 2024 Registration Receipt
================================
Receipt ID: ${receiptId}
Date: ${receipt?.date}
Status: ${receipt?.status}

Events Registered:
${receipt?.events.map((event) => `- ${event.name} (${event.participants} participants) - ₹${event.amount}`).join("\n")}

Total Amount: ₹${receipt?.totalAmount}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TechFest2024-Receipt-${receiptId}.txt`;
    a.click();
  };

  if (!receipt) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-yellow-400">
            Loading Receipt...
          </h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h1 className="text-5xl font-bold text-yellow-400">
              Registration Successful!
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            Your registration for Kratos 2025 has been confirmed
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Receipt Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white text-black rounded-xl p-8 shadow-2xl"
            >
              {/* Receipt Header */}
              <div className="text-center border-b border-gray-300 pb-6 mb-6">
                <h2 className="text-3xl font-bold text-black">Kratos 2024</h2>
                <p className="text-gray-600 mt-2">Registration Receipt</p>
                <div className="bg-green-500 text-white px-4 py-1 rounded-full inline-block mt-3">
                  {receipt.status}
                </div>
              </div>

              {/* Receipt Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Receipt Details
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Receipt ID:</span>{" "}
                      {receipt.id}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span> {receipt.date}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {receipt.status}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Payment Info
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Method:</span> Online
                      Payment
                    </p>
                    <p>
                      <span className="font-medium">Gateway:</span> Razorpay
                      (Ready)
                    </p>
                    <p>
                      <span className="font-medium">Total Events:</span>{" "}
                      {receipt.events.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Events List */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Registered Events
                </h3>
                <div className="space-y-3">
                  {receipt.events.map((event, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{event.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.participants} participant
                          {event.participants > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {event.amount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total Amount</span>
                  <div className="flex items-center">
                    <IndianRupee className="w-5 h-5" />
                    {receipt.totalAmount}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
                <p>Thank you for registering with Kratos 2024!</p>
                <p>Keep this receipt for your records.</p>
              </div>
            </motion.div>
          </div>

          {/* QR Code and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm text-center"
              >
                <QrCode className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">
                  Quick Access
                </h3>
                {qrCodeUrl && (
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img
                      src={qrCodeUrl}
                      alt="Receipt QR Code"
                      className="w-full max-w-48 mx-auto"
                    />
                  </div>
                )}
                <p className="text-gray-300 text-sm">
                  Scan this QR code to quickly access your receipt
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Share className="w-5 h-5" />
                  <span>Share Receipt</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Receipt</span>
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-600 text-white p-4 rounded-lg text-center"
              >
                <Calendar className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">
                  Event dates and venue details will be shared via email and
                  SMS.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-yellow-400">Loading receipt...</div>
        </div>
      </Layout>
    }>
      <ReceiptContent />
    </Suspense>
  );
}
