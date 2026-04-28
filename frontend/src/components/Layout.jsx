import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../utils/auth";
import { 
  LayoutDashboard, 
  Map, 
  Mic, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Sun,
  Moon
} from "lucide-react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = localStorage.getItem("currentUser") || "User";

  // 🌗 GLOBAL THEME
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "light" || (!savedTheme && !prefersDark)) {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Roadmap", path: "/roadmap", icon: Map },
    { name: "Interview", path: "/interview", icon: Mic },
    { name: "Feedback", path: "/feedback", icon: MessageSquare },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white font-sans selection:bg-purple-500/30 transition-colors duration-300">
      {/* 📌 LEFT SIDEBAR */}
      <div className="w-64 fixed h-full p-6 flex flex-col justify-between bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/5 z-20 transition-colors duration-300">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 text-purple-600 dark:text-purple-400">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
              <span className="font-bold text-xl">&lt;/&gt;</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">AI Interview</h1>
          </div>

          {/* Nav Items */}
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                               (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
              return (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.1)]" 
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={20} className={isActive ? "text-purple-700 dark:text-purple-400" : ""} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* 📌 MAIN CONTENT AREA */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* 📌 HEADER */}
        <header className="h-20 flex items-center justify-end px-8 sticky top-0 z-10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
          <div className="flex items-center gap-6">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-white dark:border-[#050505]"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 cursor-pointer pl-4 border-l border-gray-200 dark:border-white/10 group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Pro Member</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md dark:shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-lg dark:group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-shadow">
                {user.charAt(0).toUpperCase()}
              </div>
            </div>
            
          </div>
        </header>

        {/* 📌 PAGE CONTENT */}
        <main className="flex-1 p-8">
          {children}
        </main>
        
      </div>
    </div>
  );
}