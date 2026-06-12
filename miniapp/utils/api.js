const app = getApp()

function getBaseUrl() {
  let url = app.globalData.apiBaseUrl || wx.getStorageSync('apiBaseUrl') || ''
  return url.replace(/\/+$/, '')
}

function request(path, method = 'GET', data = null) {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    wx.showToast({ title: '请先在设置中配置服务器地址', icon: 'none' })
    return Promise.reject(new Error('API_BASE_URL_NOT_CONFIGURED'))
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + path,
      method,
      data,
      header: { 'Content-Type': 'application/json' },
      timeout: 60000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`网络错误: ${err.errMsg}`))
      }
    })
  })
}

export function analyzeFullSync(problem) {
  return request('/analyze-full-sync', 'POST', { problem })
}

export function getReports() {
  return request('/reports')
}

export function getReport(id) {
  return request(`/reports/${id}`)
}

export function createReport(data) {
  return request('/reports', 'POST', data)
}

export function toggleStar(id) {
  return request(`/reports/${id}/star`, 'PATCH')
}

export function deleteReport(id) {
  return request(`/reports/${id}`, 'DELETE')
}

export function clearReports() {
  return request('/reports', 'DELETE')
}

export function healthCheck() {
  return request('/health')
}

export default {
  analyzeFullSync,
  getReports,
  getReport,
  createReport,
  toggleStar,
  deleteReport,
  clearReports,
  healthCheck
}
