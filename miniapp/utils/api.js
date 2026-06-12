/**
 * API 封装 - 使用微信云托管内部通信
 * 免公网域名、免备案、免配置域名白名单
 *
 * 前置条件：app.js 中已调用 wx.cloud.init()
 *
 * 配置项（从云托管控制台获取）：
 *   CLOUD_ENV   = 'prod-d4gdb3koxd4c6f555'   // 云托管环境ID
 *   SERVICE_NAME = 'flask-1c4n'                // 云托管服务名称
 */

const CLOUD_ENV = 'prod-d4gdb3koxd4c6f555'
const SERVICE_NAME = 'flask-1c4n'

/**
 * 通用请求封装
 */
function callContainer(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const params = {
      config: { env: CLOUD_ENV },
      path,
      method,
      header: {
        'X-WX-SERVICE': SERVICE_NAME,
        'Content-Type': 'application/json'
      }
    }
    // AI 分析可能耗时较长，设置超时为 120 秒
    params.timeout = 120000
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      params.data = data
    }
    wx.cloud.callContainer(params)
      .then(res => {
        // res.data 是接口返回的完整响应体
        resolve(res.data)
      })
      .catch(err => {
        console.error('[API Error]', path, err)
        reject(new Error(err.errMsg || '请求失败'))
      })
  })
}

/** 提交问题进行分析（同步返回完整报告） */
export function analyzeFullSync(problem) {
  return callContainer('/analyze-full-sync', 'POST', { problem })
}

/** 获取历史报告列表 */
export function getReports() {
  return callContainer('/reports')
}

/** 获取单条报告 */
export function getReport(id) {
  return callContainer(`/reports/${id}`)
}

/** 创建报告 */
export function createReport(data) {
  return callContainer('/reports', 'POST', data)
}

/** 切换收藏 */
export function toggleStar(id) {
  return callContainer(`/reports/${id}/star`, 'PATCH')
}

/** 删除报告 */
export function deleteReport(id) {
  return callContainer(`/reports/${id}`, 'DELETE')
}

/** 清空所有报告 */
export function clearReports() {
  return callContainer('/reports', 'DELETE')
}

/** 健康检查 */
export function healthCheck() {
  return callContainer('/health')
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
