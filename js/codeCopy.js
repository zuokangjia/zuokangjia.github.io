// clipboard js 代码复制功能
window.addEventListener('DOMContentLoaded', initCodeCopy)

function initCodeCopy() {
  // 查找所有代码块
  const figures = document.querySelectorAll('figure.highlight')
  
  figures.forEach(figure => {
    // 避免重复添加
    if (figure.querySelector('.pin-copy')) return

    // 1. 创建滚动容器包裹 table (如果存在)
    // 这样做的目的是为了让 table 横向滚动时，figure (及其绝对定位的复制按钮) 保持静止
    const table = figure.querySelector('table')
    if (table) {
      const wrapper = document.createElement('div')
      wrapper.className = 'code-scroll-pane'
      // 将 wrapper 插入到 table 之前
      table.parentNode.insertBefore(wrapper, table)
      // 将 table 移动到 wrapper 中
      wrapper.appendChild(table)
    }

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