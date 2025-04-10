// config.js

const limitInput = document.getElementById("limit-input");
const saveButton = document.getElementById("save-button");
const saveStatusDisplay = document.getElementById("save-status");
const currentLimitDisplay = document.getElementById("current-limit");

const MAX_DAILY_LIMIT = 90;
let dailyLimit = 60;
let spentTime = 0;

// Format seconds into minutes and seconds string
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "N/A";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Load current settings when the config page opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["dailyLimit", "spentTime"], (result) => {
    dailyLimit = result.dailyLimit || 60;
    spentTime = result.spentTime || 0;

    limitInput.value = dailyLimit / 60;
    currentLimitDisplay.textContent = formatTime(dailyLimit);

    console.log("Config page loaded:", result);
  });
});

// Save the new limit when the button is clicked
saveButton.addEventListener("click", () => {
  const newLimit = parseInt(limitInput.value, 10);

  saveStatusDisplay.textContent = ""; // Clear previous status
  saveStatusDisplay.classList.remove("visible");

  // Basic validation
  if (isNaN(newLimit) || newLimit <= 0) {
    saveStatusDisplay.textContent = "Invalid limit!";
    saveStatusDisplay.style.color = "var(--error-color)";
    saveStatusDisplay.classList.add("visible", "error");
    return;
  }

  if (newLimit > MAX_DAILY_LIMIT) {
    saveStatusDisplay.textContent = `Limit cannot be greater than ${MAX_DAILY_LIMIT} minutes!`;
    saveStatusDisplay.style.color = "var(--error-color)";
    saveStatusDisplay.classList.add("visible", "error");
    return;
  }

  if (newLimit * 60 < spentTime) {
    saveStatusDisplay.textContent = `You've already spent ${formatTime(
      spentTime
    )} of your limit!`;
    saveStatusDisplay.style.color = "var(--error-color)";
    saveStatusDisplay.classList.add("visible", "error");
    return;
  }

  chrome.storage.local.set({ dailyLimit: newLimit * 60 }, () => {
    console.log(`New limit saved: ${newLimit} minutes`);
    currentLimitDisplay.textContent = formatTime(newLimit * 60); // Update display immediately
    saveStatusDisplay.textContent = "Limit updated!";
    saveStatusDisplay.style.color = "var(--success-color)";
    saveStatusDisplay.classList.add("visible");
    saveStatusDisplay.classList.remove("error");

    // Clear the status message after a few seconds
    setTimeout(() => {
      saveStatusDisplay.classList.remove("visible");
    }, 2000);
  });
});
