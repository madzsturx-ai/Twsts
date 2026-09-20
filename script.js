const emojis=['👍','❤️','🔥','😂','😮','😢','🙏','👏','😍','💯','🎉','🤯','😁','🗿'];
const selected=new Set();
const segmentEmoji = (value) => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)]
      .map(item => item.segment);
  }
  return [...value];
};
const grid=document.querySelector('#emojiGrid');
let seconds=0;

const menu=document.querySelector('#sideMenu');
document.querySelector('#menuToggle').onclick=()=>{menu.classList.add('open');menu.setAttribute('aria-hidden','false')};
document.querySelector('#menuClose').onclick=()=>{menu.classList.remove('open');menu.setAttribute('aria-hidden','true')};
menu.querySelectorAll('a').forEach(a=>a.onclick=()=>{menu.classList.remove('open');menu.setAttribute('aria-hidden','true')});

emojis.forEach(e=>{
 const b=document.createElement('button');
 b.className='emoji-btn';b.textContent=e;b.title='Pilih '+e;b.type='button';
 b.onclick=()=>{if(selected.has(e))selected.delete(e);else if(selected.size<5)selected.add(e);else return;b.classList.toggle('selected',selected.has(e));updatePreview()};
 grid.appendChild(b)
});

setInterval(()=>{seconds++;document.querySelector('#timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')},1000);
function setNotice(message,bad=false){const n=document.querySelector('#notice');n.textContent=message;n.classList.toggle('error',bad)}
function updatePreview(){
 const manual=segmentEmoji(document.querySelector('#manual').value).filter(x=>![' ', '\n', ','].includes(x));
 const chosen=[...new Set([...selected,...manual])].slice(0,5);
 document.querySelector('#emojiPreview').textContent=chosen.length?chosen.join('  '):'Emoji terpilih akan tampil di sini';
}
document.querySelector('#manual').addEventListener('input',updatePreview);

document.querySelector('#execute').onclick=async()=>{
 const button=document.querySelector('#execute');
 const url=document.querySelector('#channel').value.trim();
 const manual=document.querySelector('#manual').value.trim();
 let chosen=[...selected];if(manual)chosen.push(...segmentEmoji(manual).filter(x=>![' ','\n',','].includes(x)));
 chosen=[...new Set(chosen)].slice(0,5);
 if(!/^https?:\/\/((www\.)?whatsapp\.com|wa\.me)\/channel\//i.test(url)){setNotice('Masukkan URL WhatsApp Channel yang valid.',true);return}
 if(!chosen.length){setNotice('Pilih minimal satu emoji.',true);return}
 button.disabled=true;button.classList.add('loading');button.innerHTML='<span class="fingerprint" aria-hidden="true">⌁</span><span class="button-label">Memproses…</span>';
 document.querySelector('#processState').textContent='Menghubungkan ke API…';
 document.querySelector('#progressBar').style.width='35%';document.querySelector('#progressText').textContent='35%';setNotice('Memproses permintaan…');
 try{
  const response=await fetch('/.netlify/functions/react',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,emojis:chosen})});
  const data=await response.json();
  if(!response.ok||data.status===false)throw new Error(data.error||'Permintaan ditolak API.');
  const d=data?.data||{};
  document.querySelector('#processState').textContent='Proses selesai';
  document.querySelector('#resultSummary').textContent=`Requested: ${d.requested??0} · Succeeded: ${d.succeeded??0} · Failed: ${d.failed??0}`;
  document.querySelector('#progressBar').style.width='100%';document.querySelector('#progressText').textContent='100%';setNotice('Berhasil menerima respons dari API.');
 }catch(err){document.querySelector('#processState').textContent='Proses gagal';document.querySelector('#progressBar').style.width='0%';document.querySelector('#progressText').textContent='0%';setNotice(err.message,true);document.querySelector('#resultSummary').textContent='Permintaan gagal. Periksa API key, URL, atau status layanan.';}
 finally{button.disabled=false;button.classList.remove('loading');button.innerHTML='<span class="fingerprint" aria-hidden="true">⌁</span><span class="button-label">Mulai proses</span>'}
};

document.querySelector('#reset').onclick=()=>{selected.clear();document.querySelectorAll('.emoji-btn').forEach(b=>b.classList.remove('selected'));document.querySelector('#channel').value='';document.querySelector('#manual').value='';updatePreview();document.querySelector('#progressBar').style.width='0%';document.querySelector('#progressText').textContent='0%';document.querySelector('#processState').textContent='Menunggu permintaan';document.querySelector('#resultSummary').textContent='Belum ada proses dijalankan.';setNotice('Siap menerima permintaan baru.')};
