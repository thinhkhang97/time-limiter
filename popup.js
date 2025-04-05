// popup.js

const limitInput = document.getElementById("limit-input");
const saveButton = document.getElementById("save-button");
const remainingTimeDisplay = document.getElementById("remaining-time");
const currentLimitDisplay = document.getElementById("current-limit");
const saveStatusDisplay = document.getElementById("save-status");

// Format seconds into minutes and seconds string
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "N/A";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

// Load current settings when the popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["dailyLimit", "todayRemainingTime"], (result) => {
    const limit = result.dailyLimit || 60; // Default to 60 if not set
    const remainingTime = result.todayRemainingTime || 0; // Default to 0

    limitInput.value = limit; // Set input field to current limit
    currentLimitDisplay.textContent = `${limit} min`;
    remainingTimeDisplay.textContent = formatTime(remainingTime / 1000);

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

  chrome.storage.local.set({ dailyLimit: newLimit }, () => {
    console.log(`New daily limit saved: ${newLimit} minutes`);
    currentLimitDisplay.textContent = `${newLimit} min`; // Update display immediately
    saveStatusDisplay.textContent = "Limit Saved!";
    saveStatusDisplay.style.color = "green";

    // Clear the status message after a few seconds
    setTimeout(() => {
      saveStatusDisplay.textContent = "";
    }, 2000);
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    // Check if 'timeSpentToday' was one of the changed items
    if (changes.todayRemainingTime) {
      const todayRemainingTime = changes.todayRemainingTime.newValue || 0;
      console.log(
        `Storage changed: todayRemainingTime updated to ${todayRemainingTime}s`
      );
      // Update the display in the popup immediately
      remainingTimeDisplay.textContent = formatTime(todayRemainingTime / 1000);
    }
    // You could also listen for changes to dailyLimit if needed,
    // though the input field might become out of sync if changed elsewhere.
    if (changes.dailyLimit) {
      const newLimitValue = changes.dailyLimit.newValue || 60;
      console.log(
        `Storage changed: dailyLimit updated to ${newLimitValue} min`
      );
      currentLimitDisplay.textContent = `${newLimitValue} min`;
    }
  }
});
