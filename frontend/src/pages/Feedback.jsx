import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInterviewHistory } from "../utils/api";
import { jsPDF } from "jspdf";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const KPI_META = [
  { key: "score", label: "Overall Score", accent: "text-violet-300", bar: "bg-violet-500" },
  { key: "confidence", label: "Confidence", accent: "text-emerald-300", bar: "bg-emerald-500" },
  { key: "communication", label: "Communication", accent: "text-sky-300", bar: "bg-sky-500" }
];

export default function Feedback() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  // 🧠 Get data safely
  const data = JSON.parse(localStorage.getItem("report")) || {};

  const {
    role = "Selected Role",
    score = 0,
    confidence = 0,
    communication = 0,
    strengths = [],
    weaknesses = [],
    suggestions = [],
    qaPairs = []
  } = data;

  const overallPercent = Math.round(((score + confidence + communication) / 30) * 100);

  useEffect(() => {
    getInterviewHistory()
      .then((res) => setHistory(res.history || []))
      .catch(() => setHistory([]));
  }, []);

  const chartData = [...history]
    .reverse()
    .slice(-10)
    .map((item, idx) => ({
      attempt: idx + 1,
      score: item.score,
      confidence: item.confidence,
      communication: item.communication
    }));

  const activeQaPairs =
    qaPairs.length > 0 ? qaPairs : history[0]?.qaPairs || [];

  const getRatingLabel = (value) => {
    if (value >= 8) return "Excellent";
    if (value >= 6) return "Good";
    if (value >= 4) return "Average";
    return "Needs Work";
  };

  const downloadInterviewPdf = () => {
    const doc = new jsPDF();
    let y = 15;
    const lineHeight = 7;
    const maxWidth = 180;

    doc.setFontSize(16);
    doc.text("AI Voice Interview Report", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Role: ${role}`, 14, y);
    y += lineHeight;
    doc.text(`Score: ${score}/10 | Confidence: ${confidence}/10 | Communication: ${communication}/10`, 14, y);
    y += 10;

    doc.setFontSize(13);
    doc.text("Questions and Answers", 14, y);
    y += 8;

    if (!activeQaPairs.length) {
      doc.setFontSize(11);
      doc.text("No Q&A data available.", 14, y);
    } else {
      activeQaPairs.forEach((item, index) => {
        const qLines = doc.splitTextToSize(`Q${index + 1}: ${item.question}`, maxWidth);
        const aLines = doc.splitTextToSize(`A${index + 1}: ${item.answer}`, maxWidth);

        if (y > 265) {
          doc.addPage();
          y = 15;
        }

        doc.setFontSize(11);
        doc.text(qLines, 14, y);
        y += qLines.length * lineHeight;
        doc.text(aLines, 14, y);
        y += aLines.length * lineHeight + 4;
      });
    }

    doc.save("interview-report.pdf");
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interview Assessment Report</p>
              <h1 className="text-3xl md:text-4xl font-semibold mt-2">Performance Feedback</h1>
              <p className="text-slate-400 mt-3">
                Role: <span className="text-slate-200 font-medium capitalize">{role}</span>
              </p>
            </div>
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 min-w-40 text-center">
              <p className="text-xs uppercase tracking-wider text-violet-300">Overall Rating</p>
              <p className="text-3xl font-bold text-violet-200 mt-1">{overallPercent}%</p>
              <p className="text-sm text-violet-300/80 mt-1">{getRatingLabel((score + confidence + communication) / 3)}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KPI_META.map((metric) => {
            const value = data[metric.key] || 0;
            return (
              <div key={metric.key} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className={`text-3xl font-semibold mt-2 ${metric.accent}`}>{value}/10</p>
                <div className="mt-4 h-2 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-2 rounded-full ${metric.bar}`}
                    style={{ width: `${Math.min(100, value * 10)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-slate-100">Performance Trend</h2>
            <p className="text-sm text-slate-400 mt-1">Last 10 attempts across score, confidence, and communication.</p>
            {chartData.length < 2 ? (
              <p className="text-slate-400 mt-8">Complete at least 2 interviews to view trend chart.</p>
            ) : (
              <div className="h-80 mt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="attempt" stroke="#94a3b8" />
                    <YAxis domain={[0, 10]} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "10px",
                        color: "#e2e8f0"
                      }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="confidence" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="communication" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
            <h2 className="text-xl font-semibold">Action Center</h2>
            <p className="text-sm text-slate-400">Use these actions to continue practice or export this report.</p>
            <button
              onClick={() => navigate("/interview")}
              className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-3 text-sm font-semibold transition-colors"
            >
              Retake Interview
            </button>
            <button
              onClick={downloadInterviewPdf}
              className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-3 text-sm font-semibold transition-colors"
            >
              Download PDF Report
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="text-lg font-semibold text-emerald-300">Strengths</h3>
            {strengths.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {strengths.map((s, i) => (
                  <li key={i} className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mt-3">No strengths recorded.</p>
            )}
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <h3 className="text-lg font-semibold text-rose-300">Areas to Improve</h3>
            {weaknesses.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {weaknesses.map((w, i) => (
                  <li key={i} className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">{w}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mt-3">No major weaknesses reported.</p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="text-lg font-semibold text-amber-300">Recommendations</h3>
            {suggestions.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {suggestions.map((s, i) => (
                  <li key={i} className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mt-3">No recommendations available.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Interview Questions and Answers</h2>
          <p className="text-sm text-slate-400 mt-1">Detailed transcript from your latest attempt.</p>
          {activeQaPairs.length === 0 ? (
            <p className="text-slate-400 mt-4">No questions saved for this attempt.</p>
          ) : (
            <div className="space-y-4 mt-5">
              {activeQaPairs.map((item, idx) => (
                <article key={`${idx}-${item.question.slice(0, 10)}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-violet-300 font-medium">Question {idx + 1}</p>
                  <p className="text-slate-100 mt-1">{item.question}</p>
                  <p className="text-sky-300 font-medium mt-4">Your Answer</p>
                  <p className="text-slate-300 mt-1">{item.answer}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Previous Attempts</h2>
          <p className="text-sm text-slate-400 mt-1">Recent interview history with scores and timestamps.</p>
          {history.length === 0 ? (
            <p className="text-slate-400 mt-4">No history available yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="text-left py-3 pr-4 font-medium">Role</th>
                    <th className="text-left py-3 pr-4 font-medium">Date</th>
                    <th className="text-left py-3 pr-4 font-medium">Score</th>
                    <th className="text-left py-3 pr-4 font-medium">Confidence</th>
                    <th className="text-left py-3 font-medium">Communication</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item._id} className="border-b border-slate-900 text-slate-200">
                      <td className="py-3 pr-4 capitalize">{item.role}</td>
                      <td className="py-3 pr-4 text-slate-400">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="py-3 pr-4">{item.score}/10</td>
                      <td className="py-3 pr-4">{item.confidence}/10</td>
                      <td className="py-3">{item.communication}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}