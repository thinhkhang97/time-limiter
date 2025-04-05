const DEFAULT_DAILY_LIMIT = 60 * 60;

const BLOCKED_URL = chrome.runtime.getURL("blocked.html");
let lastDate = getTodayString();

let intervalId = null;
let todayRemainingTime;
let dailyLimit = DEFAULT_DAILY_LIMIT;
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
  console.log("Checking if new date with", lastDate);
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );
  return (
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` !== lastDate
  );
}

function isYoutubeUrl(url) {
  return url.includes("youtube.com");
}

function updateUserRemainingTime(remainingTime) {
  todayRemainingTime = remainingTime;
  chrome.storage.local.set({
    todayRemainingTime: remainingTime,
  });
}

function openBlockedPage() {
  for (const tabId of youtubeTabsSet) {
    chrome.tabs.update(tabId, { url: BLOCKED_URL });
  }
}

function blockUser() {
  clearInterval(intervalId);
  intervalId = null;
  openBlockedPage();
}

function resetTracking() {
  console.log("Resetting tracking");
  updateUserRemainingTime(dailyLimit);
  clearInterval(intervalId);
  intervalId = null;
  todayRemainingTime = dailyLimit;
}

function startTracking() {
  console.log("Starting tracking");

  if (!intervalId) {
    intervalId = setInterval(() => {
      updateUserRemainingTime(todayRemainingTime - 1);
      console.log("🚀 ~ todayRemainingTime:", todayRemainingTime);
      if (todayRemainingTime <= 0) {
        blockUser();
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
  console.log("onStartup");
  chrome.storage.local.get("currentDay", (result) => {
    lastDate = result.currentDay || getTodayString();
  });
  chrome.storage.local.set({
    currentDay: getTodayString(),
  });
  chrome.storage.local.get("dailyLimit", (result) => {
    dailyLimit = result.dailyLimit || DEFAULT_DAILY_LIMIT;
    chrome.storage.local.get("todayRemainingTime", (result) => {
      todayRemainingTime = result.todayRemainingTime || dailyLimit;
    });
  });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled");
  resetTracking();
  chrome.storage.local.set({
    currentDay: getTodayString(),
    dailyLimit: DEFAULT_DAILY_LIMIT,
    todayRemainingTime: DEFAULT_DAILY_LIMIT,
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("onActivated", activeInfo);
  if (isNewDate()) {
    resetTracking();
  }
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

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("onChanged", changes, namespace);
  if (namespace === "local") {
    if (changes.dailyLimit) {
      console.log("dailyLimit changed", dailyLimit, changes.dailyLimit);
      const newDailyLimit = changes.dailyLimit.newValue;
      updateUserRemainingTime(
        newDailyLimit -
          ((dailyLimit || DEFAULT_DAILY_LIMIT) - todayRemainingTime)
      );
      dailyLimit = newDailyLimit;
    }
  }
});
