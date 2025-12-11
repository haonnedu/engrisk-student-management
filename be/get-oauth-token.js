/**
 * Script để lấy OAuth 2.0 Refresh Token
 * 
 * Cách dùng:
 * 1. Cài đặt: npm install googleapis
 * 2. Thay CLIENT_ID, CLIENT_SECRET, REDIRECT_URI bằng giá trị của bạn
 * 3. Chạy: node get-oauth-token.js
 * 4. Mở URL trong browser, authorize, copy code và paste vào terminal
 */

const { google } = require('googleapis');
const readline = require('readline');

// ============================================
// THAY ĐỔI CÁC GIÁ TRỊ NÀY
// ============================================
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
// ============================================

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.file'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Cần để lấy refresh token
  scope: scopes,
  prompt: 'consent', // Force consent screen để đảm bảo có refresh token
});

console.log('\n===========================================');
console.log('BƯỚC 1: Mở URL này trong browser:');
console.log('===========================================');
console.log(authUrl);
console.log('\n===========================================');
console.log('BƯỚC 2: Sau khi authorize, bạn sẽ được redirect đến:');
console.log('===========================================');
console.log(`${REDIRECT_URI}?code=XXXXX`);
console.log('\nBƯỚC 3: Copy phần "code=XXXXX" từ URL (chỉ lấy phần sau dấu =)');
console.log('Ví dụ: Nếu URL là http://localhost:3000/api/auth/google/callback?code=4/0Axxxxx');
console.log('Thì copy: 4/0Axxxxx');
console.log('\n===========================================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Paste authorization code ở đây: ', async (code) => {
  try {
    // Remove any whitespace
    code = code.trim();
    
    // Remove redirect URI if user pasted full URL
    if (code.includes('code=')) {
      code = code.split('code=')[1].split('&')[0];
    }
    
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n===========================================');
    console.log('THÀNH CÔNG! Refresh Token của bạn:');
    console.log('===========================================');
    console.log(tokens.refresh_token);
    console.log('\n===========================================');
    console.log('Thông tin đầy đủ:');
    console.log('===========================================');
    console.log(JSON.stringify({
      type: 'oauth2',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      redirect_uri: REDIRECT_URI
    }, null, 2));
    console.log('\n===========================================');
    console.log('Copy JSON trên và update vào database:');
    console.log('===========================================');
    console.log(`UPDATE google_drives SET credentials = '...' WHERE email = 'your-email@gmail.com';`);
    console.log('\n');
    
    rl.close();
  } catch (error) {
    console.error('\n===========================================');
    console.error('LỖI:', error.message);
    console.error('===========================================');
    
    if (error.message.includes('redirect_uri_mismatch')) {
      console.error('\nVẤN ĐỀ: Redirect URI không khớp!');
      console.error('\nCÁCH SỬA:');
      console.error('1. Vào Google Cloud Console > APIs & Services > Credentials');
      console.error('2. Click vào OAuth Client ID của bạn');
      console.error(`3. Trong "Authorized redirect URIs", thêm: ${REDIRECT_URI}`);
      console.error('4. Click Save');
      console.error('5. Đợi 1-2 phút rồi thử lại');
    } else if (error.message.includes('invalid_grant')) {
      console.error('\nVẤN ĐỀ: Authorization code đã hết hạn hoặc đã được dùng!');
      console.error('CÁCH SỬA: Lấy code mới từ URL authorization');
    } else {
      console.error('\nChi tiết lỗi:', error);
    }
    
    rl.close();
    process.exit(1);
  }
});

