// ==UserScript==
// @name         NIU Moodle Helper - Auto Check Statement Only
// @namespace    https://github.com/chien/Better-NIU-Moodle
// @version      1.4.0
// @description  宜蘭大學 Moodle 優化腳本
// @author       CHIEN https://blog.qian30.net
// @match        https://euni.niu.edu.tw/mod/assign/*
// @match        https://euni.niu.edu.tw/course/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';
  
    // 腳本配置設定
    const CONFIG = {
      enableAutoCheckStatement: true,
      enableAssignmentHighlight: true,
      clickDelay: 300
    };
  
    // 全域變數管理
    const state = { };
  
    // 安全地獲取主容器元素
    function getMainContainer() {
      return document.querySelector('#region-main') || document.body;
    }
  
    // 注入作業高亮樣式
    function injectAssignmentHighlightStyles() {
      if (document.getElementById('niu-assignment-highlight-style')) return;
      const style = document.createElement('style');
      style.id = 'niu-assignment-highlight-style';
      style.textContent = `
        .niu-assignment-highlight {
          background-color: #fff3cd !important;
        }
      `;
      document.head.appendChild(style);
    }
  
    // 判斷是否為作業活動
    function isAssignmentActivity(activityInstance) {
      if (!activityInstance || typeof activityInstance.querySelector !== 'function') return false;
      const link = activityInstance.querySelector('a[href*="/mod/assign/view.php"]');
      if (!link) return false;
      const icon = activityInstance.querySelector('img[src*="/assign/"]');
      return Boolean(icon);
    }
  
    // 套用高亮到作業標題
    function highlightAssignments() {
      if (!CONFIG.enableAssignmentHighlight) return;
      const instances = document.querySelectorAll('.activityinstance');
      instances.forEach((inst) => {
        if (!isAssignmentActivity(inst)) return;
        if (inst.classList.contains('niu-assignment-highlight')) return;
        inst.classList.add('niu-assignment-highlight');
      });
    }
  
    // 自動勾智慧財產權聲明的地方
    function autoCheckStatement() {
      const checkbox = document.getElementById('id_submissionstatement');
      if (!checkbox || checkbox.type !== 'checkbox') return false;
      if (!checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }
  
    // 清理所有資源
    // 不再需要清理函式（僅一次性行為）
  
    // 監聽頁面變化（僅用於作業頁面）
    // 不再需要任何 MutationObserver
  
    // 主要執行函數
    function startAutoCheck() {
      if (!CONFIG.enableAutoCheckStatement) return;
      if (!location.pathname.includes('/mod/assign/')) return;
      // 立即嘗試勾選；若失敗，再延遲一次重試
      if (!autoCheckStatement()) {
        setTimeout(autoCheckStatement, CONFIG.clickDelay);
      }
    }
  
    function startAssignmentHighlight() {
      if (!CONFIG.enableAssignmentHighlight) return;
      if (!location.pathname.includes('/course/')) return;
      injectAssignmentHighlightStyles();
      setTimeout(highlightAssignments, 100);
    }
  
    // 頁面卸載時清理
    // 無需 beforeunload 清理
  
    // 啟動腳本
    function initializeScript() {
      startAutoCheck();
      startAssignmentHighlight();
    }
  
    // 根據頁面載入狀態決定何時啟動
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initializeScript();
    } else {
      document.addEventListener('DOMContentLoaded', initializeScript, { once: true });
    }
  })();