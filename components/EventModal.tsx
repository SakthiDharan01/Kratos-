"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Event } from "@/lib/store";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import toast from "react-hot-toast";
import { useState } from "react";
import { IndianRupee, Users, Plus } from "lucide-react";

interface EventModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event: Event | null;
}

export function EventModal({ open, onOpenChange, event }: EventModalProps) {
  const { addToCart, isAuthenticated } = useStore();
  const [teamSize, setTeamSize] = useState<number>(event?.min_team_size || 1);

  if (!event) return null;

  const handleAdd = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add events");
      return;
    }
    addToCart(event, teamSize);
    toast.success("Added to cart");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 text-white border border-red-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-yellow-400">{event.name}</DialogTitle>
          <DialogDescription className="text-gray-300">
            {event.category.toUpperCase()} • Min {event.min_team_size} / Max {event.max_team_size}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
          {event.rules && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Rules</h3>
              <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: event.rules }} />
            </div>
          )}
          <div className="flex flex-wrap gap-6 items-end justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Team Size</label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:border-red-500 outline-none"
              >
                {Array.from({ length: event.max_team_size - event.min_team_size + 1 }, (_, i) => event.min_team_size + i).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <IndianRupee className="w-5 h-5" /> {event.price} / person
            </div>
            <div className="text-sm text-gray-400">Total: <span className="text-green-400 font-semibold">₹{event.price * teamSize}</span></div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add to Cart
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
