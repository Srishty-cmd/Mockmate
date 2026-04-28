import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveInterviewHistory, interviewStep, parseResume } from "../utils/api";
import * as LucideIcons from "lucide-react";

const TOTAL_QUESTIONS = 5;

function AnimatedInterviewer({ speaking }) {
  const [blink, setBlink] = useState(false);
  const [lookLeft, setLookLeft] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 2600 + Math.floor(Math.random() * 1800));

    const gazeInterval = setInterval(() => {
      setLookLeft((prev) => !prev);
    }, 1800);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(gazeInterval);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#172554_0%,#020617_60%,#000_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(59,130,246,0.10),rgba(168,85,247,0.06),transparent)]" />
      <div className="relative z-10 flex flex-col items-center">
        <div className={`w-56 h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 shadow-2xl border-4 border-slate-600/50 relative overflow-hidden transition-transform duration-300 ${speaking ? "scale-[1.02]" : "scale-100"}`}>
          <div className={`absolute top-[35%] left-[28%] w-8 bg-white rounded-full border border-slate-500 overflow-hidden transition-all duration-150 ${blink ? "h-1.5" : "h-6"}`}>
            <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-900 transition-all duration-300 ${lookLeft ? "left-1" : "right-1"}`} />
          </div>
          <div className={`absolute top-[35%] right-[28%] w-8 bg-white rounded-full border border-slate-500 overflow-hidden transition-all duration-150 ${blink ? "h-1.5" : "h-6"}`}>
            <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-900 transition-all duration-300 ${lookLeft ? "left-1" : "right-1"}`} />
          </div>
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-3 h-8 rounded-full bg-slate-500/70" />
          <div className={`absolute left-1/2 -translate-x-1/2 top-[66%] bg-slate-900 rounded-full transition-all duration-150 ${speaking ? "w-14 h-7" : "w-10 h-2"}`} />
        </div>
      </div>
    </div>
  );
}

function getEffectiveLevel(manualLevel, parsedResume) {
  if (!parsedResume) return manualLevel;
  if (parsedResume.resumeStrength === "strong") return "intermediate";
  if (parsedResume.resumeStrength === "early") return "beginner";
  return manualLevel;
}

