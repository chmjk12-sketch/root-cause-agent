/**
 * API 封装 - 纯本地模式
 * 所有接口返回本地假数据，不发起任何网络请求
 * 真机打包时再替换为真实 callContainer 调用
 */

// 本地存储的历史记录 key
var STORAGE_KEY = 'analysisHistory'

/**
 * 模拟 AI 分析（纯本地，带 loading 延迟模拟）
 */
function analyzeFullSync(problem) {
  return new Promise(function(resolve) {
    // 模拟 1.5 秒延迟
    setTimeout(function() {
      var mockMarkdown = generateMockReport(problem)
      resolve({
        success: true,
        report: {
          markdown: mockMarkdown,
          title: problem
        }
      })
    }, 1500)
  })
}

/**
 * 生成模拟报告
 */
function generateMockReport(problem) {
  return '### 📊 根因分析报告\n\n' +
    '**分析问题：** ' + problem + '\n\n' +
    '---\n\n' +
    '### 1. 问题定位\n\n' +
    '根据描述，该问题的核心根因可能来自以下几个维度：\n\n' +
    '- **流程层面**：现有流程中存在断点，导致信息传递不及时\n' +
    '- **工具层面**：使用的工具未能有效支撑协作需求\n' +
    '- **人员层面**：角色职责不够清晰，响应机制不健全\n\n' +
    '---\n\n' +
    '### 2. 建议措施\n\n' +
    '1. **建立定期同步机制**：建议每周固定时间进行进度对齐\n' +
    '2. **明确责任分工**：为每个环节指定唯一负责人\n' +
    '3. **引入协作工具**：使用统一的文档/任务管理平台\n\n' +
    '---\n\n' +
    '> 💡 这是模拟数据。真机体验将调用真实 AI 分析。'
}

/**
 * 获取历史记录
 */
function getReports() {
  return new Promise(function(resolve) {
    var list = wx.getStorageSync(STORAGE_KEY) || []
    resolve({ success: true, reports: list })
  })
}

/**
 * 保存报告到本地
 */
function createReport(data) {
  return new Promise(function(resolve) {
    var list = wx.getStorageSync(STORAGE_KEY) || []
    var item = {
      id: Date.now().toString(),
      title: data.title || '未命名分析',
      markdown: data.markdown || '',
      time: new Date().toLocaleString('zh-CN'),
      starred: false
    }
    list.unshift(item)
    wx.setStorageSync(STORAGE_KEY, list.slice(0, 100))
    resolve({ success: true, report: item })
  })
}

/**
 * 切换收藏状态
 */
function toggleStar(id) {
  return new Promise(function(resolve) {
    var list = wx.getStorageSync(STORAGE_KEY) || []
    var item = list.find(function(r) { return r.id === id })
    if (item) {
      item.starred = !item.starred
      wx.setStorageSync(STORAGE_KEY, list)
    }
    resolve({ success: true })
  })
}

/**
 * 删除单条记录
 */
function deleteReport(id) {
  return new Promise(function(resolve) {
    var list = wx.getStorageSync(STORAGE_KEY) || []
    list = list.filter(function(r) { return r.id !== id })
    wx.setStorageSync(STORAGE_KEY, list)
    resolve({ success: true })
  })
}

/**
 * 清空所有记录
 */
function clearReports() {
  return new Promise(function(resolve) {
    wx.removeStorageSync(STORAGE_KEY)
    resolve({ success: true })
  })
}

/**
 * 健康检查（本地始终返回 ok）
 */
function healthCheck() {
  return new Promise(function(resolve) {
    resolve({ status: 'ok', version: '1.0.0-local' })
  })
}

module.exports = {
  analyzeFullSync: analyzeFullSync,
  getReports: getReports,
  getReport: function(id) { return Promise.resolve({}) },
  createReport: createReport,
  toggleStar: toggleStar,
  deleteReport: deleteReport,
  clearReports: clearReports,
  healthCheck: healthCheck
}
