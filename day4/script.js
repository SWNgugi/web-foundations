const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

const DRAFT_KEY = "day4-draft";
const THEME_KEY = "day4-theme";

function updateCounts() {
  const text = noteText.value;
  const chars = text.length;
  const trimmed = text.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

  charCount.textContent = `${chars} / 200 characters`;
  wordCount.textContent = `${words} words`;

  charCount.classList.remove("warning", "over");
  if (chars > 200) {
    charCount.classList.add("over");
  } else if (chars > 180) {
    charCount.classList.add("warning");
  }
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, noteText.value);
}

function clearAll() {
  noteText.value = "";
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
}

function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

noteText.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});

noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearAll();
  }
});

clearBtn.addEventListener("click", clearAll);

themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
});

// On page load: restore draft and theme, then update the counters
noteText.value = localStorage.getItem(DRAFT_KEY) || "";
applyTheme(localStorage.getItem(THEME_KEY) === "dark");
updateCounts();