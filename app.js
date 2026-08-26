/* Altıdünya Parti Defteri — kabuk uygulaması */
(function(){
  const $ = (s)=>document.querySelector(s);
  const S = window.AltStore;
  let PARTI = null, NOTLAR = null, ROLE = null;
  const remoteOK = { parti:false, notlar:false, karakterler:false };   // bulut doğrulanmadan buluta yazılmaz
  let charFrameReady = false, pendingChars = null;

  /* ---------- yardımcılar ---------- */
  function toast(msg){
    const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(t._tm); t._tm = setTimeout(()=>t.classList.add('hidden'), 2600);
  }
  function modal(html){
    $('#modal-card').innerHTML = html;
    $('#modal-root').classList.remove('hidden');
  }
  function closeModal(){ $('#modal-root').classList.add('hidden'); }
  $('#modal-root').addEventListener('click', (e)=>{ if(e.target.id==='modal-root') closeModal(); });
  window.altKapat = closeModal;

  async function kaydetParti(){
    const kilit = S.mode==='supabase' && !remoteOK.parti;
    const tamam = await S.set('parti', PARTI, kilit);
    S.markSeen('parti', PARTI); guncelleSync(tamam && !kilit);
    if(kilit) toast('⚠ Bulut doğrulanmadı — değişiklik henüz buluta yazılmadı');
    else if(S.mode==='supabase') sonYazma(tamam);
  }

  function sonYazma(ok){
    const b = $('#sync-badge');
    const s = new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    b.textContent = ok ? '● '+s : '● yazılamadı';
    b.title = ok ? ('Son bulut yazımı: '+s) : 'Bulut yazımı BAŞARISIZ';
    if(!ok) toast('⚠ Buluta yazılamadı — internet/oturum kontrol et');
  }
  async function kaydetNotlar(){
    const kilit = S.mode==='supabase' && !remoteOK.notlar;
    const tamam = await S.set('notlar', NOTLAR, kilit);
    S.markSeen('notlar', NOTLAR); guncelleSync(tamam && !kilit);
  }
  function guncelleSync(ok){
    const b = $('#sync-badge');
    b.className = S.mode==='supabase' ? (ok?'on':'err') : '';
    b.title = S.mode==='supabase' ? (ok?'Senkron: bağlı':'Senkron YOK') : 'Yerel mod (tek cihaz)';
    let s = document.getElementById('durum-serit');
    if(S.mode==='supabase' && !ok){
      if(!s){
        s = document.createElement('div');
        s.id = 'durum-serit';
        s.style.cssText = 'background:#b3542e;color:#fff;text-align:center;padding:.45em .8em;font-size:.85em;font-weight:600;position:sticky;top:0;z-index:30';
        s.textContent = '⚠ BULUTA BAĞLI DEĞİL — değişiklikler kaydedilmiyor. Sayfayı yenile / tekrar giriş yap.';
        document.getElementById('view-main').prepend(s);
      }
    } else if(s){ s.remove(); }
  }

  /* ---------- giriş ---------- */
  async function girisDene(){
    const p = $('#login-pass').value.trim();
    if(!p) return;
    $('#login-btn').disabled = true;
    const r = await S.login(p);
    $('#login-btn').disabled = false;
    if(!r){
      const e = $('#login-err');
      e.textContent = (S.sonHata && S.sonHata()) ? S.sonHata() : 'Şifre yanlış.';
      e.classList.remove('hidden');
      return;
    }
    baslat(r);
  }
  $('#login-btn').addEventListener('click', girisDene);
  $('#login-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') girisDene(); });
  $('#logout-btn').addEventListener('click', ()=>{ S.logout(); location.reload(); });
  $('#mode-badge').textContent = S.mode==='supabase'
    ? 'Bulut modu — cihazlar arası senkron açık'
    : 'YEREL MOD — veriler yalnız bu cihazda (SETUP.md ile buluta geç)';

  S.oturumBittiginde(()=>{
    toast('Oturum süresi doldu — lütfen tekrar gir (verin bulutta duruyor)');
    setTimeout(()=>location.reload(), 1500);
  });

  /* ---------- ana başlangıç ---------- */
  async function baslat(role){
    ROLE = role;
    $('#view-login').classList.add('hidden');
    $('#view-main').classList.remove('hidden');
    const rb = $('#role-badge');
    rb.textContent = role==='dm' ? 'DM' : 'Oyuncu';
    rb.className = role==='dm' ? 'dm' : '';
    if(role==='dm'){ $('#tab-dm').classList.remove('hidden'); $('#tab-kasa').classList.remove('hidden'); }

    async function guvenliYukle(key, seed){
      if(S.mode!=='supabase'){
        remoteOK[key] = true;
        const yerel = await S.get(key);
        return yerel || (seed ? JSON.parse(JSON.stringify(seed)) : null);
      }
      for(let deneme=0; deneme<3; deneme++){
        const r = await S.getRemote(key);
        if(r.status==='ok'){ remoteOK[key]=true; return r.value; }
        if(r.status==='empty'){
          remoteOK[key]=true;
          // Bulut boş: önce BU CİHAZDAKİ kaydı yükselt (tohum en son çare)
          let yerel = null;
          try{ const s = localStorage.getItem('altsite_'+key); if(s) yerel = JSON.parse(s); }catch(e){}
          const v = yerel || (seed ? JSON.parse(JSON.stringify(seed)) : null);
          if(v){ await S.set(key, v); if(yerel) toast('Bu cihazdaki kayıt buluta taşındı'); }
          return v;
        }
        if(deneme<2) await new Promise(x=>setTimeout(x, 1800));
      }
      guncelleSync(false);
      toast('⚠ Bulut alınamadı — son yerel kopya gösteriliyor; değişiklikler buluta yazılmayacak');
      const yerel = await S.get(key);
      return yerel || (seed ? JSON.parse(JSON.stringify(seed)) : null);
    }

    PARTI  = await guvenliYukle('parti',  window.ALT_SEED.parti);
    NOTLAR = await guvenliYukle('notlar', window.ALT_SEED.notlar);
    S.markSeen('parti', PARTI); S.markSeen('notlar', NOTLAR);
    guncelleSync(remoteOK.parti);

    const chars = await guvenliYukle('karakterler', null);
    if(chars){ pendingChars = chars; pushChars(); }

    cizKasa(); cizNotlar(); if(role==='dm') cizDM();

    S.poll(['parti','notlar','karakterler'], (k,v)=>{
      if(k==='parti'){ remoteOK.parti=true; PARTI=v; cizKasa(); toast('Kasa/envanter güncellendi'); }
      if(k==='notlar'){ remoteOK.notlar=true; NOTLAR=v; cizNotlar(); $('#not-dot').classList.remove('hidden'); }
      if(k==='karakterler'){ remoteOK.karakterler=true; pendingChars=v; pushChars(); toast('Karakterler güncellendi'); }
    }, 5000);
  }

  /* ---------- karakter motoru köprüsü ---------- */
  window.addEventListener('message', async (e)=>{
    const m = e.data;
    if(!m) return;
    if(m.type==='alt-ready'){ charFrameReady = true; pushChars(); }
    if(m.type==='alt-save' && m.data){
      const kilit = S.mode==='supabase' && !remoteOK.karakterler;
      const tamam = await S.set('karakterler', m.data, kilit);
      S.markSeen('karakterler', m.data);
      guncelleSync(tamam && !kilit);
      if(kilit) toast('⚠ Bulut doğrulanmadı — karakter değişikliği buluta yazılmadı');
    }
  });
  function pushChars(){
    if(charFrameReady && pendingChars){
      $('#char-frame').contentWindow.postMessage({type:'alt-load', data:pendingChars}, '*');
      pendingChars = null;
    }
  }

  /* ---------- sekmeler ---------- */
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      ['karakterler','harita','dunya','kasa','notlar','dm'].forEach(p=>$('#pane-'+p).classList.add('hidden'));
      const fr2 = $('#pane-'+t.dataset.tab+' iframe.tab-frame');
      if(fr2 && !fr2.src) fr2.src = fr2.dataset.src;   // sekme ilk açılınca yükle
      $('#pane-'+t.dataset.tab).classList.remove('hidden');
      if(t.dataset.tab==='notlar') $('#not-dot').classList.add('hidden');
    });
  });

  /* ---------- KASA & ENVANTER ---------- */
  function cizKasa(){
    const k = PARTI.kasa;
    const paraKart = (id,lab,val,cls)=>`
      <div class="para ${cls||''}">
        <div class="v" id="p-${id}">${val}</div><div class="l">${lab}</div>
        <div class="adj">
          <button onclick="altPara('${id}',-1)">−</button>
          <button onclick="altPara('${id}',1)">+</button>
          <button onclick="altPara('${id}',-10)" title="−10">≪</button>
          <button onclick="altPara('${id}',10)" title="+10">≫</button>
        </div>
      </div>`;
    let html = `<h2 class="sec">Parti Kasası</h2>
      <div class="kasa-grid">
        ${paraKart('temiz_gumus','Temiz Gümüş',k.temiz_gumus)}
        ${paraKart('isaretli_gumus','İşaretli Gümüş',k.isaretli_gumus,'isaretli')}
        ${paraKart('bakir','Bakır',k.bakir)}
        ${paraKart('altin','Altın',k.altin)}
      </div>
      <p class="muted" style="margin-top:.5em">${PARTI.kasa_notu||''} ${ROLE==='dm'?`<button class="btn ghost small-btn" onclick="altKasaNot()">✎</button>`:''}</p>
      <h2 class="sec" style="margin-top:1.2em">Envanter</h2>
      <div class="card">`;
    PARTI.envanter.forEach((it,i)=>{
      if(it.gizli && ROLE!=='dm') return;   // oyunculardan gizli
      html += `<div class="env-item">
        <span class="ad" onclick="altDetay(${i})">${it.ad}</span>
        ${it.gizli?`<span class="etiket" title="Oyuncular bu eşyayı görmez">👁 gizli</span>`:''}
        ${it.etiket?`<span class="etiket ${it.etiket}">${it.etiket==='riskli'?'⚠ riskli':'★ önemli'}</span>`:''}
        <span class="adet">×${it.adet}</span>
      </div>`;
    });
    html += `</div>`;
    if(ROLE==='dm'){
      html += `<h2 class="sec">Yeni Eşya Ekle <span class="muted">(DM)</span></h2>
      <div class="card">
        <input id="ye-ad" placeholder="Eşya adı" style="width:100%;margin-bottom:.5em;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.55em .7em">
        <textarea id="ye-detay" placeholder="Açıklama — nasıl çalışır, kuralı ne? (kalın için <b>...</b> kullanabilirsin)"></textarea>
        <div style="display:flex;gap:.6em;margin-top:.5em;flex-wrap:wrap;align-items:center">
          <label class="muted">Adet <input id="ye-adet" type="number" value="1" min="1" style="width:4.5em;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.3em .4em"></label>
          <label class="muted"><input type="checkbox" id="ye-gizli"> 👁 gizle</label>
          <select id="ye-etiket" style="background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.4em">
            <option value="">etiket yok</option><option value="onemli">★ önemli</option><option value="riskli">⚠ riskli</option>
          </select>
          <select id="ye-tip" style="background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.4em">
            <option value="detay">normal eşya</option><option value="ic">kullanılabilir (tüketilir)</option>
          </select>
          <button class="btn primary" onclick="altYeniEkle()">Ekle</button>
        </div>
      </div>`;
      html += `<h2 class="sec">Katalogdan Ekle <span class="muted">(DM)</span></h2><div class="card">`;
      window.ALT_SEED.katalog.forEach((c,i)=>{
        html += `<div class="env-item"><span class="ad">${c.ad} <span class="muted">· ${c.fiyat}</span></span>
                 <button class="btn small-btn" onclick="altKatalogEkle(${i})">Ekle</button></div>`;
      });
      html += `</div>`;
    }
    $('#pane-kasa').innerHTML = html;
  }

  window.altPara = function(id, d){
    PARTI.kasa[id] = Math.max(0, (PARTI.kasa[id]||0) + d);
    $('#p-'+id).textContent = PARTI.kasa[id];
    kaydetParti();
  };

  window.altKatalogEkle = function(i){
    const c = window.ALT_SEED.katalog[i];
    const mevcut = PARTI.envanter.find(x=>x.id===c.envId);
    if(mevcut) mevcut.adet++;
    else PARTI.envanter.push({id:c.envId, ad:c.ad, adet:1, tip:c.tip, detay:c.detay, etiket:''});
    kaydetParti(); cizKasa(); toast(c.ad+' envantere eklendi');
  };

  window.altDetay = function(i){
    const it = PARTI.envanter[i];
    let ekstra = '';
    if(it.tip==='ic') ekstra = `<button class="btn primary" onclick="altKullan(${i})">Kullan (1 adet düşer)</button>`;
    if(it.tip==='duduk') ekstra = `
      <button class="btn" onclick="altToast('Kısa-kısa-uzun: TEHLİKE perdesi çalındı')">Tehlike</button>
      <button class="btn" onclick="altToast('Uzun-uzun: TOPLAN perdesi çalındı')">Toplan</button>
      <button class="btn" onclick="altToast('Tek uzun düşen ton: TEMİZ perdesi çalındı')">Temiz</button>`;
    if(it.tip==='mektup') ekstra = `<button class="btn" onclick="altToast('Mühür soğuk. Açılmıyor.')">Mührü zorla</button>`;
    if(it.tip==='fener' || it.id==='fener') ekstra = `<div id="fener-alan"></div>`;
    modal(`<h3>${it.ad} <span class="muted">×${it.adet}</span></h3>
      <p>${it.detay}</p>
      <div class="butonlar">${ekstra}
        ${ROLE==='dm'?`<button class="btn ghost" onclick="altAdet(${i},-1)">− adet</button>
                       <button class="btn ghost" onclick="altAdet(${i},1)">+ adet</button>
                       <button class="btn" onclick="altDuzenle(${i})">✎ Düzenle</button>`:''}
        <button class="btn" onclick="altKapat()">Kapat</button></div>`);
    if(it.tip==='fener' || it.id==='fener') cizFener();
  };
  window.altToast = toast;
  window.altKullan = function(i){
    const it = PARTI.envanter[i];
    if(it.adet<=0) return toast('Kalmadı.');
    it.adet--;
    if(it.adet===0 && ROLE!=='dm') it.etiket='';
    kaydetParti(); cizKasa(); closeModal();
    toast(it.ad+' kullanıldı'+(it.id==='potion1'?' — 2d4+2 iyileşme zarı at!':''));
  };
  window.altKasaNot = function(){
    modal(`<h3>Kasa Notu</h3>
      <textarea id="kn-metin" style="min-height:110px">${PARTI.kasa_notu||''}</textarea>
      <div class="butonlar">
        <button class="btn primary" onclick="altKasaNotKaydet()">Kaydet</button>
        <button class="btn" onclick="altKapat()">Vazgeç</button>
      </div>`);
  };
  window.altKasaNotKaydet = function(){
    PARTI.kasa_notu = document.querySelector('#kn-metin').value.trim();
    kaydetParti(); cizKasa(); closeModal(); toast('Kasa notu güncellendi');
  };

  window.altYeniEkle = function(){
    const ad = $('#ye-ad').value.trim();
    if(!ad) return toast('Eşya adı gerekli.');
    PARTI.envanter.push({
      id: 'oz'+Date.now(),
      ad,
      adet: Math.max(1, parseInt($('#ye-adet').value)||1),
      tip: $('#ye-tip').value,
      detay: $('#ye-detay').value.trim() || '—',
      etiket: $('#ye-etiket').value,
      gizli: $('#ye-gizli').checked
    });
    kaydetParti(); cizKasa(); toast(ad+' envantere eklendi');
  };

  window.altDuzenle = function(i){
    const it = PARTI.envanter[i];
    modal(`<h3>✎ ${it.ad}</h3>
      <label class="muted">Ad</label>
      <input id="ed-ad" value="${(it.ad||'').replace(/"/g,'&quot;')}" style="width:100%;margin:.25em 0 .7em;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.55em .7em">
      <label class="muted">Açıklama</label>
      <textarea id="ed-detay" style="min-height:110px;margin-top:.25em">${it.detay||''}</textarea>
      <div style="display:flex;gap:.6em;margin-top:.7em;flex-wrap:wrap;align-items:center">
        <label class="muted">Adet <input id="ed-adet" type="number" value="${it.adet}" min="0" style="width:4.5em;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.3em .4em"></label>
        <select id="ed-etiket" style="background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.4em">
          <option value="" ${!it.etiket?'selected':''}>etiket yok</option>
          <option value="onemli" ${it.etiket==='onemli'?'selected':''}>★ önemli</option>
          <option value="riskli" ${it.etiket==='riskli'?'selected':''}>⚠ riskli</option>
        </select>
        <select id="ed-tip" style="background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.4em">
          <option value="detay" ${it.tip!=='ic'&&it.tip!=='duduk'&&it.tip!=='mektup'&&it.tip!=='fener'?'selected':''}>normal eşya</option>
          <option value="ic" ${it.tip==='ic'?'selected':''}>kullanılabilir (tüketilir)</option>
          <option value="duduk" ${it.tip==='duduk'?'selected':''}>düdük (özel)</option>
          <option value="mektup" ${it.tip==='mektup'?'selected':''}>mühürlü (özel)</option>
          <option value="fener" ${it.tip==='fener'?'selected':''}>fener (özel)</option>
        </select>
      </div>
      <label class="muted" style="display:block;margin-top:.6em"><input type="checkbox" id="ed-gizli" ${it.gizli?'checked':''}> 👁 oyunculardan gizle</label>
      <div class="butonlar">
        <button class="btn primary" onclick="altDuzenleKaydet(${i})">Kaydet</button>
        <button class="btn ghost" style="color:var(--red)" onclick="altEsyaSil(${i})">Sil</button>
        <button class="btn" onclick="altKapat()">Vazgeç</button>
      </div>`);
  };

  window.altDuzenleKaydet = function(i){
    const it = PARTI.envanter[i];
    const ad = $('#ed-ad').value.trim();
    if(!ad) return toast('Ad boş olamaz.');
    it.ad = ad;
    it.detay = $('#ed-detay').value.trim() || '—';
    it.adet = Math.max(0, parseInt($('#ed-adet').value)||0);
    it.etiket = $('#ed-etiket').value;
    it.tip = $('#ed-tip').value;
    it.gizli = $('#ed-gizli').checked;
    if(it.adet===0) PARTI.envanter.splice(i,1);
    kaydetParti(); cizKasa(); closeModal(); toast('Kaydedildi');
  };

  window.altEsyaSil = function(i){
    if(!confirm(PARTI.envanter[i].ad+' envanterden silinsin mi?')) return;
    PARTI.envanter.splice(i,1);
    kaydetParti(); cizKasa(); closeModal(); toast('Silindi');
  };

  window.altAdet = function(i,d){
    PARTI.envanter[i].adet = Math.max(0, PARTI.envanter[i].adet+d);
    if(PARTI.envanter[i].adet===0) PARTI.envanter.splice(i,1);
    kaydetParti(); cizKasa(); closeModal();
  };

  /* Fener ışık diyagramı — interaktif */
  function cizFener(){
    let acik = true;
    function r(){
      const b = acik?30:0, d = acik?30:5;         // parlak / loş (ft)
      const scale = 2.2, cx=110, cy=110;
      $('#fener-alan').innerHTML = `
        <svg class="fener-svg" width="220" height="220" viewBox="0 0 220 220">
          <circle cx="${cx}" cy="${cy}" r="${(b+d)*scale/2}" fill="#c9a22722" stroke="#c9a22755" stroke-dasharray="3 3"/>
          ${b?`<circle cx="${cx}" cy="${cy}" r="${b*scale/2}" fill="#c9a22744" stroke="#c9a227"/>`:''}
          <circle cx="${cx}" cy="${cy}" r="4" fill="#e8ded0"/>
          <text x="${cx}" y="${cy-((b||d)*scale/2)-6}" text-anchor="middle" fill="#a3968a" font-size="11">${acik?'30 ft parlak + 30 ft loş':'5 ft loş'}</text>
        </svg>
        <p class="fener-aciklama">Her kare 5 ft. ${acik?'Kapak açık — herkes sizi görür.':'Kapak kısık — süzülen tek şerit ışık.'}</p>
        <div class="butonlar" style="justify-content:center">
          <button class="btn" id="fener-tgl">${acik?'Kapağı kıs':'Kapağı aç'}</button>
        </div>`;
      $('#fener-tgl').onclick = ()=>{ acik=!acik; r(); };
    }
    r();
  }

  /* ---------- NOTLAR ---------- */
  function cizNotlar(){
    let html = `<h2 class="sec">Notlar <span class="muted">(DM yayınlar — herkes görür)</span></h2>`;
    if(ROLE==='dm'){
      html += `<div class="card"><textarea id="not-metin" placeholder="Yeni not…"></textarea>
        <div class="butonlar" style="margin-top:.5em">
          <label class="muted"><input type="checkbox" id="not-onemli"> Önemli işaretle</label>
          <button class="btn primary" onclick="altNotEkle()">Yayınla</button>
        </div></div>`;
    }
    [...NOTLAR].reverse().forEach(n=>{
      html += `<div class="not ${n.onemli?'onemli':''}">
        <div class="meta">${n.t} · ${n.kim}</div><div>${n.metin}</div></div>`;
    });
    $('#pane-notlar').innerHTML = html;
  }
  window.altNotEkle = function(){
    const m = $('#not-metin').value.trim();
    if(!m) return;
    NOTLAR.push({t:new Date().toISOString().slice(0,10), kim:'DM', metin:m, onemli:$('#not-onemli').checked});
    kaydetNotlar(); cizNotlar(); toast('Not yayınlandı');
  };

  /* ---------- DM PANELİ ---------- */
  function cizDM(){
    $('#pane-dm').innerHTML = `
      <h2 class="sec">DM Paneli</h2>
      <div class="card">
        <div class="dm-row"><span>Mod</span><span class="muted">${S.mode==='supabase'?'Bulut (Supabase) — senkron açık':'YEREL — tek cihaz; SETUP.md ile buluta geç'}</span></div>
        <div class="dm-row"><span>Karakter kayıtları</span><span class="muted">Karakterler sekmesindeki her değişiklik otomatik ortak kayda yazılır</span></div>
        <div class="dm-row"><span>Parti dinlenmesi <span class="muted">(üç karaktere birden uygular ve kaydeder)</span></span>
          <span>
            <button class="btn small-btn" onclick="altParteRest('kisa')">Kısa</button>
            <button class="btn small-btn" onclick="altParteRest('uzun')">Uzun</button>
          </span></div>
        <div class="dm-row"><span>Bu cihazdaki otomatik yedekler <span class="muted">(son 8 sürüm)</span></span>
          <button class="btn small-btn" onclick="altYerelYedekler('parti')">Kasa/Envanter</button>
          <button class="btn small-btn" onclick="altYerelYedekler('karakterler')">Karakterler</button></div>
      </div>
      <h2 class="sec">Kurtarma <span class="muted">(sürüm geçmişi)</span></h2>
      <div class="card">
        <div class="dm-row"><span>Kasa &amp; envanterin eski sürümleri</span>
          <button class="btn small-btn" onclick="altGecmis('parti')">Listele</button></div>
        <div class="dm-row"><span>Karakter kayıtlarının eski sürümleri</span>
          <button class="btn small-btn" onclick="altGecmis('karakterler')">Listele</button></div>
        <div class="dm-row"><span>Bu cihazdaki kaydı buluta zorla yaz</span>
          <button class="btn small-btn" onclick="altYereliBulutaYaz()">Yükle</button></div>
        <div class="dm-row"><span><b>Bulutla karşılaştır</b> <span class="muted">— ekrandaki hâl buluta yazıldı mı?</span></span>
          <button class="btn small-btn" onclick="altDogrula()">Doğrula</button></div>
        <div class="dm-row"><span><b>Yedeği panoya kopyala</b> <span class="muted">— Claude'a yapıştır, repoya işlensin (git = kalıcı arşiv)</span></span>
          <button class="btn small-btn" onclick="altYedekKopyala()">Kopyala</button></div>
        <div id="gecmis-alan" style="margin-top:.6em"></div>
      </div>
      <p class="muted">Spoiler kuralı: bu sitede yalnız oyuncuların bilebileceği [O] bilgiler yaşar. GM sırları repoda kalır.</p>`;
  }
  window.altParteRest = function(tip){
    $('#char-frame').contentWindow.postMessage({type:'alt-rest', tip}, '*');
    toast(tip==='uzun' ? 'Parti uzun dinlendi — HP/kaynaklar yenilendi' : 'Parti kısa dinlendi');
    document.querySelector('[data-tab="karakterler"]').click();
  };

  window.altGecmis = async function(key){
    const alan = $('#gecmis-alan');
    alan.innerHTML = '<span class="muted">Yükleniyor…</span>';
    const liste = await S.gecmisAl(key);
    if(!liste.length){
      alan.innerHTML = '<span class="muted">Kayıtlı eski sürüm yok. (Geçmiş tablosu kurulduysa bundan sonraki her değişiklik saklanır.)</span>';
      return;
    }
    alan.innerHTML = liste.map((g,i)=>{
      let ozet = '';
      try{
        const v = g.value;
        if(key==='parti') ozet = (v.envanter||[]).length+' eşya · '+(v.kasa?('temiz '+v.kasa.temiz_gumus+'g'):'');
        else ozet = Object.keys(v).filter(k=>k[0]!=='_').join(', ');
      }catch(e){}
      const t = (g.kaydedildi||'').replace('T',' ').slice(0,16);
      return `<div class="dm-row"><span>${t} <span class="muted">· ${ozet}</span></span>
        <button class="btn small-btn" onclick="altGecmisGeriYukle('${key}',${g.id})">Geri yükle</button></div>`;
    }).join('');
  };

  window.altGecmisGeriYukle = async function(key, id){
    const liste = await S.gecmisAl(key);
    const kayit = liste.find(x=>x.id===id);
    if(!kayit) return toast('Sürüm bulunamadı');
    if(!confirm('Bu sürüm geri yüklenecek — şu anki hâl geçmişe kaydedilir. Devam?')) return;
    await S.set(key, kayit.value);
    S.markSeen(key, kayit.value);
    if(key==='parti'){ PARTI = kayit.value; cizKasa(); }
    if(key==='karakterler'){ pendingChars = kayit.value; pushChars(); }
    toast('Geri yüklendi');
  };

  window.altYereliBulutaYaz = async function(){
    let sayi = 0;
    for(const key of ['parti','notlar','karakterler']){
      let v = null;
      try{ const s = localStorage.getItem('altsite_'+key); if(s) v = JSON.parse(s); }catch(e){}
      if(v){ await S.set(key, v); S.markSeen(key, v); sayi++; }
    }
    toast(sayi+' kayıt buluta yazıldı');
  };

  window.altDogrula = async function(){
    const alan = $('#gecmis-alan');
    alan.innerHTML = '<span class="muted">Buluttan çekiliyor…</span>';
    const sonuc = [];
    const esler = [['parti', PARTI], ['notlar', NOTLAR]];
    for(const [key, yerel] of esler){
      const r = await S.getRemote(key);
      if(r.status!=='ok'){ sonuc.push('<div class="dm-row"><span>'+key+'</span><span style="color:var(--red)">✗ buluttan okunamadı</span></div>'); continue; }
      const ayni = JSON.stringify(r.value) === JSON.stringify(yerel);
      sonuc.push('<div class="dm-row"><span>'+key+'</span><span style="color:'+(ayni?'var(--green)':'var(--red)')+'">'+
        (ayni?'✓ bulut ekranla AYNI':'✗ FARK VAR — kaydedilmemiş değişiklik olabilir')+'</span></div>');
    }
    // karakterler: motordaki güncel hâl
    const rk = await S.getRemote('karakterler');
    sonuc.push('<div class="dm-row"><span>karakterler</span><span style="color:'+(rk.status==='ok'?'var(--green)':'var(--red)')+'">'+
      (rk.status==='ok'?'✓ bulutta kayıt var':'✗ bulutta yok/okunamadı')+'</span></div>');
    alan.innerHTML = sonuc.join('') +
      '<p class="muted" style="margin-top:.5em">Fark varsa: "Bu cihazdaki kaydı buluta zorla yaz" ile eşitleyebilirsin.</p>';
  };

  window.altYerelYedekler = function(key){
    const liste = S.yerelYedekler(key);
    const alan = $('#gecmis-alan');
    if(!liste.length){ alan.innerHTML = '<span class="muted">Bu cihazda otomatik yedek yok (yeni sistem bu andan sonrasını kaydeder).</span>'; return; }
    alan.innerHTML = liste.map((g,i)=>{
      let ozet = '';
      try{
        if(key==='parti') ozet = (g.v.envanter||[]).length+' eşya · temiz '+(g.v.kasa?g.v.kasa.temiz_gumus:'?')+'g';
        else ozet = Object.keys(g.v).filter(k=>k[0]!=='_').join(', ');
      }catch(e){}
      return `<div class="dm-row"><span>${g.t.replace('T',' ').slice(0,16)} <span class="muted">· ${ozet}</span></span>
        <button class="btn small-btn" onclick="altYerelGeriYukle('${key}',${i})">Geri yükle</button></div>`;
    }).join('');
  };

  window.altYerelGeriYukle = async function(key, i){
    const liste = S.yerelYedekler(key);
    const kayit = liste[i];
    if(!kayit) return toast('Yedek bulunamadı');
    if(!confirm('Bu yedek geri yüklenecek ve buluta yazılacak. Devam?')) return;
    await S.set(key, kayit.v);
    S.markSeen(key, kayit.v);
    if(key==='parti'){ PARTI = kayit.v; cizKasa(); }
    if(key==='karakterler'){ pendingChars = kayit.v; pushChars(); }
    toast('Yedek geri yüklendi');
  };

  window.altYedekKopyala = async function(){
    const paket = {tarih:new Date().toISOString().slice(0,16), parti:PARTI, notlar:NOTLAR};
    const metin = JSON.stringify(paket, null, 1);
    try{ await navigator.clipboard.writeText(metin); toast("Yedek panoya kopyalandı — Claude'a yapıştır"); }
    catch(e){
      modal(`<h3>Yedek</h3><p class="muted">Metni seçip kopyala:</p>
        <textarea style="min-height:200px" onclick="this.select()">${metin.replace(/</g,'&lt;')}</textarea>
        <div class="butonlar"><button class="btn" onclick="altKapat()">Kapat</button></div>`);
    }
  };

  /* altSifirla kaldırıldı (2026-08-26): tohumun canlı veriyi ezme riski — kurtarma artık geçmiş/yedek üzerinden. */

  /* ---------- oturum sürdür ---------- */
  const resumed = S.resume();
  if(resumed) baslat(resumed);
})();
