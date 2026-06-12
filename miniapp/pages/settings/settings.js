var api = require('../../utils/api.js')

Page({
  data: {
    testResult: '',
    testResultType: ''
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
