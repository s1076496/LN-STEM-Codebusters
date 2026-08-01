const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const quoteCache = [];
let currentQuote = null;
let currentCipherText = "";
let currentCipherLetters = [];
let cipherToPlain = new Map();
let startTime = null;
let timerInterval = null;

const authorEl = document.getElementById("author");
const charCountEl = document.getElementById("char-count");
const timerEl = document.getElementById("timer");
const cipherDisplayEl = document.getElementById("cipher-display");
const solverGridEl = document.getElementById("solver-grid");
const feedbackEl = document.getElementById("feedback");
const newQuoteBtn = document.getElementById("new-quote-btn");
const checkBtn = document.getElementById("check-btn");
const minCharInput = document.getElementById("min-char");
const maxCharInput = document.getElementById("max-char");

function shuffle(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function normalizeText(text) {
  return text.toUpperCase();
}

function encryptQuote(plaintext) {
  const letters = plaintext.toUpperCase().split("");
  const shuffledAlphabet = shuffle(alphabet.split(""));
  const plainToCipher = new Map(
    alphabet.split("").map((letter, index) => [letter, shuffledAlphabet[index]])
  );

  return letters
    .map((character) => {
      if (/[A-Z]/.test(character)) {
        return plainToCipher.get(character);
      }
      return character;
    })
    .join("");
}

function buildSolverRows(cipherText) {
  const uniqueLetters = Array.from(new Set(cipherText.split("").filter((char) => /[A-Z]/.test(char))));
  return uniqueLetters;
}

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now();
  updateTimer();
  timerInterval = window.setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (!startTime) {
    timerEl.textContent = "00:00";
    return;
  }

  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  timerEl.textContent = `${minutes}:${seconds}`;
}

function stopTimer() {
  clearInterval(timerInterval);
}

