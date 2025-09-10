'use client'

import { Event } from '@/lib/store'

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
}

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const rulesList = (event.rules || '').split('\n').filter(rule => rule.trim());
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border border-yellow-500/30" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">{event.name} - Event Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl font-bold">&times;</button>
        </div>
        
        <div className="space-y-6">
          {/* Detailed Description */}
          {event.description_detailed && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 border-b-2 border-yellow-500/20 pb-2">Detailed Description</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{event.description_detailed}</p>
            </div>
          )}
          
          {/* Rules */}
          {event.rules && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 border-b-2 border-yellow-500/20 pb-2">Rules</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                {rulesList.map((rule, index) => <li key={index}>{rule}</li>)}
              </ul>
            </div>
          )}
          
          {/* Rounds */}
          {event.rounds && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 border-b-2 border-yellow-500/20 pb-2">Rounds</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{event.rounds}</p>
            </div>
          )}
          
          {/* Event Information */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3 border-b-2 border-yellow-500/20 pb-2">Event Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <p><span className="font-semibold text-yellow-400">Date:</span> {new Date(event.event_date).toLocaleDateString()}</p>
                {event.time_slot && (
                  <p><span className="font-semibold text-yellow-400">Time Slot:</span> {
                    event.time_slot === 'morning' ? 'Morning Session' : 
                    event.time_slot === 'afternoon' ? 'Afternoon Session' : 
                    'Full Day (Morning & Afternoon)'
                  }</p>
                )}
                <p><span className="font-semibold text-yellow-400">Venue:</span> {event.venue}</p>
              </div>
              <div>
                <p><span className="font-semibold text-yellow-400">Event Type:</span> {event.event_type === 'team' ? 'Team Event' : 'Solo Event'}</p>
                {event.event_type === 'team' && (
                  <p><span className="font-semibold text-yellow-400">Team Size:</span> {event.min_team_size}-{event.max_team_size} members</p>
                )}
                <p><span className="font-semibold text-yellow-400">Registration Fee:</span> ₹{event.price}</p>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          {(event.incharge_name1 || event.incharge_name2) && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 border-b-2 border-yellow-500/20 pb-2">Contact Information</h3>
              <div className="text-gray-300 space-y-2">
                {event.incharge_name1 && event.incharge_phone1 && (
                  <p><span className="font-semibold text-yellow-400">Event Incharge:</span> {event.incharge_name1} - +91 {event.incharge_phone1}</p>
                )}
                {event.incharge_name2 && event.incharge_phone2 && (
                  <p><span className="font-semibold text-yellow-400">Co-Incharge:</span> {event.incharge_name2} - +91 {event.incharge_phone2}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-center mt-8">
          <button onClick={onClose} className="bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-yellow-300 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}