export default function Interview() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("beginner");
  const [resumeFile, setResumeFile] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `00:${m}:${s}`;
  };
  const progressPercent = Math.min((questionCount / TOTAL_QUESTIONS) * 100, 100);

  const answeredPairs = [];
  for (let i = 0; i < history.length - 1; i += 1) {
    if (history[i].role === "ai" && history[i + 1].role === "user") {
      answeredPairs.push({
        question: history[i].text,
        answer: history[i + 1].text
      });
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera permission denied.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const speak = (text) => {
    if (!text) return;
    const speech = new SpeechSynthesisUtterance(text);
    setSpeaking(true);
    speech.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(speech);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i += 1) {
          transcript += `${event.results[i][0].transcript} `;
        }
        setAnswer(transcript.trim());
      };
    }

    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  const endInterview = () => {
    stopCamera();
    stopListening();
    window.speechSynthesis.cancel();
    navigate("/roadmap");
  };

  const handleResumeSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx"].includes(extension)) {
      setError("Only PDF and DOCX resumes are supported.");
      return;
    }

    if (!domain) {
      setError("Please select a domain before uploading resume.");
      return;
    }

    setResumeFile(file);
    setParsedResume(null);
    setParsingResume(true);
    setError("");

    try {
      const data = await parseResume(file, domain);
      setParsedResume(data.parsedResume || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Resume parsing failed.");
    } finally {
      setParsingResume(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setParsedResume(null);
  };

  const startInterview = async () => {
    if (!domain) return;
    setLoading(true);
    setError("");
    try {
      const currentLevel = getEffectiveLevel(level, parsedResume);
      const data = await interviewStep({
        role: domain,
        level: currentLevel,
        history: [],
        isFinal: false,
        parsedResume,
        hasResume: Boolean(parsedResume)
      });
      setQuestion(data.nextQuestion);
      setHistory([{ role: "ai", text: data.nextQuestion }]);
      setQuestionCount(1);
      setStarted(true);
      setTimerActive(true);
      setTimeElapsed(0);
      setAnswer("");
      await startCamera();

      const speechText = data.acknowledgment ? `${data.acknowledgment} ${data.nextQuestion}` : data.nextQuestion;
      speak(speechText);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start interview.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !question || loading) return;
    setLoading(true);
    setError("");
    stopListening();
    try {
      const currentLevel = getEffectiveLevel(level, parsedResume);
      const updatedHistory = [...history, { role: "user", text: answer }];
      setHistory(updatedHistory);
      setAnswer("");

      if (questionCount < TOTAL_QUESTIONS) {
        const data = await interviewStep({
          role: domain,
          level: currentLevel,
          history: updatedHistory,
          isFinal: false,
          parsedResume,
          hasResume: Boolean(parsedResume)
        });
        setQuestion(data.nextQuestion);
        setHistory([...updatedHistory, { role: "ai", text: data.nextQuestion }]);
        setQuestionCount((prev) => prev + 1);

        const speechText = data.acknowledgment ? `${data.acknowledgment} ${data.nextQuestion}` : data.nextQuestion;
        speak(speechText);
      } else {
        setTimerActive(false);
        const reportData = await interviewStep({
          role: domain,
          level: currentLevel,
          history: updatedHistory,
          isFinal: true,
          parsedResume,
          hasResume: Boolean(parsedResume)
        });
        const qaPairs = [];
        for (let i = 0; i < updatedHistory.length - 1; i += 1) {
          const current = updatedHistory[i];
          const next = updatedHistory[i + 1];
          if (current.role === "ai" && next.role === "user") {
            qaPairs.push({
              question: current.text,
              answer: next.text
            });
          }
        }

        const report = {
          role: domain,
          score: reportData.score,
          confidence: reportData.confidence,
          communication: reportData.communication,
          strengths: reportData.strengths,
          weaknesses: reportData.weaknesses,
          suggestions: reportData.suggestions,
          qaPairs
        };

        localStorage.setItem("report", JSON.stringify(report));
        await saveInterviewHistory(report);
        stopCamera();
        navigate("/feedback");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not process answer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => {
    stopCamera();
    window.speechSynthesis.cancel();
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans flex flex-col">
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b1220] to-black">
          <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold">Professional Interview Room</h1>
                <p className="text-slate-400 mt-2">Adaptive AI interview with resume-aware personalized questioning.</p>
              </div>
              <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                <LucideIcons.Briefcase className="w-7 h-7 text-purple-300" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-slate-100 font-semibold">Resume Upload</h3>
                    <p className="text-slate-400 text-sm mt-1">Upload PDF or DOCX for personalized interview questions.</p>
                  </div>
                  <LucideIcons.FileText className="w-5 h-5 text-purple-300 mt-1" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium cursor-pointer transition-colors">
                    <LucideIcons.Upload className="w-4 h-4" />
                    {resumeFile ? "Replace Resume" : "Upload Resume"}
                    <input type="file" accept=".pdf,.docx" onChange={handleResumeSelect} className="hidden" disabled={parsingResume || loading} />
                  </label>
                  {resumeFile && (
                    <button type="button" onClick={removeResume} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm">
                      <LucideIcons.Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                {resumeFile && (
                  <div className="mt-4 text-sm bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <p className="text-slate-200 font-medium">{resumeFile.name}</p>
                    <p className="text-slate-400 mt-1">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                    {parsingResume ? (
                      <p className="text-purple-300 mt-2 flex items-center gap-2">
                        <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing resume...
                      </p>
                    ) : parsedResume ? (
                      <p className="text-emerald-300 mt-2">
                        Parsed successfully: {parsedResume.skills?.slice(0, 4).join(", ") || "profile extracted"}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  if (resumeFile) {
                    setParsedResume(null);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-colors"
              >
                <option value="">Select domain (required)</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="data science">Data Science</option>
                <option value="ai/ml">AI/ML</option>
                <option value="core">Core</option>
              </select>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-colors"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                onClick={startInterview}
                disabled={loading || !domain || parsingResume}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 p-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? <LucideIcons.Loader2 className="w-5 h-5 animate-spin" /> : "Start Interview"}
              </button>
              <p className="text-xs text-slate-400">Flow: Upload Resume (optional) -> Select Domain -> Start Interview</p>
            </div>
            {error && <p className="text-red-400 mt-6 text-sm">{error}</p>}
          </div>
        </div>
      )}

      {started && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold hidden md:block text-slate-200">Professional Interview Room</h1>
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-bold tracking-widest">LIVE</span>
                <span className="text-slate-300 text-sm ml-2 font-mono">{formatTime(timeElapsed)}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-slate-400">Progress</span>
              <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-sm text-slate-300 font-medium">{questionCount}/{TOTAL_QUESTIONS}</span>
            </div>
            <button onClick={endInterview} className="bg-red-600/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <LucideIcons.PhoneOff className="w-4 h-4" /> Leave
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 overflow-hidden bg-[#0b111e]">
            <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-lg overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                  <LucideIcons.MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-200">Current Question</h2>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Question {questionCount} of {TOTAL_QUESTIONS}</span>
                <p className="text-slate-200 leading-relaxed font-medium">{question}</p>
              </div>
              {answeredPairs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Answers</h3>
                  {answeredPairs.map((item, index) => (
                    <div key={`${index}-${item.question}`} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">Q{index + 1}</p>
                      <p className="text-slate-300 text-sm mb-2">{item.question}</p>
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Your answer</p>
                      <p className="text-slate-200 text-sm leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
              {error && <p className="text-red-400 text-sm mt-auto bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
            </div>

            <div className="md:col-span-6 bg-black border border-slate-800 rounded-2xl relative flex items-center justify-center shadow-2xl overflow-hidden group">
              <div className="w-full h-full max-h-[60vh] md:max-h-none">
                <AnimatedInterviewer speaking={speaking} />
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 z-10">
                <LucideIcons.Volume2 className={`w-4 h-4 ${speaking ? "text-emerald-400" : "text-slate-500"}`} />
                {speaking && (
                  <div className="flex gap-1 h-3 items-center">
                    <div className="w-1 h-full bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1 h-2/3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1 h-4/5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 z-10 border border-slate-700">
                <div className={`w-2.5 h-2.5 rounded-full ${speaking ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-purple-500"}`} />
                <div>
                  <div className="font-semibold text-slate-100 text-sm">AI Interviewer</div>
                  <div className="text-[10px] text-slate-400 font-medium">Host</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="bg-black border border-slate-800 rounded-2xl h-48 md:h-1/2 relative overflow-hidden shadow-lg">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror-mode" style={{ transform: "scaleX(-1)" }} />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs flex items-center gap-2 border border-slate-700">
                  <LucideIcons.Camera className="w-3 h-3 text-emerald-400" />
                  <span className="text-slate-300">Camera is on</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-sm font-medium text-slate-200">You</span>
                </div>
              </div>

              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center items-center text-center shadow-lg">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                  <LucideIcons.ShieldCheck className="w-8 h-8 text-emerald-500/70" />
                </div>
                <h3 className="text-slate-200 font-medium mb-2">Interview Guidelines</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-3">Use concise STAR-style answers. Speak clearly and keep examples practical.</p>
                <div className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">Tip: start with context, then action, then measurable outcome.</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border-t border-slate-800 p-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-3 w-full justify-center">
                <button
                  onClick={toggleListening}
                  className={`h-14 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${listening ? "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20" : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:text-white"}`}
                >
                  {listening ? <><LucideIcons.MicOff className="w-5 h-5" /> Stop Voice</> : <><LucideIcons.Mic className="w-5 h-5" /> Voice Input</>}
                </button>

                <button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="h-14 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <LucideIcons.Loader2 className="w-5 h-5 animate-spin" /> : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
