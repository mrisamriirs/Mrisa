import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Scene3D } from "@/components/Scene3D"; // Using the main site 3D scene
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <>
      {/* 
        This style tag contains the CSS for the new glitch and typing animations.
        It's included here for convenience, but you can also move it to your global CSS file.
      */}
      <style>{`
        .glitch-text {
          position: relative;
          color: white;
          text-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
        }
        .glitch-text::before,
        .glitch-text::after {
          content: '404';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0A0A1A;
          overflow: hidden;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -2px 0 #ff00c1;
          animation: glitch-anim-1 2s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
          animation: glitch-anim-2 2s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(15% 0 86% 0); } 25% { clip-path: inset(48% 0 50% 0); } 50% { clip-path: inset(90% 0 2% 0); } 75% { clip-path: inset(34% 0 63% 0); } 100% { clip-path: inset(5% 0 92% 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(83% 0 13% 0); } 25% { clip-path: inset(21% 0 78% 0); } 50% { clip-path: inset(6% 0 95% 0); } 75% { clip-path: inset(64% 0 33% 0); } 100% { clip-path: inset(45% 0 53% 0); }
        }
        
        .typing-effect {
          width: 0;
          overflow: hidden;
          white-space: nowrap;
          border-right: .15em solid #00ff99;
          animation: typing 2s steps(22, end) 1s 1 forwards, blink-caret .75s step-end infinite;
        }
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #00ff99; }
        }
      `}</style>
      
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A1A] text-white">
        {/* 1. UNIFIED 3D BACKGROUND */}
        <div className="fixed inset-0 z-0">
          <Scene3D />
        </div>

        {/* 2. FROSTED GLASS UI PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center p-8 md:p-12 flex flex-col items-center bg-[#121224]/50 backdrop-blur-lg rounded-xl border border-blue-900/40 w-[90%] max-w-2xl"
        >
          <div className="flex items-center text-yellow-400 mb-6">
            <AlertTriangle className="h-8 w-8 mr-3" />
            <h2 className="text-xl md:text-2xl font-mono typing-effect">
              RESOURCE NOT FOUND
            </h2>
          </div>

          <h1 className="text-8xl md:text-9xl font-mono font-bold glitch-text mb-6">
            404
          </h1>

          <p className="max-w-md text-lg text-gray-400 mb-10">
            The requested endpoint does not exist or has been decommissioned. 
            The link may be broken or you may have insufficient permissions to access this resource.
          </p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Button
              asChild
              className="bg-green-500 text-black hover:bg-green-400 transition-all duration-300 transform hover:scale-105 rounded-lg px-8 py-3 group"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Return to Homepage
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;