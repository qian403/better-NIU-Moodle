// Background script for NIU Moodle Helper
'use strict';

// 預設配置
const DEFAULT_CONFIG = {
  enableAutoCheckStatement: true,
  enableAssignmentHighlight: true,
  clickDelay: 300
};

// 安全的 storage API 檢查
const storage = (() => {
  try {
    return chrome?.storage?.sync || browser?.storage?.sync;
  } catch (error) {
    console.warn('Storage API 不可用:', error);
    return null;
  }
})();

// 安全的 runtime API 檢查
const runtime = (() => {
  try {
    return chrome?.runtime || browser?.runtime;
  } catch (error) {
    console.warn('Runtime API 不可用:', error);
    return null;
  }
})();

// 安全的 tabs API 檢查
const tabs = (() => {
  try {
    return chrome?.tabs || browser?.tabs;
  } catch (error) {
    console.warn('Tabs API 不可用:', error);
    return null;
  }
})();

// 初始化預設設定
if (runtime && storage) {
  runtime.onInstalled.addListener(async (details) => {
    try {
      // 檢查是否已有設定，如果沒有則設定預設值
      const result = await storage.get(['niuMoodleConfig']);
      if (!result.niuMoodleConfig) {
        await storage.set({ niuMoodleConfig: DEFAULT_CONFIG });
        console.log('NIU Moodle Helper: 已初始化預設設定');
      }
    } catch (error) {
      console.error('初始化設定失敗:', error);
    }
  });
}

// 監聽來自 content script 的訊息
if (runtime) {
  runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!storage) {
      sendResponse(DEFAULT_CONFIG);
      return;
    }

    if (request.action === 'getConfig') {
      storage.get(['niuMoodleConfig']).then(result => {
        const config = result.niuMoodleConfig || DEFAULT_CONFIG;
        // 安全地驗證配置
        const sanitizedConfig = {};
        for (const key of Object.keys(DEFAULT_CONFIG)) {
          if (key in config) {
            sanitizedConfig[key] = config[key];
          }
        }
        sendResponse({ ...DEFAULT_CONFIG, ...sanitizedConfig });
      }).catch(error => {
        console.error('獲取設定失敗:', error);
        sendResponse(DEFAULT_CONFIG);
      });
      return true; // 保持訊息通道開啟以進行異步回應
    }
  });
}

// 監聽標籤頁更新
if (tabs) {
  tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        tab.url && 
        tab.url.includes('euni.niu.edu.tw')) {
      // 標籤頁載入完成，content script 會自動處理
      console.log('NIU Moodle Helper: 檢測到 Moodle 頁面載入完成');
    }
  });
}
