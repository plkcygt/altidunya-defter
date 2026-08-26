/* Altıdünya Parti Defteri — veri katmanı
   İki mod: YEREL (localStorage) · SUPABASE (kv tablosu + GoTrue şifre girişi)
   Anahtarlar: 'karakterler' (motorun D nesnesi) · 'parti' · 'notlar'          */
(function(){
  const CFG = window.ALT_CONFIG || {};
  const SB = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) && location.search.indexOf('yerel=1') === -1;   // ?yerel=1 = bulutu kapat (test/teşhis)
  const LS = (k)=>'altsite_'+k;
  let jwt = null, role = null;

  const DM_EMAIL = 'dm@altidunya.local';
  const PARTI_EMAIL = 'parti@altidunya.local';

  async function sbAuth(email, pass){
    const r = await fetch(CFG.SUPABASE_URL+'/auth/v1/token?grant_type=password', {
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':CFG.SUPABASE_ANON_KEY},
      body: JSON.stringify({email, password: pass})
    });
    if(!r.ok) return null;
    const j = await r.json();
    return j.access_token || null;
  }

  async function login(pass){
    if(SB){
      let t = await sbAuth(DM_EMAIL, pass);
      if(t){ jwt=t; role='dm'; }
      else {
        t = await sbAuth(PARTI_EMAIL, pass);
        if(t){ jwt=t; role='oyuncu'; }
      }
      if(!role) return null;
    } else {
      if(pass === (CFG.DM_SIFRE||'dm')) role='dm';
      else if(pass === (CFG.OYUNCU_SIFRE||'parti')) role='oyuncu';
      else return null;
    }
    try{ sessionStorage.setItem('alt_role', role); if(jwt) sessionStorage.setItem('alt_jwt', jwt); }catch(e){}
    return role;
  }

  function resume(){
    try{
      role = sessionStorage.getItem('alt_role') || null;
      jwt  = sessionStorage.getItem('alt_jwt') || null;
      if(SB && role && !jwt) role = null;   // Supabase modunda jwt şart
    }catch(e){}
    return role;
  }

  function logout(){
    role=null; jwt=null;
    try{ sessionStorage.removeItem('alt_role'); sessionStorage.removeItem('alt_jwt'); }catch(e){}
  }

  function sbHeaders(){
    return {'apikey':CFG.SUPABASE_ANON_KEY, 'Authorization':'Bearer '+jwt, 'Content-Type':'application/json'};
  }

  /* Uzak durumu net döner: ok / empty / err (SB modu için) */
  async function getRemote(key){
    if(!(SB && jwt)) return {status:'err'};
    try{
      const r = await fetch(CFG.SUPABASE_URL+'/rest/v1/kv?key=eq.'+key+'&select=value', {headers: sbHeaders()});
      if(!r.ok) return {status:'err'};
      const j = await r.json();
      if(j.length){
        try{ localStorage.setItem(LS(key), JSON.stringify(j[0].value)); }catch(e){}
        return {status:'ok', value: j[0].value};
      }
      return {status:'empty'};
    }catch(e){ return {status:'err'}; }
  }

  async function get(key){
    if(SB && jwt){
      try{
        const r = await fetch(CFG.SUPABASE_URL+'/rest/v1/kv?key=eq.'+key+'&select=value', {headers: sbHeaders()});
        if(r.ok){
          const j = await r.json();
          if(j.length){ try{ localStorage.setItem(LS(key), JSON.stringify(j[0].value)); }catch(e){}; return j[0].value; }
        }
      }catch(e){ /* çevrimdışı → yerel önbellek */ }
    }
    try{
      const s = localStorage.getItem(LS(key));
      if(s) return JSON.parse(s);
    }catch(e){}
    return null;
  }

  async function set(key, val, yalnizYerel){
    try{ localStorage.setItem(LS(key), JSON.stringify(val)); }catch(e){}
    if(yalnizYerel) return true;
    if(SB && jwt){
      try{
        const r = await fetch(CFG.SUPABASE_URL+'/rest/v1/kv', {
          method:'POST',
          headers: Object.assign(sbHeaders(), {'Prefer':'resolution=merge-duplicates,return=minimal'}),
          body: JSON.stringify([{key, value: val, updated_at: new Date().toISOString()}])
        });
        return r.ok;
      }catch(e){ return false; }
    }
    return true;
  }

  /* Basit yoklama: uzak veri değiştiyse cb(key, value) */
  const snap = {};
  function poll(keys, cb, ms){
    if(!SB) return;   // yerel modda senkron edilecek uzak yok
    setInterval(async ()=>{
      for(const k of keys){
        const v = await get(k);
        const s = JSON.stringify(v);
        if(v && snap[k] && snap[k] !== s) cb(k, v);
        if(v) snap[k] = s;
      }
    }, ms||8000);
  }
  function markSeen(key, val){ snap[key] = JSON.stringify(val); }

  window.AltStore = { login, resume, logout, get, getRemote, set, poll, markSeen,
                      mode: SB ? 'supabase' : 'yerel',
                      role: ()=>role };
})();
