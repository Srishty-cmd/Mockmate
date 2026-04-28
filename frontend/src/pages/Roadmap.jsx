import { useState, useEffect } from "react";
import { generateRoadmapAI, mentorChatAI } from "../utils/api";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

const DOMAIN_LABELS = {
  frontend: "Frontend Development",
  data: "Data Science",
  mbbs: "MBBS"
};

const FALLBACK_ROADMAPS = {
  frontend: [
    { title: "Foundation", description: "HTML5, CSS3, modern JavaScript (ES6+)", icon: "Code", difficulty: "Beginner" },
    { title: "Core Frontend", description: "Responsive design, React fundamentals: components, props, state", icon: "Monitor", difficulty: "Intermediate" },
    { title: "Real Product Skills", description: "API integration, forms, routing, auth", icon: "Database", difficulty: "Advanced" },
    { title: "Portfolio + Prep", description: "Build 3 projects and prepare for interviews", icon: "Award", difficulty: "Advanced" }
  ],
  data: [
    { title: "Foundation", description: "Python, statistics, probability, SQL basics", icon: "Database", difficulty: "Beginner" },
    { title: "Data Handling", description: "NumPy, Pandas, data cleaning, visualization", icon: "BarChart", difficulty: "Intermediate" },
    { title: "ML Core", description: "Regression, classification, scikit-learn", icon: "Brain", difficulty: "Advanced" },
    { title: "Portfolio + Prep", description: "3 end-to-end projects with datasets", icon: "Award", difficulty: "Advanced" }
  ],
  mbbs: [
    { title: "Entry Preparation", description: "Strong NCERT basics and NEET prep", icon: "Book", difficulty: "Beginner" },
    { title: "MBBS Years", description: "Build conceptual clarity year by year", icon: "Activity", difficulty: "Intermediate" },
    { title: "Internship Readiness", description: "Ward work, case discussions, communication", icon: "Stethoscope", difficulty: "Advanced" },
    { title: "Long-term Growth", description: "Prepare for PG pathway", icon: "Award", difficulty: "Advanced" }
  ]
};

const DynamicIcon = ({ name, className }) => {
  const IconComponent = LucideIcons[name] || LucideIcons.CheckCircle;
  return <IconComponent className={className} />;
};

function fallbackAnswer(selectedDomain, question) {
  const q = question.toLowerCase();

  const hasAny = (words) => words.some((word) => q.includes(word));

  if (selectedDomain === "frontend") {
    if (hasAny(["project", "portfolio", "build"])) {
      return "Build 3 projects in order: portfolio site, API-based dashboard, and a full CRUD app with auth.";
    }
    if (hasAny(["internship", "job", "placement"])) {
      return "Prepare a strong GitHub + portfolio, then apply daily on Internshala, LinkedIn, and startup career pages.";
    }
    if (hasAny(["resource", "course", "youtube", "learn"])) {
      return "Use freeCodeCamp for basics, then follow a React project playlist and document every project on GitHub.";
    }
    if (hasAny(["time", "month", "how long"])) {
      return "With 2-3 focused hours daily, most learners become internship-ready in around 4-6 months.";
    }
    if (hasAny(["dsa", "interview", "prepare"])) {
      return "Parallel track: practice basic DSA and JavaScript interview questions while building frontend projects.";
    }
    return "For frontend, focus on HTML/CSS/JS -> React -> APIs -> projects -> interview prep. Keep a weekly build schedule.";
  }
  if (selectedDomain === "data") {
    if (hasAny(["project", "portfolio", "build"])) {
      return "Start with EDA project, then ML prediction project, then dashboard/reporting project using real datasets.";
    }
    if (hasAny(["internship", "job", "placement"])) {
      return "Show 2-3 strong notebooks with business insights, then apply with a concise portfolio and GitHub links.";
    }
    if (hasAny(["resource", "course", "learn"])) {
      return "Start with Python + statistics playlists, then Pandas/NumPy, then scikit-learn courses with practice datasets.";
    }
    if (hasAny(["time", "month", "how long"])) {
      return "For beginner to internship-level readiness, plan around 5-8 months of consistent practice.";
    }
    return "For data science, build strong Python + statistics + Pandas first, then machine learning and portfolio projects.";
  }
  if (selectedDomain === "mbbs") {
    if (hasAny(["neet", "exam", "prep"])) {
      return "For NEET, create a subject rotation plan, daily MCQ practice, and weekly full-length revision tests.";
    }
    if (hasAny(["time", "routine", "schedule"])) {
      return "Follow a fixed daily routine: concept study, revision blocks, and timed practice questions.";
    }
    if (hasAny(["internship", "clinical", "hospital"])) {
      return "Focus on bedside learning, case discussion, communication, and maintaining practical notes during rotations.";
    }
    return "For MBBS path, focus on NEET base, then year-wise concepts, clinical exposure, and disciplined long-term revision.";
  }
  return "Focus on fundamentals, practical projects, and consistent weekly progress in your selected domain.";
}

