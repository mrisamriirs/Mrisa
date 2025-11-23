import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Calendar, User, Settings, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Scene3D } from "@/components/Scene3D";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const userEmail = user?.email || "User";
  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const menuItems = [
    { icon: User, label: "Profile", href: "#", color: "from-blue-500 to-cyan-500" },
    { icon: Settings, label: "Settings", href: "#", color: "from-purple-500 to-pink-500" },
    { icon: Mail, label: "Messages", href: "#", color: "from-green-500 to-emerald-500" },
  ];

  return (
    <div className="relative text-gray-200 min-h-screen">
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>
      <div className="relative z-10 min-h-screen py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                Welcome to Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-400">Manage your MRISA account</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base w-full sm:w-auto"
            >
              <LogOut className="h-4 sm:h-5 w-4 sm:w-5" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-8"
          >
            <Button
              onClick={() => navigate("/admin/events")}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-black font-semibold flex items-center justify-center gap-2 h-10 sm:h-11 px-4 text-sm sm:text-base"
            >
              <Calendar className="h-4 sm:h-5 w-4 sm:w-5" />
              Manage Events
            </Button>
            <Button
              onClick={() => navigate("/admin/winners")}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold flex items-center justify-center gap-2 h-10 sm:h-11 px-4 text-sm sm:text-base"
            >
              <Trophy className="h-4 sm:h-5 w-4 sm:w-5" />
              Manage Winners
            </Button>
          </motion.div>

          {/* Overview Content */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Main Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {/* User Profile Card */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-1"
                >
                  <div className="bg-[#121224]/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-blue-900/40 h-full">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(16, 185, 129, 0.3)",
                            "0 0 40px rgba(16, 185, 129, 0.5)",
                            "0 0 20px rgba(16, 185, 129, 0.3)",
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 sm:mb-6"
                      >
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
                          {userInitial}
                        </span>
                      </motion.div>

                      {/* User Info */}
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {userEmail.split("@")[0]}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 break-all">{userEmail}</p>

                      {/* Stats */}
                      <div className="w-full space-y-3 sm:space-y-4">
                        <div className="bg-[#1a1a2e]/50 rounded-lg p-3 sm:p-4">
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                            Member Since
                          </p>
                          <p className="text-white font-semibold text-sm sm:text-base">{createdAt}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="sm:col-span-2 lg:col-span-2"
                >
                  <div className="bg-[#121224]/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-blue-900/40 h-full">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {menuItems.map((item, index) => (
                        <motion.a
                          key={item.label}
                          href={item.href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative overflow-hidden rounded-xl p-4 sm:p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-blue-900/40 cursor-pointer transition-all duration-300"
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                          />
                          <div className="relative z-10">
                            <div className={`inline-block p-2 sm:p-3 rounded-lg bg-gradient-to-br ${item.color} mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300`}>
                              <item.icon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                            </div>
                            <h4 className="text-base sm:text-lg font-semibold text-white mb-1">
                              {item.label}
                            </h4>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              Access your {item.label.toLowerCase()}
                            </p>
                            <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 text-gray-400 mt-3 sm:mt-4 group-hover:text-green-400 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[#121224]/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-blue-900/40"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Account Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Events Attended", value: "0", icon: Calendar, color: "from-blue-500 to-cyan-500" },
                    { label: "Achievements", value: "0", icon: User, color: "from-purple-500 to-pink-500" },
                    { label: "Points Earned", value: "0", icon: Mail, color: "from-green-500 to-emerald-500" },
                    { label: "Certifications", value: "0", icon: Settings, color: "from-orange-500 to-red-500" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      className="bg-[#1a1a2e]/50 rounded-xl p-4 sm:p-6 group hover:bg-[#1a1a2e]/70 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                          <stat.icon className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">{stat.label}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
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

export default Dashboard;
