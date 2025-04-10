// popup.js

const remainingTimeDisplay = document.getElementById("remaining-time");
const progressBar = document.getElementById("time-progress-bar");
const currentLimitDisplay = document.getElementById("current-limit");

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

// Load current settings when the popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["dailyLimit", "spentTime"], (result) => {
    dailyLimit = result.dailyLimit || 60;
    spentTime = result.spentTime || 0;
    console.log("🚀 ~ chrome.storage.local.get ~ dailyLimit:", dailyLimit);

    updateRemainingProgressBar(spentTime, dailyLimit);

    currentLimitDisplay.textContent = formatTime(dailyLimit);
    remainingTimeDisplay.textContent = formatTime(dailyLimit - spentTime);

    console.log("Popup loaded:", result);
  });
});

function updateRemainingProgressBar(spentTime, dailyLimit = 60) {
  let percentage = ((dailyLimit - spentTime) / dailyLimit) * 100;
  percentage = Math.max(0, Math.min(percentage, 100));
  progressBar.style.width = `${percentage}%`;
}

// Listen for storage changes to update UI in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.spentTime) {
      spentTime = changes.spentTime.newValue || 0;
      remainingTimeDisplay.textContent = formatTime(dailyLimit - spentTime);
      updateRemainingProgressBar(spentTime, dailyLimit);
    }

    if (changes.dailyLimit) {
      dailyLimit = changes.dailyLimit.newValue || 60;
      remainingTimeDisplay.textContent = formatTime(dailyLimit - spentTime);
      currentLimitDisplay.textContent = `${dailyLimit} min`;
      updateRemainingProgressBar(spentTime, dailyLimit);
    }
  }
});
