var api = require('../../utils/api.js')

Page({
  data: {
    problem: '',
    loading: false,
    loadingText: '正在分析...'
  },

  onProblemInput(e) {
    this.setData({ problem: e.detail.value })
  },

  async startAnalysis() {
    var problem = this.data.problem.trim()
    if (!problem) {
      wx.showToast({ title: '请输入问题描述', icon: 'none' })
      return
    }
    if (problem.length < 5) {
      wx.showToast({ title: '描述太短，请详细一点', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      var result = await api.analyzeFullSync(problem)
      if (result && result.success) {
        getApp().globalData.currentResult = {
          markdown: result.report.markdown,
          title: result.report.title || problem,
          time: new Date().toLocaleString('zh-CN')
        }
        // 同时保存到本地历史
        api.createReport({
          title: result.report.title || problem,
          markdown: result.report.markdown
        })
        wx.navigateTo({ url: '/pages/result/result' })
      } else {
        wx.showToast({ title: '分析失败，请重试', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '分析失败: ' + (err.message || err), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onShow() {
    // 每次回到首页，清空输入框（可选）
  }
})
