const DEFAULT_REMAINING_TIME = 30 * 1000;

let intervalId = null;
let todayRemainingTime = DEFAULT_REMAINING_TIME;
const youtubeTabsSet = new Set();

function isYoutubeUrl(url) {
  return url.includes("youtube.com");
}

function resetTracking() {
  console.log("Resetting tracking");
  todayRemainingTime = DEFAULT_REMAINING_TIME;
  clearInterval(intervalId);
  intervalId = null;
}

function startTracking() {
  console.log("Starting tracking");
  if (!intervalId) {
    intervalId = setInterval(() => {
      todayRemainingTime -= 1000;
      console.log("🚀 ~ todayRemainingTime:", todayRemainingTime);
      if (todayRemainingTime <= 0) {
        resetTracking();
        console.log("Time's up! Blocking Youtube");
      }
    }, 1000);
  }
}

function stopTracking() {
  console.log("Stopping tracking");
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (youtubeTabsSet.has(activeInfo.tabId)) {
    startTracking();
  } else {
    stopTracking();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isYoutubeUrl(tab.url)) {
    if (changeInfo.status === "complete") {
      youtubeTabsSet.add(tabId);
      startTracking();
    }
  } else {
    youtubeTabsSet.delete(tabId);
    stopTracking();
  }
});
