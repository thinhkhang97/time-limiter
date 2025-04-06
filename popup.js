// popup.js

const limitInput = document.getElementById("limit-input");
const saveButton = document.getElementById("save-button");
const remainingTimeDisplay = document.getElementById("remaining-time");
const currentLimitDisplay = document.getElementById("current-limit");
const saveStatusDisplay = document.getElementById("save-status");
const progressBar = document.getElementById("time-progress-bar");

let dailyLimit = 60;
let todayRemainingTime = 0;
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
  chrome.storage.local.get(["dailyLimit", "todayRemainingTime"], (result) => {
    dailyLimit = result.dailyLimit || 60;
    todayRemainingTime = result.todayRemainingTime || 0;
    updateRemainingProgessBar(todayRemainingTime, dailyLimit);

    limitInput.value = dailyLimit / 60;
    currentLimitDisplay.textContent = formatTime(dailyLimit);
    remainingTimeDisplay.textContent = formatTime(todayRemainingTime);

    console.log("Popup loaded:", result);
  });
});

// Save the new limit when the button is clicked
saveButton.addEventListener("click", () => {
  const newLimit = parseInt(limitInput.value, 10);

  saveStatusDisplay.textContent = ""; // Clear previous status

  // Basic validation
  if (isNaN(newLimit) || newLimit <= 0) {
    saveStatusDisplay.textContent = "Invalid limit!";
    saveStatusDisplay.style.color = "red";
    return;
  }

  if (newLimit > 120) {
    saveStatusDisplay.textContent = "Limit cannot be greater than 120 minutes!";
    saveStatusDisplay.style.color = "red";
    return;
  }

  if (newLimit < (dailyLimit - todayRemainingTime) / 60) {
    saveStatusDisplay.textContent = `You're already spent ${formatTime(
      dailyLimit - todayRemainingTime
    )} of your limit!`;
    saveStatusDisplay.style.color = "red";
    return;
  }

  chrome.storage.local.set({ dailyLimit: newLimit * 60 }, () => {
    console.log(`New limit saved: ${newLimit} minutes`);
    currentLimitDisplay.textContent = `${formatTime(newLimit * 60)}`; // Update display immediately
    saveStatusDisplay.textContent = "Limit updated!";
    saveStatusDisplay.style.color = "green";

    // Clear the status message after a few seconds
    setTimeout(() => {
      saveStatusDisplay.textContent = "";
    }, 2000);
  });
});

function updateRemainingProgessBar(remainingTime, dailyLimit = 60) {
  let percentage = (remainingTime / dailyLimit) * 100;
  percentage = Math.max(0, Math.min(percentage, 100));
  progressBar.style.width = `${percentage}%`;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    // Check if 'timeSpentToday' was one of the changed items
    if (changes.todayRemainingTime) {
      const todayRemainingTime = changes.todayRemainingTime.newValue || 0;
      // Update the display in the popup immediately
      remainingTimeDisplay.textContent = formatTime(todayRemainingTime);
      updateRemainingProgessBar(todayRemainingTime, dailyLimit);
    }
    // You could also listen for changes to dailyLimit if needed,
    // though the input field might become out of sync if changed elsewhere.
    if (changes.dailyLimit) {
      const newLimitValue = changes.dailyLimit.newValue || 60;
      currentLimitDisplay.textContent = `${newLimitValue} min`;
      updateRemainingProgessBar(todayRemainingTime, newLimitValue);
    }
  }
});
