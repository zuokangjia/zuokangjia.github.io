// clipboard js 代码复制功能
window.addEventListener('DOMContentLoaded', initCodeCopy)

function initCodeCopy() {
  // 查找所有代码块
  const figures = document.querySelectorAll('figure.highlight')
  
  figures.forEach(figure => {
    // 避免重复添加
    if (figure.querySelector('.pin-copy')) return

    // 创建复制按钮
    const copyBtn = document.createElement('span')
    copyBtn.className = 'pin-copy'
    copyBtn.setAttribute('data-text', 'Copy') // 初始提示文字
    
    const icon = document.createElement('i')
    icon.className = 'iconfont icon-copy'
    copyBtn.appendChild(icon)
    
    figure.appendChild(copyBtn)
  })

  // 初始化 ClipboardJS
  if (typeof ClipboardJS !== 'undefined') {
    const clipboard = new ClipboardJS('.pin-copy', {
      text: function(trigger) {
        const figure = trigger.parentNode
        // 尝试获取代码内容，适配不同的 hexo 渲染结构
        const codeElement = figure.querySelector('.code pre') || 
                          figure.querySelector('table .code pre') || 
                          figure.querySelector('td.code pre')
        return codeElement ? codeElement.innerText : ''
      }
    })

    clipboard.on('success', function(e) {
      const btn = e.trigger
      btn.setAttribute('data-text', 'Copied!')
      e.clearSelection()
      
      setTimeout(() => {
        btn.setAttribute('data-text', 'Copy')
      }, 2000)
    })

    clipboard.on('error', function(e) {
      const btn = e.trigger
      btn.setAttribute('data-text', 'Failed')
      
      setTimeout(() => {
        btn.setAttribute('data-text', 'Copy')
      }, 2000)
    })
  } else {
    console.warn('ClipboardJS not found')
  }
}