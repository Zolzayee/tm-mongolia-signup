(function () {
  'use strict';

  var MEMBERS = [], ROLES = [], DATES = [];
  var WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function parts(iso){ var p=iso.split('-').map(Number); var d=new Date(p[0],p[1]-1,p[2]); return {wd:WD[d.getDay()],mon:MON[p[1]-1],d:p[2]}; }
  function longLabel(iso){ var p=parts(iso); return p.wd+', '+p.mon+' '+p.d; }
  function keyOf(iso,role){ return iso+'_'+role; }
  function roleById(id){ for(var i=0;i<ROLES.length;i++){ if(ROLES[i].id===id) return ROLES[i]; } return null; }
  function roleLabel(id){ var r=roleById(id); return r?r.label:id; }
  // "Today" in Ulaanbaatar (UTC+8), so the grid matches the club's calendar wherever the phone is.
  var ub = new Date(Date.now()+8*3600*1000);
  var todayISO = ub.toISOString().slice(0,10);
  function isPast(iso){ return iso < todayISO; }

  function lsGet(k){ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  var me = '';
  var claims = {};
  var selected = {};
  var pendingCancel = null, pendingTimer = null;
  var busy = false, isAdmin = false, started = false, pollTimer = null;
  var clubCode = lsGet('tm_club_code'), adminCode = lsGet('tm_admin_code');

  var $ = function(id){ return document.getElementById(id); };
  var gridEl=$('grid'), nameSel=$('nameSel'), nameOther=$('nameOther'), mineEl=$('mine');
  var bar=$('bar'), barText=$('barText'), notice=$('notice'), toastEl=$('toast');

  function setNotice(msg){ if(msg){ notice.textContent=msg; notice.hidden=false; } else { notice.hidden=true; } }
  var toastTimer=null;
  function toast(msg){ toastEl.textContent=msg; toastEl.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(function(){ toastEl.hidden=true; },4500); }

  // ---- server calls
  async function api(path, opts){
    opts = opts || {};
    var h = {'content-type':'application/json'};
    if(clubCode) h['x-club-code']=clubCode;
    if(adminCode) h['x-admin-code']=adminCode;
    opts.headers = h;
    try{
      var r = await fetch(path, opts), j = null;
      try{ j = await r.json(); }catch(e){}
      return {status:r.status, body:j};
    }catch(e){ return {status:0, body:null}; }
  }

  // ---- gate
  function showGate(wrong){ $('app').hidden=true; $('gate').hidden=false; $('gateErr').hidden=!wrong; bar.hidden=true; }
  function hideGate(){ $('gate').hidden=true; $('app').hidden=false; }
  $('gateBtn').addEventListener('click', submitGate);
  $('gateInput').addEventListener('keydown', function(e){ if(e.key==='Enter') submitGate(); });
  async function submitGate(){
    clubCode = $('gateInput').value.trim(); lsSet('tm_club_code', clubCode);
    var ok = await loadConfig(true);
    if(ok){ await refresh(); startPolling(); }
  }

  // ---- config + name list + role descriptions
  async function loadConfig(fromGate){
    var r = await api('/api/config');
    if(r.status===401 && r.body && r.body.error==='bad_admin_code'){ adminCode=''; lsSet('tm_admin_code',''); r = await api('/api/config'); }
    if(r.status===401){ showGate(!!fromGate && clubCode!==''); return false; }
    if(r.status!==200 || !r.body){ setNotice('Cannot reach the sign-up server. Check your internet connection and reload the page.'); return false; }
    setNotice('');
    DATES=r.body.dates||[]; ROLES=r.body.roles||[]; MEMBERS=r.body.members||[]; isAdmin=!!r.body.admin;
    hideGate();
    buildNames(); buildInfo(); applyAdminUI(); render();
    return true;
  }

  function buildNames(){
    nameSel.textContent='';
    var o=document.createElement('option'); o.value=''; o.textContent='Choose your name'; nameSel.appendChild(o);
    MEMBERS.forEach(function(n){ var e=document.createElement('option'); e.value=n; e.textContent=n; nameSel.appendChild(e); });
    var other=document.createElement('option'); other.value='__other'; other.textContent='Other (type my name)'; nameSel.appendChild(other);
    var saved = lsGet('tm_name');
    if(saved){
      if(MEMBERS.indexOf(saved)>=0){ nameSel.value=saved; me=saved; nameOther.hidden=true; }
      else { nameSel.value='__other'; nameOther.hidden=false; nameOther.value=saved; me=saved; }
    }
  }
  nameSel.addEventListener('change', function(){
    if(nameSel.value==='__other'){ nameOther.hidden=false; nameOther.focus(); me=nameOther.value.trim(); }
    else { nameOther.hidden=true; me=nameSel.value; }
    lsSet('tm_name', me); render();
  });
  nameOther.addEventListener('input', function(){ me=nameOther.value.trim(); lsSet('tm_name', me); render(); });

  function buildInfo(){
    var dl=$('roleInfo'); dl.textContent='';
    ROLES.forEach(function(r){
      var dt=document.createElement('dt'); dt.textContent=r.label;
      var dd=document.createElement('dd'); dd.textContent=r.resp;
      dl.appendChild(dt); dl.appendChild(dd);
    });
  }

  // ---- VPE mode
  function applyAdminUI(){ $('vpeLogin').hidden=isAdmin; $('vpeTools').hidden=!isAdmin; if(isAdmin) $('vpeBox').open=true; }
  $('vpeBtn').addEventListener('click', async function(){
    var code=$('vpeInput').value.trim(); if(!code) return;
    adminCode=code; lsSet('tm_admin_code', code);
    var r = await api('/api/config');
    if(r.status===200 && r.body && r.body.admin){ isAdmin=true; $('vpeErr').hidden=true; $('vpeInput').value=''; applyAdminUI(); render(); toast('VPE mode is on.'); }
    else { adminCode=''; lsSet('tm_admin_code',''); isAdmin=false; $('vpeErr').hidden=false; }
  });
  $('vpeOut').addEventListener('click', function(){ adminCode=''; lsSet('tm_admin_code',''); isAdmin=false; applyAdminUI(); render(); toast('Signed out of VPE mode.'); });

  // ---- grid
  function cellFor(r, iso){
    var k=keyOf(iso,r.id), c=claims[k], past=isPast(iso), el;
    if(c){
      var mineHere = me && c.name===me;
      if(mineHere || isAdmin){
        el=document.createElement('button'); el.type='button';
        el.className='cell '+(mineHere?'mine':'taken')+(pendingCancel===k?' confirming':'')+((past && !isAdmin)?' past':'');
        if(pendingCancel===k){ el.textContent='Tap again to cancel'; }
        else { el.textContent=c.name; el.title = mineHere ? 'Your role. Tap to cancel.' : 'Tap to remove (VPE).'; }
        if(past && !isAdmin){ el.disabled=true; }
        el.addEventListener('click', function(){ onOwnCell(k); });
        return el;
      }
      el=document.createElement('div'); el.className='cell taken'+(past?' past':''); el.textContent=c.name; el.title=c.name; return el;
    }
    el=document.createElement('button'); el.type='button';
    var sel=!!selected[k];
    el.className='cell '+(sel?'sel':'open')+(past?' past':'');
    el.textContent = sel ? 'Selected' : 'Open';
    el.setAttribute('aria-pressed', sel?'true':'false');
    el.setAttribute('aria-label', r.label+', '+longLabel(iso)+(sel?', selected':', open'));
    if(past){ el.disabled=true; }
    el.addEventListener('click', function(){ openRole(r,iso); });
    return el;
  }

  function renderGrid(){
    gridEl.textContent='';
    var thead=document.createElement('thead'), hr=document.createElement('tr');
    var th0=document.createElement('th'); th0.className='roleh'; th0.textContent='Role'; hr.appendChild(th0);
    DATES.forEach(function(iso){
      var th=document.createElement('th'); if(isPast(iso)) th.className='past';
      var p=parts(iso); th.textContent=p.mon+' '+p.d;
      var s=document.createElement('small'); s.textContent=p.wd; th.appendChild(s);
      hr.appendChild(th);
    });
    thead.appendChild(hr); gridEl.appendChild(thead);
    var tb=document.createElement('tbody'), lastG='';
    ROLES.forEach(function(r){
      if(r.g!==lastG){
        lastG=r.g;
        var gr=document.createElement('tr'); gr.className='group';
        var gt=document.createElement('td'); gt.colSpan=DATES.length+1; gt.textContent=r.g; gr.appendChild(gt); tb.appendChild(gr);
      }
      var tr=document.createElement('tr');
      var rh=document.createElement('th'); rh.scope='row'; rh.className='roleh';
      var rb=document.createElement('button'); rb.type='button'; rb.className='rolebtn'; rb.textContent=r.label;
      var ic=document.createElement('span'); ic.className='i'; ic.setAttribute('aria-hidden','true'); ic.textContent='i'; rb.appendChild(ic);
      rb.setAttribute('aria-label','About the '+r.label+' role');
      rb.addEventListener('click', function(){ openRole(r,null); });
      rh.appendChild(rb); tr.appendChild(rh);
      DATES.forEach(function(iso){ var td=document.createElement('td'); td.appendChild(cellFor(r,iso)); tr.appendChild(td); });
      tb.appendChild(tr);
    });
    gridEl.appendChild(tb);
  }

  function myClaims(){
    var out=[]; Object.keys(claims).forEach(function(k){ var c=claims[k]; if(me && c.name===me) out.push({key:k,date:c.date,role:c.role}); });
    out.sort(function(a,b){ return a.date<b.date?-1:a.date>b.date?1:0; });
    return out;
  }

  function renderMine(){
    mineEl.textContent='';
    if(!me){ var p0=document.createElement('p'); p0.className='empty'; p0.textContent='Choose your name above to see your roles.'; mineEl.appendChild(p0); return; }
    var list=myClaims();
    if(!list.length){ var p=document.createElement('p'); p.className='empty'; p.textContent='No confirmed roles yet.'; mineEl.appendChild(p); return; }
    var ul=document.createElement('ul'); ul.className='mine-list';
    list.forEach(function(m){
      var li=document.createElement('li');
      var t=document.createElement('span'); t.textContent=longLabel(m.date)+': '+roleLabel(m.role);
      li.appendChild(t);
      if(!isPast(m.date)){
        var b=document.createElement('button'); b.type='button'; b.className='btn ghost'; b.textContent='Cancel';
        b.addEventListener('click', function(){ cancelClaim(m.key); });
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
    mineEl.appendChild(ul);
  }

  function selectedKeys(){ return Object.keys(selected).filter(function(k){ return selected[k]; }).sort(); }
  function splitKey(k){ var i=k.indexOf('_'); return {date:k.slice(0,i), role:k.slice(i+1)}; }

  function renderBar(){
    var keys=selectedKeys();
    if(!keys.length || $('app').hidden){ bar.hidden=true; return; }
    bar.hidden=false; barText.textContent='';
    var b=document.createElement('b'); b.textContent=keys.length+(keys.length===1?' role selected':' roles selected');
    barText.appendChild(b);
    barText.appendChild(document.createTextNode(': '+keys.map(function(k){ var s=splitKey(k); return longLabel(s.date)+' '+roleLabel(s.role); }).join('; ')));
    var perDate={};
    keys.forEach(function(k){ var d=splitKey(k).date; perDate[d]=(perDate[d]||0)+1; });
    myClaims().forEach(function(m){ perDate[m.date]=(perDate[m.date]||0)+1; });
    var multi=Object.keys(perDate).filter(function(d){ return perDate[d]>1 && keys.some(function(k){ return splitKey(k).date===d; }); });
    if(multi.length){
      var w=document.createElement('span'); w.id='barWarn';
      w.textContent='Heads up: more than one role on '+multi.map(longLabel).join(', ')+'. Fine if you wish, but others may want a turn.';
      barText.appendChild(w);
    }
    $('confirmBtn').disabled = busy || !me;
  }

  function render(){ renderGrid(); renderMine(); renderBar(); }

  // ---- role popup
  var dlgEl=$('roleDlg'), dlgKey=null;
  function openRole(r, iso){
    dlgKey = iso ? keyOf(iso, r.id) : null;
    $('rdTitle').textContent=r.label;
    $('rdDate').textContent = iso ? longLabel(iso) : '';
    $('rdResp').textContent=r.resp;
    $('rdBen').textContent=r.benefit||'';
    $('rdBenWrap').hidden=!r.benefit;
    var act=$('rdAct');
    if(iso){ act.hidden=false; act.textContent = selected[dlgKey] ? 'Remove from my selection' : 'Select for '+longLabel(iso); }
    else { act.hidden=true; }
    dlgEl.hidden=false;
    (iso ? act : $('rdClose')).focus();
  }
  function closeRole(){ dlgEl.hidden=true; dlgKey=null; }
  $('rdClose').addEventListener('click', closeRole);
  dlgEl.addEventListener('click', function(e){ if(e.target===dlgEl) closeRole(); });
  $('rdAct').addEventListener('click', function(){ var k=dlgKey; closeRole(); if(k) onOpenCell(k); });

  // ---- interactions
  function onOpenCell(k){
    if(!me){ toast('Choose your name first.'); nameSel.focus(); window.scrollTo({top:0,behavior:'smooth'}); return; }
    if(selected[k]) delete selected[k]; else selected[k]=true;
    render();
  }
  function onOwnCell(k){
    var c=claims[k]; if(!c) return;
    if(pendingCancel===k){ clearTimeout(pendingTimer); pendingCancel=null; cancelClaim(k); return; }
    pendingCancel=k; render();
    clearTimeout(pendingTimer); pendingTimer=setTimeout(function(){ pendingCancel=null; render(); },3500);
  }

  async function cancelClaim(k){
    var c=claims[k]; if(!c) return;
    var r = await api('/api/signups', {method:'POST', body:JSON.stringify({action:'cancel', key:k, name:c.name})});
    if(r.status===200){ toast('Cancelled: '+longLabel(c.date)+', '+roleLabel(c.role)+'.'); }
    else if(r.status===401){ showGate(clubCode!==''); return; }
    else if(r.status===403){ toast('You can only cancel your own role.'); }
    else { toast('Could not cancel. Check your connection and try again.'); }
    await refresh();
  }

  async function confirmAll(){
    if(busy) return;
    if(!me){ toast('Choose your name first.'); return; }
    var keys=selectedKeys(); if(!keys.length) return;
    busy=true; renderBar();
    var ok=0, lost=0, failed=0, past=0;
    for(var i=0;i<keys.length;i++){
      var r = await api('/api/signups', {method:'POST', body:JSON.stringify({action:'claim', key:keys[i], name:me})});
      if(r.status===200){ ok++; delete selected[keys[i]]; }
      else if(r.status===409){ lost++; delete selected[keys[i]]; }
      else if(r.status===401){ showGate(clubCode!==''); break; }
      else if(r.body && r.body.error==='past_date'){ past++; delete selected[keys[i]]; }
      else { failed++; }
    }
    busy=false;
    var msg=[];
    if(ok) msg.push('Signed up for '+ok+(ok===1?' role.':' roles.'));
    if(lost) msg.push(lost+' just taken by someone else.');
    if(past) msg.push(past+' already in the past.');
    if(failed) msg.push(failed+' could not be saved. Check your connection and try again.');
    toast(msg.join(' ')||'Nothing saved.');
    await refresh();
  }

  // ---- copy helpers
  function showCopy(title, hint, text){
    $('ovTitle').textContent=title; $('ovHint').textContent=hint; $('ovText').value=text;
    $('overlay').hidden=false; $('ovText').focus(); $('ovText').select();
  }
  async function copyOrShow(title, text, okMsg){
    try{ await navigator.clipboard.writeText(text); toast(okMsg); }
    catch(e){ showCopy(title, 'Copying was blocked here. Select all and copy it yourself.', text); }
  }
  $('ovClose').addEventListener('click', function(){ $('overlay').hidden=true; });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ $('overlay').hidden=true; closeRole(); } });

  $('clearBtn').addEventListener('click', function(){ selected={}; render(); });
  $('confirmBtn').addEventListener('click', confirmAll);
  $('msgBtn').addEventListener('click', function(){
    if(!me){ toast('Choose your name first.'); return; }
    var keys=selectedKeys(); if(!keys.length) return;
    var lines=['Hi, this is '+me+'. I would like to take these roles:'];
    keys.forEach(function(k){ var s=splitKey(k); lines.push('- '+longLabel(s.date)+': '+roleLabel(s.role)); });
    lines.push('Thank you!');
    copyOrShow('Message for the VPE', lines.join('\n'), 'Copied. Paste it into your message to the VPE.');
  });
  $('copySheet').addEventListener('click', function(){
    var rows=DATES.map(function(iso){
      return ROLES.map(function(r){ var c=claims[keyOf(iso,r.id)]; return c?c.name:''; }).join('\t');
    });
    copyOrShow('Table for the Google Sheet', rows.join('\n'), 'Copied. In the Google Sheet, click cell D2 on the Schedule tab and paste.');
  });

  // ---- data refresh
  async function refresh(){
    var r = await api('/api/signups');
    if(r.status===401){ showGate(clubCode!==''); return; }
    if(r.status!==200 || !r.body){ setNotice('Cannot reach the sign-up server. What you see may be out of date.'); return; }
    setNotice('');
    var next={}, src=r.body.claims||{};
    Object.keys(src).forEach(function(k){
      var x=src[k];
      if(x && typeof x.name==='string' && x.name && typeof x.date==='string' && typeof x.role==='string'){
        next[k]={name:x.name.slice(0,60), date:x.date, role:x.role};
      }
    });
    claims=next;
    Object.keys(selected).forEach(function(k){ if(claims[k]) delete selected[k]; });
    var t=new Date(); $('updated').textContent='Updated '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
    render();
  }
  function startPolling(){
    if(pollTimer) return;
    pollTimer=setInterval(function(){ if(document.visibilityState==='visible' && !busy && !$('app').hidden) refresh(); }, 20000);
    document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='visible' && !$('app').hidden) refresh(); });
  }

  (async function init(){
    var ok = await loadConfig(false);
    if(ok){ await refresh(); startPolling(); }
  })();
})();
