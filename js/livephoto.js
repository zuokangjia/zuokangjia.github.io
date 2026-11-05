/*!
 * Live Photo 前端逻辑
 * 由 scripts/livephoto.js 按需注入为 <script defer>，只在包含 [data-livephoto] 的页面出现。
 * 特点：没有 window 全局变量、没有内联配置，行为全部由元素上的 data-* 属性决定。
 *
 * 视频默认 preload="none"，所以静态图会一直显示到视频真正开始播放；
 * 加载期间只显示一个小转盘，不会出现“图先消失、黑屏等视频”的闪烁。
 */
(function () {
  'use strict';

  var WEIXIN = /micromessenger/i.test(navigator.userAgent);
  var REDUCED_MOTION =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NO_HOVER =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none)').matches;

  function has(element, name) {
    return element.hasAttribute(name);
  }

  function number(element, name, fallback) {
    var value = parseFloat(element.getAttribute(name));
    return isFinite(value) ? value : fallback;
  }

  function LivePhoto(root) {
    this.root = root;
    this.image = root.querySelector('.lp-img');
    this.video = root.querySelector('.lp-video');
    this.badge = root.querySelector('.lp-badge');
    this.spinner = root.querySelector('.lp-spinner');

    this.autoplay = has(root, 'data-autoplay') && !REDUCED_MOTION;
    this.hover = has(root, 'data-hover') && !NO_HOVER;
    this.click = has(root, 'data-click');
    this.lazy = has(root, 'data-lazy');
    this.keepObserving = has(root, 'data-keep');
    this.hoverPause = has(root, 'data-hover-pause');
    this.hoverDelay = number(root, 'data-delay', 300);
    this.threshold = Math.min(1, Math.max(0.01, number(root, 'data-threshold', 0.8)));

    // 微信内置浏览器默认不自动播放，改为“点击播放”
    this.weixin = has(root, 'data-weixin') && WEIXIN;
    if (this.weixin) {
      this.autoplay = false;
    }

    this.wantPlay = false;
    this.hoverTimer = null;
    this.observer = null;

    if (!this.video) {
      return;
    }

    this.bind();
    this.showWeixinHint();
    this.observe();
  }

  LivePhoto.prototype.bind = function () {
    var self = this;

    this.root.addEventListener('mouseenter', function () {
      if (!self.hover) {
        return;
      }
      self.hoverTimer = setTimeout(function () {
        self.play();
      }, self.hoverDelay);
    });

    this.root.addEventListener('mouseleave', function () {
      if (!self.hover) {
        return;
      }
      if (self.hoverTimer) {
        clearTimeout(self.hoverTimer);
        self.hoverTimer = null;
      }
      if (self.hoverPause) {
        self.pause();
      }
    });

    if (this.click) {
      this.root.addEventListener('click', function () {
        self.toggle();
      });

      this.root.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          self.toggle();
        }
      });
    }

    this.video.addEventListener('ended', function () {
      self.pause();
    });
    this.video.addEventListener('loadstart', function () {
      self.loading(true);
    });
    this.video.addEventListener('waiting', function () {
      self.loading(true);
    });
    this.video.addEventListener('canplay', function () {
      self.loading(false);
    });
    this.video.addEventListener('playing', function () {
      if (!self.wantPlay) {
        return;
      }
      self.root.classList.add('is-playing');
      self.loading(false);
    });
    this.video.addEventListener('error', function () {
      self.pause();
    });
  };

  LivePhoto.prototype.showWeixinHint = function () {
    if (this.weixin && this.badge) {
      this.badge.textContent = this.badge.textContent + ' · 点击播放';
    }
  };

  LivePhoto.prototype.toggle = function () {
    if (this.wantPlay) {
      this.pause();
    } else {
      this.play();
    }
  };

  LivePhoto.prototype.play = function () {
    if (this.wantPlay) {
      return;
    }
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }

    this.wantPlay = true;
    this.loading(true);

    var self = this;
    var promise = this.video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        self.wantPlay = false;
        self.root.classList.remove('is-playing');
        self.loading(false);
      });
    }
  };

  LivePhoto.prototype.pause = function () {
    if (!this.wantPlay && !this.root.classList.contains('is-playing')) {
      return;
    }
    this.wantPlay = false;
    this.root.classList.remove('is-playing');
    this.loading(false);
    this.video.pause();
  };

  LivePhoto.prototype.loading = function (visible) {
    if (!this.spinner) {
      return;
    }
    this.root.classList.toggle('is-loading', !!visible && this.wantPlay);
  };

  LivePhoto.prototype.observe = function () {
    if (!this.autoplay) {
      return;
    }

    // 不启用懒加载（或浏览器不支持）时直接播放
    if (!this.lazy || typeof window.IntersectionObserver !== 'function') {
      this.play();
      return;
    }

    var self = this;
    this.observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          self.play();
          if (!self.keepObserving) {
            self.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: '0px 0px 10% 0px'
      }
    );
    this.observer.observe(this.root);
  };

  function init() {
    var nodes = document.querySelectorAll('[data-livephoto]');
    for (var i = 0; i < nodes.length; i++) {
      new LivePhoto(nodes[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
