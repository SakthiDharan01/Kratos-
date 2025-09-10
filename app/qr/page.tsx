"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Calendar, MapPin, Clock, Mail, Phone, User, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  is_leader: boolean;
}

interface Event {
  id: number;
  name: string;
  description: string;
  price: number;
  event_type: string;
  category: string;
  event_date: string;
  time_slot: string | null;
  venue: string;
  rounds: string | null;
}

interface Team {
  id: number;
  name: string;
  payment_status: string;
  paid_amount: number;
  payment_time: string;
  registration_date: string;
  members: TeamMember[];
}

interface QRData {
  success: boolean;
  type: 'team' | 'individual';
  event: Event;
  team: Team;
  participant?: TeamMember;
}

function QRContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("id");
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) {
        setError("No team ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching team data for ID:', teamId);
        const response = await fetch(`/api/registrations/query?id=${teamId}`);
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}: Failed to fetch team data`);
        }

        if (!data.success) {
          throw new Error(data.error || 'Team not found or payment not completed');
        }
        
        setQrData(data);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load team data');
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading team information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !qrData || !qrData.success) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-400 mb-2">Team Not Found</h1>
            <p className="text-gray-300 mb-4">
              Please provide userId, email, registrantId, or qrId parameter
            </p>
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mt-4">
                <p className="text-red-300 text-sm">
                  <strong>Error:</strong> {error}
                </p>
                {teamId && (
                  <p className="text-red-300 text-sm mt-2">
                    <strong>Team ID:</strong> {teamId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  const { event, team } = qrData;
  const leader = team.members.find(member => member.is_leader);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
              <h1 className="text-3xl font-bold text-yellow-400">Team Registration</h1>
            </div>
            <p className="text-gray-300">Verified team information for {event.name}</p>
          </motion.div>

          {/* Event Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Event:</strong> {event.name}
                </p>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Category:</strong> {event.category}
                </p>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Type:</strong> {event.event_type}
                </p>
              </div>
              <div>
                {event.event_date && (
                  <p className="text-gray-300 mb-2">
                    <strong className="text-white">Date:</strong> {new Date(event.event_date).toLocaleDateString()}
                  </p>
                )}
                {event.time_slot && (
                  <p className="text-gray-300 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <strong className="text-white">Time:</strong> {event.time_slot === 'morning' ? 'Morning' : event.time_slot === 'afternoon' ? 'Afternoon' : 'Full Day'}
                  </p>
                )}
                {event.venue && (
                  <p className="text-gray-300 mb-2">
                    <strong className="text-white">Venue:</strong> {event.venue}
                  </p>
                )}
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Fee:</strong> ₹{event.price}
                </p>
              </div>
            </div>
            {event.description && (
              <div className="mt-4">
                <p className="text-gray-300">
                  <strong className="text-white">Description:</strong> {event.description}
                </p>
              </div>
            )}
          </motion.div>

          {/* Team Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Team Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Team Name:</strong> {team.name}
                </p>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Team Size:</strong> {team.members.length} members
                </p>
              </div>
              <div>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Payment Status:</strong>{" "}
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    {team.payment_status.toUpperCase()}
                  </span>
                </p>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Amount Paid:</strong> ₹{team.paid_amount}
                </p>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Registration Date:</strong>{" "}
                  {new Date(team.registration_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Team Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Team Members
            </h2>
            <div className="space-y-4">
              {team.members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    member.is_leader 
                      ? 'bg-yellow-900/20 border-yellow-600' 
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      {member.name}
                      {member.is_leader && (
                        <span className="ml-2 px-2 py-1 bg-yellow-600 text-black text-xs rounded font-bold">
                          LEADER
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-300 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {member.email}
                    </p>
                    <p className="text-gray-300 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {member.phone}
                    </p>
                    <p className="text-gray-300">
                      <strong>College:</strong> {member.college}
                    </p>
                    <p className="text-gray-300">
                      <strong>Department:</strong> {member.department}
                    </p>
                    <p className="text-gray-300">
                      <strong>Year:</strong> {member.year}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-gray-400 text-sm">
              This is a verified registration for Kratos 2k25
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Generated on {new Date().toLocaleString()}
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

export default function QRPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      </Layout>
    }>
      <QRContent />
    </Suspense>
  );
}
