// 点赞功能 JavaScript
// 移植自 Bloghugo 主题

document.addEventListener('DOMContentLoaded', function() {
  const likeButtons = document.querySelectorAll('.like-button');
  const API_BASE = 'https://df.suuus.top'; // 你需要替换为自己的API地址
  const LIKES_KEY = 'post-likes';
  
  // 从本地存储获取已点赞文章列表
  let likedPosts = JSON.parse(localStorage.getItem(LIKES_KEY) || '[]');

  // 创建提示元素
  function createToast(message) {
    const toast = document.createElement('div');
    toast.className = 'like-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示提示
    setTimeout(() => toast.style.opacity = '1', 10);
    
    // 3 秒后隐藏并移除提示
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  likeButtons.forEach(button => {
    const path = button.dataset.path;
    const countEl = button.querySelector('.like-count');

    // 如果文章已被点赞，添加 liked 类
    if (likedPosts.includes(path)) {
      button.classList.add('liked');
    }

    // 获取点赞数
    fetch(`${API_BASE}/post${path}like`)
      .then(res => res.json())
      .then(data => {
        countEl.textContent = data.likes || 0;
      })
      .catch(err => {
        console.error('获取点赞数失败：', err);
        countEl.textContent = '0';
      });

    // 点击事件
    button.addEventListener('click', async () => {
      if (button.classList.contains('liked')) {
        createToast('你已经点过赞了！');
        return;
      }

      button.classList.add('heart-animation');
      
      try {
        const res = await fetch(`${API_BASE}/post${path}like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.likes) {
          countEl.textContent = data.likes;
          button.classList.add('liked');
          
          // 将文章路径添加到已点赞列表并保存到本地存储
          if (!likedPosts.includes(path)) {
            likedPosts.push(path);
            localStorage.setItem(LIKES_KEY, JSON.stringify(likedPosts));
            // 显示感谢提示
            createToast('感谢你的鼓励，我会再接再厉！');
          }
        }
      } catch (err) {
        console.error('点赞失败：', err);
        button.classList.remove('liked');
        createToast('点赞失败，请稍后再试');
      } finally {
        setTimeout(() => {
          button.classList.remove('heart-animation');
        }, 300);
      }
    });
  });
});