const { parseFile } = require('music-metadata');
const iconv = require('iconv-lite');

async function testSpecificFile() {
  const filePath = 'F:\\Music\\林俊杰\\2007-西界\\林俊杰-01大男人·小女孩.mp3';
  
  console.log('测试文件:', filePath);
  console.log('=================================');
  
  try {
    const metadata = await parseFile(filePath);
    
    console.log('\n【原始元数据】');
    console.log('  title:', JSON.stringify(metadata.common?.title));
    console.log('  artist:', JSON.stringify(metadata.common?.artist));
    console.log('  album:', JSON.stringify(metadata.common?.album));
    
    // 测试解码
    if (metadata.common?.title) {
      const rawTitle = metadata.common.title;
      console.log('\n【标题解码测试】');
      console.log('  原始:', rawTitle);
      console.log('  UTF-8:', Buffer.from(rawTitle, 'binary').toString('utf8'));
      console.log('  GBK:', iconv.decode(Buffer.from(rawTitle, 'binary'), 'gbk'));
      
      // 检查每个字符
      console.log('\n  字符分析:');
      for (let i = 0; i < rawTitle.length && i < 10; i++) {
        const char = rawTitle[i];
        const code = char.charCodeAt(0);
        console.log(`    [${i}] '${char}' - 0x${code.toString(16)} (${code})`);
      }
    }
    
  } catch (error) {
    console.error('读取失败:', error.message);
  }
}

testSpecificFile().catch(console.error);
