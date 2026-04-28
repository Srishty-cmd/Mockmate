import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, Map, Mic, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("currentUser") || "User";
  const domain = "Frontend Development"; // Can be replaced with context or localStorage if available
  const progressValue = 65; // Static/Placeholder progress

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 👋 WELCOME SECTION */}
      <motion.div variants={itemVariants} className="mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Welcome, {user} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Ready to level up your skills today?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Cards */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 📊 SELECTED DOMAIN CARD */}
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-colors duration-300"
          >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/20 rounded-full blur-3xl transition-colors duration-300"></div>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-blue-50 dark:from-purple-500/20 dark:to-blue-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)] dark:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-colors duration-300">
                <Code size={32} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1 transition-colors duration-300">Selected Domain</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{domain}</h2>
              </div>
            </div>
          </motion.div>

          {/* 🚀 ACTION CARDS (2 Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* View Roadmap Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/roadmap")}
              className="relative overflow-hidden rounded-2xl p-6 cursor-pointer group shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 dark:from-purple-600 dark:to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 dark:bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/30 dark:group-hover:bg-white/20 transition-all"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white mb-4 backdrop-blur-sm">
                    <Map size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">View Roadmap</h3>
                  <p className="text-purple-50 text-sm">Explore your personalized learning path.</p>
                </div>
                
                <div className="mt-6 flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
                  Explore Roadmap <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </motion.div>

            {/* Start Interview Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/interview")}
              className="relative overflow-hidden rounded-2xl p-6 cursor-pointer group shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 dark:bg-white/10 rounded-full blur-2xl transform translate-x-10 translate-y-10 group-hover:bg-white/30 dark:group-hover:bg-white/20 transition-all"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white mb-4 backdrop-blur-sm">
                    <Mic size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Start Interview</h3>
                  <p className="text-emerald-50 text-sm">Practice with AI mock interviewer.</p>
                </div>
                
                <div className="mt-6 flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
                  Start Session <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* RIGHT COLUMN: Progress & Extras */}
        <div className="space-y-8">
          
          {/* 📈 PROGRESS SECTION */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-colors duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
              <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
              Your Progress
            </h3>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Overall Mastery</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{progressValue}%</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden transition-colors duration-300">
              {/* Animated Fill */}
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressValue}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              />
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center transition-colors duration-300">Keep practicing to reach 100%!</p>
          </motion.div>

          {/* ✨ TIPS / EXTRA */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-b from-gray-50 to-transparent dark:from-white/5 dark:to-transparent border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md transition-colors duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">🚀 Quick Tips</h3>
            <ul className="space-y-3">
              {[
                "Practice daily to build confidence.",
                "Use the STAR method for answers.",
                "Speak clearly and concisely."
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}