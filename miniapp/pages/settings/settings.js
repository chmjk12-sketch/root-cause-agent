Page({
  data: {
    storageSize: '0 KB',
    version: '1.0.0-local',
    envId: 'prod-d4gdb3koxd4c6f555',
    serviceName: 'flask-1c4n'
  },

  onShow() {
    this.calcStorageSize()
  },

  calcStorageSize() {
    try {
      var list = wx.getStorageSync('analysisHistory') || []
      var size = JSON.stringify(list).length
      var sizeStr = size < 1024 ? size + ' B' : (size / 1024).toFixed(1) + ' KB'
      this.setData({ storageSize: sizeStr })
    } catch (e) {
      this.setData({ storageSize: '未知' })
    }
  },

  clearCache() {
    var that = this
    wx.showModal({
      title: '清空缓存',
      content: '确定要清空所有本地历史记录吗？',
      success: function(res) {
        if (res.confirm) {
          wx.removeStorageSync('analysisHistory')
          that.setData({ storageSize: '0 KB' })
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  showAbout() {
    wx.showModal({
      title: '关于',
      content: '根因分析 Agent v1.0.0\n\n基于 TRIZ 矛盾矩阵与 FOS 跨界映射的根因分析工具。\n\n当前为本地模拟模式。',
      showCancel: false
    })
  }
})
