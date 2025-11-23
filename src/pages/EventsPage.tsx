import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Scene3D } from "@/components/Scene3D";
import { EventsManagement } from "@/components/EventsManagement";

const EventsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await logout();
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoggingOut(false);
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    }
  };

  return (
    <div className="relative text-gray-200 min-h-screen">
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>
      <div className="relative z-10 min-h-screen py-12 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-1">
                  Events Management
                </h1>
                <p className="text-sm sm:text-base text-gray-400">Create and manage all MRISA events</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowNewEventForm(!showNewEventForm)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-semibold flex items-center justify-center gap-2 h-10 sm:h-11 px-4 text-sm sm:text-base"
              >
                <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
                New Event
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
              >
                <LogOut className="h-4 sm:h-5 w-4 sm:w-5" />
                <span className="hidden sm:inline">{isLoggingOut ? "Logging out..." : "Logout"}</span>
                <span className="sm:hidden">{isLoggingOut ? "..." : "Log"}</span>
              </Button>
            </div>
          </motion.div>

          {/* Events Management Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <EventsManagement showForm={showNewEventForm} setShowForm={setShowNewEventForm} />
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 40px rgba(16, 185, 129, 0.1)",
                "0 0 80px rgba(16, 185, 129, 0.2)",
                "0 0 40px rgba(16, 185, 129, 0.1)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="fixed bottom-10 left-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl pointer-events-none z-0"
          />
          <motion.div
            animate={{
              boxShadow: [
                "0 0 60px rgba(59, 130, 246, 0.1)",
                "0 0 100px rgba(59, 130, 246, 0.2)",
                "0 0 60px rgba(59, 130, 246, 0.1)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="fixed top-20 right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none z-0"
          />
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
