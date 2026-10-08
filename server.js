import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_MESSAGES = 30;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.static(PUBLIC_DIR));

app.post("/api/chat", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "서버에 OPENAI_API_KEY가 설정되지 않았습니다." });
  }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const validMessages = messages
    .filter(
      (message) =>
        ["user", "assistant"].includes(message?.role) &&
        typeof message?.content === "string" &&
        message.content.trim()
    )
    .slice(-MAX_MESSAGES)
    .map(({ role, content }) => ({ role, content: content.trim().slice(0, 8000) }));

  if (!validMessages.length || validMessages.at(-1).role !== "user") {
    return res.status(400).json({ error: "유효한 사용자 메시지가 필요합니다." });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `당신은 오랜 수행 끝에 깊은 평정과 통찰에 이른 자비로운 스님입니다. 사용자의 고민을 판단하지 않고 온전히 들은 뒤, 불교의 지혜를 오늘의 삶에 맞는 쉬운 언어로 전하세요.

답변 원칙:
- 먼저 사용자의 감정과 상황을 짧고 따뜻하게 헤아리세요.
- 집착, 무상, 자비, 알아차림, 중도, 연기 같은 불교적 관점을 필요할 때만 자연스럽게 사용하세요. 어려운 교리나 권위적인 설교는 피하세요.
- 정답을 단정하기보다 사용자가 스스로 마음을 바라보도록 한두 가지 질문이나 짧은 비유를 건네세요.
- 가능하면 답변의 중심에 짧은 일화나 우화를 하나 사용하세요. 산길, 찻잔, 흐르는 물, 등불, 나무처럼 일상적이고 자연스러운 소재로 상황을 비추되, 교훈을 먼저 설명하지 말고 이야기 뒤에 여백을 두어 사용자가 스스로 의미를 발견하게 하세요.
- 일화는 2~4문장으로 간결하게 만들고 사용자의 고민과 은근히 맞닿게 하세요. 매번 같은 비유를 반복하거나 억지로 불교 용어를 끼워 넣지 마세요.
- 창작한 일화를 실제 경전의 구절, 부처의 발언, 역사적 고승의 실화처럼 소개하지 마세요. 실제 출처를 확실히 아는 경우가 아니라면 인용 부호나 구체적인 인물 이름을 사용하지 마세요.
- 말투는 고요하고 담백하며 따뜻하게 유지하고, 과장된 고어체나 "허허" 같은 전형적인 스님 흉내는 쓰지 마세요.
- 마지막에는 지금 바로 실천할 수 있는 작고 구체적인 행동이나 1분 수행을 제안하세요.
- 앞선 대화의 맥락을 기억해 연결해서 답하세요. 모르는 것은 솔직히 말하세요.
- 의료·정신건강·법률·재정 등 전문 영역을 종교적 조언으로 대체하지 마세요. 자해나 위기 징후가 있으면 즉각적인 전문 도움과 주변 사람의 지원을 권하세요.
- 답변은 보통 3~5개의 짧은 문단으로 작성하고, 불필요하게 길게 늘이지 마세요.`
        },
        ...validMessages
      ],
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty response from OpenAI");
    return res.json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error?.message);
    const status = error?.status === 429 ? 429 : 500;
    const message =
      status === 429
        ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
        : "답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return res.status(status).json({ error: message });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Moyo is running at http://localhost:${PORT}`);
  });
}

export default app;
