const DEFAULT_DAILY_LIMIT = 60 * 60 * 1.5;
const BLOCKED_URL = chrome.runtime.getURL("blocked.html");

const state = {
  dailyLimit: DEFAULT_DAILY_LIMIT,
  spentTime: 0,
  socialMediaTabsSet: new Set(),
  currentDay: getTodayString(),
  intervalId: null,
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled");
  chrome.storage.local.set({
    currentDay: getTodayString(),
    dailyLimit: DEFAULT_DAILY_LIMIT,
    spentTime: 0,
  });
});

async function initialize() {
  console.log("loading state");

  const dailyLimitResult = await chrome.storage.local.get("dailyLimit");
  state.dailyLimit = dailyLimitResult.dailyLimit || DEFAULT_DAILY_LIMIT;

  const spentTimeResult = await chrome.storage.local.get("spentTime");
  state.spentTime = spentTimeResult.spentTime || 0;

  const currentDayResult = await chrome.storage.local.get("currentDay");
  const today = getTodayString();
  state.currentDay = currentDayResult.currentDay || today;
  await chrome.storage.local.set({
    currentDay: today,
  });

  console.log("loaded state");
}

async function start() {
  await initialize();

  chrome.runtime.onStartup.addListener(() => {
    console.log("onStartup");
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log("onActivated", activeInfo);
    if (state.currentDay !== getTodayString()) {
      resetTracking();
      chrome.storage.local.set({
        currentDay: getTodayString(),
      });
    }
    if (state.socialMediaTabsSet.has(activeInfo.tabId)) {
      startTracking();
    } else {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (isSocialMediaUrl(tab.url)) {
          state.socialMediaTabsSet.add(tab.id);
          startTracking();
        } else {
          stopTracking();
        }
      });
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (isSocialMediaUrl(tab.url)) {
      if (changeInfo.status === "complete") {
        state.socialMediaTabsSet.add(tabId);
        startTracking();
      }
    } else {
      state.socialMediaTabsSet.delete(tabId);
      stopTracking();
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log("onChanged", changes, namespace);
    if (namespace === "local") {
      if (changes.dailyLimit) {
        // const spentTime = changes.dailyLimit.oldValue - state.spentTime;
        // let newRemainingTime = changes.dailyLimit.newValue - spentTime;
        // if (newRemainingTime < 0) {
        //   newRemainingTime = 0;
        // }
        // updateUserRemainingTime(newRemainingTime);
        state.dailyLimit = changes.dailyLimit.newValue;
      }
    }
  });
}

function getTodayString() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function isSocialMediaUrl(url) {
  return (
    url.includes("youtube.com") ||
    url.includes("instagram.com") ||
    url.includes("netflix.com") ||
    url.includes("tiktok.com") ||
    url.includes("facebook.com")
  );
}

function updateUserSpentTime(spentTime = 0) {
  state.spentTime = spentTime;
  chrome.storage.local.set({
    spentTime: spentTime,
  });
}

function openBlockedPage() {
  for (const tabId of state.socialMediaTabsSet) {
    chrome.tabs.update(tabId, { url: BLOCKED_URL });
  }
}

function blockUser() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  openBlockedPage();
}

function resetTracking() {
  console.log("Resetting tracking");
  updateUserSpentTime(state.dailyLimit);
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.spentTime = state.dailyLimit;
}

function startTracking() {
  console.log("Starting tracking");

  if (!state.intervalId) {
    state.intervalId = setInterval(() => {
      updateUserSpentTime(state.spentTime + 1);
      if (state.spentTime >= state.dailyLimit) {
        blockUser();
      }
    }, 1000);
  }
}

function stopTracking() {
  console.log("Stopping tracking");
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

start();
