window.CA = (() => {
 const q=s=>Array.from(document.querySelectorAll(s));
 const clean=s=>(s||'').replace(/\s+/g,' ').trim();
 const links=q('a[href]').map((a,i)=>({index:i+1,text:clean(a.textContent),href:a.getAttribute('href'),url:a.href,id:a.id,eventHandler:a.hasAttribute('onclick')}));
 // Convert recognized section actions into public L6 links; preserve original href.
 const sectionURL = (raw, code) => {
   if (!/^[A-Z]{2,5}$/.test(code || '') || !/^[0-9]+(?:\.[0-9]+)*[A-Za-z]?\.?$/.test(raw || '')) return null;
   const u = new URL('https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml');
   u.searchParams.set('lawCode', code);
   u.searchParams.set('sectionNum', raw.endsWith('.') ? raw : raw + '.');
   return u.href;
 };
 const scope = new URL(location.href).searchParams;
 const lawCode = scope.get('lawCode') || scope.get('tocCode');
 for (const a of links) {
   const m = /^javascript:\s*submitCodesValues\(\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*\)\s*;?\s*$/i.exec(a.href || '');
   const url = m && location.hostname === 'leginfo.legislature.ca.gov' ? sectionURL(m[1],lawCode) : null;
   if (url) Object.assign(a,{url,level:6,code:lawCode,section:m[1].replace(/\.$/,''),url_kind:'derived_section_url'});
 }
 const urls=[...new Set(links.filter(a=>a.href&&!a.href.startsWith('#')&&!a.eventHandler&&/^https?:\/\//.test(a.url)).map(a=>a.url))];
 const levels={'codes.xhtml':1,'codesTOCSelected.xhtml':2,'codedisplayexpand.xhtml':3,'codes_displayexpandedbranch.xhtml':4,'codes_displayText.xhtml':5,'codes_displaySection.xhtml':6,'codeBillCrossRef.xhtml':7,'displayCodeAndBill.xhtml':8,'asAmendsTheBill.xhtml':9};
 const routes=urls.map(url=>{const u=new URL(url),endpoint=u.pathname.split('/').pop();return {level:levels[endpoint]??null,endpoint,code:u.searchParams.get('tocCode')||u.searchParams.get('lawCode'),url};});
 const codes=links.filter(a=>a.href.includes('codesTOCSelected.xhtml')).map((a,i)=>({index:i+1,level:2,code:new URL(a.url).searchParams.get('tocCode'),title:a.text,url:a.url}));
 const navigation=q('nav,[role="navigation"],#tabs,#system,#breadcrumbs,.horznavigation').map(e=>({tag:e.tagName,id:e.id,class:e.getAttribute('class'),links:e.querySelectorAll('a').length,text:clean(e.textContent)}));
 const tables=q('table').map((e,i)=>({index:i+1,id:e.id,rows:e.rows.length,data:Array.from(e.rows,r=>Array.from(r.cells,c=>clean(c.textContent)))}));
 const lists=q('ul,ol,dl').map(e=>({tag:e.tagName,id:e.id,items:e.children.length,text:clean(e.textContent)}));
 const css=q('link[rel="stylesheet"],style').map(e=>({type:e.tagName,url:e.href||'INLINE',media:e.getAttribute('media'),characters:e.textContent.length}));
 const js=q('script').map(e=>({url:e.src||'INLINE',type:e.type,characters:e.textContent.length}));
 const forms=Array.from(document.forms,e=>({id:e.id,method:e.method,action:e.action,controls:e.elements.length}));
 const dom=q('*').map((e,i)=>({index:i+1,tag:e.tagName,id:e.id,class:e.getAttribute('class'),parent:e.parentElement?.tagName,children:e.children.length}));
 const report=()=>({captured:new Date().toISOString(),page:{title:document.title,url:location.href,domain:location.hostname,endpoint:location.pathname.split('/').pop(),ready:document.readyState},stats:{elements:dom.length,anchors:links.length,urls:urls.length,codes:codes.length,navigation:navigation.length,tables:tables.length,lists:lists.length,styles:css.length,scripts:js.length,forms:forms.length},codes,routes,links,navigation,tables,lists,css,js,forms,dom});
 const api={sectionURL,all:report,page:()=>report().page,stats:()=>report().stats,links:()=>links,urls:()=>urls,codes:()=>codes,routes:()=>routes,nav:()=>navigation,tables:()=>tables,lists:()=>lists,css:()=>css,js:()=>js,forms:()=>forms,dom:(selector='*')=>selector==='*'?dom:q(selector).map(e=>({tag:e.tagName,id:e.id,class:e.getAttribute('class')}))};
 api.view=(name,...args)=>{if(Object.hasOwn(api,name)&&!['view','help'].includes(name)) console.table(api[name](...args));}; api.help=()=>Object.keys(api);
 return api;
})();

/* CA DOM Intelligence 3.1 — read-only extension, no requests or script evaluation. */
(() => {
  const CA = window.CA;
  if (!CA || CA.version === '3.1') return;
  const original = CA.all.bind(CA);
  const q = s => Array.from(document.querySelectorAll(s));
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const params = new URL(location.href).searchParams;
  const code = params.get('lawCode') || params.get('tocCode');
  const path = e => {
    const parts = [];
    for (; e && e.nodeType === 1; e = e.parentElement) {
      let n = 1; for (let p = e.previousElementSibling; p; p = p.previousElementSibling) if (p.localName === e.localName) n++;
      parts.unshift(`${e.localName}[${n}]`);
    }
    return '/' + parts.join('/');
  };
  // Parse only six literal arguments. Never execute the href.
  CA.parseSection = href => {
    const m = /^javascript:\s*submitCodesValues\(\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*,\s*'([^'\\]*)'\s*\)\s*;?\s*$/i.exec(href || '');
    if (!m) return null;
    return {section_raw:m[1],section:m[1].replace(/\.$/,''),arg2:m[2],year_raw:m[3],chapter_raw:m[4],bill_section_raw:m[5],source_id:m[6]};
  };
  CA.sections = () => q('a[href]').flatMap((a,i) => {
    const href=a.getAttribute('href'), r=CA.parseSection(href);
    return r ? [{index:i+1,level:6,code,...r,label:clean(a.textContent),source_url:location.href,href,path:path(a),url:location.hostname==='leginfo.legislature.ca.gov'?CA.sectionURL(r.section_raw,code):null,navigation:'JS_ACTION_REFERENCE'}] : [];
  });
  CA.hierarchy = () => q('#expandedbranchcodesid a[href]').flatMap(a => {
    let u; try {u=new URL(a.href);} catch {return [];}
    const ep=u.pathname.split('/').pop(), level=ep==='codes_displayexpandedbranch.xhtml'?4:ep==='codes_displayText.xhtml'?5:null;
    if (!level || u.origin!==location.origin) return [];
    const fields=Object.fromEntries(['division','title','part','chapter','article','nodetreepath'].map(k=>[k,u.searchParams.get(k)||null]));
    return [{level,code:u.searchParams.get('lawCode')||u.searchParams.get('tocCode'),heading:clean(a.children[0]?.textContent||a.textContent),section_range:clean(a.children[1]?.textContent)||null,...fields,url:u.href,path:path(a)}];
  });
  CA.headings = () => q('h1,h2,h3,h4,h5,h6').map(e=>({tag:e.tagName,text:clean(e.textContent),path:path(e)}));
  CA.paragraphs = () => q('p').map((e,i)=>({index:i+1,text:clean(e.textContent),path:path(e),parent:path(e.parentElement)}));
  CA.tree = () => {const nodes=q('*'), ids=new Map(nodes.map((e,i)=>[e,i+1])); return nodes.map(e=>({id:ids.get(e),parent_id:ids.get(e.parentElement)||null,tag:e.tagName,element_id:e.id||null,class:e.getAttribute('class'),path:path(e)}));};
  CA.actions = () => q('a[href],a[onclick],button[onclick]').flatMap(e=>{const href=e.getAttribute('href')||''; if(!/^javascript:/i.test(href)&&!e.hasAttribute('onclick'))return [];return [{label:clean(e.textContent),id:e.id||null,kind:CA.parseSection(href)?'SECTION_REFERENCE':'EVENT_HANDLER',path:path(e)}];});
  CA.features = () => {const s=original().stats;return {...s,section_references:CA.sections().length,hierarchy_rows:CA.hierarchy().length,headings:q('h1,h2,h3,h4,h5,h6').length,paragraphs:q('p').length,visible_text_chars:(document.body?.innerText||'').length};};
  CA.all = () => {const r=original();return {...r,version:'3.1',stats:CA.features(),sections:CA.sections(),hierarchy:CA.hierarchy(),headings:CA.headings(),paragraphs:CA.paragraphs(),tree:CA.tree(),actions:CA.actions()};};
  CA.stats=CA.features;
  CA.version='3.1';
  CA.view=(name,...args)=>{if(Object.hasOwn(CA,name)&&typeof CA[name]==='function'&&!['view','help','parseSection'].includes(name)) console.table(CA[name](...args));else console.warn('Unknown command');};
  CA.help=()=>Object.keys(CA).filter(k=>typeof CA[k]==='function');
})();


/* V3.2: unify source records without executing navigation links. */
(() => {
 const base=CA.all.bind(CA);
 const normalize=s=>s.replace(/\s+/g,' ').trim();
 const historyPattern=/^\((?:Amended|Added|Repealed|Renumbered|Enacted|Reenacted|Operative|Formerly)\b/i;
 function unify(r) {
   const u=new URL(r.page.url), scope=Object.fromEntries(['division','title','part','chapter','article'].map(k=>[k,u.searchParams.get(k)||null]));
   const paths=new Map(r.tree.map(n=>[n.path,n]));
   const parent=p=>p.slice(0,p.lastIndexOf('/'));
   const anchors=r.sections.map(s=>{const h=parent(s.path), c=parent(h);return {s,h,c};});
   const candidates=anchors.filter(a=>paths.get(a.h)?.tag==='H6' && paths.has(a.c) && anchors.filter(b=>b.s.path.startsWith(a.c+'/')).length===1);
   const owned=new Set();
   const statutes=candidates.map(({s,h,c})=>{
     const paragraphs=r.paragraphs.filter(p=>p.path.startsWith(c+'/')).map(p=>{
       owned.add(p.path);
       const role=!p.text?'blank':historyPattern.test(p.text)?'history_candidate':'body';
       return {...p,role,markers:[...p.text.matchAll(/^((?:\([A-Za-z0-9]+\)\s*)+)/g)].flatMap(m=>m[1].match(/\([A-Za-z0-9]+\)/g)||[])};
     });
     const body=paragraphs.filter(p=>p.role==='body');
     const history=paragraphs.filter(p=>p.role==='history_candidate');
     return {code:s.code,section:s.section,section_raw:s.section_raw,identity:`${s.code}:${s.section}`,source_id:s.source_id,scope,source_url:r.page.url,container_path:c,heading:r.headings.find(x=>x.path===h)?.text||s.label,url:s.url||null,js_link:{href:s.href,url:s.url||null,function:'submitCodesValues',arguments:[s.section_raw,s.arg2,s.year_raw,s.chapter_raw,s.bill_section_raw,s.source_id],anchor_path:s.path,level:6},source_metadata:{year:s.year_raw,chapter:s.chapter_raw,bill_section:s.bill_section_raw},paragraphs,statute_text:body.map(p=>p.text).join('\n\n'),history_text:history.map(p=>p.text).join('\n'),counts:{paragraphs:paragraphs.length,body:body.length,history_candidates:history.length,blank:paragraphs.filter(p=>p.role==='blank').length},warnings:[...(!body.length?['NO_BODY']:[]),...(!history.length?['NO_RECOGNIZED_HISTORY']:[])]};
   });
   const unresolved=anchors.filter(a=>!candidates.includes(a)).map(a=>a.s);
   return {statutes,validation:{section_references:anchors.length,unified_statutes:statutes.length,unresolved_references:unresolved.length,assigned_paragraphs:owned.size,unassigned_paragraphs:r.paragraphs.length-owned.size,duplicate_identities:statutes.length-new Set(statutes.map(s=>s.identity)).size,empty_body:statutes.filter(s=>!s.statute_text).length},unresolved,unassigned_paragraphs:r.paragraphs.filter(p=>!owned.has(p.path))};
 }
 CA.unify=unify;
 CA.statutes=()=>unify(base()).statutes;
 CA.statute=id=>CA.statutes().filter(s=>s.section===String(id));
 CA.validate=()=>unify(base()).validation;
 CA.statuteLinks=()=>CA.statutes().map(s=>({identity:s.identity,...s.js_link}));
 CA.statuteParagraphs=()=>CA.statutes().flatMap(s=>s.paragraphs.map(p=>({identity:s.identity,...p})));
 CA.all=()=>{const r=base();return {...r,version:'3.3',...unify(r)};};
 CA.version='3.3';
 CA.downloadStatutes=()=>{const r=CA.all();const b=new Blob([JSON.stringify({page:r.page,statutes:r.statutes,validation:r.validation,unresolved:r.unresolved,unassigned_paragraphs:r.unassigned_paragraphs},null,2)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='CA_statutes_'+new Date().toISOString().replace(/:/g,'_')+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
})();

// Export only the document currently loaded in this browser tab.
CA.txt = () => {
    const report = CA.all();
    return JSON.stringify(report, null, 2);
};
CA.download = () => {
    const u = new URL(location.href);
    const name = [u.searchParams.get('lawCode') || u.searchParams.get('tocCode') || 'ROOT', u.pathname.split('/').pop(), new Date().toISOString()].join('_').replace(/[^a-zA-Z0-9._-]/g, '_') + '.txt';
    const blob = new Blob([CA.txt()], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    console.log('Saved: ' + name);
};
/* V3.4: explicit legal graph and capture-local DOM index. */
function enrichCA34(r) {
 const byPath=new Map(r.tree.map(n=>[n.path,n]));
 const byId=new Map(r.tree.map(n=>[n.id,n]));
 const loc=p=>{const n=byPath.get(p);return {xpath:p||null,dom_index:n?.id??null,parent_dom_index:n?.parent_id??null};};
 const nodes=[],edges=[], warnings=[], map=new Map();
 function add(id,parent,type,fields={}) {
   if(map.has(id)) return map.get(id);
   const n={id,parent_id:parent,type,...fields};map.set(id,n);nodes.push(n);
   if(parent) edges.push({from:parent,to:id,relationship:'contains'});return n;
 }
 const segment=s=>encodeURIComponent(String(s));
 const u=new URL(r.page.url), params=u.searchParams;
 const code=params.get('lawCode')||params.get('tocCode');
 const kinds=['division','title','part','chapter','article'];
 add('CA',null,'jurisdiction',{label:'California'});
 function branch(c,scope,headings=[]) {
   let id='CA/'+segment(c);
   const ch=headings.find(h=>h.tag==='H3'&&h.text.endsWith(' - '+c));
   add(id,'CA','code',{label:ch?.text||c,...loc(ch?.path)});
   for(const k of kinds) {
     if(!scope[k])continue;
     const raw=scope[k], value=raw.replace(/\.$/,'');
     const h=headings.find(h=>h.tag!=='H6'&&h.text.toUpperCase().startsWith(k.toUpperCase()+' '+raw.toUpperCase()+' '));
     const next=id+'/'+k+':'+segment(value);
     add(next,id,k,{number:value,raw,label:h?.text||null,...loc(h?.path),provenance:h?'scope_and_heading':'scope'});id=next;
   } return id;
 }
 for(const c of r.codes||[]) if(c.code) add('CA/'+segment(c.code),'CA','code',{label:c.title,url:c.url});
 if(code)branch(code,Object.fromEntries(kinds.map(k=>[k,params.get(k)])),r.headings);
 for(const h of r.hierarchy||[]) if(h.code){const id=branch(h.code,h);const n=map.get(id); if(h.heading&&!n.label)n.label=h.heading;}
 for(const s of r.statutes||[]) {
   if(!s.code){warnings.push({section:s.section,reason:'MISSING_CODE'});continue;}
   const parent=branch(s.code,s.scope,r.headings), base=parent+'/section:'+segment(s.section);
   const id=map.has(base)?base+'/occurrence:'+segment(s.source_id||s.container_path):base;
   const container=loc(s.container_path), anchor=loc(s.js_link.anchor_path);
   add(id,parent,'section',{section:s.section,identity:s.identity,url:s.url,source_id:s.source_id,...container,anchor});
   Object.assign(s,{legal_path:id,parent_legal_id:parent,...container,anchor});Object.assign(s.js_link,anchor);
   let stack=[], occurrences=new Map();
   for(const [i,p] of s.paragraphs.entries()) {
     Object.assign(p,loc(p.path),{section_index:i+1,legal_section_id:id});
     // Only explicit marker sequences: ambiguous roman/letter nesting is flagged, not guessed.
     let owner=id;
     if(p.role==='body') {
       for(const marker of p.markers||[]) {
         const m=marker.slice(1,-1);let depth=/^\d+$/.test(m)?1:/^[A-Z]+$/.test(m)?2:/^[a-z]+$/.test(m)?0:-1;
         if(/^[ivxlcdm]+$/.test(m)&&stack[2]) {depth=3;warnings.push({section:s.section,xpath:p.path,reason:'ROMAN_MARKER_CANDIDATE'});}
         if(depth<0||depth>stack.length){warnings.push({section:s.section,xpath:p.path,reason:'UNRESOLVED_MARKER',marker});stack=[];break;}
         stack=stack.slice(0,depth);const par=stack.at(-1)||id;
         const b=par+'/subdivision:'+segment(m), count=(occurrences.get(b)||0)+1;occurrences.set(b,count);
         const sid=count===1?b:b+'/occurrence:'+count;
         add(sid,par,'subdivision_candidate',{marker,confidence:'heuristic',...loc(p.path)});stack.push(sid);
       }
       owner=stack.at(-1)||id;
     }
     p.legal_parent_id=owner;
     add(id+'/paragraph:'+(i+1),owner,'paragraph',{role:p.role,paragraph_index:p.index,section_index:i+1,...loc(p.path)});
   }
 }
 const dom_index=r.tree.map(n=>({...n,index:n.id,xpath:n.path,depth:n.path.split('/').length-1,child_indices:[]}));
 const ix=new Map(dom_index.map(n=>[n.id,n]));for(const n of dom_index)if(ix.has(n.parent_id))ix.get(n.parent_id).child_indices.push(n.id);
 for(const key of ['sections','headings','paragraphs','actions','hierarchy'])for(const item of r[key]||[])Object.assign(item,loc(item.path));
 for(const [i,a] of (r.links||[]).entries()){const n=dom_index.filter(n=>n.tag==='A')[i]; /* href anchors may exclude A without href: link mapping supplied by live adapter below */ if(a.path)Object.assign(a,loc(a.path));}
 for(const [i,n] of (r.dom||[]).entries())Object.assign(n,loc(r.tree[i]?.path));
 r.version='3.4';r.dom_index=dom_index;r.legal_nodes=nodes;r.legal_edges=edges;r.legal_warnings=warnings;
 r.legal_tree=nodes.filter(n=>!n.parent_id).map(root=>{function expand(n){return {...n,children:edges.filter(e=>e.from===n.id).map(e=>expand(map.get(e.to)))};}return expand(root);});
 r.validation={...(r.validation||{}),legal_nodes:nodes.length,legal_edges:edges.length,missing_parent_edges:edges.filter(e=>!map.has(e.from)||!map.has(e.to)).length,duplicate_dom_paths:r.tree.length-byPath.size,paragraphs_missing_dom_index:(r.statutes||[]).flatMap(s=>s.paragraphs).filter(p=>p.dom_index===null).length,legal_warnings:warnings.length};return r;
}

(() => {
 const base=CA.all.bind(CA);
 CA.all=()=>{const r=base(); const elements=[...document.querySelectorAll('*')], ids=new Map(elements.map((e,i)=>[e,i+1])); const anchors=[...document.querySelectorAll('a[href]')]; r.links.forEach((a,i)=>{a.path=r.tree[ids.get(anchors[i])-1]?.path||null;}); return enrichCA34(r);};
 CA.version='3.4';
 CA.legalTree=()=>CA.all().legal_tree; CA.nodes=()=>CA.all().legal_nodes; CA.edges=()=>CA.all().legal_edges; CA.domIndex=()=>CA.all().dom_index;
 CA.xpath=i=>CA.domIndex().find(n=>n.index===Number(i))?.xpath||null;
 CA.statutes=()=>CA.all().statutes; CA.validate=()=>CA.all().validation;
 CA.subdivisions=()=>CA.nodes().filter(n=>n.type==='subdivision_candidate');
 CA.legalPath=id=>CA.statutes().filter(s=>s.section===String(id)).map(s=>s.legal_path);
 CA.ancestors=id=>{const m=new Map(CA.nodes().map(n=>[n.id,n])); const out=[];for(let n=m.get(id);n;n=m.get(n.parent_id))out.unshift(n);return out;};
 CA.descendants=id=>CA.nodes().filter(n=>n.id.startsWith(id+'/'));
 CA.downloadTree=()=>{const r=CA.all(),b=new Blob([JSON.stringify({page:r.page,legal_tree:r.legal_tree,legal_nodes:r.legal_nodes,legal_edges:r.legal_edges,dom_index:r.dom_index,validation:r.validation},null,2)],{type:'text/plain'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='CA_hierarchy_'+Date.now()+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
})();

/* V3.5 precision layer: capture-local, no network requests. */
window.CA.ready = (async () => {
 const C=window.CA, base=C.all.bind(C), r=base();
 const enc=new TextEncoder();
 const hash=async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(t))),b=>b.toString(16).padStart(2,'0')).join('');
 const els=[...document.querySelectorAll('*')], byPath=new Map(r.dom_index.map(n=>[n.xpath,n]));
 const ids=new Map(els.map((e,i)=>[e,i+1]));
 const checks=[], history=[], references=[], offsets=[], hashes=[], textNodes=[];
 const check=(name,failures)=>checks.push({name,failures,status:failures?'REVIEW':'PASS'});
 // Exclude form values and arbitrary data attributes to avoid capturing session state.
 r.attributes=els.map((e,i)=>({dom_index:i+1,xpath:r.dom_index[i].xpath,attributes:Object.fromEntries([...e.attributes].filter(a=>/^(id|class|role|style|title|lang|dir|type|name|colspan|rowspan|aria-label)$/i.test(a.name)).map(a=>[a.name,a.value]))}));
 r.selectors=r.dom_index.map(n=>({dom_index:n.index,xpath:n.xpath,css:n.xpath.split('/').filter(Boolean).map(x=>x.replace(/\[(\d+)\]$/,':nth-of-type($1)')).join(' > ')}));
 const walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);let t;
 while(t=walker.nextNode()) {const p=t.parentElement;if(!p||p.closest('script,style,form input,textarea,select,button'))continue;const i=ids.get(p);const ordinal=[...p.childNodes].filter(x=>x.nodeType===3).indexOf(t)+1;textNodes.push({dom_index:i,xpath:r.dom_index[i-1].xpath+'/text()['+ordinal+']',text:t.nodeValue});}
 r.text_nodes=textNodes;
 for(const s of r.statutes){let pos=0;const parts=[];
   for(const p of s.paragraphs){const e=els[p.dom_index-1];p.raw_text=e?.textContent??null;p.sha256=await hash(p.text);if(p.role==='body'){if(parts.length)pos+=2;const start=pos;pos+=p.text.length;p.offset={start,end:pos,unit:'UTF-16',basis:'statute_text'};parts.push(p.text);offsets.push({identity:s.identity,dom_index:p.dom_index,...p.offset});}else p.offset=null;
   if(p.role==='history_candidate'){const h={identity:s.identity,xpath:p.xpath,text:p.text,action:p.text.match(/^\((\w+)/)?.[1]||null,year_candidates:[...p.text.matchAll(/\b(?:18|19|20)\d{2}\b/g)].map(m=>m[0]),date_candidates:[...p.text.matchAll(/\b(Effective|Operative|Repealed)\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},\s+\d{4})/gi)].map(m=>({type:m[1],raw:m[2]}))};history.push(h);}
   if(p.role==='body')for(const m of p.text.matchAll(/\b(Sections?)\s+(\d+(?:\.\d+)*[A-Za-z]?)/gi))references.push({identity:s.identity,dom_index:p.dom_index,raw:m[0],section_candidate:m[2],paragraph_offset:m.index,status:'unresolved'});
   }
   s.sha256=await hash(s.statute_text);s.version_identity=s.identity+':'+s.sha256; hashes.push({identity:s.identity,sha256:s.sha256,version_identity:s.version_identity});
   s.offsets_valid=parts.join('\n\n')===s.statute_text;
 }
 check('DOM index uniqueness',r.dom_index.length-new Set(r.dom_index.map(n=>n.index)).size);
 check('XPath uniqueness',r.dom_index.length-byPath.size);
 check('XPath round trip',r.dom_index.filter(n=>{try{return document.evaluate(n.xpath,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue!==els[n.index-1];}catch{return true;}}).length);
 check('DOM parent consistency',r.dom_index.filter(n=>(ids.get(els[n.index-1]?.parentElement)||null)!==n.parent_id).length);
 check('Statute offsets',r.statutes.filter(s=>!s.offsets_valid||s.paragraphs.some(p=>p.offset&&s.statute_text.slice(p.offset.start,p.offset.end)!==p.text)).length);
 const legalIds=new Set(r.legal_nodes.map(n=>n.id));check('Legal parent references',r.legal_nodes.filter(n=>n.parent_id&&!legalIds.has(n.parent_id)).length);
 check('Paragraph DOM references',r.statutes.flatMap(s=>s.paragraphs).filter(p=>byPath.get(p.xpath)?.index!==p.dom_index).length);
 check('Unresolved statutory references',r.unresolved.length);
 check('Subdivision candidates requiring review',r.legal_warnings.length);
 Object.assign(r,{version:'3.5',history,temporal:history.flatMap(h=>h.date_candidates.map(d=>({identity:h.identity,...d}))),references,offsets,hashes,precision_checks:checks,manifest:{captured:r.captured,source_url:r.page.url,hash_algorithm:'SHA-256',hash_basis:'UTF-8 normalized extracted statute_text',offset_unit:'UTF-16 code units',scope:'current document snapshot',subdivisions:'heuristic candidates'}});
 r.schema={dom_index:'capture-local element ordinal',legal_nodes:'legal hierarchy including candidate subdivisions',offsets:'half-open ranges in normalized statute text',references:'unresolved textual candidates',attributes:'allowlisted structural attributes',text_nodes:'body text nodes excluding selected controls and scripts'};
 C.version='3.5';C.all=()=>r; C.statutes=()=>r.statutes; C.validate=()=>r.validation;
 for(const [cmd,key] of Object.entries({attributes:'attributes',selectors:'selectors',textNodes:'text_nodes',offsets:'offsets',hashes:'hashes',references:'references',history:'history',temporal:'temporal',schema:'schema',manifest:'manifest',verify:'precision_checks'})) C[cmd]=()=>r[key];
 C.raw=()=>document.documentElement.outerHTML; C.source=id=>r.statutes.filter(s=>s.section===String(id)).map(s=>els[s.dom_index-1]?.outerHTML??null);
 C.compact=()=>Object.fromEntries(Object.entries(r).filter(([k])=>!['dom','tree','legal_tree'].includes(k)));
 C.console=()=>{console.group('CA DOM Intelligence V3.5');console.table(r.stats);console.table(checks);console.table(r.statutes.map(s=>({section:s.section,legal_path:s.legal_path,paragraphs:s.counts.paragraphs,dom_index:s.dom_index,url:s.url,sha256:s.sha256})));console.table(r.legal_warnings);console.log('Full report:',r);console.groupEnd();};
 C.view=(name,...args)=>{if(typeof C[name]!=='function'||['view','download','downloadTree','downloadStatutes','console'].includes(name))return console.warn('Unknown or unsupported view command');const v=C[name](...args);if(typeof v==='string')console.log(v);else console.table(v);};
 return C;
})().catch(e=>{console.error('CA V3.5 precision capture failed:',e);throw e;});

/* V3.6: passive acquisition and derived analytics. No fetch, eval, or navigation. */
window.CA.ready = window.CA.ready.then(() => {
 const C=window.CA,r=C.all(),els=[...document.querySelectorAll('*')],ids=new Map(els.map((e,i)=>[e,i+1]));
 const loc=e=>({dom_index:ids.get(e)??null,xpath:r.dom_index[(ids.get(e)||0)-1]?.xpath??null});
 const rows={},warnings=[]; const put=(k,v)=>{rows[k]=v;C[k]=()=>v;};
 const attempt=(k,f)=>{try{put(k,f());}catch(e){warnings.push({module:k,error:String(e)});put(k,[]);}};
 put('metadata',{title:document.title,language:document.documentElement.lang,charset:document.characterSet,content_type:document.contentType,compat_mode:document.compatMode,doctype:document.doctype?{name:document.doctype.name,public_id:document.doctype.publicId,system_id:document.doctype.systemId}:null,meta:[...document.querySelectorAll('meta[name],meta[property]')].filter(e=>/^(description|keywords|author|viewport|og:title|og:description)$/i.test(e.name||e.getAttribute('property'))).map(e=>({name:e.name||e.getAttribute('property'),content:e.content,...loc(e)}))});
 attempt('namespaces',()=>[...new Set(els.map(e=>e.namespaceURI))]);
 attempt('siblings',()=>els.map(e=>({...loc(e),previous:ids.get(e.previousElementSibling)??null,next:ids.get(e.nextElementSibling)??null})));
 attempt('geometry',()=>els.map(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return {...loc(e),x:b.x,y:b.y,width:b.width,height:b.height,display:s.display,visibility:s.visibility,opacity:s.opacity,has_layout_box:e.getClientRects().length>0};}));
 attempt('computedStyles',()=>els.map(e=>{const s=getComputedStyle(e);return {...loc(e),properties:Object.fromEntries(['display','position','font-family','font-size','font-weight','line-height','color','background-color','margin','padding','white-space','text-align','overflow','visibility'].map(k=>[k,s.getPropertyValue(k)]))};}));
 attempt('accessibility',()=>els.filter(e=>e.hasAttribute('role')||[...e.attributes].some(a=>a.name.startsWith('aria-'))||/^(IMG|INPUT|BUTTON|A|H[1-6])$/.test(e.tagName)).map(e=>({...loc(e),tag:e.tagName,attributes:Object.fromEntries([...e.attributes].filter(a=>/^(role|aria-[\w-]+|alt|tabindex|for)$/i.test(a.name)).map(a=>[a.name,a.value]))})));
 attempt('cssRules',()=>{const out=[];const walk=(rules,sheet,parent=[])=>{for(const [i,x] of [...rules].entries()){const path=[...parent,i+1];out.push({sheet,path,type:x.constructor.name,selector:x.selectorText??null,condition:x.conditionText??null,css_text:x.cssText,declarations:x.style?[...x.style].map(k=>({property:k,value:x.style.getPropertyValue(k),priority:x.style.getPropertyPriority(k)})):[]});if(x.cssRules)walk(x.cssRules,sheet,path);}};for(const [i,s] of [...document.styleSheets].entries()){try{walk(s.cssRules,i+1);}catch(e){warnings.push({module:'cssRules',sheet:i+1,url:s.href,error:String(e)});}}return out;});
 put('styleSheets',[...document.styleSheets].map((s,i)=>({index:i+1,url:s.href,disabled:s.disabled,media:s.media.mediaText,...loc(s.ownerNode)})));
 put('inlineStyles',[...document.querySelectorAll('style')].map(e=>({...loc(e),text:e.textContent})));
 put('inlineScripts',[...document.querySelectorAll('script:not([src])')].map(e=>({...loc(e),type:e.type,characters:e.textContent.length,source:e.textContent}))); 
 // Source may include embedded session state: only include script text in explicit source export.
 put('scriptDeclarations',rows.inlineScripts.flatMap(s=>[...s.source.matchAll(/\b(function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)].map(m=>({dom_index:s.dom_index,kind:m[1],name:m[2],offset:m.index,status:'lexical_candidate'}))));
 put('resources',performance.getEntriesByType('resource').map(e=>({url:e.name,initiator:e.initiatorType,duration_ms:e.duration,transfer_bytes:e.transferSize,decoded_bytes:e.decodedBodySize})));
 put('performance',performance.getEntriesByType('navigation').map(e=>({type:e.type,duration_ms:e.duration,dom_interactive_ms:e.domInteractive,load_end_ms:e.loadEventEnd,transfer_bytes:e.transferSize})));
 const sentences=[],words=[],semantics=[],frequency=new Map(),docFreq=new Map(),features=[],bigrams=new Map(),trigrams=new Map();
 const seg=(granularity)=>new Intl.Segmenter('en',{granularity});const ss=seg('sentence'),ws=seg('word');
 const patterns=[['prohibition',/\b(?:shall not|must not|may not)\b/gi],['obligation',/\b(?:shall|must)\b(?!\s+not\b)/gi],['permission',/\bmay\b(?!\s+not\b)/gi],['exception',/\b(?:unless|except)\b/gi],['priority',/\bnotwithstanding\b/gi],['dependency',/\b(?:subject to|pursuant to)\b/gi],['time_candidate',/\bwithin\s+\d+\s+(?:days?|months?|years?|hours?)\b/gi]];
 for(const s of r.statutes){const counts=new Map();let sentenceCount=0,wordCount=0;for(const p of s.paragraphs.filter(p=>p.role==='body')){const base={identity:s.identity,legal_path:s.legal_path,dom_index:p.dom_index,xpath:p.xpath,section_index:p.section_index};for(const x of ss.segment(p.text)){sentences.push({...base,index:sentences.length+1,text:x.segment,start:x.index,end:x.index+x.segment.length});sentenceCount++;}const terms=[];for(const x of ws.segment(p.text)){if(!x.isWordLike)continue;const term=x.segment.toLocaleLowerCase('en');words.push({...base,index:words.length+1,text:x.segment,term,start:x.index,end:x.index+x.segment.length});terms.push(term);wordCount++;counts.set(term,(counts.get(term)||0)+1);frequency.set(term,(frequency.get(term)||0)+1);}for(const [n,bag] of [[2,bigrams],[3,trigrams]])for(let i=0;i+n<=terms.length;i++){const k=terms.slice(i,i+n).join(' ');bag.set(k,(bag.get(k)||0)+1);}for(const [kind,re] of patterns)for(const m of p.text.matchAll(re))semantics.push({...base,kind,text:m[0],start:m.index,end:m.index+m[0].length,status:'lexical_candidate'});}
 for(const t of counts.keys())docFreq.set(t,(docFreq.get(t)||0)+1);features.push({identity:s.identity,legal_path:s.legal_path,characters:s.statute_text.length,paragraphs:s.counts.body,sentences:sentenceCount,words:wordCount,unique_terms:counts.size,term_counts:[...counts]});}
 put('sentences',sentences);put('words',words);C.tokens=C.words;put('semantics',semantics);const sorted=m=>[...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([term,count])=>({term,count}));put('frequency',sorted(frequency));put('bigrams',sorted(bigrams));put('trigrams',sorted(trigrams));C.ngrams=n=>n===2?rows.bigrams:n===3?rows.trigrams:[];C.vocabulary=()=>rows.frequency.map(x=>x.term);
 put('matrix',features.map(({term_counts,...f})=>f));put('tfidf',features.map(f=>({identity:f.identity,terms:f.term_counts.map(([term,count])=>({term,weight:count*(Math.log((1+features.length)/(1+docFreq.get(term)))+1)}))})));
 const nodeIds=r.legal_nodes.map(n=>n.id),nodeMap=new Map(nodeIds.map((x,i)=>[x,i]));put('adjacency',{format:'COO',shape:[nodeIds.length,nodeIds.length],node_ids:nodeIds,entries:r.legal_edges.map(e=>[nodeMap.get(e.from),nodeMap.get(e.to),1])});
 C.cosine=(a,b)=>{const x=rows.tfidf.find(f=>f.identity===a),y=rows.tfidf.find(f=>f.identity===b);if(!x||!y)return null;const m=new Map(y.terms.map(t=>[t.term,t.weight]));const dot=x.terms.reduce((z,t)=>z+t.weight*(m.get(t.term)||0),0),norm=f=>Math.sqrt(f.terms.reduce((z,t)=>z+t.weight*t.weight,0));return norm(x)*norm(y)?dot/(norm(x)*norm(y)):null;};
 put('acquisitionWarnings',warnings);put('modules',{document:['metadata','namespaces'],dom:['siblings','geometry','computedStyles','accessibility','domIndex','attributes','textNodes'],css:['cssRules','styleSheets','inlineStyles'],javascript:['inlineScripts','scriptDeclarations'],navigation:['links','routes','resources','performance'],legislation:['statutes','legalTree','nodes','edges'],linguistics:['sentences','words','frequency','ngrams'],semantics:['semantics','references','history','temporal'],mathematics:['matrix','tfidf','adjacency','cosine'],integrity:['hashes','manifest'],validation:['verify','acquisitionWarnings'],export:['console','download','compact','downloadSource','markdown']});
 // Default report excludes inline script bodies; explicit source export is separate.
 const {inlineScripts,...safeRows}=rows;Object.assign(r,{version:'3.6',...safeRows,inline_script_metadata:inlineScripts.map(({source,...s})=>s)});C.version='3.6';r.manifest.derived_units='UTF-16 offsets within normalized paragraph text';r.manifest.source_bodies='inline JS and full HTML excluded from default export; explicit source export may contain session data';
 r.precision_checks.push({name:'Word offsets',failures:words.filter(w=>{const p=r.paragraphs.find(p=>p.dom_index===w.dom_index);return !p||p.text.slice(w.start,w.end)!==w.text;}).length,status:'PENDING'});const last=r.precision_checks.at(-1);last.status=last.failures?'REVIEW':'PASS';
 C.markdown=()=>r.statutes.map(s=>`## ${s.identity}\n\n${s.url||''}\n\n${s.statute_text}\n\n${s.history_text}`).join('\n\n');
 C.downloadSource=()=>{const b=new Blob([JSON.stringify({warning:'May contain session or embedded sensitive data; keep local',page:r.page,html:C.raw(),inlineScripts},null,2)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='CA_SOURCE_'+Date.now()+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const oldConsole=C.console;C.console=()=>{oldConsole();console.group('CA V3.6 acquisition');console.table(Object.entries(rows.modules).map(([module,commands])=>({module,commands:commands.join(', ')})));console.table(Object.entries(rows).filter(([k,v])=>Array.isArray(v)).map(([registry,v])=>({registry,records:v.length})));console.table(r.precision_checks);console.table(warnings);console.table(rows.matrix);console.log('Complete V3.6 report',r);console.groupEnd();};
 C.view=(name,...args)=>{if(!Object.hasOwn(C,name)||typeof C[name]!=='function'||/^(download|console|view|unify)/.test(name))return console.warn('Unknown or unsupported command');const x=C[name](...args);if(typeof x==='string')console.log(x);else console.table(x);};
 return C;
}).catch(e=>{console.error('CA V3.6 acquisition failed',e);throw e;});

/* V3.7: pure snapshot analytics; no network or DOM mutation. */
async function deepenCA37(r, hash) {
 const statutes=r.statutes, byId=new Map(statutes.map(s=>[s.identity,s])), paragraphs=new Map(statutes.flatMap(s=>s.paragraphs.map(p=>[p.dom_index,p]))), terms=new Map(), docs=new Map(statutes.map(s=>[s.identity,new Map()])), forward=new Map(), markers=[];
 const add=(m,k,v)=>{if(!m.has(k))m.set(k,[]);m.get(k).push(v);};
 for(const w of r.words){const p=paragraphs.get(w.dom_index);const prefix=p?.text.match(/^\s*(?:\([A-Za-z0-9]+\)\s*)+/)?.[0]||'';if(w.end<=prefix.length){markers.push(w.index);continue;}add(terms,w.term,w.index);add(forward,w.identity,w.index);const d=docs.get(w.identity);d.set(w.term,(d.get(w.term)||0)+1);}
 const lengths=new Map([...docs].map(([id,d])=>[id,[...d.values()].reduce((a,b)=>a+b,0)])), N=docs.size, avg=[...lengths.values()].reduce((a,b)=>a+b,0)/Math.max(1,N), df=new Map();for(const d of docs.values())for(const t of d.keys())df.set(t,(df.get(t)||0)+1);
 const search=(query,limit=10)=>{const q=[...new Set([...new Intl.Segmenter('en',{granularity:'word'}).segment(String(query))].filter(x=>x.isWordLike).map(x=>x.segment.toLocaleLowerCase('en')))];return [...docs].map(([identity,d])=>({identity,url:byId.get(identity).url,score:q.reduce((sum,t)=>{const f=d.get(t)||0;return sum+(f?Math.log(1+(N-(df.get(t)||0)+.5)/((df.get(t)||0)+.5))*f*2.2/(f+1.2*(.25+.75*lengths.get(identity)/(avg||1))):0);},0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.identity.localeCompare(b.identity)).slice(0,Math.max(0,limit));};
 const citation_graph=r.references.map(x=>{const code=byId.get(x.identity)?.code;const candidate=code+':'+x.section_candidate;return {...x,from:x.identity,to_candidate:byId.has(candidate)?candidate:null,status:byId.has(candidate)?'same_code_candidate_unverified':'unresolved'};});
 const rules=r.semantics.map(x=>({...x,context:paragraphs.get(x.dom_index)?.text||'',status:'lexical_candidate_not_executable'}));
 const definitions=[];for(const s of statutes)for(const p of s.paragraphs.filter(p=>p.role==='body'))for(const m of p.text.matchAll(/(?:[“"]([^”"\n]{1,100})[”"]\s+(?:means|includes|does not include)\b)/gi))definitions.push({identity:s.identity,dom_index:p.dom_index,term:m[1],start:m.index,end:m.index+m[0].length,text:p.text,status:'candidate'});
 const wordsByIndex=new Map(r.words.map(w=>[w.index,w])), pairCounts=new Map();for(const ids of forward.values())for(let i=0;i<ids.length;i++)for(let j=i+1;j<Math.min(ids.length,i+6);j++){const a=wordsByIndex.get(ids[i]),b=wordsByIndex.get(ids[j]);if(a.dom_index!==b.dom_index)break;const k=JSON.stringify([a.term,b.term].sort());pairCounts.set(k,(pairCounts.get(k)||0)+1);}
 const entropy=[...docs].map(([identity,d])=>({identity,bits_per_token:[...d.values()].reduce((z,f)=>{const p=f/(lengths.get(identity)||1);return z-p*Math.log2(p);},0)}));
 const unicode=statutes.map(s=>{const counts=new Map();for(const c of s.statute_text){const k=c.codePointAt(0);counts.set(k,(counts.get(k)||0)+1);}return {identity:s.identity,utf16_units:s.statute_text.length,utf8_bytes:new TextEncoder().encode(s.statute_text).length,code_points:[...counts].sort((a,b)=>a[0]-b[0]).map(([code,count])=>({code,count,hex:'U+'+code.toString(16).toUpperCase().padStart(4,'0')}))};});
 const vec=[...docs].map(([identity,d])=>{const v=new Map([...d].map(([t,f])=>[t,f*(1+Math.log((1+N)/(1+df.get(t))))]));return {identity,v,n:Math.hypot(...v.values())};});const similarity=[];const parent=new Map(vec.map(v=>[v.identity,v.identity]));const root=x=>{while(parent.get(x)!==x)x=parent.get(x);return x;};for(let i=0;i<vec.length;i++)for(let j=i+1;j<vec.length;j++){const a=vec[i],b=vec[j],score=a.n*b.n?[...a.v].reduce((z,[t,w])=>z+w*(b.v.get(t)||0),0)/(a.n*b.n):0; similarity.push({a:a.identity,b:b.identity,score});if(score>=.65)parent.set(root(a.identity),root(b.identity));}const clusters=new Map();for(const x of vec)add(clusters,root(x.identity),x.identity);
 const leaves=await Promise.all(statutes.map(async s=>({identity:s.identity,hash:await hash(JSON.stringify(['leaf',s.identity,s.sha256]))})));let level=leaves.map(x=>x.hash),levels=[level];while(level.length>1){const next=[];for(let i=0;i<level.length;i+=2)next.push(await hash(JSON.stringify(['node',level[i],level[i+1]||level[i]])));levels.push(next);level=next;}
 const shapes=new Map();for(const n of r.dom_index){const key=n.xpath.replace(/\[\d+\]/g,'[]');shapes.set(key,(shapes.get(key)||0)+1);}
 const css_ast=r.cssRules.map(x=>({...x,kind:'CSSOM_rule_record',parent_path:x.path.slice(0,-1)}));
 const deep={unicode,token_index:{forward:[...forward],inverted:[...terms],excluded_marker_indices:markers},citation_graph,rules,definitions,cooccurrence:[...pairCounts].map(([k,count])=>({terms:JSON.parse(k),count})),entropy,similarity,clusters:[...clusters.values()],merkle:{algorithm:'SHA-256',encoding:'JSON UTF-8, domain separated; odd leaf duplicated',root:level[0]||null,leaves,levels},fingerprint:{content:await hash(JSON.stringify(leaves)),template:await hash(JSON.stringify([...shapes].sort()))},schema_patterns:[...shapes].map(([path,count])=>({path,count})),css_ast};
 // Normalize the core tables; full export remains available separately.
 const normalized={capture:{captured:r.captured,page:r.page,manifest:r.manifest},statutes:statutes.map(({paragraphs,...s})=>s),paragraphs:statutes.flatMap(s=>s.paragraphs.map(p=>({...p,identity:s.identity}))),dom_nodes:r.dom_index,legal_nodes:r.legal_nodes,legal_edges:r.legal_edges,tokens:r.words.map(({xpath,legal_path,...w})=>w),sentences:r.sentences.map(({xpath,legal_path,...s})=>s),citations:citation_graph};
 const schema=`PRAGMA foreign_keys=ON;\nCREATE TABLE IF NOT EXISTS capture(id TEXT PRIMARY KEY,payload TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS statute(capture_id TEXT REFERENCES capture(id),identity TEXT, payload TEXT NOT NULL,PRIMARY KEY(capture_id,identity));\nCREATE TABLE IF NOT EXISTS record(capture_id TEXT REFERENCES capture(id),registry TEXT,ordinal INTEGER,payload TEXT NOT NULL,PRIMARY KEY(capture_id,registry,ordinal));\nCREATE INDEX IF NOT EXISTS record_registry ON record(registry);`;
 const sqlQuote=x=>"'"+String(x).replace(/'/g,"''")+"'";const sql=()=>{const id=r.captured+'|'+r.page.url,q=sqlQuote;return schema+'\nBEGIN;\n'+`INSERT INTO capture VALUES(${q(id)},${q(JSON.stringify(normalized.capture))});\n`+normalized.statutes.map(s=>`INSERT INTO statute VALUES(${q(id)},${q(s.identity)},${q(JSON.stringify(s))});`).join('\n')+'\n'+Object.entries(normalized).filter(([k])=>!['capture','statutes'].includes(k)).flatMap(([k,v])=>v.map((x,i)=>`INSERT INTO record VALUES(${q(id)},${q(k)},${i+1},${q(JSON.stringify(x))});`)).join('\n')+'\nCOMMIT;';};
 return {deep,normalized,search,sql,schema};
}
if(typeof module!=='undefined'&&module.exports)module.exports=deepenCA37;

window.CA.ready=window.CA.ready.then(async C=>{const r=C.all();const hash=async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))),b=>b.toString(16).padStart(2,'0')).join('');const x=await deepenCA37(r,hash);r.version=C.version='3.7';r.deep=x.deep;r.normalized_schema=x.schema;C.deep=()=>x.deep;for(const k of Object.keys(x.deep))C[k]=()=>x.deep[k];C.bm25=x.search;C.normalized=()=>x.normalized;C.sql=x.sql;const save=(name,data)=>{const u=URL.createObjectURL(new Blob([data],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};C.downloadNormalized=()=>save('CA_normalized_'+Date.now()+'.txt',JSON.stringify(x.normalized));C.downloadSQL=()=>save('CA_import_'+Date.now()+'.sql',x.sql());const prior=C.console;C.console=()=>{prior();console.group('CA V3.7 deep intelligence');console.table(Object.entries(x.deep).map(([registry,v])=>({registry,records:Array.isArray(v)?v.length:null})));console.table(x.deep.entropy);console.log('Merkle root',x.deep.merkle.root);console.groupEnd();};C.console();C.download();return C;}).catch(e=>{console.error('V3.7 failed',e);throw e;});
