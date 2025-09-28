(function () {
  'use strict';

  // 預設配置
  const DEFAULT_CONFIG = {
    enableAutoCheckStatement: true,
    enableAssignmentHighlight: true,
    enableAutoUpload: true,
    clickDelay: 300
  };

  let currentConfig = { ...DEFAULT_CONFIG };
  let isInitialized = false;
  let styleElement = null;

  // 安全的 storage API 檢查
  const storage = (() => {
    try {
      return chrome?.storage?.sync || browser?.storage?.sync;
    } catch (error) {
      console.warn('Storage API 不可用:', error);
      return null;
    }
  })();

  // 從 storage 載入設定
  async function loadConfig() {
    if (!storage) {
      console.warn('Storage API 不可用，使用預設設定');
      return;
    }

    try {
      const result = await storage.get(['niuMoodleConfig']);
      if (result?.niuMoodleConfig && typeof result.niuMoodleConfig === 'object') {
        // 安全地合併設定，只允許預期的屬性
        const validKeys = Object.keys(DEFAULT_CONFIG);
        const sanitizedConfig = {};
        
        for (const key of validKeys) {
          if (key in result.niuMoodleConfig) {
            sanitizedConfig[key] = result.niuMoodleConfig[key];
          }
        }
        
        currentConfig = { ...DEFAULT_CONFIG, ...sanitizedConfig };
      }
    } catch (error) {
      console.warn('載入設定失敗，使用預設值:', error);
    }
  }

  // 監聽設定變更
  if (storage) {
    try {
      storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.niuMoodleConfig) {
          const newConfig = changes.niuMoodleConfig.newValue;
          if (newConfig && typeof newConfig === 'object') {
            currentConfig = { ...DEFAULT_CONFIG, ...newConfig };
            // 重新執行功能
            if (location.pathname.includes('/course/')) {
              highlightAssignments();
            }
          }
        }
      });
    } catch (error) {
      console.warn('無法監聽設定變更:', error);
    }
  }

  // 注入作業高亮樣式
  function injectAssignmentHighlightStyles() {
    if (styleElement) return;
    
    try {
      styleElement = document.createElement('style');
      styleElement.id = 'niu-assignment-highlight-style';
      styleElement.textContent = `
        .niu-assignment-highlight {
          background-color: #fff3cd !important;
          transition: background-color 0.2s ease;
        }
      `;
      document.head.appendChild(styleElement);
    } catch (error) {
      console.warn('注入樣式失敗:', error);
    }
  }

  // 安全的 DOM 元素檢查
  function isValidElement(element) {
    return element && 
           typeof element === 'object' && 
           element.nodeType === Node.ELEMENT_NODE &&
           typeof element.querySelector === 'function';
  }

  // 判斷是否為作業活動
  function isAssignmentActivity(activityInstance) {
    if (!isValidElement(activityInstance)) return false;
    
    try {
      const link = activityInstance.querySelector('a[href*="/mod/assign/view.php"]');
      if (!link) return false;
      
      const icon = activityInstance.querySelector('img[src*="/assign/"]');
      return Boolean(icon);
    } catch (error) {
      console.warn('檢查作業活動時發生錯誤:', error);
      return false;
    }
  }

  // 套用高亮到作業標題
  function highlightAssignments() {
    if (!currentConfig.enableAssignmentHighlight) return;
    
    try {
      const instances = document.querySelectorAll('.activityinstance');
      let highlightedCount = 0;
      
      instances.forEach((inst) => {
        if (!isAssignmentActivity(inst)) return;
        if (inst.classList.contains('niu-assignment-highlight')) return;
        
        inst.classList.add('niu-assignment-highlight');
        highlightedCount++;
      });
      
      if (highlightedCount > 0) {
        console.log(`NIU Moodle Helper: 已高亮 ${highlightedCount} 個作業`);
      }
    } catch (error) {
      console.warn('套用作業高亮時發生錯誤:', error);
    }
  }

  // 自動勾智慧財產權聲明
  function autoCheckStatement() {
    if (!currentConfig.enableAutoCheckStatement) return false;
    
    try {
      const checkbox = document.getElementById('id_submissionstatement');
      if (!checkbox || 
          checkbox.type !== 'checkbox' || 
          !isValidElement(checkbox)) {
        return false;
      }
      
      if (!checkbox.checked) {
        checkbox.checked = true;
        // 安全地觸發事件
        const changeEvent = new Event('change', { 
          bubbles: true, 
          cancelable: true 
        });
        checkbox.dispatchEvent(changeEvent);
        console.log('NIU Moodle Helper: 已自動勾選智慧財產權聲明');
        return true;
      }
      return true;
    } catch (error) {
      console.warn('自動勾選聲明時發生錯誤:', error);
      return false;
    }
  }

  // 自動點擊上傳按鈕
  function autoClickUploadButton() {
    if (!currentConfig.enableAutoUpload) return false;
    
    try {
      const uploadButton = document.querySelector('input[name="repo_upload_file"]');
      if (!uploadButton || !isValidElement(uploadButton)) {
        return false;
      }
      
      // 模擬點擊上傳按鈕
      uploadButton.click();
      console.log('NIU Moodle Helper: 已自動點擊上傳按鈕');
      return true;
    } catch (error) {
      console.warn('自動點擊上傳按鈕時發生錯誤:', error);
      return false;
    }
  }

  // 監聽拖拽上傳區域的點擊事件
  function setupUploadAreaListener() {
    if (!currentConfig.enableAutoUpload) return;
    
    try {
      const uploadArea = document.querySelector('.dndupload-arrow.d-flex');
      if (!uploadArea || !isValidElement(uploadArea)) {
        return;
      }
      
      // 移除舊的監聽器（如果存在）
      if (uploadArea._niuUploadListener) {
        uploadArea.removeEventListener('click', uploadArea._niuUploadListener);
      }
      
      // 建立新的監聽器
      uploadArea._niuUploadListener = function(event) {
        // 等待一秒後自動點擊上傳按鈕
        setTimeout(() => {
          autoClickUploadButton();
        }, 500);
      };
      
      // 綁定事件監聽器
      uploadArea.addEventListener('click', uploadArea._niuUploadListener);
      console.log('NIU Moodle Helper: 已設定上傳區域監聽器');
    } catch (error) {
      console.warn('設定上傳區域監聽器時發生錯誤:', error);
    }
  }

  // 主要執行函數
  function startAutoCheck() {
    if (!currentConfig.enableAutoCheckStatement) return;
    if (!location.pathname.includes('/mod/assign/')) return;
    
    // 立即嘗試勾選；若失敗，再延遲一次重試
    if (!autoCheckStatement()) {
      setTimeout(() => {
        autoCheckStatement();
      }, currentConfig.clickDelay);
    }
  }

  function startAssignmentHighlight() {
    if (!currentConfig.enableAssignmentHighlight) return;
    if (!location.pathname.includes('/course/')) return;
    
    injectAssignmentHighlightStyles();
    // 使用 requestAnimationFrame 確保 DOM 完全準備好
    requestAnimationFrame(() => {
      setTimeout(highlightAssignments, 100);
    });
  }

  function startAutoUpload() {
    if (!currentConfig.enableAutoUpload) return;
    if (!location.pathname.includes('/mod/assign/')) return;
    
    // 使用 requestAnimationFrame 確保 DOM 完全準備好
    requestAnimationFrame(() => {
      setTimeout(setupUploadAreaListener, 100);
    });
  }

  // 初始化腳本
  async function initializeScript() {
    if (isInitialized) return;
    isInitialized = true;
    
    try {
      await loadConfig();
      startAutoCheck();
      startAssignmentHighlight();
      startAutoUpload();
    } catch (error) {
      console.error('初始化腳本失敗:', error);
    }
  }

  // 防抖動的初始化函數
  let initTimeout = null;
  function debouncedInit() {
    if (initTimeout) clearTimeout(initTimeout);
    initTimeout = setTimeout(initializeScript, 50);
  }

  // 根據頁面載入狀態決定何時啟動
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    debouncedInit();
  } else {
    document.addEventListener('DOMContentLoaded', debouncedInit, { once: true });
  }

  // 監聽頁面可見性變化，確保在頁面重新可見時重新檢查
  if (typeof document.visibilityState !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && isInitialized) {
        // 頁面重新可見時，重新執行功能
        if (location.pathname.includes('/mod/assign/')) {
          autoCheckStatement();
          setupUploadAreaListener();
        } else if (location.pathname.includes('/course/')) {
          highlightAssignments();
        }
      }
    });
  }
})();
