const DEFAULT_REMAINING_TIME = 30 * 1000;

let intervalId = null;
let todayRemainingTime = DEFAULT_REMAINING_TIME;
const youtubeTabsSet = new Set();

function getTodayString() {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
}

function isNewDate() {
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );
  const currentDay = chrome.storage.local.get("currentDay");
  return (
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` !== currentDay
  );
}

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

chrome.runtime.onStartup.addListener(() => {
  if (isNewDate()) {
    resetTracking();
  }
  chrome.storage.local.set({
    currentDay: getTodayString(),
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    currentDay: getTodayString(),
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (youtubeTabsSet.has(activeInfo.tabId)) {
    startTracking();
  } else {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (isYoutubeUrl(tab.url)) {
        youtubeTabsSet.add(tab.id);
        startTracking();
      } else {
        stopTracking();
      }
    });
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
