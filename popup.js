document.addEventListener('DOMContentLoaded', async function() {
  'use strict';

  const autoCheckToggle = document.getElementById('autoCheckToggle');
  const highlightToggle = document.getElementById('highlightToggle');
  const autoUploadToggle = document.getElementById('autoUploadToggle');
  const status = document.getElementById('status');

  // 預設配置
  const defaultConfig = {
    enableAutoCheckStatement: true,
    enableAssignmentHighlight: true,
    enableAutoUpload: true,
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

  // 載入當前設定
  async function loadSettings() {
    if (!storage) {
      showStatus('Storage API 不可用', 'error');
      return;
    }

    try {
      const result = await storage.get(['niuMoodleConfig']);
      const config = result.niuMoodleConfig || defaultConfig;
      
      // 安全地驗證配置
      const sanitizedConfig = {};
      for (const key of Object.keys(defaultConfig)) {
        if (key in config) {
          sanitizedConfig[key] = config[key];
        }
      }
      const finalConfig = { ...defaultConfig, ...sanitizedConfig };
      
      autoCheckToggle.classList.toggle('active', finalConfig.enableAutoCheckStatement);
      highlightToggle.classList.toggle('active', finalConfig.enableAssignmentHighlight);
      autoUploadToggle.classList.toggle('active', finalConfig.enableAutoUpload);
    } catch (error) {
      console.error('載入設定失敗:', error);
      showStatus('載入設定失敗', 'error');
    }
  }

  // 儲存設定
  async function saveSettings(config) {
    if (!storage) {
      showStatus('Storage API 不可用', 'error');
      return;
    }

    try {
      // 安全地驗證配置
      const sanitizedConfig = {};
      for (const key of Object.keys(defaultConfig)) {
        if (key in config) {
          sanitizedConfig[key] = config[key];
        }
      }
      
      await storage.set({ niuMoodleConfig: { ...defaultConfig, ...sanitizedConfig } });
      showStatus('設定已儲存', 'success');
    } catch (error) {
      console.error('儲存設定失敗:', error);
      showStatus('儲存失敗', 'error');
    }
  }

  // 顯示狀態訊息
  function showStatus(message, type = 'success') {
    if (!status) return;
    
    status.textContent = message;
    status.style.color = type === 'error' ? '#e74c3c' : '#27ae60';
    status.style.opacity = '1';
    
    setTimeout(() => {
      if (status) {
        status.style.opacity = '0';
        setTimeout(() => {
          if (status) status.textContent = '';
        }, 300);
      }
    }, 2000);
  }

  // 安全的切換功能
  function createToggleHandler(toggleElement, configKey) {
    return async function() {
      if (!storage) {
        showStatus('Storage API 不可用', 'error');
        return;
      }

      try {
        const isActive = toggleElement.classList.contains('active');
        toggleElement.classList.toggle('active');
        
        const result = await storage.get(['niuMoodleConfig']);
        const config = result.niuMoodleConfig || defaultConfig;
        config[configKey] = !isActive;
        
        await saveSettings(config);
      } catch (error) {
        console.error('切換設定失敗:', error);
        showStatus('切換失敗', 'error');
        // 恢復原始狀態
        toggleElement.classList.toggle('active');
      }
    };
  }

  // 綁定事件監聽器
  if (autoCheckToggle) {
    autoCheckToggle.addEventListener('click', createToggleHandler(autoCheckToggle, 'enableAutoCheckStatement'));
  }

  if (highlightToggle) {
    highlightToggle.addEventListener('click', createToggleHandler(highlightToggle, 'enableAssignmentHighlight'));
  }

  if (autoUploadToggle) {
    autoUploadToggle.addEventListener('click', createToggleHandler(autoUploadToggle, 'enableAutoUpload'));
  }

  // 初始化
  try {
    await loadSettings();
  } catch (error) {
    console.error('初始化失敗:', error);
    showStatus('初始化失敗', 'error');
  }
});
