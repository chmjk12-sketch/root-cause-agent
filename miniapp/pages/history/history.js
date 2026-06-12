var api = require('../../utils/api.js')

Page({
  data: {
    list: [],
    loading: false
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    this.setData({ loading: true })
    api.getReports()
      .then(res => {
        if (res && res.success) {
          this.setData({ list: res.reports || [] })
        }
        this.setData({ loading: false })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  viewDetail(e) {
    var id = e.currentTarget.dataset.id
    var item = this.data.list.find(function(i) { return i.id === id })
    if (item) {
      getApp().globalData.currentResult = {
        markdown: item.markdown || '',
        title: item.title || '根因分析报告',
        time: item.time || ''
      }
      wx.navigateTo({ url: '/pages/result/result' })
    }
  },

  toggleStar(e) {
    var id = e.currentTarget.dataset.id
    var that = this
    api.toggleStar(id)
      .then(function() {
        that.loadHistory()
      })
  },

  deleteItem(e) {
    var id = e.currentTarget.dataset.id
    var that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: function(res) {
        if (res.confirm) {
          api.deleteReport(id)
            .then(function() {
              that.loadHistory()
              wx.showToast({ title: '已删除', icon: 'success' })
            })
        }
      }
    })
  },

  clearAll() {
    var that = this
    wx.showModal({
      title: '清空历史',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      success: function(res) {
        if (res.confirm) {
          api.clearReports()
            .then(function() {
              that.setData({ list: [] })
              wx.showToast({ title: '已清空', icon: 'success' })
            })
        }
      }
    })
  }
})
