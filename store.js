/* Altıdünya Parti Defteri — veri katmanı
   İki mod: YEREL (localStorage) · SUPABASE (kv tablosu + GoTrue)
   Anahtarlar: 'karakterler' (motorun D nesnesi) · 'parti' · 'notlar'
   v2: refresh-token ile otomatik oturum yenileme — jeton ölünce veri "eskiye dönmez" */
(function(){
  const CFG = window.ALT_CONFIG || {};
  const SB = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) && location.search.indexOf('yerel=1') === -1;   // ?yerel=1 = bulutu kapat
  const LS = (k)=>'altsite_'+k;
  let jwt = null, refresh = null, role = null;
  let oturumOldu = null;   // oturum kurtarılamazsa çağrılır (app.js atar)

  const DM_EMAIL = 'dm@altidunya.local';
  const PARTI_EMAIL = 'parti@altidunya.local';

  function oturumKaydet(){
    try{ localStorage.setItem('alt_oturum', JSON.stringify({jwt, refresh, role})); }catch(e){}
  }
  function oturumTemizle(){
    jwt = refresh = role = null;
    try{
      localStorage.removeItem('alt_oturum');
      sessionStorage.removeItem('alt_role'); sessionStorage.removeItem('alt_jwt');
    }catch(e){}
  }

  let sonHata = '';
  async function sbAuth(email, pass){
    try{
      const r = await fetch(CFG.SUPABASE_URL+'/auth/v1/token?grant_type=password', {
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':CFG.SUPABASE_ANON_KEY},
        body: JSON.stringify({email, password: pass})
      });
      if(!r.ok){
        let d = {};
        try{ d = await r.json(); }catch(e){}
        if(r.status===429) sonHata = 'Çok fazla deneme yapıldı — Supabase giriş limiti. 15-60 dk bekle ya da Supabase panelinden şifreyi güncelle.';
        else if(r.status===400) sonHata = 'Şifre kabul edilmedi (' + (d.error_description || d.msg || 'invalid credentials') + ')';
        else sonHata = 'Sunucu hatası: HTTP ' + r.status + (d.msg ? ' — '+d.msg : '');
        console.warn('[Altıdünya] auth hatası', r.status, d);
        return null;
      }
      const j = await r.json();
      return j.access_token ? {jwt:j.access_token, refresh:j.refresh_token} : null;
    }catch(e){
      sonHata = 'Bağlantı kurulamadı (internet/CORS): ' + e.message;
      console.warn('[Altıdünya] auth istisna', e);
      return null;
    }
  }

  async function tokenYenile(){
    if(!refresh) return false;
    try{
      const r = await fetch(CFG.SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token', {
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':CFG.SUPABASE_ANON_KEY},
        body: JSON.stringify({refresh_token: refresh})
      });
      if(!r.ok) return false;
      const j = await r.json();
      if(!j.access_token) return false;
      jwt = j.access_token;
      if(j.refresh_token) refresh = j.refresh_token;
      oturumKaydet();
      return true;
    }catch(e){ return false; }
  }

  async function login(pass){
    if(SB){
      let t = await sbAuth(DM_EMAIL, pass);
      if(t){ role='dm'; }
      else { t = await sbAuth(PARTI_EMAIL, pass); if(t) role='oyuncu'; }
      if(!t) return null;
      jwt = t.jwt; refresh = t.refresh;
      oturumKaydet();
    } else {
      if(pass === (CFG.DM_SIFRE||'dm')) role='dm';
      else if(pass === (CFG.OYUNCU_SIFRE||'parti')) role='oyuncu';
      else return null;
      try{ localStorage.setItem('alt_oturum', JSON.stringify({role})); }catch(e){}
    }
    return role;
  }

  function resume(){
    try{
      const s = localStorage.getItem('alt_oturum');
      if(s){
        const o = JSON.parse(s);
        role = o.role || null; jwt = o.jwt || null; refresh = o.refresh || null;
      }
      if(!role){   // eski sürüm oturumu (sessionStorage)
        role = sessionStorage.getItem('alt_role') || null;
        jwt  = sessionStorage.getItem('alt_jwt')  || null;
      }
      if(SB && role && !jwt && !refresh) role = null;
    }catch(e){}
    return role;
  }

  function logout(){ oturumTemizle(); }

  function sbHeaders(){
    return {'apikey':CFG.SUPABASE_ANON_KEY, 'Authorization':'Bearer '+jwt, 'Content-Type':'application/json'};
  }

  /* 401/403 alırsa bir kez token yenileyip tekrar dener */
  async function sbFetch(yol, opts, ikinciDeneme){
    const o = Object.assign({}, opts||{});
    o.headers = Object.assign({}, sbHeaders(), (opts && opts.headers) || {});
    const r = await fetch(CFG.SUPABASE_URL + yol, o);
    if((r.status===401 || r.status===403) && !ikinciDeneme){
      const yenilendi = await tokenYenile();
      if(yenilendi) return sbFetch(yol, opts, true);
      oturumTemizle();
      if(typeof oturumOldu === 'function') oturumOldu();
    }
    return r;
  }

  /* Uzak durum: ok / empty / err */
  async function getRemote(key){
    if(!(SB && (jwt || refresh))) return {status:'err'};
    if(!jwt && refresh){ const y = await tokenYenile(); if(!y) return {status:'err'}; }
    try{
      const r = await sbFetch('/rest/v1/kv?key=eq.'+key+'&select=value');
      if(!r.ok) return {status:'err'};
      const j = await r.json();
      if(j.length){
        try{ localStorage.setItem(LS(key), JSON.stringify(j[0].value)); }catch(e){}
        yerelSnapshot(key, j[0].value);
        return {status:'ok', value: j[0].value};
      }
      return {status:'empty'};
    }catch(e){ return {status:'err'}; }
  }

  async function get(key){
    if(SB && (jwt || refresh)){
      const r = await getRemote(key);
      if(r.status==='ok') return r.value;
    }
    try{
      const s = localStorage.getItem(LS(key));
      if(s) return JSON.parse(s);
    }catch(e){}
    return null;
  }

  /* Her değişiklikte bu cihazda son 8 sürümü sakla — bulut çökse de kurtarılır */
  function yerelSnapshot(key, val){
    try{
      const a = 'altsite_yedek_'+key;
      const dizi = JSON.parse(localStorage.getItem(a) || '[]');
      const yeni = JSON.stringify(val);
      if(dizi.length && JSON.stringify(dizi[0].v) === yeni) return;   // değişmemişse yazma
      dizi.unshift({t: new Date().toISOString(), v: val});
      localStorage.setItem(a, JSON.stringify(dizi.slice(0,8)));
    }catch(e){}
  }
  function yerelYedekler(key){
    try{ return JSON.parse(localStorage.getItem('altsite_yedek_'+key) || '[]'); }catch(e){ return []; }
  }

  async function set(key, val, yalnizYerel){
    try{ localStorage.setItem(LS(key), JSON.stringify(val)); }catch(e){}
    yerelSnapshot(key, val);
    if(yalnizYerel) return true;
    if(SB && (jwt || refresh)){
      try{
        const r = await sbFetch('/rest/v1/kv', {
          method:'POST',
          headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},
          body: JSON.stringify([{key, value: val, updated_at: new Date().toISOString()}])
        });
        return r.ok;
      }catch(e){ return false; }
    }
    return true;
  }

  /* Sürüm geçmişi (kv_gecmis tablosu — sql/gecmis.sql kurulduysa) */
  async function gecmisAl(key){
    if(!(SB && (jwt || refresh))) return [];
    try{
      const r = await sbFetch('/rest/v1/kv_gecmis?key=eq.'+key+'&select=id,value,kaydedildi&order=kaydedildi.desc&limit=25');
      if(!r.ok) return [];
      return await r.json();
    }catch(e){ return []; }
  }

  /* Yoklama: uzak veri değiştiyse cb(key, value) */
  const snap = {};
  function poll(keys, cb, ms){
    if(!SB) return;
    setInterval(async ()=>{
      for(const k of keys){
        const r = await getRemote(k);
        if(r.status!=='ok') continue;
        const s = JSON.stringify(r.value);
        if(snap[k] && snap[k] !== s) cb(k, r.value);
        snap[k] = s;
      }
    }, ms||8000);
  }
  function markSeen(key, val){ snap[key] = JSON.stringify(val); }

  window.AltStore = { login, resume, logout, get, getRemote, set, poll, markSeen, gecmisAl, tokenYenile,
                      yerelYedekler, sonHata: ()=>sonHata,
                      mode: SB ? 'supabase' : 'yerel',
                      role: ()=>role,
                      oturumBittiginde: (fn)=>{ oturumOldu = fn; } };
})();
