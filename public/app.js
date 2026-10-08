const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const messagesEl = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const clearButton = document.querySelector("#clearButton");
const suggestions = document.querySelectorAll(".suggestions button");

let messages = [];
let loading = false;

function addMessage(role, content, extraClass = "") {
  const message = document.createElement("div");
  message.className = `message ${role} ${extraClass}`.trim();
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  message.appendChild(bubble);
  messagesEl.appendChild(message);
  message.scrollIntoView({ behavior: "smooth", block: "end" });
  return message;
}

function addTyping() {
  const item = addMessage("assistant", "", "typing");
  item.querySelector(".bubble").innerHTML = "<i></i><i></i><i></i>";
  return item;
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

async function sendMessage(text) {
  const cleanText = text.trim();
  if (!cleanText || loading) return;

  loading = true;
  document.body.classList.add("chatting");
  welcome.hidden = true;
  messages.push({ role: "user", content: cleanText });
  addMessage("user", cleanText);
  input.value = "";
  resizeInput();
  sendButton.disabled = true;
  const typing = addTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "요청에 실패했습니다.");
    messages.push({ role: "assistant", content: data.reply });
    typing.remove();
    addMessage("assistant", data.reply);
  } catch (error) {
    typing.remove();
    addMessage("assistant", error.message || "오류가 발생했습니다.");
    messages.pop();
  } finally {
    loading = false;
    sendButton.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", resizeInput);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

suggestions.forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.textContent));
});

clearButton.addEventListener("click", () => {
  messages = [];
  document.body.classList.remove("chatting");
  messagesEl.replaceChildren();
  welcome.hidden = false;
  input.value = "";
  resizeInput();
  input.focus();
});
