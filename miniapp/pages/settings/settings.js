import api from '../../utils/api'

const app = getApp()

Page({
  data: {
    apiBaseUrl: '',
    testResult: '',
    testResultType: '',
    statusText: '待配置'
  },

  onShow() {
    const savedUrl = wx.getStorageSync('apiBaseUrl') || ''
    this.setData({
      apiBaseUrl: savedUrl,
      statusText: savedUrl ? '已配置' : '待配置'
    })
  },

  onApiBaseUrlInput(e) {
    this.setData({ apiBaseUrl: e.detail.value })
  },

  saveConfig() {
    const url = this.data.apiBaseUrl.replace(/\/+$/, '')
    if (!url) {
      wx.showToast({ title: '请输入服务器地址', icon: 'none' })
      return
    }
    if (!url.startsWith('http')) {
      wx.showToast({ title: '地址需以 http:// 或 https:// 开头', icon: 'none' })
      return
    }
    wx.setStorageSync('apiBaseUrl', url)
    app.globalData.apiBaseUrl = url
    wx.showToast({ title: '配置已保存', icon: 'success' })
    this.setData({ statusText: '已配置' })
  },

  testConnection() {
    wx.showLoading({ title: '测试中...' })
    api.healthCheck()
      .then(res => {
        wx.hideLoading()
        if (res && res.status === 'ok') {
          this.setData({
            testResult: `✅ 连接成功, 版本 ${res.version || 'unknown'}`,
            testResultType: 'success'
          })
        } else {
          this.setData({
            testResult: `❌ 响应异常: ${JSON.stringify(res)}`,
            testResultType: 'error'
          })
        }
      })
      .catch(err => {
        wx.hideLoading()
        this.setData({
          testResult: `❌ 连接失败: ${err.message}`,
          testResultType: 'error'
        })
      })
  }
})
