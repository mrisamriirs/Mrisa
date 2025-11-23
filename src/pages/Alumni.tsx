import { useState } from "react";
import { motion } from "framer-motion";
// --- UPDATED: Added Instagram and Linkedin icons ---
import { Github, Linkedin, Mail, Code, Shield, Zap, Instagram } from "lucide-react";
// Assuming Scene3D is defined elsewhere
import { Scene3D } from "@/components/Scene3D";

// Data structure for an alumna/alumnus
interface Alumnus {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  linkedin_url?: string;
  github_url?: string;
  email?: string;
}

// Alumni data
const manualAlumni: Alumnus[] = [
    {
      id: 'a1',
      name: 'Alumni Member 1',
      role: 'Former President',
      bio: 'A strategic leader who drove the core vision and initiatives of the team, ensuring excellence in all endeavors.',
      image_url: null,
      linkedin_url: 'https://www.linkedin.com'
    },
    {
      id: 'a2',
      name: 'Alumni Member 2',
      role: 'Former Vice President',
      bio: 'A strategic leader who drove the core vision and initiatives of the team, ensuring excellence in all endeavors.',
      image_url: null,
      linkedin_url: 'https://www.linkedin.com'
    },
    {
      id: 'a3',
      name: 'Alumni Member 3',
      role: 'Former Secretary',
      bio: 'The organizational backbone of the team, managing communications and ensuring smooth operational workflow.',
      image_url: null,
      linkedin_url: 'https://www.linkedin.com'
    },
    {
      id: 'a4',
      name: 'Alumni Member 4',
      role: 'Former Operations',
      bio: 'Expert in managing day-to-day activities and strategic projects, ensuring efficiency and timely execution.',
      image_url: null,
      linkedin_url: 'https://www.linkedin.com'
    },
    {
      id: 'a5',
      name: 'Alumni Member 5',
      role: 'Former Media Head',
      bio: 'The creative force behind our brand, leading our media strategy and public engagement.',
      image_url: null,
      linkedin_url: 'https://www.linkedin.com'
    },
    {
      id: 'a6',
      name: 'Alumni Member 6',
      role: 'Former Technical Head',
      bio: 'The engineering visionary who transformed complex technical challenges into powerful, scalable solutions.', 
      image_url: null,
      linkedin_url: 'https://www.linkedin.com',
      github_url:  'https://github.com',
      email: 'alumni@example.com'
    }
];

const socialIcons = [
  { Component: Github, name: "github" },
  { Component: Linkedin, name: "linkedin" },
  { Component: Mail, name: "mail" },
];

const AlumniCard = ({ member, index }: { member: Alumnus, index: number }) => {
  const [imageError, setImageError] = useState(false);
  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('technical') || role.toLowerCase().includes('engineer')) return Code;
    if (role.toLowerCase().includes('security') || role.toLowerCase().includes('president')) return Shield;
    if (role.toLowerCase().includes('operations') || role.toLowerCase().includes('media')) return Zap;
    return Zap;
  };
  const RoleIcon = getRoleIcon(member.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateY: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ y: -10, rotateY: 5 }}
      className="p-8 group relative overflow-hidden bg-[#121224]/70 backdrop-blur-md rounded-xl border border-blue-900/40"
      style={{ perspective: "1000px" }}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative mb-6 flex justify-center">
            <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/30 group-hover:border-primary/60 transition-colors duration-300">
                    {member.image_url && !imageError ? (<img src={member.image_url} alt={member.name} className="w-full h-full object-cover" onError={() => setImageError(true)} />) : (<div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><RoleIcon className="h-16 w-16 text-primary/60" /></div>)}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/50 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary/20 rounded-full border-2 border-primary/50 flex items-center justify-center backdrop-blur-sm"><RoleIcon className="h-5 w-5 text-primary" /></div>
            </div>
        </div>
        <div className="text-center mb-4"><h3 className="text-2xl font-sans font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{member.name}</h3><p className="text-sm font-mono uppercase tracking-wide text-green-500/80">{member.role}</p></div>
        <p className="text-gray-400 text-center mb-6 leading-relaxed">{member.bio}</p>
        <div className="flex justify-center space-x-4 h-10 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {socialIcons.map(({ Component, name }, idx) => {
              let url;
              switch (name) {
                case 'linkedin':
                  url = member.linkedin_url;
                  break;
                case 'github':
                  url = member.github_url;
                  break;
                case 'mail':
                  url = member.email ? `mailto:${member.email}` : undefined;
                  break;
                default:
                  url = undefined;
              }
              if (!url) return null;
              return (
                <motion.a
                  key={idx} href={url} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 cursor-pointer"
                >
                  <Component className="h-4 w-4 text-primary" />
                </motion.a>
              );
            })}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </motion.div>
  );
};

const Alumni = () => {
  return (
    <div className="relative text-gray-200">
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>
      <div className="relative z-10 min-h-screen py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-sans font-bold mb-6 text-white" style={{ textShadow: '0 0 20px rgba(0, 255, 150, 0.5)' }}>
              Our Alumni
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Meet the alumni who shaped our legacy and continue to inspire us.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {manualAlumni.map((member, index) => (
              <AlumniCard key={member.id} member={member} index={index} />
            ))}
          </div>

          {/* --- MODIFIED: Community CTA Section --- */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 text-center bg-[#121224]/70 backdrop-blur-md rounded-2xl p-12 border border-blue-900/40 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-sans font-bold mb-6 text-white">
                Join Our Community
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
                Stay connected and be the first to know about our upcoming events, workshops, and competitions by following our social media channels.
              </p>
              {/* --- NEW: Social media buttons --- */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.a 
                    href="https://www.linkedin.com/company/manav-rachna-infosec-army" target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center bg-blue-600 text-white rounded-lg px-8 py-3 font-semibold transition-colors hover:bg-blue-500"
                  >
                    <Linkedin className="mr-2 h-5 w-5" />
                    Follow on LinkedIn
                  </motion.a>
                  <motion.a
                    href="https://www.instagram.com/mrisa_mriirs" target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center bg-pink-600 text-white rounded-lg px-8 py-3 font-semibold transition-colors hover:bg-pink-500"
                  >
                    <Instagram className="mr-2 h-5 w-5" />
                    Join on Instagram
                  </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Alumni;

