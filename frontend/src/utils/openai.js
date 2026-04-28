const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

export function hasOpenAIKey() {
  return Boolean(OPENAI_API_KEY);
}

async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI key");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || "OpenAI request failed");
  }

  const data = await response.json();
  return (data?.output_text || "").trim();
}

function safeParseJson(text, fallbackValue) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return fallbackValue;
    try {
      return JSON.parse(match[0]);
    } catch {
      return fallbackValue;
    }
  }
}

export async function generateInterviewQuestions(domain) {
  const prompt = `
Generate 5 interview questions for ${domain}.
Return strict JSON only in this format:
{"questions":["q1","q2","q3","q4","q5"]}

Rules:
- Questions should go from basic to intermediate.
- Keep each question short and spoken-interview friendly.
`;

  const raw = await callOpenAI(prompt);
  const parsed = safeParseJson(raw, { questions: [] });
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Invalid questions response");
  }
  return parsed.questions.slice(0, 5);
}

export async function evaluateInterviewAnswer({ domain, question, answer }) {
  const prompt = `
You are an interview evaluator for ${domain}.
Evaluate this answer.

Question: ${question}
Answer: ${answer}

Return strict JSON only:
{
  "score": <0-10 integer>,
  "confidence": <0-10 integer>,
  "communication": <0-10 integer>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}

Rules:
- Be strict but fair.
- strengths/weaknesses/suggestions each must have 1-3 items.
`;

  const raw = await callOpenAI(prompt);
  const parsed = safeParseJson(raw, null);
  if (!parsed) throw new Error("Invalid evaluation response");

  return {
    score: Math.max(0, Math.min(10, Number(parsed.score) || 0)),
    confidence: Math.max(0, Math.min(10, Number(parsed.confidence) || 0)),
    communication: Math.max(0, Math.min(10, Number(parsed.communication) || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 3) : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
  };
}

export async function generateFinalInterviewFeedback({ domain, qaPairs, averages }) {
  const prompt = `
Create a final interview feedback report for ${domain}.

Q&A:
${qaPairs.map((item, i) => `${i + 1}. Q: ${item.question}\nA: ${item.answer}`).join("\n\n")}

Average metrics:
score=${averages.score}, confidence=${averages.confidence}, communication=${averages.communication}

Return strict JSON only:
{
  "score": <0-10 integer>,
  "confidence": <0-10 integer>,
  "communication": <0-10 integer>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}
`;

  const raw = await callOpenAI(prompt);
  const parsed = safeParseJson(raw, null);
  if (!parsed) throw new Error("Invalid final feedback response");

  return {
    score: Math.max(0, Math.min(10, Number(parsed.score) || averages.score || 0)),
    confidence: Math.max(0, Math.min(10, Number(parsed.confidence) || averages.confidence || 0)),
    communication: Math.max(0, Math.min(10, Number(parsed.communication) || averages.communication || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 6) : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 6) : []
  };
}
