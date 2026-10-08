# Moyo AI Chatbot
HTML, CSS, JavaScript와 Node.js/Express로 만든 간단한 AI 챗봇입니다. 브라우저가 현재 대화 이력을 보관하고 매 요청에 함께 전송하므로 데이터베이스 없이도 앞선 대화 맥락을 반영합니다.
## 로컬 실행
```bash
npm install
cp .env.example .env
```
`.env`의 `OPENAI_API_KEY`를 실제 키로 바꾼 뒤 실행합니다.
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`을 엽니다.
## Vercel 배포
1. 이 프로젝트를 Git 저장소에 올리고 Vercel에서 가져옵니다.
2. Vercel 프로젝트의 **Settings → Environment Variables**에 `OPENAI_API_KEY`를 추가합니다.
3. 배포합니다. `vercel.json`이 Express 앱과 정적 파일을 함께 제공합니다.
> API 키를 `public/` 파일이나 Git 저장소에 넣지 마세요.
