App({
  onLaunch() {
    // wx.cloud.callContainer 无需提前 init，每次调用时传 config.env 即可
  },

  globalData: {
    currentResult: null
  }
})
