import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Calendar, Clock, Users, Trophy, ExternalLink, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Scene3D } from "@/components/Scene3D";

interface CTFEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "active" | "past";
  image_url: string | null;
  attendees: number;
  registration_link?: string;
}

// Restyled Registration Modal
const RegistrationModal = ({ event, onClose }: { event: CTFEvent, onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: "", email: "", team_name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("registrations").insert([{
        event_id: event.id,
        name: formData.name,
        email: formData.email,
        team_name: formData.team_name || null,
      }]);
      if (error) throw error;
      toast({
        title: "Registration Successful!",
        description: `You're registered for ${event.title}. Check your email for confirmation.`,
      });
      onClose(); // Close modal on success
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="bg-[#121224]/70 backdrop-blur-md border border-blue-900/40 text-gray-200 p-4 sm:p-6 md:p-8">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl md:text-2xl font-sans text-green-400 line-clamp-2">
          Register for: {event.title}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
        <div>
          <Label htmlFor="name" className="text-xs sm:text-sm">Name *</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1 sm:mt-2 text-sm sm:text-base h-9 sm:h-10" />
        </div>
        <div>
          <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="mt-1 sm:mt-2 text-sm sm:text-base h-9 sm:h-10" />
        </div>
        <div>
          <Label htmlFor="team_name" className="text-xs sm:text-sm">Team Name (Optional)</Label>
          <Input id="team_name" value={formData.team_name} onChange={(e) => setFormData({ ...formData, team_name: e.target.value })} className="mt-1 sm:mt-2 text-sm sm:text-base h-9 sm:h-10" />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-green-500 text-black hover:bg-green-400 h-9 sm:h-10 text-sm sm:text-base">
          {isSubmitting ? "Submitting..." : "Confirm Registration"}
        </Button>
      </form>
    </DialogContent>
  );
};

// 3D Interactive Event Card
const EventCard = ({ event }: { event: CTFEvent }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-150, 150], [-10, 10]);
  const rotateY = useTransform(x, [-150, 150], [10, -10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const statusStyles = {
    upcoming: { color: "border-green-500" },
    active: { color: "border-blue-500" },
    past: { color: "border-gray-600" },
  };

  const status = statusStyles[event.status] || statusStyles.past;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-xl border ${status.color} transition-shadow duration-300 hover:shadow-2xl hover:shadow-green-500/10 overflow-hidden`}
      >
        {/* Event Image */}
        {event.image_url && (
          <div className="relative h-24 sm:h-32 overflow-hidden bg-[#0a0a14]">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div style={{ transform: "translateZ(20px)" }} className="p-4 sm:p-6">
          <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg md:text-xl font-sans font-bold text-white line-clamp-2">{event.title}</h3>
            <span className={`px-2 sm:px-3 py-1 text-xs font-mono uppercase rounded-full bg-black/30 whitespace-nowrap flex-shrink-0`}>
              {event.status}
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">{event.description}</p>
          <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
            <span className="flex items-center"><Calendar className="h-3 sm:h-4 w-3 sm:w-4 mr-2 flex-shrink-0" />{new Date(event.date).toLocaleDateString()}</span>
            <span className="flex items-center"><Clock className="h-3 sm:h-4 w-3 sm:w-4 mr-2 flex-shrink-0" />{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
            <Users className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
            <span className="line-clamp-1">{event.location} • {event.attendees} attendees</span>
          </div>
          <div style={{ transform: "translateZ(30px)" }} className="space-y-2">
            {event.status === "upcoming" && event.registration_link ? (
              <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-green-500 text-black hover:bg-green-400 h-9 sm:h-10 text-xs sm:text-sm">Register Now</Button>
              </a>
            ) : event.status === "upcoming" && !event.registration_link ? (
              <Button disabled className="w-full bg-gray-500 text-gray-300 cursor-not-allowed h-9 sm:h-10 text-xs sm:text-sm">No Registration Link</Button>
            ) : event.status === "past" ? (
              <Link to="/winners" className="block">
                <Button className="w-full bg-blue-500 text-white hover:bg-blue-400 border-blue-900/40 h-9 sm:h-10 text-xs sm:text-sm">View Results</Button>
              </Link>
            ) : event.status === "active" ? (
              <a href={event.registration_link || "#"} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-blue-500 text-white hover:bg-blue-400 h-9 sm:h-10 text-xs sm:text-sm">Join Now</Button>
              </a>
            ) : null}
          </div>
        </div>
      </motion.div>
      <RegistrationModal event={event} onClose={() => setIsModalOpen(false)} />
    </Dialog>
  );
};

// Main Events Page Component
const Events = () => {
  const [events, setEvents] = useState<CTFEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "active" | "past">("all");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // FIX: Tell Supabase what type of data to expect to satisfy TypeScript
        const { data, error } = await supabase
          .from("events")
          .select<"*", CTFEvent>("*")
          .order("date", { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => filter === "all" || e.status === filter);
  const filterOptions = ["all", "upcoming", "active", "past"];

  return (
    <div className="relative text-gray-200">
      <div className="fixed inset-0 z-0"><Scene3D /></div>
      <div className="relative z-10 min-h-screen py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10 md:mb-16">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold mb-3 sm:mb-4 md:mb-6 text-white" style={{ textShadow: '0 0 20px rgba(0, 255, 150, 0.5)' }}>
              Events
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              Test your skills in our cutting-edge cybersecurity competitions against a global community of hackers.
            </p>
          </motion.div>
          <div className="flex justify-center mb-8 sm:mb-10 md:mb-12 px-2 sm:px-0 overflow-x-auto">
            <div className="flex gap-1 sm:gap-2 bg-[#121224]/70 backdrop-blur-md rounded-lg p-1 sm:p-2 border border-blue-900/40 whitespace-nowrap">
              {filterOptions.map(option => (
                <button key={option} onClick={() => setFilter(option as any)} className="relative px-3 sm:px-6 py-2 rounded-md font-mono text-xs sm:text-sm transition-colors text-gray-300 hover:text-white">
                  {filter === option && (
                    <motion.div layoutId="filter-active" className="absolute inset-0 bg-green-500/30 rounded-md" />
                  )}
                  <span className="relative z-10 capitalize">{option}</span>
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12 sm:py-16 md:py-20">
              <Shield className="h-12 sm:h-16 w-12 sm:w-16 text-green-500 animate-pulse mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-mono text-white">Querying Event Matrix...</h3>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              >
                {filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}
              </motion.div>
            </AnimatePresence>
          )}
          {!loading && filteredEvents.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 sm:py-16 md:py-20">
              <h3 className="text-lg sm:text-xl md:text-2xl font-mono text-green-400 mb-2 sm:mb-4">No Events Found</h3>
              <p className="text-sm sm:text-base text-gray-400">There are currently no {filter} events. Please check back later.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;