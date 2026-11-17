const https = require('https');
async function check(url) {
  return new Promise(resolve => {
    https.request(url, {method: 'HEAD'}, res => resolve(res.statusCode === 200)).on('error', () => resolve(false)).end();
  });
}
async function run() {
  for(let i=1; i<=150; i++) {
    const url = `https://pngimg.com/uploads/computer_pc/computer_pc_PNG${i}.png`;
    if(await check(url)) console.log(url);
  }
}
run();