function normalizeText(text) {
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function similarityScore(a, b) {
  const tokensA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeText(b).split(" ").filter(Boolean));
  if (!tokensA.size || !tokensB.size) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union ? intersection / union : 0;
}

function isNearDuplicate(a, b) {
  return similarityScore(a, b) >= 0.82;
}

function isNearDuplicateAgainstRecent(reply, history, limit = 4) {
  const recentAiReplies = history
    .filter((item) => item.role === "ai")
    .slice(-limit)
    .map((item) => item.text);

  return recentAiReplies.some((pastReply) => isNearDuplicate(reply, pastReply));
}

function detectIntent(question) {
  const q = normalizeText(question);
  const hasAny = (words) => words.some((word) => q.includes(word));

  if (hasAny(["roadmap", "plan", "step", "path"])) return "roadmap";
  if (hasAny(["project", "portfolio", "build"])) return "projects";
  if (hasAny(["resource", "course", "youtube", "book", "learn"])) return "resources";
  if (hasAny(["internship", "job", "placement", "resume", "cv"])) return "career";
  if (hasAny(["time", "month", "how long", "duration"])) return "timeline";
  if (hasAny(["salary", "pay", "package"])) return "salary";
  if (hasAny(["skill", "topic", "what should i learn", "syllabus"])) return "skills";
  if (hasAny(["interview", "question", "dsa", "prepare"])) return "interview";
  return "general";
}

function isRelevantToQuestion(question, reply) {
  const qWords = normalizeText(question).split(" ").filter((w) => w.length > 3);
  const r = normalizeText(reply);
  if (!qWords.length) return true;
  const matched = qWords.filter((w) => r.includes(w)).length;
  return matched >= Math.max(1, Math.floor(qWords.length * 0.25));
}

function isTooShortQuestion(question) {
  const trimmed = (question || "").trim();
  return trimmed.length < 4 || trimmed.split(/\s+/).length < 2;
}

function shortQuestionPrompt(selectedDomain, askedCount) {
  const domainText = DOMAIN_LABELS[selectedDomain] || "this domain";
  const prompts = [
    `Please ask a bit more detail so I can help better in ${domainText}. Example: "What should I learn first?"`,
    `I need a clearer question for ${domainText}. Try: "Give me a 3-month roadmap with daily tasks."`,
    `Could you expand your question for ${domainText}? Example: "How do I prepare for internship interviews?"`
  ];
  return prompts[askedCount % prompts.length];
}

function makeReplyUnique(reply, question, askedCount) {
  const suffixes = [
    `Action now: write a 1-week plan for "${question}" and follow it day by day.`,
    `Action now: finish one small task today related to "${question}".`,
    `Action now: share your current level for "${question}", and I can customize next steps.`,
    `Action now: set a 45-minute daily slot focused on "${question}".`
  ];

  const suffix = suffixes[askedCount % suffixes.length];
  return `${reply}\n\n${suffix}`;
}

