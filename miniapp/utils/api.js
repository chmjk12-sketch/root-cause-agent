/**
 * API 封装 - 模拟器用假数据，真机调用云托管
 * 策略：先检测是否在真机，否就用假数据
 */

var CLOUD_ENV = 'prod-d4gdb3koxd4c6f555'
var SERVICE_NAME = 'flask-1c4n'

/**
 * 检测是否在真机上（callContainer 只在真机可用）
 */
function isRealDevice() {
  try {
    var sys = wx.getSystemInfoSync()
    return sys.platform === 'ios' || sys.platform === 'android'
  } catch (e) {
    return false
  }
}

/**
 * 通用请求封装
 */
function callContainer(path, method, data) {
  method = method || 'GET'

  // 模拟器：直接返回假数据，不搞 callContainer
  if (!isRealDevice()) {
    console.log('[API] 模拟器模式，返回假数据:', path)
    return Promise.resolve(getMockData(path, data))
  }

  // 真机：用 wx.cloud.callContainer
  return new Promise(function(resolve, reject) {
    var params = {
      config: { env: CLOUD_ENV },
      path: path,
      method: method,
      header: {
        'X-WX-SERVICE': SERVICE_NAME,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      params.data = data
    }
    wx.cloud.callContainer(params)
      .then(function(res) {
        resolve(res.data)
      })
      .catch(function(err) {
        console.error('[callContainer Error]', path, err)
        resolve(getMockData(path, data))
      })
  })
}

/**
 * 模拟器假数据
 */
function getMockData(path, data) {
  if (path === '/analyze-full-sync') {
    return {
      success: true,
      report: {
        markdown: '### 模拟分析结果\n\n这是模拟器中的测试数据。\n\n- 真机体验才会调用真实 AI 分析。\n- 请点击「预览」在手机上体验完整功能。',
        title: (data && data.problem) || '测试问题'
      }
    }
  }
  if (path === '/reports' && method === 'GET') {
    return { success: true, reports: [] }
  }
  if (path === '/health') {
    return { status: 'ok', version: '1.0.0' }
  }
  return { success: true }
}

module.exports = {
  analyzeFullSync: function(problem) {
    return callContainer('/analyze-full-sync', 'POST', { problem: problem })
  },
  getReports: function() {
    return callContainer('/reports')
  },
  getReport: function(id) {
    return callContainer('/reports/' + id)
  },
  createReport: function(data) {
    return callContainer('/reports', 'POST', data)
  },
  toggleStar: function(id) {
    return callContainer('/reports/' + id + '/star', 'PATCH')
  },
  deleteReport: function(id) {
    return callContainer('/reports/' + id, 'DELETE')
  },
  clearReports: function() {
    return callContainer('/reports', 'DELETE')
  },
  healthCheck: function() {
    return callContainer('/health')
  }
}
