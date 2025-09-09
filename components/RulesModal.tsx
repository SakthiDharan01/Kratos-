'use client'

interface RulesModalProps {
  eventTitle: string;
  rules: string;  // We know this is non-null because of the check in EventCard
  onClose: () => void;
}

export function RulesModal({ eventTitle, rules, onClose }: RulesModalProps) {
  const rulesList = (rules || '').split('\n').filter(rule => rule.trim());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border border-yellow-500/30" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">{eventTitle} - Rules</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl font-bold">&times;</button>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3 border-b-2 border-yellow-500/20 pb-2">Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              {rulesList.map((rule, index) => <li key={index}>{rule}</li>)}
            </ul>
          </div>
        </div>
        <div className="text-center mt-8">
          <button onClick={onClose} className="bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}