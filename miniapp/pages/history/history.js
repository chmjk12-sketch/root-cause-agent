Page({
  data: {
    list: []
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    const history = wx.getStorageSync('analysisHistory') || []
    this.setData({ list: history })
  },

  viewDetail(e) {
    const { id } = e.currentTarget.dataset
    const item = this.data.list.find(i => i.id === id)
    if (item) {
      wx.navigateTo({
        url: `/pages/result/result?markdown=${encodeURIComponent(item.markdown)}&title=${encodeURIComponent(item.title)}`
      })
    }
  },

  toggleStar(e) {
    const { id } = e.currentTarget.dataset
    const history = wx.getStorageSync('analysisHistory') || []
    const idx = history.findIndex(i => i.id === id)
    if (idx > -1) {
      history[idx].starred = !history[idx].starred
      wx.setStorageSync('analysisHistory', history)
      this.loadHistory()
    }
  },

  deleteItem(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条分析记录吗？',
      success: (res) => {
        if (res.confirm) {
          const history = wx.getStorageSync('analysisHistory') || []
          const filtered = history.filter(i => i.id !== id)
          wx.setStorageSync('analysisHistory', filtered)
          this.loadHistory()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  clearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('analysisHistory', [])
          this.loadHistory()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})
