import api from '../../utils/api'

Page({
  data: {
    problem: '',
    analyzing: false
  },

  onInput(e) {
    this.setData({ problem: e.detail.value })
  },

  startAnalysis() {
    const problem = this.data.problem.trim()
    if (!problem) return
    if (this.data.analyzing) return

    this.setData({ analyzing: true })

    api.analyzeFullSync(problem)
      .then(res => {
        this.setData({ analyzing: false })
        if (res && res.success && res.report) {
          // 通过 globalData 传递数据，避免 URL 超长
          getApp().globalData.currentResult = {
            markdown: res.report.markdown || '',
            title: res.report.title || problem,
            time: new Date().toLocaleString('zh-CN')
          }
          wx.navigateTo({ url: '/pages/result/result' })
        } else {
          wx.showToast({ title: res.error || '分析失败', icon: 'none' })
        }
      })
      .catch(err => {
        this.setData({ analyzing: false })
        wx.showToast({ title: err.message, icon: 'none' })
      })
  }
})
