import React, { useState } from "react";
import girl from "../assets/girl.png";
import { Mail, Lock, Code2, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../utils/auth";
import { loginUser, registerUser } from "../utils/api";

export default function AIInterviewLoginPage({ defaultRegister = false }) {
  const navigate = useNavigate();

  const [isRegister] = useState(defaultRegister);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getApiErrorMessage = (error, fallbackMessage) => {
    if (!error?.response) {
      return "Cannot connect to server. Start backend on port 5000.";
    }
    return error?.response?.data?.message || fallbackMessage;
  };

  // 🔐 REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Fill all fields");
      return;
    }
    try {
      setLoading(true);
      await registerUser({ name, email, password });
      alert("Registered successfully! Now login.");
      navigate("/login");
    } catch (error) {
      alert(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  // 🔓 LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await loginUser({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", data.user?.name || "User");
      login();
      navigate("/dashboard");
    } catch (error) {
      alert(getApiErrorMessage(error, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B1A] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl bg-[#0B1225] rounded-[32px] shadow-2xl overflow-hidden border border-white/5">
        <div className="grid md:grid-cols-2 min-h-[700px]">
          {/* LEFT SECTION */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {/* LOGO */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center">
                <Code2 className="text-white" size={28} />
              </div>

              <div>
                <h1 className="text-white text-3xl font-bold">AI Interview</h1>
                <p className="text-[#B8C1D1] text-sm">
                  Your AI Mock Interviewer
                </p>
              </div>
            </div>

            {/* HEADING */}
            <h2 className="text-white text-5xl font-bold mb-3">
              {isRegister ? "Register ✨" : "Welcome 👋"}
            </h2>

            <p className="text-[#B8C1D1] text-lg mb-10">
              {isRegister
                ? "Start your AI interview journey"
                : "Login to continue your learning journey"}
            </p>

            {/* FORM */}
            <form
              onSubmit={isRegister ? handleRegister : handleLogin}
              className="space-y-6"
            >
              {/* NAME (REGISTER ONLY) */}
              {isRegister && (
                <div>
                  <label className="text-white block mb-3">Name</label>
                  <div className="flex items-center gap-3 bg-[#111827] border border-[#1E293B] rounded-2xl px-5 py-4">
                    <User className="text-[#B8C1D1]" />
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent w-full outline-none text-white"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="text-white block mb-3">Email</label>
                <div className="flex items-center gap-3 bg-[#111827] border border-[#1E293B] rounded-2xl px-5 py-4">
                  <Mail className="text-[#B8C1D1]" />
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent w-full outline-none text-white"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-white block mb-3">Password</label>
                <div className="flex items-center gap-3 bg-[#111827] border border-[#1E293B] rounded-2xl px-5 py-4">
                  <Lock className="text-[#B8C1D1]" />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent w-full outline-none text-white"
                  />
                </div>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white text-xl font-semibold bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:scale-[1.02] transition"
              >
                {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
              </button>
            </form>

            {/* SWITCH */}
            <p className="text-center text-[#B8C1D1] mt-8 text-lg">
              {isRegister ? "Already have an account?" : "No account?"}
              <Link
                to={isRegister ? "/login" : "/register"}
                className="text-[#8B5CF6] font-semibold cursor-pointer ml-2"
              >
                {isRegister ? "Login" : "Register"}
              </Link>
            </p>
          </div>

          {/* RIGHT SECTION */}
          <div className="relative hidden md:flex items-center justify-center bg-[#070D1C]">
            <div className="text-white text-center">
              <img
                src={girl} 
                alt="AI Interview Assistant"
                className="w-72 h-auto mx-auto mb-4 drop-shadow-2xl"/>
              <h3 className="text-2xl font-bold">AI Mock Interview</h3>
              <p className="text-[#B8C1D1] mt-2">
                Practice • Improve • Succeed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
