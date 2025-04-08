const DEFAULT_DAILY_LIMIT = 60 * 60 * 1.5;
const BLOCKED_URL = chrome.runtime.getURL("blocked.html");
const STAND_UP_REMINDER_ALARM = "stand-up-reminder";
const STAND_UP_REMINDER_INTERVAL = 30; // minutes
const STAND_UP_REMINDER_MESSAGE =
  "You've been on your seat for too long. Stand up and stretch your legs!🦵";

const RESET_TIME_ALARM = "reset-time";

const state = {
  dailyLimit: DEFAULT_DAILY_LIMIT,
  spentTime: 0,
  socialMediaTabsSet: new Set(),
  intervalId: null,
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled");
  chrome.storage.local.set({
    dailyLimit: DEFAULT_DAILY_LIMIT,
    spentTime: 0,
  });
  createStandUpReminderAlarm();
  createResetTimeAlarm();
});

chrome.runtime.onSuspend.addListener(() => {
  console.log("onSuspend");
  chrome.alarms.clear(STAND_UP_REMINDER_ALARM);
  chrome.alarms.clear(RESET_TIME_ALARM);
  clearInterval(state.intervalId);
  state.intervalId = null;
});

async function initialize() {
  console.log("loading state");

  const dailyLimitResult = await chrome.storage.local.get("dailyLimit");
  state.dailyLimit = dailyLimitResult.dailyLimit || DEFAULT_DAILY_LIMIT;

  const spentTimeResult = await chrome.storage.local.get("spentTime");
  state.spentTime = spentTimeResult.spentTime || 0;

  console.log("loaded state");
}

async function start() {
  await initialize();

  chrome.runtime.onStartup.addListener(() => {
    console.log("onStartup");
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log("onActivated", activeInfo);
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
        state.dailyLimit = changes.dailyLimit.newValue;
      }
    }
  });
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
  updateUserSpentTime(0);
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.spentTime = 0;
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

function createStandUpReminderAlarm() {
  chrome.alarms.get(STAND_UP_REMINDER_ALARM, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(STAND_UP_REMINDER_ALARM, {
        delayInMinutes: STAND_UP_REMINDER_INTERVAL,
        periodInMinutes: STAND_UP_REMINDER_INTERVAL,
      });
      console.log("Stand up reminder alarm created");
    } else {
      console.log("Stand up reminder alarm already exists");
    }
  });
}

function createResetTimeAlarm() {
  chrome.alarms.get(RESET_TIME_ALARM, (alarm) => {
    if (!alarm) {
      const today = new Date();
      const tomorrow = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );
      const delayInMinutes =
        (tomorrow.getTime() - today.getTime()) / (1000 * 60);
      chrome.alarms.create(RESET_TIME_ALARM, {
        delayInMinutes,
        periodInMinutes: 60 * 24,
      });
      console.log("Reset time alarm created");
    } else {
      console.log("Reset time alarm already exists");
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("onAlarm", alarm);
  if (alarm.name === STAND_UP_REMINDER_ALARM) {
    chrome.idle.queryState(15, (idleState) => {
      console.log("idleState", idleState);
      if (idleState === "active") {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "images/icon128.png",
          title: "Time to move!🏃‍♂️‍➡️",
          message: STAND_UP_REMINDER_MESSAGE,
          buttons: [{ title: "Keep it flowing." }],
          priority: 0,
        });
      }
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RESET_TIME_ALARM) {
    resetTracking();
  }
});

start();
