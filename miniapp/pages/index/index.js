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
        console.log('Analysis result:', res)
        this.setData({ analyzing: false })
        if (res && res.success && res.report) {
          wx.navigateTo({
            url: `/pages/result/result?markdown=${encodeURIComponent(res.report.markdown)}&title=${encodeURIComponent(res.report.title || problem)}`
          })
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
