import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Calendar, Clock, Edit2, Check, X, Shield, Activity, Save } from "lucide-react";
import { getUserProfile, updateUserProfile, getInterviewHistory } from "../utils/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    profileImage: "",
    phone: "",
    location: "",
    bio: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const profileData = await getUserProfile();
      const historyData = await getInterviewHistory();
      
      setProfile(profileData.user);
      setFormData({
        name: profileData.user.name || "",
        profileImage: profileData.user.profileImage || "",
        phone: profileData.user.phone || "",
        location: profileData.user.location || "",
        bio: profileData.user.bio || ""
      });
      setHistory(historyData.history || []);
    } catch (err) {
      setError("Failed to load profile data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      const updatedProfile = await updateUserProfile(formData);
      setProfile(updatedProfile.user);
      setFormData({
        name: updatedProfile.user.name || "",
        profileImage: updatedProfile.user.profileImage || "",
        phone: updatedProfile.user.phone || "",
        location: updatedProfile.user.location || "",
        bio: updatedProfile.user.bio || ""
      });
      
      // Update local storage name if it changed
      if (updatedProfile.user.name !== localStorage.getItem("currentUser")) {
        localStorage.setItem("currentUser", updatedProfile.user.name);
      }
      
      setSuccessMessage("Profile updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <motion.div 
      className="max-w-5xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Manage your personal information and activity.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-purple-500/20"
          >
            <Edit2 size={18} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: profile?.name || "",
                  profileImage: profile?.profileImage || "",
                  phone: profile?.phone || "",
                  location: profile?.location || "",
                  bio: profile?.bio || ""
                });
                setError("");
                setSuccessMessage("");
              }}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl transition-all"
              disabled={saving}
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"
              disabled={saving}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Save size={18} />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <X size={20} />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <Check size={20} />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* 👤 HEADER CARD */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-colors duration-300 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20"></div>
            
            <div className="relative z-10 pt-4 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] border-4 border-white dark:border-[#050505] overflow-hidden mb-4">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-4 text-left">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 ml-1">Avatar URL</label>
                    <input 
                      type="text" 
                      name="profileImage"
                      value={formData.profileImage}
                      onChange={handleInputChange}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name}</h2>
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                    <Mail size={16} />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-500/30">
                    <Shield size={14} />
                    {profile?.role || "User"}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* ℹ️ ACCOUNT INFO */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
              Account Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Joined On</p>
                  <p className="text-sm font-medium">{formatDate(profile?.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(profile?.updatedAt)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 📝 PERSONAL DETAILS */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-purple-500 rounded-full"></span>
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Phone size={16} /> Phone Number
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium">{profile?.phone || "Not provided"}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin size={16} /> Location
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="New York, USA"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium">{profile?.location || "Not provided"}</p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <User size={16} /> Bio
              </label>
              {isEditing ? (
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                ></textarea>
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-line bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800/50">
                  {profile?.bio || "No bio provided yet."}
                </p>
              )}
            </div>
          </motion.div>

          {/* 📊 ACTIVITY SUMMARY */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                Recent Activity
              </h3>
            </div>

            {history.length > 0 ? (
              <div className="space-y-4">
                {history.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800/50 hover:border-purple-200 dark:hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Completed Mock Interview</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.score !== undefined ? `${item.score}%` : "Done"}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Activity size={24} />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No recent activity found.</p>
                <p className="text-sm text-gray-400 mt-1">Take your first interview to see stats here.</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