function formatElapsedTime(elapsedSeconds) {
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getNextUnfilledInput(startIndex) {
  const allInputs = Array.from(cipherDisplayEl.querySelectorAll(".quote-input"));
  const afterCurrent = allInputs.slice(startIndex + 1).find((field) => !field.value);
  if (afterCurrent) {
    return afterCurrent;
  }
  const wrapped = allInputs.find((field) => !field.value);
  if (wrapped) {
    return wrapped;
  }
  return allInputs[0] || null;
}

function updateHighlighting() {
  const allInputs = Array.from(cipherDisplayEl.querySelectorAll(".quote-input"));
  const plaintextToCipherLetters = new Map();

  allInputs.forEach((field) => {
    if (!field.value) {
      return;
    }

    const cipherLetter = field.dataset.cipherLetter;
    const assignedCipherLetters = plaintextToCipherLetters.get(field.value) || new Set();
    assignedCipherLetters.add(cipherLetter);
    plaintextToCipherLetters.set(field.value, assignedCipherLetters);
  });

  allInputs.forEach((field) => {
    const assignedCipherLetters = plaintextToCipherLetters.get(field.value) || new Set();
    const isDuplicate = Boolean(field.value && assignedCipherLetters.size > 1);
    field.classList.toggle("is-duplicate", isDuplicate);
  });
}

function renderDisplay() {
  const parts = currentCipherText.split("");
  const frequencyMap = new Map();

  parts.forEach((character) => {
    if (/[A-Z]/.test(character)) {
      frequencyMap.set(character, (frequencyMap.get(character) || 0) + 1);
    }
  });

  cipherDisplayEl.innerHTML = "";
  let currentWord = null;

  const finalizeWord = () => {
    if (currentWord) {
      cipherDisplayEl.appendChild(currentWord);
      currentWord = null;
    }
  };

  parts.forEach((character) => {
    if (/[A-Z]/.test(character)) {
      if (!currentWord) {
        currentWord = document.createElement("div");
        currentWord.className = "quote-word";
      }

      const tile = document.createElement("div");
      tile.className = "quote-tile";

      const label = document.createElement("span");
      label.className = "cipher-label";
      label.textContent = character;

      const count = document.createElement("span");
      count.className = "cipher-count";
      count.textContent = frequencyMap.get(character);

      const input = document.createElement("input");
      input.className = "quote-input";
      input.type = "text";
      input.maxLength = 1;
      input.inputMode = "text";
      input.setAttribute("aria-label", `Decrypt ${character}`);
      input.dataset.cipherLetter = character;
      input.value = cipherToPlain.get(character) || "";

      const updateValue = (sourceInput, value) => {
        sourceInput.value = value;
        if (value) {
          cipherToPlain.set(character, value);
        } else {
          cipherToPlain.delete(character);
        }

        const matchingInputs = cipherDisplayEl.querySelectorAll(
          `.quote-input[data-cipher-letter="${character}"]`
        );
        matchingInputs.forEach((field) => {
          field.value = value;
        });

        feedbackEl.textContent = "";
        feedbackEl.className = "feedback";
        updateHighlighting();
      };

      input.addEventListener("input", (event) => {
        const value = event.target.value.toUpperCase().replace(/[^A-Z]/g, "");
        updateValue(event.target, value);

        if (!value) {
          return;
        }

        const allInputs = Array.from(cipherDisplayEl.querySelectorAll(".quote-input"));
        const currentIndex = allInputs.indexOf(event.target);
        const nextInput = getNextUnfilledInput(currentIndex);
        if (nextInput) {
          nextInput.focus();
        }
      });

      input.addEventListener("focus", (event) => {
        const allInputs = Array.from(cipherDisplayEl.querySelectorAll(".quote-input"));
        allInputs.forEach((field) => {
          const isMatch = field.dataset.cipherLetter === event.target.dataset.cipherLetter;
          field.classList.toggle("is-active", field === event.target);
          field.classList.toggle("is-matching", isMatch);
        });
        updateHighlighting();
      });

      input.addEventListener("blur", () => {
        const allInputs = Array.from(cipherDisplayEl.querySelectorAll(".quote-input"));
        allInputs.forEach((field) => {
          field.classList.remove("is-active", "is-matching");
        });
        updateHighlighting();
      });

      input.addEventListener("keydown", (event) => {
        const allInputs = Array.from(cipherDisplayEl.querySelectorAll(".quote-input"));
        const currentIndex = allInputs.indexOf(event.target);
        const previousInput = allInputs[currentIndex - 1];
        const nextInput = allInputs[currentIndex + 1];

        if (event.key === "Enter") {
          event.preventDefault();
          checkSolution();
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          if (previousInput) {
            previousInput.focus();
          }
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          if (nextInput) {
            nextInput.focus();
          }
          return;
        }

        if (event.key !== "Backspace") {
          return;
        }

        event.preventDefault();
        if (event.target.value) {
          updateValue(event.target, "");
          if (previousInput) {
            previousInput.focus();
          }
          return;
        }

        if (previousInput) {
          previousInput.focus();
        }
      });

      tile.appendChild(label);
      tile.appendChild(count);
      tile.appendChild(input);
      currentWord.appendChild(tile);
    } else if (/\s/.test(character)) {
      finalizeWord();
      const space = document.createElement("span");
      space.className = "quote-space";
      cipherDisplayEl.appendChild(space);
    } else {
      finalizeWord();
      const span = document.createElement("span");
      span.className = "quote-static";
      span.textContent = character;
      cipherDisplayEl.appendChild(span);
    }
  });

  finalizeWord();
}

function buildPuzzle(quote) {
  currentQuote = quote;
  currentCipherText = encryptQuote(quote.content);
  currentCipherLetters = buildSolverRows(currentCipherText);
  cipherToPlain = new Map();
  authorEl.textContent = quote.author || "Unknown";
  charCountEl.textContent = quote.character_count_excluding_spaces || "—";
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  renderDisplay();
  startTimer();
}

function checkSolution() {
  if (!currentQuote) {
    return;
  }

  const missingLetters = currentCipherLetters.filter((cipherLetter) => !cipherToPlain.has(cipherLetter));
  if (missingLetters.length) {
    feedbackEl.textContent = "Fill in each cipher letter before checking the solution.";
    feedbackEl.className = "feedback error";
    return;
  }

  const decodedText = currentCipherText
    .split("")
    .map((character) => {
      if (/[A-Z]/.test(character)) {
        return cipherToPlain.get(character);
      }
      return character;
    })
    .join("");

  if (normalizeText(decodedText) === normalizeText(currentQuote.content)) {
    stopTimer();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const elapsedTime = formatElapsedTime(elapsedSeconds);
    feedbackEl.textContent = `Correct! You solved it in ${elapsedTime}.`;
    feedbackEl.className = "feedback success";
    Swal.fire({
      title: "Solved!",
      html: `<strong>Quote:</strong> ${currentQuote.content}<br><br><strong>Author:</strong> ${currentQuote.author || "Unknown"}<br><strong>Time:</strong> ${elapsedTime}`,
      icon: "success",
      confirmButtonText: "Great!"
    });
  } else {
    feedbackEl.textContent = "Not quite yet. Review your substitutions and try again.";
    feedbackEl.className = "feedback error";
  }
}

async function loadQuotes() {
  const response = await fetch("./quotes.json");
  if (!response.ok) {
    throw new Error(`Unable to load quotes: ${response.status}`);
  }
  const data = await response.json();
  quoteCache.push(...data);
  return data;
}

function getFilteredQuotes() {
  const minChar = Number(minCharInput.value);
  const maxChar = Number(maxCharInput.value);

  return quoteCache.filter((quote) => {
    const count = Number(quote.character_count_excluding_spaces);
    if (!Number.isFinite(count)) {
      return false;
    }
    if (Number.isFinite(minChar) && minChar > 0 && count < minChar) {
      return false;
    }
    if (Number.isFinite(maxChar) && maxChar > 0 && count > maxChar) {
      return false;
    }
    return true;
  });
}

function pickRandomQuote() {
  const filteredQuotes = getFilteredQuotes();
  if (!filteredQuotes.length) {
    throw new Error("No quotes match the selected character range.");
  }

  const quote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  return quote;
}

async function init() {
  await loadQuotes();
  buildPuzzle(pickRandomQuote());
}

newQuoteBtn.addEventListener("click", () => {
  buildPuzzle(pickRandomQuote());
});
checkBtn.addEventListener("click", checkSolution);
[minCharInput, maxCharInput].forEach((input) => {
  input.addEventListener("change", () => {
    if (!quoteCache.length) {
      return;
    }
    buildPuzzle(pickRandomQuote());
  });
});

init().catch((error) => {
  feedbackEl.textContent = error.message;
  feedbackEl.className = "feedback error";
});
