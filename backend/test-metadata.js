const { parseFile } = require('music-metadata');
const path = require('path');

async function testMetadata() {
  // 测试几个不同的文件
  const testFiles = [
    'F:\\Music\\林俊杰\\2008-JJ陆\\林俊杰-06Always Online.mp3',
    'F:\\Music\\周杰伦\\coco李玟、周杰伦 - 刀马旦.flac',
    'F:\\Music\\黄龄\\High歌.mp3'
  ];
  
  for (const filePath of testFiles) {
    console.log('\n=================================');
    console.log('文件:', path.basename(filePath));
    console.log('路径:', filePath);
    console.log('=================================');
    
    try {
      const metadata = await parseFile(filePath);
      
      console.log('\n【元数据标签】');
      console.log('  标题 (title):', metadata.common?.title || 'N/A');
      console.log('  艺术家 (artist):', metadata.common?.artist || 'N/A');
      console.log('  专辑 (album):', metadata.common?.album || 'N/A');
      console.log('  专辑艺术家 (albumartist):', metadata.common?.albumartist || 'N/A');
      console.log('  艺术家数组 (artists):', metadata.common?.artists?.join(', ') || 'N/A');
      console.log('  年份 (year):', metadata.common?.year || 'N/A');
      console.log('  流派 (genre):', metadata.common?.genre?.join(', ') || 'N/A');
      console.log('  时长 (duration):', metadata.format?.duration ? Math.floor(metadata.format.duration) + '秒' : 'N/A');
      console.log('  封面图片:', (metadata.common?.picture?.length || 0) > 0 ? '有' : '无');
      
      console.log('\n【当前数据库存储映射】');
      console.log('  title →', metadata.common?.title || path.basename(filePath, path.extname(filePath)));
      console.log('  artist →', metadata.common?.artist || 'Unknown Artist');
      console.log('  album →', metadata.common?.album || 'Local Music');
      
    } catch (error) {
      console.error('读取失败:', error.message);
    }
  }
}

testMetadata().catch(console.error);
