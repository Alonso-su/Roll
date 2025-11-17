/**
 * Table of Contents functionality
 * Ported from meilijian project
 */

// Desktop TOC functionality
class DesktopTOC {
  constructor() {
    this.tocContainer = document.querySelector('.toc-desktop');
    this.tocList = document.querySelector('[data-desktop-toc-list]');
    this.headingLinks = document.querySelectorAll('[data-desktop-heading-link]');
    this.headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    this.observer = null;
    this.scrollTimeout = null;
    
    if (this.tocContainer && this.headings.length > 0) {
      this.init();
    }
  }

  init() {
    this.setupHeadingObserver();
    this.processHeadings();
    this.checkInitialHeading();
    this.updateTocPosition();
    this.setupPositionUpdater();
  }

  processHeadings() {
    // Add order numbers and data attributes to TOC links
    const tocLinks = this.tocContainer.querySelectorAll('a[href^="#"]');
    tocLinks.forEach((link, index) => {
      const href = link.getAttribute('href');
      const headingId = href.substring(1);
      
      // Add data attribute for easier selection
      link.setAttribute('data-desktop-heading-link', '');
      link.setAttribute('href', href);
      
      // Add order number
      const orderSpan = document.createElement('span');
      orderSpan.className = 'toc-number';
      orderSpan.textContent = (index + 1).toString().padStart(2, '0');
      
      // Add text span
      const textSpan = document.createElement('span');
      textSpan.className = 'toc-text';
      textSpan.textContent = link.textContent;
      textSpan.title = link.textContent;
      
      // Replace link content
      link.innerHTML = '';
      link.appendChild(orderSpan);
      link.appendChild(textSpan);
    });
  }

  setupHeadingObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0) {
            this.updateActiveHeading(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-96px 0px -85% 0px',
        threshold: [0, 1],
      }
    );

    this.headings.forEach((heading) => this.observer.observe(heading));
  }

  updateActiveHeading(activeId) {
    const headingLinks = this.tocContainer.querySelectorAll('[data-desktop-heading-link]');
    
    headingLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${activeId}`) {
        link.setAttribute('data-active', '');
        this.scrollToActiveInTOC(link);
      } else {
        link.removeAttribute('data-active');
      }
    });
  }

  scrollToActiveInTOC(activeLink) {
    if (!this.tocList) return;

    const tocContainer = this.tocList.parentElement;
    if (!tocContainer) return;

    if (this.scrollTimeout) {
      cancelAnimationFrame(this.scrollTimeout);
    }

    this.scrollTimeout = requestAnimationFrame(() => {
      const containerHeight = tocContainer.offsetHeight;
      const activeLinkTop = activeLink.offsetTop;
      const activeLinkHeight = activeLink.offsetHeight;
      const tocListHeight = this.tocList.offsetHeight;

      let targetTransform = Math.max(0, activeLinkTop - containerHeight / 2 + activeLinkHeight / 2);
      targetTransform = Math.min(targetTransform, tocListHeight - containerHeight);

      this.tocList.style.transition = 'transform 0.3s ease-out';
      this.tocList.style.transform = `translateY(-${targetTransform}px)`;
    });
  }

  checkInitialHeading() {
    setTimeout(() => {
      const visibleHeading = Array.from(this.headings).find((heading) => {
        const rect = heading.getBoundingClientRect();
        return rect.top > 10 && rect.top < window.innerHeight * 0.33;
      });
      
      if (visibleHeading) {
        this.updateActiveHeading(visibleHeading.id);
      } else if (this.headingLinks.length > 0) {
        const firstLink = this.headingLinks[0];
        firstLink.setAttribute('data-active', '');
      }
    }, 100);
  }

  updateTocPosition() {
    if (!this.tocContainer) return;
    
    // 获取文章头部区域的高度
    const postHeader = document.querySelector('.post-header');
    const postDivider = document.querySelector('.post-divider');
    
    if (postHeader) {
      const headerRect = postHeader.getBoundingClientRect();
      const headerBottom = headerRect.bottom + window.scrollY;
      
      // 添加一些间距，确保TOC在头部区域之后
      const tocTop = Math.max(headerBottom + 32, 120); // 最小120px，确保不会太靠上
      
      this.tocContainer.style.top = `${tocTop}px`;
    }
  }

  setupPositionUpdater() {
    // 监听窗口大小变化和滚动，更新TOC位置
    let updateTimeout;
    const updatePosition = () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        this.updateTocPosition();
      }, 100);
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('load', updatePosition);
    
    // 初始延迟更新，确保所有内容都已加载
    setTimeout(() => {
      this.updateTocPosition();
    }, 500);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.scrollTimeout) {
      cancelAnimationFrame(this.scrollTimeout);
    }
  }
}

// Mobile TOC functionality
class MobileTOC {
  constructor() {
    this.tocContainer = document.getElementById('mobile-toc-container');
    this.tocContent = document.querySelector('[data-toc-content]');
    this.tocArrow = document.querySelector('[data-toc-arrow]');
    this.currentSectionText = document.getElementById('mobile-toc-current-section');
    this.listElement = document.getElementById('mobile-table-of-contents');
    this.scrollArea = document.querySelector('[data-toc-scroll-area]');
    this.fadeTop = document.querySelector('[data-fade-top]');
    this.fadeBottom = document.querySelector('[data-fade-bottom]');
    
    this.isOpen = false;
    this.isStuck = false;
    this.headings = [];
    this.observer = null;
    this.stickyObserver = null;
    this.lastScrollY = 0;
    this.scrollRAF = null;
    this.recentlyOpened = false;
    this.lastOpenTime = 0;
    
    if (this.tocContainer) {
      this.init();
    }
  }

  init() {
    this.initElements();
    this.initHeadingObserver();
    this.initStickyObserver();
    this.initInteractions();
    this.initScrollHandler();
    this.processHeadings();
    this.updateMobileTocPosition();
  }

  initElements() {
    this.headings = Array.from(document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'))
      .filter(heading => heading.id !== 'footnote-label');
    this.lastScrollY = window.scrollY;
    this.isOpen = this.getOpenStateFromDOM();
  }

  processHeadings() {
    // Add order numbers and data attributes to mobile TOC links
    const tocLinks = this.listElement?.querySelectorAll('a[href^="#"]') || [];
    tocLinks.forEach((link, index) => {
      const href = link.getAttribute('href');
      const headingId = href.substring(1);
      const headingElement = document.getElementById(headingId);
      
      if (headingElement) {
        // Add data attributes
        link.setAttribute('data-heading-id', headingId);
        link.setAttribute('data-heading-text', headingElement.textContent);
        link.classList.add('mobile-toc-item');
        
        // Create number span
        const numberSpan = document.createElement('span');
        numberSpan.className = 'mobile-toc-number';
        numberSpan.setAttribute('data-order', index + 1);
        numberSpan.textContent = (index + 1).toString().padStart(2, '0');
        
        // Insert number before link
        const listItem = link.parentElement;
        if (listItem) {
          listItem.insertBefore(numberSpan, link);
        }
      }
    });
  }

  getOpenStateFromDOM() {
    if (!this.tocContent) return false;
    const maxHeight = this.tocContent.style.maxHeight;
    return maxHeight !== '0px' && maxHeight !== '' && maxHeight !== '0';
  }

  setOpen(open) {
    if (!this.tocContent || !this.tocArrow) return;

    this.isOpen = open;

    if (open) {
      this.tocContent.style.maxHeight = '31vh';
      this.tocContent.classList.add('open');
      this.tocArrow.style.transform = 'rotate(180deg)';
      setTimeout(() => this.updateScrollMask(), 100);
    } else {
      this.tocContent.style.maxHeight = '0';
      this.tocContent.classList.remove('open');
      this.tocArrow.style.transform = 'rotate(0deg)';
    }
  }

  toggle() {
    this.setOpen(!this.isOpen);
  }

  initHeadingObserver() {
    if (this.headings.length === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const visibleHeadings = entries
          .filter((entry) => entry.intersectionRatio > 0)
          .map((entry) => ({
            id: entry.target.id,
            element: entry.target,
            ratio: entry.intersectionRatio,
            rect: entry.target.getBoundingClientRect(),
          }));

        if (visibleHeadings.length > 0) {
          const bestHeading = visibleHeadings.reduce((best, current) => {
            const bestDistance = Math.abs(best.rect.top - 80);
            const currentDistance = Math.abs(current.rect.top - 80);
            return currentDistance < bestDistance ? current : best;
          });

          this.updateActiveHeading(bestHeading.id);
        } else {
          this.updateActiveHeadingByScroll();
        }
      },
      {
        rootMargin: '-80px 0px -85% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    this.headings.forEach((heading) => this.observer.observe(heading));
    setTimeout(() => this.updateActiveHeadingByScroll(), 100);
  }

  updateActiveHeadingByScroll() {
    if (this.headings.length === 0) return;

    const scrollTop = window.scrollY;
    let activeHeading = null;

    for (let i = this.headings.length - 1; i >= 0; i--) {
      const heading = this.headings[i];
      const rect = heading.getBoundingClientRect();
      const headingTop = rect.top + scrollTop;

      if (headingTop <= scrollTop + 120) {
        activeHeading = heading;
        break;
      }
    }

    this.updateActiveHeading(activeHeading?.id || '');
  }

  initStickyObserver() {
    if (!this.tocContainer || !this.tocContent) return;

    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.height = '1px';
    sentinel.style.top = `${this.tocContainer.offsetTop - 1}px`;
    this.tocContainer.parentElement?.insertBefore(sentinel, this.tocContainer);

    this.stickyObserver = new IntersectionObserver(
      ([entry]) => {
        const wasStuck = this.isStuck;
        this.isStuck = !entry.isIntersecting;

        if (this.isStuck) {
          this.tocContent.style.position = 'absolute';
          this.tocContent.style.top = '100%';
          this.tocContent.style.left = '0';
          this.tocContent.style.right = '0';
          this.tocContent.style.zIndex = '10';
        } else {
          this.tocContent.style.position = 'static';
          this.tocContent.style.top = 'auto';
          this.tocContent.style.left = 'auto';
          this.tocContent.style.right = 'auto';
          this.tocContent.style.zIndex = 'auto';

          if (wasStuck) {
            this.lastScrollY = window.scrollY;
            this.recentlyOpened = false;
          }
        }
      },
      { threshold: [0] }
    );

    this.stickyObserver.observe(sentinel);
  }

  initInteractions() {
    const toggleButton = document.querySelector('[data-toc-toggle]');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        if (!this.isOpen) {
          this.setRecentlyOpened();
        }
        this.toggle();
      });
    }

    if (this.listElement) {
      this.listElement.addEventListener('click', (e) => {
        const target = e.target;
        const item = target.closest('.mobile-toc-item');
        if (!item) return;

        e.preventDefault();

        if (!this.isOpen) {
          this.setRecentlyOpened();
          this.setOpen(true);
        } else {
          this.setOpen(false);
          setTimeout(() => {
            const href = item.getAttribute('href');
            if (href) {
              const targetElement = document.querySelector(href);
              if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                const documentTop = rect.top + window.scrollY;
                const scrollPosition = documentTop - 80;

                window.scrollTo({
                  top: Math.max(0, scrollPosition),
                  behavior: 'smooth',
                });
              }
            }
          }, 300);
        }
      });
    }

    if (this.scrollArea) {
      this.scrollArea.addEventListener('scroll', () => this.updateScrollMask(), { passive: true });
    }
  }

  initScrollHandler() {
    let headingUpdateRAF = null;

    const handleScroll = () => {
      if (this.scrollRAF) return;

      this.scrollRAF = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - this.lastScrollY;
        const isScrollingDown = scrollDelta > 1;

        const timeSinceOpened = Date.now() - this.lastOpenTime;
        const isInImmunityPeriod = this.recentlyOpened && timeSinceOpened < 200;

        if (!this.isStuck && isScrollingDown && this.isOpen) {
          const shouldClose = !isInImmunityPeriod || Math.abs(scrollDelta) > 10;

          if (shouldClose) {
            this.setOpen(false);
            this.recentlyOpened = false;
          }
        }

        if (Math.abs(scrollDelta) > 20) {
          if (headingUpdateRAF) {
            cancelAnimationFrame(headingUpdateRAF);
          }
          headingUpdateRAF = requestAnimationFrame(() => {
            this.updateActiveHeadingByScroll();
            headingUpdateRAF = null;
          });
        }

        this.lastScrollY = currentScrollY;
        this.scrollRAF = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  setRecentlyOpened() {
    this.recentlyOpened = true;
    this.lastOpenTime = Date.now();
    setTimeout(() => {
      this.recentlyOpened = false;
    }, 800);
  }

  updateActiveHeading(activeId) {
    if (!this.listElement || !this.currentSectionText) return;

    const headingLinks = this.listElement.querySelectorAll('.mobile-toc-item');
    const headingNumbers = this.listElement.querySelectorAll('.mobile-toc-number');

    // Reset styles
    headingLinks.forEach((link) => {
      link.classList.remove('active');
    });

    headingNumbers.forEach((number) => {
      number.classList.remove('active');
    });

    let textToShow = 'Overview';

    if (activeId) {
      const activeItem = this.listElement.querySelector(`[data-heading-id="${activeId}"]`);

      if (activeItem) {
        activeItem.classList.add('active');
        textToShow = activeItem.dataset.headingText || textToShow;

        const parentLi = activeItem.closest('li');
        const activeNumber = parentLi?.querySelector('.mobile-toc-number');

        if (activeNumber) {
          activeNumber.classList.add('active');
        }
      }

      this.scrollToActiveInTOC(activeId);
    }

    this.currentSectionText.textContent = textToShow;
  }

  scrollToActiveInTOC(activeHeadingId) {
    if (!this.listElement || !this.scrollArea) return;

    const activeItem = this.listElement.querySelector(`[data-heading-id="${activeHeadingId}"]`);
    if (!activeItem) return;

    const containerRect = this.scrollArea.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const relativeTop = itemRect.top - containerRect.top + this.scrollArea.scrollTop;
    const targetScrollTop = relativeTop - containerRect.height / 2 + itemRect.height / 2;

    const targetScroll = Math.max(0, Math.min(targetScrollTop, this.scrollArea.scrollHeight - this.scrollArea.clientHeight));

    if (Math.abs(targetScroll - this.scrollArea.scrollTop) > 5) {
      this.scrollArea.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  }

  updateScrollMask() {
    if (!this.scrollArea || !this.fadeTop || !this.fadeBottom) return;

    const { scrollTop, scrollHeight, clientHeight } = this.scrollArea;
    const threshold = 10;

    const showTopFade = scrollTop > threshold;
    const showBottomFade = scrollTop < scrollHeight - clientHeight - threshold;

    this.fadeTop.style.opacity = showTopFade ? '1' : '0';
    this.fadeBottom.style.opacity = showBottomFade ? '1' : '0';
  }

  updateMobileTocPosition() {
    if (!this.tocContainer) return;
    
    // 对于移动端，我们可以调整sticky的top值
    const postHeader = document.querySelector('.post-header');
    
    if (postHeader) {
      // 移动端TOC保持sticky定位，但可以调整top值
      this.tocContainer.style.top = '0';
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.stickyObserver) {
      this.stickyObserver.disconnect();
    }
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }
  }
}

// Progress Ring functionality
class ProgressRing {
  constructor() {
    this.progressRings = document.querySelectorAll('[data-progress-ring]');
    if (this.progressRings.length > 0) {
      this.init();
    }
  }

  init() {
    this.updateProgress();
    this.setupScrollListener();
  }

  updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min(Math.max(scrollTop / docHeight, 0), 1);

    this.progressRings.forEach((ring) => {
      const circumference = 2 * Math.PI * parseFloat(ring.getAttribute('r') || '0');
      const offset = circumference - scrollPercent * circumference;
      ring.style.strokeDashoffset = offset.toString();
    });
  }

  setupScrollListener() {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

// Back to Top functionality enhancement
class BackToTop {
  constructor() {
    this.buttons = document.querySelectorAll('[id^="backToTop"]');
    this.footer = document.querySelector('footer');
    
    if (this.buttons.length > 0) {
      this.init();
    }
  }

  init() {
    this.setupClickHandlers();
    this.setupScrollListener();
  }

  setupClickHandlers() {
    this.buttons.forEach((button) => {
      button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  setupScrollListener() {
    const handleScroll = () => {
      this.buttons.forEach((button) => {
        const isMobile = button.id === 'backToTopMobile';
        let shouldShow = window.scrollY > 300;

        if (isMobile && this.footer && shouldShow) {
          const footerTop = this.footer.getBoundingClientRect().top;
          const windowHeight = window.innerHeight;
          shouldShow = footerTop > windowHeight - 100;
        }

        if (isMobile) {
          if (shouldShow) {
            button.classList.add('show');
            button.style.transform = 'translateY(0)';
            button.style.pointerEvents = 'auto';
          } else {
            button.classList.remove('show');
            button.style.transform = 'translateY(120px)';
            button.style.pointerEvents = 'none';
          }
        } else {
          button.classList.toggle('show', shouldShow);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

// Initialize all TOC functionality
function initTOC() {
  new DesktopTOC();
  new MobileTOC();
  new ProgressRing();
  new BackToTop();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTOC);
} else {
  initTOC();
}