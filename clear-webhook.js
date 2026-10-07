require('dotenv').config();
const token = process.env.TELEGRAM_BOT_TOKEN;

fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`)
  .then(r => r.json())
  .then(data => {
    console.log('Webhook cleared:', data);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
