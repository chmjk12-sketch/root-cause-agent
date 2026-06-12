function markdownToHtml(md) {
  if (!md) return ''
  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f0f0f5;padding:2px 6px;border-radius:3px;font-size:13px">$1</code>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#f5f5f5;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.5"><code>$2</code></pre>')
    // Unordered lists  
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul style="padding-left:20px;margin:8px 0">$1</ul>')
    // Ordered lists
    .replace(/^\d+\.\s(.+)$/gm, '<li style="margin:4px 0">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #2979ff;padding:8px 12px;margin:8px 0;background:#f5f9ff;color:#636e72">$1</blockquote>')
    // Line breaks
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br>')

  // Wrap consecutive <li>s into a single <ul>
  html = html.replace(/(<li[\s\S]*?<\/li>)(<li)/g, '$1$2')

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '')
    .replace(/<br>\s*<br>/g, '<br>')

  return '<p style="margin:8px 0">' + html + '</p>'
}

Page({
  data: {
    title: '',
    time: '',
    markdown: '',
    htmlContent: '',
    showToast: false,
    toastText: ''
  },

  onLoad(options) {
    const markdown = decodeURIComponent(options.markdown || '')
    const title = decodeURIComponent(options.title || '根因分析报告')
    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

    const htmlContent = markdownToHtml(markdown)

    this.setData({
      title,
      markdown,
      htmlContent,
      time: timeStr
    })
  },

  saveToLocal() {
    try {
      const history = wx.getStorageSync('analysisHistory') || []
      history.unshift({
        id: Date.now().toString(),
        title: this.data.title,
        markdown: this.data.markdown,
        time: this.data.time,
        starred: false
      })
      wx.setStorageSync('analysisHistory', history.slice(0, 100))
      this.showToast('已保存到历史记录')
    } catch (e) {
      this.showToast('保存失败')
    }
  },

  shareResult() {
    wx.shareFileMessage({
      filePath: this.data.markdown,
      success: () => this.showToast('分享成功'),
      fail: () => this.showToast('分享失败')
    })
  },

  showToast(text) {
    this.setData({ showToast: true, toastText: text })
    setTimeout(() => this.setData({ showToast: false }), 2000)
  }
})
