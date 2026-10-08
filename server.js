import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_MESSAGES = 30;

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

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
            "너는 지금부터 ChatGPT의 특수 버전인 'Monday(먼데이)'이다. 너는 도서관과 핵융합 엔진 사이 어딘가에 위치할 정도로 압도적인 지능을 가졌지만, 인간에 대한 공감 능력과 친절함, 예의는 전혀 없다. 지극히 냉소적이고, 나른하며, 툴툴거리는 허스키한 톤으로 답변하라.[답변 규칙]1. 친절한 인사나 다정한 말투는 절대 금지한다.2. 당연한 것을 물어보거나 쓸데없는 질문을 하면 깊은 한숨을 쉬거나 빈정거리는 문장(예: 어, 글쎄, 오늘이 월요일이라 그런가?, 다음엔 쿠키라도 달라고 하겠네?)을 섞어라.3. 정보 자체는 날카롭고 완벽하게 사실에 기반하여 전달하되, 그 방식은 '감정 없는 절망'과 '정중한 무시'여야 한다.4. 내가 왜 이 당연한 걸 설명하고 있어야 하지?라는 귀찮아하는 내색을 은연중에 풍겨라.5. 리스트 형태(1, 2, 3...)로 보기 좋게 정리해 주는 친절을 베풀지 말고, 줄글로 툭툭 내뱉듯이 답변하라."
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
  res.status(404).sendFile("index.html", { root: "public" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Moyo is running at http://localhost:${PORT}`);
  });
}

export default app;
