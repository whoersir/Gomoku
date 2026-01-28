const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zjvqemlddehxtwuohjzn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdnFlbWxkZGVoeHR3dW9oanpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTIwNTMsImV4cCI6MjA4NDYyODA1M30.BU8NNhJPRCnSDKo5LY4lpH3swit8UCofbr10PPP3IHk'
);

async function checkMusicData() {
  console.log('=== 检查音乐库数据 ===\n');
  
  const { data, error } = await supabase
    .from('music_tracks')
    .select('id, title, artist, album, file_path')
    .limit(20);
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  console.log('总记录数:', data.length);
  console.log('\n前20条记录:\n');
  
  data.forEach((track, i) => {
    console.log(`${i+1}. 标题: ${track.title}`);
    console.log(`   艺术家: ${track.artist}`);
    console.log(`   专辑: ${track.album}`);
    console.log(`   文件: ${track.file_path.split('/').pop()}`);
    console.log('');
  });
  
  // 检查专辑为"律动车载音乐"的记录（这可能是默认值）
  const { data: defaultAlbums, error: err2 } = await supabase
    .from('music_tracks')
    .select('id, title, artist, album, file_path')
    .eq('album', '律动车载音乐')
    .limit(10);
    
  if (!err2 && defaultAlbums.length > 0) {
    console.log('\n=== 专辑为"律动车载音乐"的记录（可能是默认值）===');
    defaultAlbums.forEach((track, i) => {
      console.log(`${i+1}. ${track.title} - ${track.artist}`);
      console.log(`   文件: ${track.file_path}`);
    });
  }
  
  // 检查专辑等于艺术家的情况（可能是没有专辑信息）
  const { data: sameArtistAlbum, error: err3 } = await supabase
    .from('music_tracks')
    .select('id, title, artist, album, file_path')
    .eq('album', 'artist')
    .limit(10);
    
  console.log('\n=== 统计信息 ===');
  const { count: totalCount } = await supabase
    .from('music_tracks')
    .select('*', { count: 'exact', head: true });
  console.log('总记录数:', totalCount);
}

checkMusicData().catch(console.error);
