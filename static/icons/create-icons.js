// 创建PWA图标的Node.js脚本
const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 绘制黑色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    
    // 绘制白色圆形
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制黑色 S 字母
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', centerX, centerY);
    
    // 保存文件
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./static/icons/icon-${size}x${size}.png`, buffer);
    console.log(`Created icon-${size}x${size}.png`);
});

console.log('All icons created successfully!');