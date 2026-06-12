App({
  onLaunch() {
    // 初始化云托管（必须在调用 callContainer 前执行一次）
    wx.cloud.init()
  },

  globalData: {
    currentResult: null
  }
})