function forceFreshStructure(question, selectedDomain, askedCount) {
  const domain = DOMAIN_LABELS[selectedDomain] || selectedDomain || "this domain";
  const variants = [
    `- Direct answer: For "${question}", in ${domain}, start with one focused topic and one practical output today.
- Example: Learn a concept for 30 minutes, build a mini-task for 30 minutes, then explain it in 3 lines.
- Quick tip: Change your practice focus every 2 days (concept -> project -> interview).`,
    `- Direct answer: For "${question}", split your approach into learning, implementation, and revision.
- Example: Day plan: learn (40m), implement (50m), mock answer practice (20m).
- Quick tip: Use a checklist so each session ends with one measurable result.`,
    `- Direct answer: For "${question}", prioritize depth over many random topics in ${domain}.
- Example: Pick one core topic, build one mini artifact, and review one interview question from it.
- Quick tip: Record 60-second spoken summaries to improve interview clarity.`
  ];
  return variants[askedCount % variants.length];
}

function buildQuestionSpecificFallback(selectedDomain, question, askedCount) {
  const intent = detectIntent(question);
  const base = fallbackAnswer(selectedDomain, question);
  const q = normalizeText(question);
  const words = q.split(" ").filter((w) => w.length > 3);
  const focusWord = words[askedCount % Math.max(words.length, 1)] || "skills";

  const domainTracks = {
    frontend: [
      "Today: build one UI section, tomorrow: connect one API, then deploy on Vercel.",
      "This week: 2 React components, 1 API integration, 1 GitHub README update.",
      "Next milestone: complete one mini project around your question topic."
    ],
    data: [
      "Today: clean one dataset, tomorrow: visualize insights, then write a short conclusion.",
      "This week: one EDA notebook, one ML baseline, one improvement experiment.",
      "Next milestone: publish one project with business interpretation."
    ],
    mbbs: [
      "Today: revise one concept block, tomorrow: solve timed MCQs, then analyze mistakes.",
      "This week: concept revision + question practice + one mock test review cycle.",
      "Next milestone: strengthen weak topics identified from your recent tests."
    ]
  };

  const steps = domainTracks[selectedDomain] || [
    "Today: learn one key concept and apply it in practice."
  ];
  const step = steps[askedCount % steps.length];

  const intentHints = {
    roadmap: "Use a stage-wise roadmap with clear order.",
    projects: "Give project ideas from beginner to advanced with outcomes.",
    resources: "Recommend specific learning resources with usage order.",
    career: "Focus on internship/job execution steps and profile building.",
    timeline: "Give a realistic timeline with weekly effort assumptions.",
    salary: "Explain salary range with skill-level dependency.",
    skills: "List exact must-have skills in priority order.",
    interview: "Include interview prep strategy and common question areas.",
    general: "Give practical next actions based on the selected domain."
  };

  return `- Direct answer: For "${question}", focus on ${focusWord}. ${intentHints[intent]} ${base}
- Example: ${step}
- Quick tip: Track progress weekly and move from beginner to intermediate only after mini-task completion.`;
}

