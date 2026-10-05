const https = require('https');

const token = '8813479264:AAFtWO4GnVZ19rTJ1LEah3_E0_CzJAtnZiQ';

console.log('🔄 Đang xóa webhook và pending updates...\n');

https.get(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('✅ Kết quả:', JSON.stringify(result, null, 2));
    
    if (result.ok) {
      console.log('\n✅ Đã xóa webhook thành công!');
      console.log('💡 Bây giờ bạn có thể chạy: npm start\n');
    } else {
      console.log('\n❌ Lỗi:', result.description);
    }
  });
}).on('error', (err) => {
  console.error('❌ Lỗi kết nối:', err.message);
});