export default function Roadmap() {
  const [domain, setDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [, setError] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [lastAiReply, setLastAiReply] = useState("");
  const [questionCountMap, setQuestionCountMap] = useState({});
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (domain) {
      const saved = localStorage.getItem(`roadmap_progress_${domain}`);
      if (saved) setCompletedSteps(JSON.parse(saved));
      else setCompletedSteps([]);
    }
  }, [domain]);

  const toggleStep = (title) => {
    setCompletedSteps(prev => {
      const next = prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title];
      localStorage.setItem(`roadmap_progress_${domain}`, JSON.stringify(next));
      return next;
    });
  };

  const generateRoadmap = async (selectedDomain) => {
    const finalDomain = selectedDomain || customDomain;
    if (!finalDomain) return;
    
    setDomain(finalDomain);
    setShowChat(false);
    setMessages([]);
    setChatHistory([]);
    setQuestionCountMap({});
    setError("");
    setRoadmap(null);
    setIsGeneratingRoadmap(true);

    try {
      const data = await generateRoadmapAI({ role: DOMAIN_LABELS[finalDomain] || finalDomain });
      setRoadmap(Array.isArray(data.roadmap) ? data.roadmap : FALLBACK_ROADMAPS[finalDomain] || FALLBACK_ROADMAPS.frontend);
    } catch (err) {
      setRoadmap(FALLBACK_ROADMAPS[finalDomain] || FALLBACK_ROADMAPS.frontend);
      setError("");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleChat = async () => {
    const question = chatInput.trim();
    if (!question || isReplying) return;
    const normalizedQuestion = normalizeText(question);
    const askedCount = (questionCountMap[normalizedQuestion] || 0) + 1;

    const userMessage = { role: "user", text: question };
    const updatedHistory = [...chatHistory, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsReplying(true);
    setError("");

    if (isTooShortQuestion(question)) {
      const aiMessage = {
        role: "ai",
        text: shortQuestionPrompt(domain, askedCount)
      };
      setMessages((prev) => [...prev, aiMessage]);
      setChatHistory((prev) => [...prev, userMessage, aiMessage]);
      setLastAiReply(aiMessage.text);
      setQuestionCountMap((prev) => ({
        ...prev,
        [normalizedQuestion]: askedCount
      }));
      setIsReplying(false);
      return;
    }

    try {
      const intent = detectIntent(question);
      let reply = (await mentorChatAI({
        role: DOMAIN_LABELS[domain] || domain,
        roadmap: JSON.stringify(roadmap),
        history: updatedHistory.slice(-8),
        question,
        intent
      })).reply;

      if (isNearDuplicateAgainstRecent(reply, updatedHistory)) {
        reply = (await mentorChatAI({
          role: DOMAIN_LABELS[domain] || domain,
          roadmap: JSON.stringify(roadmap),
          history: updatedHistory.slice(-8),
          question: `${question} (give a clearly different and highly specific answer than your previous reply)`,
          intent
        })).reply;
      }

      if (!isRelevantToQuestion(question, reply)) {
        reply = (await mentorChatAI({
          role: DOMAIN_LABELS[domain] || domain,
          roadmap: JSON.stringify(roadmap),
          history: updatedHistory.slice(-8),
          question: `${question} (mention key terms and answer only this ask)`,
          intent
        })).reply;
      }

      if (isNearDuplicateAgainstRecent(reply, updatedHistory)) {
        reply = forceFreshStructure(question, domain, askedCount);
      } else if (lastAiReply && isNearDuplicate(reply, lastAiReply)) {
        reply = makeReplyUnique(reply, question, askedCount);
      }

      if (!isRelevantToQuestion(question, reply)) {
        reply = buildQuestionSpecificFallback(domain, question, askedCount);
      }

      const aiMessage = { role: "ai", text: reply };
      setMessages((prev) => [...prev, aiMessage]);
      setChatHistory([...updatedHistory, aiMessage]);
      setLastAiReply(reply);
      setQuestionCountMap((prev) => ({
        ...prev,
        [normalizedQuestion]: askedCount
      }));
    } catch (err) {
      const fallback = buildQuestionSpecificFallback(domain, question, askedCount);
      const variedFallback =
        lastAiReply && isNearDuplicate(fallback, lastAiReply)
          ? makeReplyUnique(fallback, question, askedCount)
          : fallback;
      const aiMessage = { role: "ai", text: variedFallback };
      setMessages((prev) => [...prev, aiMessage]);
      setChatHistory([...updatedHistory, aiMessage]);
      setLastAiReply(aiMessage.text);
      setQuestionCountMap((prev) => ({
        ...prev,
        [normalizedQuestion]: askedCount
      }));
      setError("");
    } finally {
      setIsReplying(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'intermediate': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'advanced': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default: return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1c] to-black text-white p-6 pt-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            AI Career Roadmap
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Discover your personalized learning path dynamically generated using AI.
          </p>
        </div>

        {!roadmap && !isGeneratingRoadmap && (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-center">Select or type your domain</h2>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {['Frontend', 'Backend', 'Data Science', 'AI/ML', 'MBBS', 'Cybersecurity'].map(preset => (
                <button
                  key={preset}
                  onClick={() => generateRoadmap(preset.toLowerCase())}
                  className="px-5 py-2.5 rounded-full bg-slate-700/50 hover:bg-purple-600/50 border border-slate-600 hover:border-purple-400 transition-all duration-300 shadow-sm"
                >
                  {preset}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 max-w-md mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LucideIcons.Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="e.g. UPSC Preparation, Law, Android..."
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-slate-200"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateRoadmap()}
              />
              <button 
                onClick={() => generateRoadmap()}
                className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {isGeneratingRoadmap && (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-purple-500 mb-6"
            />
            <p className="text-xl text-purple-300 font-medium animate-pulse">
              Crafting your {domain} roadmap...
            </p>
          </div>
        )}

        {roadmap && !showChat && (
          <div className="max-w-3xl mx-auto mt-8 relative pb-20">
            <button 
              onClick={() => { setRoadmap(null); setDomain(""); }}
              className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <LucideIcons.ArrowLeft className="w-4 h-4" /> Back to Domains
            </button>
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold capitalize bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                {domain} Path
              </h2>
              <div className="bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700 text-sm font-medium">
                <span className="text-purple-400">{completedSteps.length}</span> / {roadmap.length} Completed
              </div>
            </div>

            <div className="relative border-l-2 border-slate-800 ml-4 md:ml-8 space-y-8">
              {roadmap.map((step, idx) => {
                const isCompleted = completedSteps.includes(step.title);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15, duration: 0.5, ease: "easeOut" }}
                    className="relative pl-8 md:pl-12"
                  >
                    <div 
                      className={`absolute -left-[17px] top-1 rounded-full p-2 border-4 border-[#0a0f1c] z-10 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      {isCompleted ? (
                        <LucideIcons.Check className="w-4 h-4 text-white" />
                      ) : (
                        <DynamicIcon name={step.icon} className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className={`group bg-slate-800/30 backdrop-blur-sm border ${isCompleted ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-slate-700 hover:border-purple-500/50'} p-6 rounded-2xl transition-all duration-300`}>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                        <div>
                          <h3 className={`text-xl font-bold ${isCompleted ? 'text-emerald-400 line-through opacity-70' : 'text-slate-100'}`}>
                            {step.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full border ${getDifficultyColor(step.difficulty)}`}>
                            {step.difficulty || "Level"}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-slate-400 leading-relaxed ${isCompleted ? 'opacity-60' : ''}`}>
                        {step.description}
                      </p>
                      
                      <div className="mt-6 flex items-center justify-between">
                        <button 
                          onClick={() => toggleStep(step.title)}
                          className={`flex items-center gap-2 text-sm font-medium transition-colors ${isCompleted ? 'text-slate-500 hover:text-slate-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        >
                          {isCompleted ? <><LucideIcons.RotateCcw className="w-4 h-4" /> Mark Incomplete</> : <><LucideIcons.CheckCircle className="w-4 h-4" /> Mark as Done</>}
                        </button>
                        
                        <button 
                          onClick={() => { setChatInput(`Tell me more about ${step.title}`); setShowChat(true); }}
                          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          Learn More <LucideIcons.ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: roadmap.length * 0.15 + 0.3 }}
              className="mt-12 text-center"
            >
              <button
                onClick={() => setShowChat(true)}
                className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 mx-auto transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                <LucideIcons.MessageSquare className="w-5 h-5" /> Chat with AI Avatar
              </button>
            </motion.div>
          </div>
        )}

        {showChat && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh]"
          >
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <LucideIcons.Bot className="w-6 h-6 text-purple-400" /> AI Avatar for {domain}
              </h3>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white p-2">
                <LucideIcons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 my-8">
                  <LucideIcons.MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Ask anything about your roadmap or learning journey.</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-tr-sm"
                        : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isReplying && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Ask about ${domain}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 text-white placeholder-slate-400"
                />
                <button
                  onClick={handleChat}
                  disabled={isReplying || !chatInput.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-5 rounded-xl transition-colors flex items-center justify-center text-white"
                >
                  <LucideIcons.Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}