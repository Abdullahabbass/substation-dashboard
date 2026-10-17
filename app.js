const STORAGE='substationProgressV4';
const PHOTO_STORAGE='substationProgressPhotosV1';
const PROJECT_ID='naga-hamadi-ss';
const PHOTO_BUCKET='project-photos';
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = window.SUPABASE_PUBLISHABLE_KEY || '';
let supabaseClient = null;
let session = null;
const DEFAULT={
  project:{name:'ENERGY VALLEY - Minya SS',client:'Scatec',engineer:'Eng. Abdullah Abbas',type:'500/33/33 kV',start:'2026-01-01',finish:'2026-12-31',warn:5,crit:10},
  buildings:[
    {id:'CR',name:'Control Building',weight:20,mp:0,eq:0,activities:[
      {id:'CR-01',name:'Excavation',unit:'m³',qty:1500,weight:8,planned:100,actual:0,start:'2026-01-01',finish:'2026-01-10'},
      {id:'CR-02',name:'Blinding Concrete',unit:'m³',qty:120,weight:4,planned:100,actual:0,start:'2026-01-08',finish:'2026-01-15'},
      {id:'CR-03',name:'Footings / Foundations',unit:'m³',qty:650,weight:20,planned:80,actual:0,start:'2026-01-14',finish:'2026-02-05'},
      {id:'CR-04',name:'Pedestals / Column Necks',unit:'m³',qty:180,weight:10,planned:60,actual:0,start:'2026-02-01',finish:'2026-02-15'},
      {id:'CR-05',name:'Ground Beams',unit:'m³',qty:220,weight:10,planned:50,actual:0,start:'2026-02-10',finish:'2026-02-25'},
      {id:'CR-06',name:'Columns',unit:'m³',qty:300,weight:15,planned:35,actual:0,start:'2026-02-20',finish:'2026-03-15'},
      {id:'CR-07',name:'Beams',unit:'m³',qty:240,weight:13,planned:20,actual:0,start:'2026-03-05',finish:'2026-03-25'},
      {id:'CR-08',name:'Roof Slab',unit:'m³',qty:180,weight:10,planned:10,actual:0,start:'2026-03-20',finish:'2026-04-10'},
      {id:'CR-09',name:'Backfilling',unit:'m³',qty:500,weight:10,planned:0,actual:0,start:'2026-04-01',finish:'2026-04-15'}
    ]},
    {id:'TR1',name:'Transformer 01',weight:15,mp:0,eq:0,activities:[
      {id:'TR1-01',name:'Excavation',unit:'m³',qty:900,weight:15,planned:100,actual:0,start:'2026-01-10',finish:'2026-01-25'},
      {id:'TR1-02',name:'Blinding Concrete',unit:'m³',qty:65,weight:5,planned:100,actual:0,start:'2026-01-22',finish:'2026-01-30'},
      {id:'TR1-03',name:'Raft Foundation',unit:'m³',qty:320,weight:35,planned:65,actual:0,start:'2026-01-28',finish:'2026-02-20'},
      {id:'TR1-04',name:'Walls',unit:'m³',qty:220,weight:25,planned:40,actual:0,start:'2026-02-15',finish:'2026-03-10'},
      {id:'TR1-05',name:'Waterproofing',unit:'m²',qty:700,weight:10,planned:20,actual:0,start:'2026-03-05',finish:'2026-03-20'},
      {id:'TR1-06',name:'Backfilling',unit:'m³',qty:450,weight:10,planned:0,actual:0,start:'2026-03-18',finish:'2026-03-30'}
    ]},
    {id:'TR2',name:'Transformer 02',weight:10,mp:0,eq:0,activities:[]},
    {id:'TR3',name:'Transformer 03',weight:10,mp:0,eq:0,activities:[]},
    {id:'GIS',name:'GIS Building',weight:15,mp:0,eq:0,activities:[]},
    {id:'SW',name:'Switchyard',weight:15,mp:0,eq:0,activities:[]},
    {id:'CT',name:'Cable Trench',weight:10,mp:0,eq:0,activities:[]},
    {id:'RD',name:'Internal Roads',weight:5,mp:0,eq:0,activities:[]},
    {id:'FT',name:'Fire Fighting Tank',weight:2,mp:0,eq:0,activities:[]},
    {id:'PT',name:'Pump Room',weight:2,mp:0,eq:0,activities:[]},
    {id:'WT',name:'Water Tank',weight:2,mp:0,eq:0,activities:[]},
    {id:'GR',name:'Guard Room',weight:2,mp:0,eq:0,activities:[]}
  ],
  trades:[{name:'Carpenter + Helper',total:7},{name:'Steel Fixer',total:0},{name:'Plumber',total:1},{name:'Electricians',total:2},{name:'Labour',total:23},{name:'Builders',total:3},{name:'Scaffolder',total:3},{name:'Plasters',total:2}],
  equipmentTypes:[{name:'Excavator',total:0},{name:'Crane',total:0},{name:'Loader',total:0},{name:'Dumper',total:0},{name:'Roller',total:0}],
  mpEntries:[],eqEntries:[],pgEntries:[],manualActivities:[],availabilityMp:{},availabilityEq:{},dark:false,chartPrefs:{progressChart:'bar',manpowerChart:'line',equipmentChart:'line',distributionChart:'area',historyChart:'line',reportMpHistogram:'bar',reportEqHistogram:'bar',reportProgressHistogram:'bar',reportTrendChart:'line',reportResourceTrend:'line',reportManpowerDailyTrend:'line',reportEquipmentDailyTrend:'line',reportLocationAllocation:'bar',overviewManpowerChart:'bar',overviewEquipmentChart:'bar'}
};
const REPORT_LABEL_DEFAULTS={
  reportTitle:'DAILY MANPOWER & EQUIPMENT REPORT',
  siteOverview:'Substation Layout',
  distribution:'Resource Distribution',
  manpowerChart:'Trade Distribution',
  equipmentChart:'Equipment Distribution',
  activities:'Current Activities & Delays',
  summary:'Daily Executive Summary',
  reconciliation:'Reconciliation Status',
  photoTitle:'DAILY SITE PHOTO REPORT'
};
const REPORT_LAYOUT_DEFAULTS={
  seweragetank:{col:2,row:2,w:2,h:1,color:'map-slate'},
  firefightingtank:{col:2,row:3,w:2,h:1,color:'map-slate'},
  watertank:{col:2,row:5,w:2,h:1,color:'map-yellow'},
  pumproom:{col:2,row:6,w:2,h:1,color:'map-slate'},
  guardroom:{col:2,row:7,w:2,h:1,color:'map-slate'},
  carshed:{col:2,row:8,w:2,h:1,color:'map-slate'},
  controlbuilding:{col:4,row:4,w:2,h:3,color:'map-blue'},
  gib:{col:4,row:3,w:1,h:1,color:'map-blue'},
  gisbuilding:{col:6,row:3,w:5,h:2,color:'map-green'},
  sitemobilization:{col:9,row:5,w:1,h:1,color:'map-blue'},
  transformer01:{col:6,row:6,w:1,h:2,color:'map-orange'},
  transformer02:{col:7,row:6,w:1,h:2,color:'map-orange'},
  transformer03:{col:8,row:6,w:1,h:2,color:'map-orange'},
  transformer04:{col:9,row:6,w:1,h:2,color:'map-orange'},
  mediumvoltagebuilding:{col:6,row:8,w:4,h:1,color:'map-slate'},
  switchyard:{col:4,row:8,w:2,h:1,color:'map-slate'},
  cabletrench:{col:10,row:6,w:2,h:1,color:'map-slate'},
  internalroads:{col:10,row:7,w:2,h:2,color:'map-slate'}
};
let reportCustomizeMode=false;
let selectedLayoutBuildingId='';
let globalCustomizeMode=false;
let progressManualEditMode=false;
let globalCustomizePage='dashboard';
let selectedGlobalBlockKey='';
const GLOBAL_PAGE_NAMES={dashboard:'Dashboard',progress:'Building Progress',overview:'Overview',insert:'Insert Sheet',reports:'Reports',settings:'Settings'};
function clone(x){return JSON.parse(JSON.stringify(x))}
let chartRefs={};
let currentReportKind='daily';
let customReportFrom='';
let customReportTo='';
let overviewRangeFrom='';
let overviewRangeTo='';
function ensureReportCustomizationState(){
  state.reportLayout=state.reportLayout&&typeof state.reportLayout==='object'?state.reportLayout:{};
  state.reportPrefs=state.reportPrefs&&typeof state.reportPrefs==='object'?state.reportPrefs:{};
  state.reportPrefs.fontScale=Math.max(.85,Math.min(1.2,Number(state.reportPrefs.fontScale||1)));
  state.reportPrefs.labels=Object.assign({},REPORT_LABEL_DEFAULTS,state.reportPrefs.labels||{});
  const ls=state.reportPrefs.layoutStyle&&typeof state.reportPrefs.layoutStyle==='object'?state.reportPrefs.layoutStyle:{};
  ls.zoom=Math.max(.6,Math.min(1.5,Number(ls.zoom||1)));
  ls.canvasHeight=Math.max(240,Math.min(700,Number(ls.canvasHeight||360)));
  ls.gap=Math.max(2,Math.min(24,Number(ls.gap??10)));
  ls.padding=Math.max(0,Math.min(36,Number(ls.padding??18)));
  ls.radius=Math.max(2,Math.min(28,Number(ls.radius??12)));
  ls.nameFont=Math.max(7,Math.min(18,Number(ls.nameFont||12)));
  ls.metricsFont=Math.max(6,Math.min(14,Number(ls.metricsFont||9)));
  ls.pctFont=Math.max(7,Math.min(16,Number(ls.pctFont||9)));
  state.reportPrefs.layoutStyle=ls;
}

function ensureGlobalCustomizationState(){
  state.uiPrefs=state.uiPrefs&&typeof state.uiPrefs==='object'?state.uiPrefs:{};
  state.uiPrefs.pages=state.uiPrefs.pages&&typeof state.uiPrefs.pages==='object'?state.uiPrefs.pages:{};
  state.uiPrefs.chartHeights=state.uiPrefs.chartHeights&&typeof state.uiPrefs.chartHeights==='object'?state.uiPrefs.chartHeights:{};
  state.uiPrefs.resourceCards=state.uiPrefs.resourceCards&&typeof state.uiPrefs.resourceCards==='object'?state.uiPrefs.resourceCards:{};
  state.uiPrefs.siteLayout=state.uiPrefs.siteLayout&&typeof state.uiPrefs.siteLayout==='object'?state.uiPrefs.siteLayout:{};
  Object.keys(GLOBAL_PAGE_NAMES).forEach(page=>{
    const p=state.uiPrefs.pages[page]&&typeof state.uiPrefs.pages[page]==='object'?state.uiPrefs.pages[page]:{};
    p.fontScale=Math.max(.8,Math.min(1.3,Number(p.fontScale||1)));
    p.blocks=p.blocks&&typeof p.blocks==='object'?p.blocks:{};
    p.text=p.text&&typeof p.text==='object'?p.text:{};
    p.order=Array.isArray(p.order)?p.order:[];
    state.uiPrefs.pages[page]=p;
  });
}

const DASHBOARD_LAYOUT_SCHEMA_VERSION=38;
function ensureDashboardLayoutV38(){
  ensureGlobalCustomizationState();
  if(Number(state.uiPrefs.dashboardLayoutSchemaVersion||0)===DASHBOARD_LAYOUT_SCHEMA_VERSION)return;
  state.uiPrefs.pages.dashboard={fontScale:1,blocks:{},text:{},order:[]};
  if(state.uiPrefs.resourceCards?.dashboard)delete state.uiPrefs.resourceCards.dashboard;
  ['manpowerChart','equipmentChart','distributionChart'].forEach(id=>{
    if(state.uiPrefs.chartHeights)delete state.uiPrefs.chartHeights[id];
  });
  state.chartPrefs=Object.assign({},state.chartPrefs||{},{
    manpowerChart:'line',
    equipmentChart:'line',
    distributionChart:'area'
  });
  state.uiPrefs.dashboardLayoutSchemaVersion=DASHBOARD_LAYOUT_SCHEMA_VERSION;
}

function globalPagePrefs(page){ensureGlobalCustomizationState();return state.uiPrefs.pages[page]||state.uiPrefs.pages.dashboard}
function currentVisiblePageName(){const el=document.querySelector('.page:not(.hidden)');return el?.id?.replace('page-','')||globalCustomizePage||'dashboard'}
function sanitizeUiKey(s){return String(s||'block').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'block'}
function collectGlobalBlocks(page){
  const root=document.getElementById('page-'+page);if(!root)return[];
  const children=Array.from(root.children).filter(el=>el.id!=='reportCustomizePanel');
  children.forEach((el,i)=>{
    if(!el.dataset.uiKey){const base=el.id||sanitizeUiKey(Array.from(el.classList).filter(c=>c!=='hidden').slice(0,2).join('-'))||'block';el.dataset.uiKey=`${page}-${base}-${i+1}`;}
    el.classList.add('ui-custom-block');
    if(!el.dataset.uiBaseDisplay)el.dataset.uiBaseDisplay=getComputedStyle(el).display==='none'?'':getComputedStyle(el).display;
  });
  return children;
}
function globalBlockLabel(el){
  if(!el)return 'Block';
  const h=el.querySelector(':scope > .section-head h2,:scope > .resource-panel-head h2,:scope > .page-title h1,:scope > h1,:scope > h2,.section-head h2,.resource-panel-head h2,.page-title h1,.analytics-heading h2');
  const txt=(h?.textContent||el.id||el.classList[0]||'Block').trim();return txt.slice(0,64);
}
function editableTextNodes(block){
  if(!block||block.id==='reportContent')return[];
  return Array.from(block.querySelectorAll('h1,h2,h3,p,.eyebrow')).filter(el=>!el.closest('table')&&!el.closest('.trade-card')&&!el.closest('.activity-table')&&!el.closest('#reportContent')&&!el.closest('.progress-building-card')&&!el.closest('.layout-item')&&!el.matches('[id^="summary"]'));
}
function annotateEditableTexts(page){
  collectGlobalBlocks(page).forEach(block=>editableTextNodes(block).forEach((el,i)=>{
    if(!el.dataset.uiTextKey)el.dataset.uiTextKey=`${block.dataset.uiKey}-text-${i+1}`;
    if(el.dataset.uiBaseText===undefined)el.dataset.uiBaseText=el.textContent;
    if(!el.dataset.uiBaseFont)el.dataset.uiBaseFont=parseFloat(getComputedStyle(el).fontSize)||14;
  }));
}
function backgroundValue(name){return({white:'#ffffff',lavender:'#f7f4ff',blue:'#f2f8ff',green:'#f2fbf6',warm:'#fff9ef',transparent:'transparent'})[name]||''}

function siteLayoutPref(bid){ensureGlobalCustomizationState();state.uiPrefs.siteLayout[bid]=state.uiPrefs.siteLayout[bid]||{};return state.uiPrefs.siteLayout[bid];}
function renderSiteLayoutCustomizer(page){
  const ed=document.getElementById('globalSiteLayoutEditor');if(!ed)return;ed.classList.toggle('hidden',page!=='dashboard');if(page!=='dashboard')return;
  const sel=document.getElementById('siteLayoutBuildingSelect');if(!sel)return;const old=sel.value;sel.innerHTML=state.buildings.map(b=>`<option value="${b.id}">${escaped(b.name)}</option>`).join('');sel.value=state.buildings.some(b=>b.id===old)?old:(state.buildings[0]?.id||'');
  const b=state.buildings.find(x=>x.id===sel.value);if(!b)return;const p=siteLayoutPref(b.id);document.getElementById('siteLayoutBuildingName').value=b.name||'';document.getElementById('siteLayoutBuildingWeight').value=Number(b.weight||0);document.getElementById('siteLayoutCol').value=Number(p.col||1);document.getElementById('siteLayoutRow').value=Number(p.row||1);document.getElementById('siteLayoutWidth').value=Number(p.w||3);document.getElementById('siteLayoutHeight').value=Number(p.h||1);document.getElementById('siteLayoutBackground').value=p.background||'default';
}
function applySiteLayoutControls(){const bid=document.getElementById('siteLayoutBuildingSelect')?.value,b=state.buildings.find(x=>x.id===bid);if(!b)return;const name=String(document.getElementById('siteLayoutBuildingName')?.value||'').trim();if(name)b.name=name;b.weight=Math.max(0,Number(document.getElementById('siteLayoutBuildingWeight')?.value||0));const p=siteLayoutPref(bid);p.col=Math.max(1,Math.min(12,Number(document.getElementById('siteLayoutCol')?.value||1)));p.row=Math.max(1,Math.min(30,Number(document.getElementById('siteLayoutRow')?.value||1)));p.w=Math.max(1,Math.min(12,Number(document.getElementById('siteLayoutWidth')?.value||3)));p.h=Math.max(1,Math.min(8,Number(document.getElementById('siteLayoutHeight')?.value||1)));p.background=document.getElementById('siteLayoutBackground')?.value||'default';save();renderAll();renderSiteLayoutCustomizer('dashboard');}
function resetSiteLayoutBox(){const bid=document.getElementById('siteLayoutBuildingSelect')?.value;if(!bid)return;delete state.uiPrefs.siteLayout[bid];save();renderDashboard();renderSiteLayoutCustomizer('dashboard');}

function resourceCardPrefs(page,target){
  ensureGlobalCustomizationState();
  state.uiPrefs.resourceCards[page]=state.uiPrefs.resourceCards[page]||{};
  const defaults={columns:0,minWidth:205,height:170,gap:12,fontScale:1};
  const cur=state.uiPrefs.resourceCards[page][target]||{};
  state.uiPrefs.resourceCards[page][target]=Object.assign({},defaults,cur);
  return state.uiPrefs.resourceCards[page][target];
}
function resourceCardContainer(page,target){
  const ids=page==='dashboard'?(target==='manpower'?['dashTradeCards']:['dashEquipmentCards']):(page==='overview'?(target==='manpower'?['tradeCards']:['equipmentCards']):[]);
  return ids.map(id=>document.getElementById(id)).find(Boolean)||null;
}
function applyResourceCardPrefs(page){
  if(!['dashboard','overview'].includes(page))return;
  ['manpower','equipment'].forEach(target=>{
    const c=resourceCardContainer(page,target);if(!c)return;
    const p=resourceCardPrefs(page,target);
    c.style.gridTemplateColumns=Number(p.columns)>0?`repeat(${Number(p.columns)},minmax(0,1fr))`:`repeat(auto-fit,minmax(${Number(p.minWidth||205)}px,1fr))`;
    c.style.gap=Number(p.gap||12)+'px';
    c.style.setProperty('--resource-card-height',Number(p.height||170)+'px');
    c.style.setProperty('--resource-card-font-scale',Number(p.fontScale||1));
  });
}
function renderResourceCardCustomizer(page){
  const ed=document.getElementById('globalResourceCardEditor');if(!ed)return;
  const supported=['dashboard','overview'].includes(page);ed.classList.toggle('hidden',!supported);if(!supported)return;
  const target=document.getElementById('resourceCardTarget')?.value||'manpower';
  const p=resourceCardPrefs(page,target);
  const set=(id,val)=>{const e=document.getElementById(id);if(e)e.value=val};
  set('resourceCardsPerRow',p.columns||0);set('resourceCardMinWidth',p.minWidth||205);set('resourceCardHeight',p.height||170);set('resourceCardGap',p.gap||12);set('resourceCardFontScale',Math.round((p.fontScale||1)*100));
  const txt=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val};
  txt('resourceCardMinWidthValue',(p.minWidth||205)+'px');txt('resourceCardHeightValue',(p.height||170)+'px');txt('resourceCardGapValue',(p.gap||12)+'px');txt('resourceCardFontScaleValue',Math.round((p.fontScale||1)*100)+'%');
}
function applyResourceCardControls(){
  const page=globalCustomizePage,target=document.getElementById('resourceCardTarget')?.value||'manpower';
  const p=resourceCardPrefs(page,target);
  p.columns=Number(document.getElementById('resourceCardsPerRow')?.value||0);
  p.minWidth=Number(document.getElementById('resourceCardMinWidth')?.value||205);
  p.height=Number(document.getElementById('resourceCardHeight')?.value||170);
  p.gap=Number(document.getElementById('resourceCardGap')?.value||12);
  p.fontScale=Number(document.getElementById('resourceCardFontScale')?.value||100)/100;
  save();applyResourceCardPrefs(page);renderResourceCardCustomizer(page);
}
function resetResourceCardControls(){
  const page=globalCustomizePage,target=document.getElementById('resourceCardTarget')?.value||'manpower';
  if(state.uiPrefs?.resourceCards?.[page])delete state.uiPrefs.resourceCards[page][target];
  save();applyResourceCardPrefs(page);renderResourceCardCustomizer(page);
}
function enforceOverviewCanonicalOrder(){
  const root=document.getElementById('page-overview');
  if(!root)return;
  const ordered=[];
  const add=el=>{if(el&&!ordered.includes(el))ordered.push(el)};
  add(root.querySelector(':scope > .page-title'));
  add(root.querySelector(':scope > .overview-filter-card'));
  add(root.querySelector(':scope > .imported-grid'));
  add(document.getElementById('mpDistributionTable')?.closest('.section-card'));
  add(document.getElementById('eqDistributionTable')?.closest('.section-card'));
  add(root.querySelector(':scope > .overview-charts-grid'));
  add(root.querySelector(':scope > .overview-photo-report-card'));
  ordered.forEach(el=>root.appendChild(el));
}

function applyGlobalPagePrefs(page){
  ensureGlobalCustomizationState();const root=document.getElementById('page-'+page);if(!root)return;
  const prefs=globalPagePrefs(page);const blocks=collectGlobalBlocks(page);annotateEditableTexts(page);
  const byKey=Object.fromEntries(blocks.map(b=>[b.dataset.uiKey,b]));
  const order=[...prefs.order.filter(k=>byKey[k]),...blocks.map(b=>b.dataset.uiKey).filter(k=>!prefs.order.includes(k))];
  order.forEach(k=>{const el=byKey[k];if(el)root.appendChild(el)});prefs.order=order;
  order.forEach(k=>{const el=byKey[k];if(!el)return;const bp=prefs.blocks[k]||{};
    el.style.display=bp.hidden?'none':'';
    el.style.width=bp.width&&bp.width!=='auto'?bp.width+'%':'';el.style.marginLeft=bp.width&&bp.width!=='auto'?'auto':'';el.style.marginRight=bp.width&&bp.width!=='auto'?'auto':'';
    el.style.padding=bp.padding!==undefined&&bp.padding!==null&&bp.padding!==''?Number(bp.padding)+'px':'';
    el.style.borderRadius=bp.radius!==undefined&&bp.radius!==null&&bp.radius!==''?Number(bp.radius)+'px':'';
    el.style.background=bp.background&&bp.background!=='default'?backgroundValue(bp.background):'';
    el.style.minHeight=bp.height!==undefined&&bp.height!==null&&bp.height!==''?Number(bp.height)+'px':'';
    if(bp.border==='none')el.style.border='none';else if(bp.border==='solid')el.style.border='1px solid var(--line)';else if(bp.border==='dashed')el.style.border='1px dashed #b9acd7';else el.style.border='';
    if(bp.shadow==='none')el.style.boxShadow='none';else if(bp.shadow==='soft')el.style.boxShadow='0 8px 20px rgba(67,39,133,.08)';else if(bp.shadow==='strong')el.style.boxShadow='0 18px 46px rgba(67,39,133,.18)';else el.style.boxShadow='';
    el.classList.toggle('ui-selected-block',globalCustomizeMode&&k===selectedGlobalBlockKey);
  });
  const scale=prefs.fontScale||1;
  blocks.forEach(block=>editableTextNodes(block).forEach(el=>{const base=Number(el.dataset.uiBaseFont||parseFloat(getComputedStyle(el).fontSize)||14);el.style.fontSize=(base*scale)+'px';const override=prefs.text[el.dataset.uiTextKey];if(override!==undefined&&override!==null&&String(override).trim()!=='')el.textContent=override;}));
  Object.entries(state.uiPrefs.chartHeights||{}).forEach(([id,h])=>{const c=document.getElementById(id);if(c&&root.contains(c)){const wrap=c.closest('.chart-wrap,.reconcile-chart-wrap');if(wrap)wrap.style.height=Math.max(90,Math.min(520,Number(h||0)))+'px';}});
  applyResourceCardPrefs(page);
  enableGlobalTextEditing(page);
  bindGlobalBlockSelection(page);
  if(page==='overview')enforceOverviewCanonicalOrder();
}
function applyGlobalCustomizationToAllPages(){ensureDashboardLayoutV38();Object.keys(GLOBAL_PAGE_NAMES).forEach(applyGlobalPagePrefs)}
function enableGlobalTextEditing(page){
  const prefs=globalPagePrefs(page);const root=document.getElementById('page-'+page);if(!root)return;
  annotateEditableTexts(page);collectGlobalBlocks(page).forEach(block=>editableTextNodes(block).forEach(el=>{
    const enabled=globalCustomizeMode&&globalCustomizePage===page&&document.getElementById('globalEditText')?.checked;
    el.contentEditable=enabled?'true':'false';el.classList.toggle('ui-editable-text',enabled);
    el.onblur=enabled?()=>{const key=el.dataset.uiTextKey;const val=el.textContent.trim();if(key){prefs.text[key]=val;save();}}:null;
  }));
}
function bindGlobalBlockSelection(page){
  collectGlobalBlocks(page).forEach(block=>{block.onclick=globalCustomizeMode&&globalCustomizePage===page?(e)=>{if(e.target.closest('button,input,select,textarea,a,[contenteditable="true"]'))return;selectedGlobalBlockKey=block.dataset.uiKey;renderGlobalCustomizerControls();applyGlobalPagePrefs(page);}:null;});
}
function blockPref(page,key){const prefs=globalPagePrefs(page);prefs.blocks[key]=prefs.blocks[key]||{};return prefs.blocks[key]}
function renderGlobalCustomizerControls(){
  if(!globalCustomizeMode)return;ensureGlobalCustomizationState();const page=globalCustomizePage||currentVisiblePageName();const prefs=globalPagePrefs(page),blocks=collectGlobalBlocks(page);
  const title=document.getElementById('globalCustomizeTitle');if(title)title.textContent='Customize '+(GLOBAL_PAGE_NAMES[page]||page);
  const ps=document.getElementById('globalPageSelect');if(ps)ps.value=page;
  const bs=document.getElementById('globalBlockSelect');if(bs){bs.innerHTML=blocks.map(b=>`<option value="${escaped(b.dataset.uiKey)}">${escaped(globalBlockLabel(b))}</option>`).join('');if(!selectedGlobalBlockKey||!blocks.some(b=>b.dataset.uiKey===selectedGlobalBlockKey))selectedGlobalBlockKey=blocks[0]?.dataset.uiKey||'';bs.value=selectedGlobalBlockKey;}
  const fs=document.getElementById('globalFontScale'),fsv=document.getElementById('globalFontScaleValue');if(fs){fs.value=Math.round((prefs.fontScale||1)*100);if(fsv)fsv.textContent=fs.value+'%';}
  const bp=selectedGlobalBlockKey?blockPref(page,selectedGlobalBlockKey):{};
  const vis=document.getElementById('globalBlockVisibility');if(vis)vis.value=bp.hidden?'hide':'show';
  const wid=document.getElementById('globalBlockWidth');if(wid)wid.value=bp.width||'auto';
  const pad=document.getElementById('globalBlockPadding'),padv=document.getElementById('globalBlockPaddingValue');if(pad){pad.value=bp.padding!==undefined?bp.padding:-1;if(padv)padv.textContent=bp.padding!==undefined?bp.padding+'px':'Default';}
  const rad=document.getElementById('globalBlockRadius'),radv=document.getElementById('globalBlockRadiusValue');if(rad){rad.value=bp.radius!==undefined?bp.radius:-1;if(radv)radv.textContent=bp.radius!==undefined?bp.radius+'px':'Default';}
  const bg=document.getElementById('globalBlockBackground');if(bg)bg.value=bp.background||'default';
  const bh=document.getElementById('globalBlockHeight'),bhv=document.getElementById('globalBlockHeightValue');if(bh){bh.value=bp.height!==undefined?bp.height:-1;if(bhv)bhv.textContent=bp.height!==undefined?bp.height+'px':'Default';}
  const bdr=document.getElementById('globalBlockBorder');if(bdr)bdr.value=bp.border||'default';
  const sh=document.getElementById('globalBlockShadow');if(sh)sh.value=bp.shadow||'default';
  const rs=document.getElementById('globalReportsShortcut');if(rs)rs.classList.toggle('hidden',page!=='reports');
  renderResourceCardCustomizer(page);renderSiteLayoutCustomizer(page);renderGlobalChartControls(page);applyGlobalPagePrefs(page);
}
function renderGlobalChartControls(page){
  const host=document.getElementById('globalChartControls');if(!host)return;const root=document.getElementById('page-'+page);if(!root){host.innerHTML='';return;}
  const canvases=Array.from(root.querySelectorAll('canvas[id]'));
  if(!canvases.length){host.innerHTML='<div class="customize-empty">No charts on this page.</div>';return;}
  host.innerHTML=canvases.map(c=>{const label=c.closest('.section-card,.daily-chart-panel')?.querySelector('h2,h3')?.textContent?.trim()||c.id;const mode=getChartMode(c.id,(Chart.getChart(c)?.config?.type)||'bar');const h=state.uiPrefs.chartHeights?.[c.id]||Math.round(c.closest('.chart-wrap,.reconcile-chart-wrap')?.getBoundingClientRect().height||180);return `<div class="global-chart-row" data-chart-editor="${escaped(c.id)}"><strong>${escaped(label)}</strong><select data-global-chart-type="${escaped(c.id)}"><option value="bar">Bar</option><option value="line">Line</option><option value="area">Area</option><option value="doughnut">Doughnut</option><option value="pie">Pie</option><option value="polarArea">Polar Area</option><option value="radar">Radar</option></select><label>Height <input data-global-chart-height="${escaped(c.id)}" type="number" min="90" max="520" step="10" value="${h}"></label></div>`}).join('');
  host.querySelectorAll('[data-global-chart-type]').forEach(sel=>{const id=sel.dataset.globalChartType;sel.value=getChartMode(id,sel.value||'bar');sel.onchange=()=>{state.chartPrefs[id]=sel.value;save();if(page==='reports')renderReports(currentReportKind);else if(page==='dashboard')renderDashboard();setTimeout(()=>{applyGlobalCustomizationToAllPages();renderGlobalCustomizerControls()},0);};});
  host.querySelectorAll('[data-global-chart-height]').forEach(inp=>inp.onchange=()=>{ensureGlobalCustomizationState();state.uiPrefs.chartHeights[inp.dataset.globalChartHeight]=Math.max(90,Math.min(520,Number(inp.value||180)));save();applyGlobalPagePrefs(page);});
}
function applyGlobalBlockControls(){if(!selectedGlobalBlockKey)return;const p=blockPref(globalCustomizePage,selectedGlobalBlockKey);p.hidden=document.getElementById('globalBlockVisibility').value==='hide';p.width=document.getElementById('globalBlockWidth').value;const pad=Number(document.getElementById('globalBlockPadding').value);const rad=Number(document.getElementById('globalBlockRadius').value);const height=Number(document.getElementById('globalBlockHeight')?.value??-1);if(pad<0)delete p.padding;else p.padding=pad;if(rad<0)delete p.radius;else p.radius=rad;if(height<0)delete p.height;else p.height=height;p.background=document.getElementById('globalBlockBackground').value;p.border=document.getElementById('globalBlockBorder')?.value||'default';p.shadow=document.getElementById('globalBlockShadow')?.value||'default';save();applyGlobalPagePrefs(globalCustomizePage);renderGlobalCustomizerControls();}
function moveGlobalBlock(delta){const prefs=globalPagePrefs(globalCustomizePage),blocks=collectGlobalBlocks(globalCustomizePage);if(!prefs.order.length)prefs.order=blocks.map(b=>b.dataset.uiKey);const i=prefs.order.indexOf(selectedGlobalBlockKey);const j=i+delta;if(i<0||j<0||j>=prefs.order.length)return;[prefs.order[i],prefs.order[j]]=[prefs.order[j],prefs.order[i]];save();applyGlobalPagePrefs(globalCustomizePage);renderGlobalCustomizerControls();}
function resetGlobalBlock(){if(!selectedGlobalBlockKey)return;const prefs=globalPagePrefs(globalCustomizePage);delete prefs.blocks[selectedGlobalBlockKey];Object.keys(prefs.text).filter(k=>k.startsWith(selectedGlobalBlockKey+'-text-')).forEach(k=>delete prefs.text[k]);const block=collectGlobalBlocks(globalCustomizePage).find(b=>b.dataset.uiKey===selectedGlobalBlockKey);editableTextNodes(block).forEach(el=>{if(el.dataset.uiBaseText!==undefined)el.textContent=el.dataset.uiBaseText;el.style.fontSize='';});save();applyGlobalPagePrefs(globalCustomizePage);renderGlobalCustomizerControls();}
function resetGlobalPage(){if(!confirm('Reset visual customization for this page?'))return;const blocks=collectGlobalBlocks(globalCustomizePage);blocks.forEach(block=>editableTextNodes(block).forEach(el=>{if(el.dataset.uiBaseText!==undefined)el.textContent=el.dataset.uiBaseText;el.style.fontSize='';}));state.uiPrefs.pages[globalCustomizePage]={fontScale:1,blocks:{},text:{},order:[]};if(state.uiPrefs.resourceCards)delete state.uiPrefs.resourceCards[globalCustomizePage];save();applyGlobalPagePrefs(globalCustomizePage);renderGlobalCustomizerControls();}
function toggleGlobalCustomizer(force){globalCustomizeMode=force!==undefined?!!force:!globalCustomizeMode;const panel=document.getElementById('globalCustomizePanel');const btn=document.getElementById('globalCustomizeBtn');globalCustomizePage=currentVisiblePageName();panel?.classList.toggle('hidden',!globalCustomizeMode);btn?.classList.toggle('active',globalCustomizeMode);document.documentElement.classList.toggle('global-custom-mode',globalCustomizeMode);if(globalCustomizeMode){selectedGlobalBlockKey='';renderGlobalCustomizerControls();}else{Object.keys(GLOBAL_PAGE_NAMES).forEach(page=>{collectGlobalBlocks(page).forEach(b=>b.classList.remove('ui-selected-block'));enableGlobalTextEditing(page);});}}
  const siteSel=document.getElementById('siteLayoutBuildingSelect');if(siteSel)siteSel.onchange=()=>renderSiteLayoutCustomizer('dashboard');
  const siteApply=document.getElementById('siteLayoutApplyBtn');if(siteApply)siteApply.onclick=applySiteLayoutControls;
  const siteReset=document.getElementById('siteLayoutResetBtn');if(siteReset)siteReset.onclick=resetSiteLayoutBox;
  const siteAdd=document.getElementById('siteLayoutAddBuildingBtn');if(siteAdd)siteAdd.onclick=addBuilding;
  const resourceTarget=document.getElementById('resourceCardTarget');if(resourceTarget)resourceTarget.onchange=()=>renderResourceCardCustomizer(globalCustomizePage);
  ['resourceCardMinWidth','resourceCardHeight','resourceCardGap','resourceCardFontScale'].forEach(id=>{const e=document.getElementById(id);if(e)e.oninput=()=>{const target=document.getElementById('resourceCardTarget')?.value||'manpower';const p=resourceCardPrefs(globalCustomizePage,target);if(id==='resourceCardMinWidth'){p.minWidth=Number(e.value);document.getElementById('resourceCardMinWidthValue').textContent=e.value+'px'}if(id==='resourceCardHeight'){p.height=Number(e.value);document.getElementById('resourceCardHeightValue').textContent=e.value+'px'}if(id==='resourceCardGap'){p.gap=Number(e.value);document.getElementById('resourceCardGapValue').textContent=e.value+'px'}if(id==='resourceCardFontScale'){p.fontScale=Number(e.value)/100;document.getElementById('resourceCardFontScaleValue').textContent=e.value+'%'}applyResourceCardPrefs(globalCustomizePage);};});
  const resourceCols=document.getElementById('resourceCardsPerRow');if(resourceCols)resourceCols.onchange=()=>{const target=document.getElementById('resourceCardTarget')?.value||'manpower';resourceCardPrefs(globalCustomizePage,target).columns=Number(resourceCols.value||0);applyResourceCardPrefs(globalCustomizePage);};
  const resourceApply=document.getElementById('resourceCardApplyBtn');if(resourceApply)resourceApply.onclick=applyResourceCardControls;
  const resourceReset=document.getElementById('resourceCardResetBtn');if(resourceReset)resourceReset.onclick=resetResourceCardControls;

function defaultReportLayoutForBuilding(b){
  const key=normLabel(b?.name||'').replace(/^ss/,'');
  const d=REPORT_LAYOUT_DEFAULTS[key]||{col:1,row:1,w:2,h:1,color:'map-slate'};
  return clone(d);
}
function currentReportLayoutForBuilding(b){
  ensureReportCustomizationState();
  const d=defaultReportLayoutForBuilding(b);
  const dashboardPos=state.uiPrefs?.siteLayout?.[b.id]||{};
  const reportPos=state.reportLayout[b.id]||{};
  const hasReportPos=Object.keys(reportPos).length>0;
  const hasDashboardPos=Object.keys(dashboardPos).length>0;
  const source=hasReportPos?reportPos:(hasDashboardPos?dashboardPos:{});
  return {
    col:Math.max(1,Math.min(12,Number((source.col??d.col)||d.col))),
    row:Math.max(1,Math.min(8,Number((source.row??d.row)||d.row))),
    w:Math.max(1,Math.min(12,Number((source.w??d.w)||d.w))),
    h:Math.max(1,Math.min(8,Number((source.h??d.h)||d.h))),
    color:reportPos.color||dashboardPos.color||d.color,
    radius:Math.max(0,Math.min(30,Number(reportPos.radius??state.reportPrefs.layoutStyle.radius))),
    borderWidth:Math.max(1,Math.min(4,Number(reportPos.borderWidth||1))),
    nameFont:Math.max(7,Math.min(18,Number(reportPos.nameFont??state.reportPrefs.layoutStyle.nameFont))),
    metricsFont:Math.max(6,Math.min(14,Number(reportPos.metricsFont??state.reportPrefs.layoutStyle.metricsFont))),
    pctFont:Math.max(7,Math.min(16,Number(reportPos.pctFont??state.reportPrefs.layoutStyle.pctFont))),
    background:reportPos.background||'default'
  };
}
function validDateString(v){const s=String(v||'').trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?'':s}
function dateObj(v){const s=validDateString(v)||reportDate();const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?new Date():d}
function isoLocal(d){if(!(d instanceof Date)||Number.isNaN(d.getTime()))return '';const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function clampPct(v){return Math.max(0,Math.min(100,Number(v||0)))}
function escJs(value){return JSON.stringify(String(value??''))}
function loadLocal(){try{return JSON.parse(localStorage.getItem(STORAGE))||clone(DEFAULT)}catch{return clone(DEFAULT)}}
function loadPhotos(){try{return JSON.parse(localStorage.getItem(PHOTO_STORAGE))||{}}catch{return {}}}
function latestActivityDate(){const dates=[...(state?.mpEntries||[]),...(state?.eqEntries||[]),...(state?.pgEntries||[])].map(e=>validDateString(e?.date)).filter(Boolean).sort();return dates[dates.length-1]||new Date().toISOString().slice(0,10)}
function normalizePhotoStore(raw){const src=raw&&typeof raw==='object'?raw:{};if(src.__version===2&&src.dates&&typeof src.dates==='object')return src;const legacy={};Object.entries(src).forEach(([key,val])=>{if(Array.isArray(val))legacy[key]=val});const migrated={__version:2,dates:{}};if(Object.keys(legacy).length)migrated.dates[latestActivityDate()]=legacy;return migrated}
function savePhotos(){try{localStorage.setItem(PHOTO_STORAGE,JSON.stringify(photoStore))}catch(e){console.warn('Local photo cache full',e)}}
function saveLocal(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function hydrateState(raw){
  state=raw&&typeof raw==='object'?raw:clone(DEFAULT);
  state.project=Object.assign(clone(DEFAULT.project),state.project||{});if(!state.project.type)state.project.type='500/33/33 kV';
  state.buildings=Array.isArray(state.buildings)?state.buildings:clone(DEFAULT.buildings);
  state.trades=Array.isArray(state.trades)?state.trades:clone(DEFAULT.trades);
  state.equipmentTypes=Array.isArray(state.equipmentTypes)?state.equipmentTypes:clone(DEFAULT.equipmentTypes);
  state.mpEntries=Array.isArray(state.mpEntries)?state.mpEntries:[];state.eqEntries=Array.isArray(state.eqEntries)?state.eqEntries:[];state.pgEntries=Array.isArray(state.pgEntries)?state.pgEntries:[];
  state.manualActivities=Array.isArray(state.manualActivities)?state.manualActivities:[];
  state.availabilityMp=state.availabilityMp&&typeof state.availabilityMp==='object'?state.availabilityMp:{};
  state.availabilityEq=state.availabilityEq&&typeof state.availabilityEq==='object'?state.availabilityEq:{};
  state.chartPrefs=Object.assign({},clone(DEFAULT.chartPrefs),state.chartPrefs||{});
  ensureReportCustomizationState();ensureGlobalCustomizationState();saveLocal();
}
async function saveToCloud(showError=false){
  saveLocal();
  if(!supabaseClient || !session) return {ok:false,offline:true};
  const payload={project_id:PROJECT_ID,state,updated_by:session.user.id,updated_at:new Date().toISOString()};
  const {error}=await supabaseClient.from('project_state').upsert(payload,{onConflict:'project_id'});
  if(error){
    if(showError) alert('Shared cloud save failed: '+error.message);
    console.error(error);
    return {ok:false,error};
  }
  return {ok:true};
}
function save(){saveToCloud(false)}
async function loadFromCloud(){
  const {data,error}=await supabaseClient.from('project_state').select('state,updated_at,updated_by').eq('project_id',PROJECT_ID).maybeSingle();
  if(error) throw error;
  if(data?.state){hydrateState(data.state)}
  else{hydrateState(loadLocal());const r=await saveToCloud(true);if(!r.ok&&!r.offline)throw r.error}
}

let photoCloudLoadedDates=new Set();
let photoCloudLoading=new Map();
function photoDay(date=reportDate(),create=false){
  const d=validDateString(date)||new Date().toISOString().slice(0,10);
  photoStore.dates=photoStore.dates&&typeof photoStore.dates==='object'?photoStore.dates:{};
  if(create&&!photoStore.dates[d])photoStore.dates[d]={};
  if(supabaseClient&&session&&!photoCloudLoadedDates.has(d)&&!photoCloudLoading.has(d)){
    const task=loadCloudPhotosForDate(d).finally(()=>photoCloudLoading.delete(d));
    photoCloudLoading.set(d,task);
  }
  return photoStore.dates[d]||{};
}
function dataUrlToBlob(dataUrl){
  const parts=String(dataUrl||'').split(',');if(parts.length<2)throw new Error('Invalid image data');
  const mime=(parts[0].match(/data:([^;]+)/)||[])[1]||'image/jpeg';
  const bin=atob(parts[1]);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type:mime});
}
async function loadCloudPhotosForDate(date,force=false){
  const d=validDateString(date)||reportDate();
  if(!supabaseClient||!session)return;
  if(photoCloudLoadedDates.has(d)&&!force)return;
  const {data:rows,error}=await supabaseClient.from('project_photos').select('id,building_id,report_date,storage_path,original_name,created_at').eq('project_id',PROJECT_ID).eq('report_date',d).order('created_at',{ascending:true});
  if(error){console.error('Photo metadata load failed',error);return}
  const day={};
  const paths=(rows||[]).map(r=>r.storage_path);
  let signedByPath={};
  if(paths.length){
    const {data:signed,error:signedError}=await supabaseClient.storage.from(PHOTO_BUCKET).createSignedUrls(paths,3600);
    if(signedError)console.error('Photo URL signing failed',signedError);
    (signed||[]).forEach(x=>{if(x?.path&&x?.signedUrl)signedByPath[x.path]=x.signedUrl});
  }
  (rows||[]).forEach(r=>{
    if(!day[r.building_id])day[r.building_id]=[];
    day[r.building_id].push({id:r.id,name:r.original_name||'photo.jpg',data:signedByPath[r.storage_path]||'',path:r.storage_path,date:d,created_at:r.created_at});
  });
  photoStore.dates[d]=day;photoCloudLoadedDates.add(d);savePhotos();
  if(d===reportDate()){
    renderPhotoArea();renderOverviewPhotoReport();
    if(currentVisiblePageName()==='reports')renderReports(currentReportKind);
  }
}
async function uploadPhotoRecord(buildingId,photo,date){
  const d=validDateString(date)||reportDate();
  const blob=dataUrlToBlob(photo.data);
  const safeBuilding=String(buildingId).replace(/[^a-zA-Z0-9_-]/g,'_');
  const path=`${PROJECT_ID}/${d}/${safeBuilding}/${Date.now()}-${Math.random().toString(36).slice(2,9)}.jpg`;
  const {error:uploadError}=await supabaseClient.storage.from(PHOTO_BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false});
  if(uploadError)throw uploadError;
  const {error:metaError}=await supabaseClient.from('project_photos').insert({project_id:PROJECT_ID,building_id:buildingId,report_date:d,storage_path:path,original_name:photo.name||'photo.jpg',created_by:session.user.id});
  if(metaError){await supabaseClient.storage.from(PHOTO_BUCKET).remove([path]);throw metaError}
}
async function migrateLocalPhotosToCloud(){
  if(!supabaseClient||!session)return;
  const flag=`photoCloudMigratedV74:${PROJECT_ID}`;if(localStorage.getItem(flag)==='1')return;
  const legacy=normalizePhotoStore(loadPhotos());
  const total=Object.values(legacy.dates||{}).reduce((sum,day)=>sum+Object.values(day||{}).reduce((s,arr)=>s+(Array.isArray(arr)?arr.length:0),0),0);
  if(!total){localStorage.setItem(flag,'1');return}
  const {count,error}=await supabaseClient.from('project_photos').select('id',{count:'exact',head:true}).eq('project_id',PROJECT_ID);
  if(error){console.warn('Could not check cloud photo migration',error);return}
  if((count||0)>0){localStorage.setItem(flag,'1');return}
  try{
    for(const [date,day] of Object.entries(legacy.dates||{})){
      for(const [buildingId,photos] of Object.entries(day||{})){
        for(const ph of (Array.isArray(photos)?photos:[])){
          if(ph?.data?.startsWith('data:'))await uploadPhotoRecord(buildingId,ph,date);
        }
      }
    }
    localStorage.setItem(flag,'1');
    photoCloudLoadedDates.clear();
  }catch(e){console.error('Legacy photo migration failed',e)}
}

let projectRealtimeChannel=null;
function startProjectRealtime(){
  if(!supabaseClient||!session)return;
  if(projectRealtimeChannel){supabaseClient.removeChannel(projectRealtimeChannel);projectRealtimeChannel=null}
  projectRealtimeChannel=supabaseClient.channel(`project-live-${PROJECT_ID}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'project_state',filter:`project_id=eq.${PROJECT_ID}`},payload=>{
      const row=payload.new;if(!row?.state)return;
      if(row.updated_by===session?.user?.id)return;
      hydrateState(row.state);renderAll();
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'project_photos',filter:`project_id=eq.${PROJECT_ID}`},payload=>{
      const d=validDateString(payload.new?.report_date||payload.old?.report_date);if(!d)return;
      photoCloudLoadedDates.delete(d);if(d===reportDate())loadCloudPhotosForDate(d,true);
    })
    .subscribe();
}
async function initSupabase(){
  const status=document.getElementById('authStatus');
  if(!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY){
    if(status) status.innerHTML='<strong>Setup required:</strong> put your Supabase Project URL and browser-safe Publishable/anon key in <code>supabase-config.js</code>. This page will not use the demo lock.';
    return false;
  }
  if(!window.supabase?.createClient){
    if(status) status.innerHTML='<strong>Connection error:</strong> Supabase client did not load. Check your internet connection and refresh.';
    return false;
  }
  supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data}=await supabaseClient.auth.getSession();
  if(data?.session){ session=data.session; await openAuthenticatedApp(); }
  supabaseClient.auth.onAuthStateChange(async (_event,newSession)=>{
    session=newSession;
    if(session) await openAuthenticatedApp(); else closeAuthenticatedApp();
  });
  return true;
}
async function openAuthenticatedApp(){
  try{
    await loadFromCloud();
    await migrateLocalPhotosToCloud();
    await loadCloudPhotosForDate(reportDate(),true);
    startProjectRealtime();
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    renderAll();
  }catch(error){
    console.error(error);
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    alert('Could not load your cloud dashboard: '+error.message);
  }
}
function closeAuthenticatedApp(){
  if(projectRealtimeChannel&&supabaseClient){supabaseClient.removeChannel(projectRealtimeChannel);projectRealtimeChannel=null}
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('userEmail').textContent='';
}
let state=loadLocal();
state.project=Object.assign(clone(DEFAULT.project),state.project||{});if(!state.project.type)state.project.type='500/33/33 kV';state.buildings=Array.isArray(state.buildings)?state.buildings:clone(DEFAULT.buildings);state.trades=Array.isArray(state.trades)?state.trades:clone(DEFAULT.trades);state.equipmentTypes=Array.isArray(state.equipmentTypes)?state.equipmentTypes:clone(DEFAULT.equipmentTypes);state.mpEntries=Array.isArray(state.mpEntries)?state.mpEntries:[];state.eqEntries=Array.isArray(state.eqEntries)?state.eqEntries:[];state.pgEntries=Array.isArray(state.pgEntries)?state.pgEntries:[];state.manualActivities=Array.isArray(state.manualActivities)?state.manualActivities:[];state.availabilityMp=state.availabilityMp&&typeof state.availabilityMp==='object'?state.availabilityMp:{};state.availabilityEq=state.availabilityEq&&typeof state.availabilityEq==='object'?state.availabilityEq:{};state.chartPrefs=Object.assign({},clone(DEFAULT.chartPrefs),state.chartPrefs||{});ensureReportCustomizationState();ensureGlobalCustomizationState();
let photoStore=normalizePhotoStore(loadPhotos());savePhotos();
function fmt(n,d=1){return Number(n||0).toFixed(d)}
function reportDate(){const v=document.getElementById('reportDate')?.value;return validDateString(v)||new Date().toISOString().slice(0,10)}
function activityActualAtDate(b,a,date){const rows=state.pgEntries.filter(e=>e.building===b.id&&e.activity===a.name&&validDateString(e.date)&&e.date<=date).sort((x,y)=>x.date.localeCompare(y.date));if(rows.length)return clampPct(rows[rows.length-1].actual);return validDateString(date)===reportDate()?clampPct(a.actual):0}
function activityPlannedAtDate(a,date){const start=validDateString(a.start),finish=validDateString(a.finish),d=validDateString(date);if(!d)return clampPct(a.planned);if(start&&d<start)return 0;if(finish&&d>=finish)return 100;if(start&&finish&&finish>start){const s=dateObj(start),f=dateObj(finish),x=dateObj(d);const span=f-s;if(span>0)return clampPct(((x-s)/span)*100)}return clampPct(a.planned)}
function buildingActualAtDate(b,date){if(!b.activities?.length)return 0;const w=b.activities.reduce((s,a)=>s+Number(a.weight||0),0)||100;return b.activities.reduce((s,a)=>s+Number(a.weight||0)*(activityActualAtDate(b,a,date)/100),0)/w*100}
function buildingPlannedAtDate(b,date){if(!b.activities?.length)return 0;const w=b.activities.reduce((s,a)=>s+Number(a.weight||0),0)||100;return b.activities.reduce((s,a)=>s+Number(a.weight||0)*(activityPlannedAtDate(a,date)/100),0)/w*100}
function buildingActual(b){return buildingActualAtDate(b,reportDate())}
function buildingPlanned(b){return buildingPlannedAtDate(b,reportDate())}
function projectActualAt(date){const rows=state.buildings.filter(b=>(b.activities||[]).length);if(!rows.length)return 0;const w=rows.reduce((s,b)=>s+Number(b.weight||0),0)||100;return rows.reduce((s,b)=>s+buildingActualAtDate(b,date)*Number(b.weight||0),0)/w}
function projectPlannedAt(date){const rows=state.buildings.filter(b=>(b.activities||[]).length);if(!rows.length)return 0;const w=rows.reduce((s,b)=>s+Number(b.weight||0),0)||100;return rows.reduce((s,b)=>s+buildingPlannedAtDate(b,date)*Number(b.weight||0),0)/w}
function projectActual(){return projectActualAt(reportDate())}
function projectPlanned(){return projectPlannedAt(reportDate())}
function entriesOnDate(arr,date){return arr.filter(e=>e.date===date)}
function availabilityMap(kind,date=reportDate()){const root=kind==='mp'?(state.availabilityMp||(state.availabilityMp={} )):(state.availabilityEq||(state.availabilityEq={}));return root[date]||(root[date]={})}
function availableTradeTotal(name,date=reportDate()){const m=availabilityMap('mp',date);if(Object.prototype.hasOwnProperty.call(m,name))return Number(m[name]||0);return Number(state.trades.find(t=>t.name===name)?.total||0)}
function availableEquipmentTotal(name,date=reportDate()){const m=availabilityMap('eq',date);if(Object.prototype.hasOwnProperty.call(m,name))return Number(m[name]||0);return Number(state.equipmentTypes.find(t=>t.name===name)?.total||0)}
function setAvailability(kind,name,value,date=reportDate()){const m=availabilityMap(kind,date);m[name]=Math.max(0,Number(value||0));save()}
function availableMP(date=reportDate()){return state.trades.reduce((s,t)=>s+availableTradeTotal(t.name,date),0)}
function availableEQ(date=reportDate()){return state.equipmentTypes.reduce((s,t)=>s+availableEquipmentTotal(t.name,date),0)}
function totalMP(){return availableMP(reportDate())}
function totalEQ(){return availableEQ(reportDate())}
function activeLoc(){const d=reportDate();const ids=new Set([...state.mpEntries.filter(e=>e.date===d&&e.count>0).map(e=>e.building),...state.eqEntries.filter(e=>e.date===d&&e.count>0).map(e=>e.building),...state.pgEntries.filter(e=>e.date===d&&e.actual>0).map(e=>e.building)]);return ids.size}
function resourceMatchPercent(kind='mp'){const d=reportDate();const defs=kind==='mp'?state.trades:state.equipmentTypes;const entries=kind==='mp'?state.mpEntries:state.eqEntries;const field=kind==='mp'?'trade':'type';if(!defs.length)return 100;let matched=0;defs.forEach(def=>{const available=kind==='mp'?availableTradeTotal(def.name,d):availableEquipmentTotal(def.name,d);const allocated=entries.filter(e=>e.date===d&&e[field]===def.name).reduce((s,e)=>s+Number(e.count||0),0);if(allocated===available)matched++});return Math.round(matched/defs.length*100)}
function distributionMatch(){const totalCats=state.trades.length+state.equipmentTypes.length;if(!totalCats)return 100;const mpMatched=state.trades.filter(t=>allocationForTrade(t.name)===availableTradeTotal(t.name)).length;const eqMatched=state.equipmentTypes.filter(t=>allocationForEquipment(t.name)===availableEquipmentTotal(t.name)).length;return Math.round((mpMatched+eqMatched)/totalCats*100)}
function allocationUtil(){const total=availableMP()+availableEQ();const alloc=state.mpEntries.filter(e=>e.date===reportDate()).reduce((s,e)=>s+Number(e.count||0),0)+state.eqEntries.filter(e=>e.date===reportDate()).reduce((s,e)=>s+Number(e.count||0),0);return total?Math.round(alloc/total*100):0}
function statusFor(a){const x=Number(a.actual||0);return x>=99.9?'Completed':x>0?'In Progress':'Not Started'}
function scheduleFor(a){
  const today=reportDate();
  const x=Number(a.actual||0);
  const finish=validDateString(a.finish);
  const start=validDateString(a.start);
  if(x>=99.9)return 'Completed';
  if(finish && today>finish)return 'Behind';
  if(start && today<start)return 'Not Started';
  return 'On Schedule';
}
function progressScheduleFor(a,actual=Number(a.actual||0),date=reportDate()){
  const start=validDateString(a.start);
  const finish=validDateString(a.finish);
  const d=validDateString(date)||reportDate();
  const x=Number(actual||0);
  const warn=Number(state.project.warn||5);

  // Completed activity is always healthy.
  if(x>=99.9||String(a.status||'')==='Completed')return 'On Schedule';

  // Red / Behind is driven ONLY by Planned Finish.
  // No Finish Date means we cannot technically classify the activity as late.
  if(!finish)return 'No Baseline';

  // If today/report date has not passed Planned Finish, it is not late.
  if(d<=finish){
    // Optional Ahead indicator when a complete baseline exists.
    if(start&&finish&&finish>start){
      const planned=activityPlannedAtDate(a,d);
      if(x>Number(planned)+warn)return 'Ahead';
    }
    return 'On Schedule';
  }

  // Planned Finish passed and the activity is incomplete = Behind.
  return 'Behind';
}

function buildingScheduleState(b,date=reportDate()){
  const acts=b.activities||[];
  if(!acts.length)return 'No Baseline';

  let hasOnSchedule=false,hasAhead=false,hasNoBaseline=false;
  for(const a of acts){
    const actual=activityActualAtDate(b,a,date);
    const s=progressScheduleFor(a,actual,date);
    if(s==='Behind')return 'Behind';
    if(s==='On Schedule')hasOnSchedule=true;
    else if(s==='Ahead')hasAhead=true;
    else if(s==='No Baseline')hasNoBaseline=true;
  }

  if(hasOnSchedule)return 'On Schedule';
  if(hasAhead)return 'Ahead';
  if(hasNoBaseline)return 'No Baseline';
  return 'No Baseline';
}

function performanceFor(a){const x=Number(a.actual||0),p=Number(a.planned||0),w=Number(state.project.warn||5);if(p===0)return 'No Baseline';if(x-p>w)return 'Ahead';if(x-p<-w)return 'Behind';return 'On Target'}

function fillSelect(id,items,placeholder=true){const el=document.getElementById(id);if(!el)return;el.innerHTML=placeholder?'<option value="">Select...</option>':'';items.forEach(x=>{const o=document.createElement('option');o.value=x.id||x.name;o.textContent=x.name;el.appendChild(o)})}
function escaped(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function setDefaults(){const d=reportDate();['mpDate','eqDate','pgDate'].forEach(id=>{if(document.getElementById(id))document.getElementById(id).value=d})}

function renderDashboard(){
  const a=projectActual(),p=projectPlanned(),mp=totalMP(),eq=totalEQ(),active=activeLoc();
  const ringValue=Math.max(0,Math.min(100,mp));
  document.getElementById('overallHero').textContent=mp;
  document.getElementById('overallRing').style.background=`conic-gradient(#f5d45b 0deg, #f5d45b ${Math.max(18,ringValue*3.6*0.34)}deg, #f59bc4 ${Math.max(18,ringValue*3.6*0.34)}deg ${Math.max(36,ringValue*3.6*0.67)}deg, #7fd3ff ${Math.max(36,ringValue*3.6*0.67)}deg ${Math.max(54,ringValue*3.6)}deg, rgba(255,255,255,.22) ${Math.max(54,ringValue*3.6)}deg 360deg)`;
  document.getElementById('trackedCount').textContent=`${state.buildings.length} BUILDINGS TRACKED`;
  const date=new Date(reportDate()+'T12:00:00');
  const formattedDate=date.toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'short',year:'numeric'});
  const snapshotDate=document.getElementById('snapshotDate'); if(snapshotDate) snapshotDate.textContent=formattedDate;
  document.getElementById('totalManpower').textContent=mp;document.getElementById('totalEquipment').textContent=eq;document.getElementById('activeLocations').textContent=`${active} / ${state.buildings.length}`;
  document.getElementById('kpiMp').textContent=mp;document.getElementById('kpiEq').textContent=eq;document.getElementById('kpiBuildings').textContent=active;
  const distributionState=(mp===0&&eq===0)?'Missing':(distributionMatch()===100?'Matched':'Missing');
  document.getElementById('distributionMatch').textContent=distributionState;
  document.getElementById('liveOps').textContent=`${active} active locations`;document.getElementById('allocationUtil').textContent=allocationUtil()+'%';
  const eqMatch=resourceMatchPercent('eq');document.getElementById('scheduleSummary').textContent=eq===0?'No equipment':eqMatch===100?'Operational':'Check allocation';document.getElementById('scheduleDetail').textContent=eq===0?'Awaiting daily input':eqMatch===100?`${eq} units reconciled`:`Equipment distribution ${eqMatch}% matched`;const distKpi=document.getElementById('distributionMatch')?.closest('.kpi');if(distKpi){distKpi.classList.toggle('match-good',distributionState==='Matched');distKpi.classList.toggle('match-bad',distributionState!=='Matched')};
  document.getElementById('heroTitleProject').textContent=state.project.name;
  const hp=document.getElementById('headerProjectName');if(hp)hp.textContent=state.project.name;
  const heroDescription=document.getElementById('heroDescription');if(heroDescription)heroDescription.textContent=state.project.heroDescription||`${state.project.name} · ${state.project.type||'500/33/33 kV'} Generation Substation. Daily tracking of civil manpower, construction equipment, and their distribution across the project buildings.`;
  const heroSubstationType=document.getElementById('heroSubstationType');if(heroSubstationType)heroSubstationType.textContent=state.project.type||'500/33/33 kV';
  const heroEngineer=document.getElementById('heroEngineer');if(heroEngineer)heroEngineer.textContent=state.project.engineer||'Civil Engineer';
  const heroDate=document.getElementById('heroDate');if(heroDate)heroDate.textContent=formattedDate;
  const engChip=document.getElementById('engineerChip');if(engChip)engChip.textContent=state.project.engineer||session?.user?.email||'Engineer';
  const ss=document.getElementById('storageStatusBtn');if(ss){ss.textContent=supabaseClient&&session?'Storage ✓':'Storage';ss.title=supabaseClient&&session?'Cloud persistence connected':'Cloud persistence not connected'};
  renderDashboardResources();renderLayout();renderCharts();renderLocationRanking();renderActivityHotlist();renderPhotoArea();syncChartSelectors(document.getElementById('page-dashboard'));
}

let heroEditMode=false;
function setHeroEditMode(on){
  heroEditMode=!!on;
  document.querySelectorAll('[data-hero-edit]').forEach(el=>{
    el.contentEditable=heroEditMode?'true':'false';
    el.classList.toggle('hero-inline-editing',heroEditMode);
  });
  const btn=document.getElementById('editHeroBtn');
  if(btn)btn.textContent=heroEditMode?'✓ Save Header':'✎ Edit Header';
  if(heroEditMode)document.getElementById('heroTitleProject')?.focus();
}
function saveHeroEdits(){
  const title=String(document.getElementById('heroTitleProject')?.textContent||'').trim();
  const desc=String(document.getElementById('heroDescription')?.textContent||'').trim();
  const type=String(document.getElementById('heroSubstationType')?.textContent||'').trim();
  const engineer=String(document.getElementById('heroEngineer')?.textContent||'').trim();
  if(title)state.project.name=title;
  state.project.heroDescription=desc;
  if(type)state.project.type=type;
  if(engineer)state.project.engineer=engineer;
  save();setHeroEditMode(false);renderAll();
}
function startFreshToday(){
  const cutoff=reportDate();
  const countBefore=(arr)=>arr.filter(x=>validDateString(x.date)&&x.date<cutoff).length;
  const removeCount=countBefore(state.mpEntries)+countBefore(state.eqEntries)+countBefore(state.pgEntries)+countBefore(state.manualActivities);
  if(!confirm(`Make ${cutoff} the first reporting day?\n\nThis will permanently delete ${removeCount} saved daily record(s) dated before ${cutoff}.\nBuildings, activities, current structure and baseline dates will NOT be deleted.`))return;
  state.mpEntries=state.mpEntries.filter(x=>!validDateString(x.date)||x.date>=cutoff);
  state.eqEntries=state.eqEntries.filter(x=>!validDateString(x.date)||x.date>=cutoff);
  state.pgEntries=state.pgEntries.filter(x=>!validDateString(x.date)||x.date>=cutoff);
  state.manualActivities=state.manualActivities.filter(x=>!validDateString(x.date)||x.date>=cutoff);
  Object.keys(state.availabilityMp||{}).forEach(d=>{if(validDateString(d)&&d<cutoff)delete state.availabilityMp[d]});
  Object.keys(state.availabilityEq||{}).forEach(d=>{if(validDateString(d)&&d<cutoff)delete state.availabilityEq[d]});
  state.project.dataStartDate=cutoff;
  save();renderAll();
  alert(`${cutoff} is now the first reporting day. Weekly / monthly reporting will not include dates before it.`);
}

function renderLayout(){
  const el=document.getElementById('layoutGrid');if(!el)return;el.innerHTML='';const rd=reportDate();ensureGlobalCustomizationState();const anyManual=state.buildings.some(b=>state.uiPrefs.siteLayout?.[b.id]&&Object.keys(state.uiPrefs.siteLayout[b.id]).length);el.classList.toggle('manual-site-layout',anyManual);
  state.buildings.forEach((b,i)=>{
    const ba=buildingActualAtDate(b,rd),mp=state.mpEntries.filter(e=>e.date===rd&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0),eq=state.eqEntries.filter(e=>e.date===rd&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0);
    const scheduleState=buildingScheduleState(b,rd);
    const resourceHealth=locationResourceHealth(b.id,rd);
    const working=ba>0||mp>0||eq>0;
    const isProblem=scheduleState==='Behind'||resourceHealth.mismatch;
    const isGreen=!isProblem&&working;

    const d=document.createElement('div');
    d.className='layout-item'+(isGreen?' active':'')+(isProblem?' overdue':'');
    d.dataset.buildingId=b.id;
    d.dataset.scheduleState=scheduleState;

    if(resourceHealth.mismatch)d.title='Active location with a manpower/equipment allocation mismatch.';
    else if(scheduleState==='Behind')d.title='Behind schedule because Planned Finish has passed and the work is incomplete.';
    else if(working)d.title='Active location with reconciled resources.';
    else d.title='No active work. Neutral status.';

    const p=state.uiPrefs.siteLayout?.[b.id]||{};
    if(Object.keys(p).length){
      const col=Math.max(1,Math.min(12,Number(p.col||1))),row=Math.max(1,Math.min(30,Number(p.row||1))),w=Math.max(1,Math.min(12,Number(p.w||3))),h=Math.max(1,Math.min(8,Number(p.h||1)));
      d.style.gridColumn=`${col}/span ${Math.min(w,13-col)}`;
      d.style.gridRow=`${row}/span ${h}`;
      if(p.background&&p.background!=='default')d.style.background=backgroundValue(p.background);
    }else{
      const span=i===0?4:(i%4===0?3:i%3===0?2:3);
      d.style.gridColumn=`span ${Math.min(span,4)}`;
      d.style.gridRow=`span ${i===0?2:1}`;
    }

    d.innerHTML=`<span class="pct">${fmt(ba,1)}%</span><h4>${escaped(b.name)}</h4><div class="mini"><span>👷 MP ${mp}</span><span>▣ EQ ${eq}</span></div>`;
    d.onclick=()=>openBuilding(b.id);
    el.appendChild(d);
  });
}
function destroyChart(id){
  try{
    const c=document.getElementById(id);
    if(window.Chart && c){const existing=Chart.getChart(c);if(existing)existing.destroy();}
  }catch(e){console.warn('Chart cleanup skipped',id,e)}
  chartRefs[id]=null;
}
function palette(i,alpha=1){const colors=[[111,53,230],[22,139,230],[24,183,137],[245,212,91],[245,155,196],[255,166,43],[151,115,242],[121,199,255]];const c=colors[i%colors.length];return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`}
function styleDatasets(datasets,mode='bar'){return (datasets||[]).map((ds,i)=>Object.assign({},ds,{backgroundColor:ds.backgroundColor||(mode==='area'?palette(i,.12):palette(i,mode==='line'?.18:.78)),borderColor:ds.borderColor||palette(i,1),borderRadius:mode==='bar'?8:0,borderWidth:(mode==='line'||mode==='area')?2:2,tension:(mode==='line'||mode==='area')?0.28:(ds.tension||0),fill:mode==='area'?true:(mode==='line'?false:(ds.fill||false)),pointRadius:(mode==='line'||mode==='area')?2.5:(ds.pointRadius||0),pointHoverRadius:(mode==='line'||mode==='area')?4:(ds.pointHoverRadius||0),pointBackgroundColor:ds.pointBackgroundColor||palette(i,1)}))}
function renderChipLegend(containerId,labels,values){const el=document.getElementById(containerId);if(!el)return;el.innerHTML=(labels||[]).map((label,i)=>`<span class="legend-chip"><i style="background:${palette(i,1)}"></i>${escaped(label)}<b>${Number(values?.[i]||0)}</b></span>`).join('')}
const pointLabelPlugin={id:'pointLabelPlugin',afterDatasetsDraw(chart,args,pluginOptions){if(!pluginOptions||!pluginOptions.enabled)return;const {ctx}=chart;const labels=chart.data.labels||[];chart.data.datasets.forEach((ds,di)=>{const meta=chart.getDatasetMeta(di);if(meta.hidden)return;meta.data.forEach((point,i)=>{const value=Array.isArray(ds.data)?ds.data[i]:undefined;if(value===undefined||value===null||Number(value)<=0)return;const x=point.x;const y=point.y;const text=`${labels[i]} - ${value}`;ctx.save();ctx.font='600 10px Inter, sans-serif';const padX=6,padY=4,r=6;const w=ctx.measureText(text).width+padX*2;const h=20;let lx=x+6,ly=y-22;if(lx+w>chart.chartArea.right)lx=x-w-6;if(ly<chart.chartArea.top+2)ly=y+8;ctx.fillStyle='rgba(255,255,255,.96)';ctx.strokeStyle=palette(i,0.45);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(lx+r,ly);ctx.arcTo(lx+w,ly,lx+w,ly+h,r);ctx.arcTo(lx+w,ly+h,lx,ly+h,r);ctx.arcTo(lx,ly+h,lx,ly,r);ctx.arcTo(lx,ly,lx+w,ly,r);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#4d4760';ctx.textBaseline='middle';ctx.fillText(text,lx+padX,ly+h/2);ctx.restore();});});}};
if(window.Chart && !(Chart.registry?.plugins?.get && Chart.registry.plugins.get('pointLabelPlugin'))){Chart.register(pointLabelPlugin)}
function decorateChartOptions(options={},mode='bar'){const o=clone(options||{});o.responsive=true;o.maintainAspectRatio=false;o.plugins=Object.assign({legend:{position:'bottom',labels:{boxWidth:12,boxHeight:12,usePointStyle:true,pointStyle:'circle',padding:16,color:'#5f5676',font:{size:11,weight:'600'}}},tooltip:{backgroundColor:'rgba(33,27,59,.96)',padding:12,titleFont:{weight:'700'},bodyFont:{weight:'600'}}},o.plugins||{});if(mode==='bar'){o.scales=o.scales||{};if(o.scales.x){o.scales.x.grid=Object.assign({display:false,drawBorder:false},o.scales.x.grid||{});o.scales.x.ticks=Object.assign({color:'#6f6885',font:{size:11,weight:'600'}},o.scales.x.ticks||{})}if(o.scales.y){o.scales.y.grid=Object.assign({color:'rgba(111,53,230,.08)',drawBorder:false},o.scales.y.grid||{});o.scales.y.ticks=Object.assign({color:'#857b99',font:{size:10}},o.scales.y.ticks||{})}}
if(mode==='line'||mode==='area'){o.elements=Object.assign({line:{borderWidth:2},point:{radius:2.5,hoverRadius:4}},o.elements||{});o.scales=o.scales||{};if(o.scales.x){o.scales.x.grid=Object.assign({display:false,drawBorder:false},o.scales.x.grid||{});o.scales.x.ticks=Object.assign({color:'#6f6885',font:{size:11,weight:'600'}},o.scales.x.ticks||{})}if(o.scales.y){o.scales.y.grid=Object.assign({color:'rgba(111,53,230,.08)',drawBorder:false},o.scales.y.grid||{});o.scales.y.ticks=Object.assign({color:'#857b99',font:{size:10}},o.scales.y.ticks||{})}}
return o}
function chartOptionsPercent(){return {responsive:true,maintainAspectRatio:false,scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'}}},plugins:{legend:{position:'bottom'}}}}
function getChartMode(id,fallback){state.chartPrefs=Object.assign({},clone(DEFAULT.chartPrefs),state.chartPrefs||{});return state.chartPrefs[id]||fallback}
function setChartMode(id,mode){state.chartPrefs=Object.assign({},state.chartPrefs||{}, {[id]:mode});save();if(String(id).startsWith('report'))renderReports(currentReportKind);else if(String(id).startsWith('overview'))renderOverview();else renderDashboard()}
function syncChartSelectors(scope=document){scope?.querySelectorAll?.('.chart-type-select[data-chart-target]').forEach(sel=>{const id=sel.dataset.chartTarget;sel.value=getChartMode(id,sel.value||'bar');sel.onchange=()=>setChartMode(id,sel.value)})}
function buildChart(canvasId,baseType,data,options,fallback='bar'){
  const canvas=document.getElementById(canvasId);if(!canvas||!window.Chart)return null;
  const requestedMode=getChartMode(canvasId,baseType||fallback);let finalType=requestedMode==='area'?'line':requestedMode;let finalData=clone(data);let finalOptions=clone(options||{});
  const radial=['doughnut','pie','polarArea'].includes(requestedMode);
  if(radial){
    finalOptions.responsive=true;finalOptions.maintainAspectRatio=false;delete finalOptions.scales;
    if((finalData.datasets||[]).length>1){finalData={labels:finalData.labels,datasets:[Object.assign({},finalData.datasets[0],{data:finalData.datasets[0].data})]};}
    finalData.datasets=styleDatasets(finalData.datasets,requestedMode).map((ds,di)=>Object.assign({},ds,{backgroundColor:(Array.isArray(ds.data)?ds.data:[]).map((_,i)=>palette(i,0.9)),borderColor:(Array.isArray(ds.data)?ds.data:[]).map((_,i)=>palette(i,1)),borderWidth:0,hoverOffset:6}));
    finalOptions=decorateChartOptions(finalOptions,requestedMode);
    if(requestedMode==='doughnut'){finalOptions.cutout='72%';}
  }else if(requestedMode==='radar'){
    finalOptions={responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{r:{beginAtZero:true,max:(options?.scales?.y?.max)||undefined,ticks:{backdropColor:'transparent',color:'#81789a'},grid:{color:'rgba(111,53,230,.08)'},angleLines:{color:'rgba(111,53,230,.08)'},pointLabels:{color:'#615777',font:{size:11,weight:'600'}}}}};
    finalData.datasets=styleDatasets(finalData.datasets,'line').map(ds=>Object.assign({},ds,{backgroundColor:palette(0,0.14),fill:true}));
  }else{
    finalData.datasets=styleDatasets(finalData.datasets,requestedMode);
    finalOptions=decorateChartOptions(finalOptions,requestedMode==='area'?'line':requestedMode);
  }
  return new Chart(canvas,{type:finalType,data:finalData,options:finalOptions})
}
function renderCharts(){
  if(!window.Chart)return;
  ['progressChart','manpowerChart','equipmentChart','distributionChart','historyChart'].forEach(destroyChart);
  const rd=reportDate();

  const mpLabels=state.trades.map(t=>t.name), mpValues=state.trades.map(t=>availableTradeTotal(t.name,rd));
  const mpMode=getChartMode('manpowerChart','line');
  chartRefs.manpowerChart=buildChart('manpowerChart','line',{labels:mpLabels,datasets:[{label:'Allocated Workers',data:mpValues,borderWidth:2,fill:false}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},pointLabelPlugin:{enabled:mpMode==='line'}},scales:{x:{display:true,ticks:{font:{size:11,weight:'600'},color:'#6c6681'}},y:{display:true,beginAtZero:true,ticks:{stepSize:5,font:{size:10},color:'#7f7992'},grid:{color:'rgba(124,105,196,.10)',drawBorder:false}}}},'line');
  renderChipLegend('manpowerLegend',mpLabels,mpValues);

  const eqLabels=state.equipmentTypes.map(t=>t.name), eqValues=state.equipmentTypes.map(t=>availableEquipmentTotal(t.name,rd));
  const eqMode=getChartMode('equipmentChart','line');
  chartRefs.equipmentChart=buildChart('equipmentChart','line',{labels:eqLabels,datasets:[{label:'Allocated Units',data:eqValues,borderWidth:2,fill:false}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},pointLabelPlugin:{enabled:eqMode==='line'}},scales:{x:{display:true,ticks:{font:{size:11,weight:'600'},color:'#6c6681'}},y:{display:true,beginAtZero:true,ticks:{stepSize:1,font:{size:10},color:'#7f7992'},grid:{color:'rgba(124,105,196,.10)',drawBorder:false}}}},'line');
  renderChipLegend('equipmentLegend',eqLabels,eqValues);

  const buildingLabels=state.buildings.map(b=>b.name);
  const distMode=getChartMode('distributionChart','area');
  const distDatasets=state.trades.map((t,i)=>({label:t.name,data:state.buildings.map(b=>state.mpEntries.filter(e=>e.date===rd&&e.trade===t.name&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0)),pointRadius:2.5,fill:distMode==='area'}));
  chartRefs.distributionChart=buildChart('distributionChart','area',{labels:buildingLabels,datasets:distDatasets},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},pointLabelPlugin:{enabled:true}},scales:{x:{display:true,ticks:{maxRotation:42,minRotation:42,autoSkip:false,font:{size:10,weight:'600'},color:'#7d7690'},grid:{display:false}},y:{display:true,beginAtZero:true,ticks:{stepSize:0.5,font:{size:10},color:'#7d7690'},grid:{color:'rgba(124,105,196,.12)',drawBorder:false}}}},'area');
}
function renderLocationRanking(){const wrap=document.getElementById('locationRanking');if(!wrap)return;const rd=reportDate();const rows=state.buildings.map(b=>{const mp=state.mpEntries.filter(e=>e.date===rd&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0);const eq=state.eqEntries.filter(e=>e.date===rd&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0);return {name:b.name,mp,eq,total:mp+eq};}).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);const peak=Math.max(...rows.map(x=>x.total),1);wrap.innerHTML=rows.length?rows.map((row,i)=>`<div class="ranking-item"><div class="ranking-top"><div class="rank-badge">${i+1}</div><div class="rank-title">${escaped(row.name)}</div><div class="rank-total">${row.total} Total</div></div><div class="rank-bar"><span class="mp-bar" style="width:${(row.mp/peak)*100}%"></span><span class="eq-bar" style="width:${(row.eq/peak)*100}%"></span></div><div class="rank-meta"><span>${row.mp} MP</span><span>${row.eq} EQ</span><span>${Math.round(row.total/peak*100)}% of peak</span></div></div>`).join(''):'<div class="empty-state">No active locations for the selected report date yet.</div>'}
function renderActivityHotlist(){
  const wrap=document.getElementById('activityHotlist');if(!wrap)return;const rd=reportDate();const items=[];
  state.buildings.forEach(b=>(b.activities||[]).forEach(a=>{const actual=activityActualAtDate(b,a,rd);const sched=scheduleFor({...a,actual});if((actual>0&&actual<100)||sched==='Behind')items.push({building:b.name,name:a.name,status:sched==='Behind'?'Delayed':'In Progress',manual:false})}));
  state.manualActivities.filter(x=>x.date===rd).forEach(x=>{const b=state.buildings.find(z=>z.id===x.building);items.push({building:b?.name||'General / No location',name:x.name,status:'In Progress',manual:true,id:x.id})});
  const inProgress=items.filter(x=>x.status==='In Progress').length,delayed=items.filter(x=>x.status==='Delayed').length;const ipc=document.getElementById('inProgressCount'),dc=document.getElementById('delayedCount');if(ipc)ipc.textContent=inProgress;if(dc)dc.textContent=delayed;
  wrap.innerHTML=items.length?items.map(item=>`<div class="hot-activity ${item.status==='Delayed'?'delayed':''}"><div><strong>${escaped(item.building)}</strong><span>${escaped(item.name)}</span></div><div class="hot-actions"><span class="hot-status">${item.status}</span>${item.manual?`<button type="button" class="mini-remove manual-activity-remove" data-id="${item.id}">Remove</button>`:''}</div></div>`).join(''):'<div class="empty-state">No in-progress or delayed activities for the selected report date.</div>';
  const sel=document.getElementById('manualActivityBuilding');if(sel){const current=sel.value;sel.innerHTML='<option value="">General / No location</option>'+state.buildings.map(b=>`<option value="${b.id}">${escaped(b.name)}</option>`).join('');sel.value=current}
  const add=document.getElementById('addManualActivityBtn');if(add)add.onclick=addManualActivities;wrap.querySelectorAll('.manual-activity-remove').forEach(btn=>btn.onclick=()=>{state.manualActivities=state.manualActivities.filter(x=>String(x.id)!==String(btn.dataset.id));save();renderActivityHotlist()});
}
function addManualActivities(){const ta=document.getElementById('manualActivityText'),sel=document.getElementById('manualActivityBuilding');const lines=String(ta?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return;lines.forEach((name,i)=>state.manualActivities.push({id:Date.now()+'-'+i,date:reportDate(),building:sel?.value||'',name}));if(ta)ta.value='';save();renderActivityHotlist()}
function renderPhotoArea(){const wrap=document.getElementById('progressPhotosArea');if(!wrap)return;const date=reportDate();const day=photoDay(date,false);wrap.innerHTML=state.buildings.map(b=>{const photos=day[b.id]||[];const cover=photos[0]?.data||'';return `<div class="photo-card"><div class="photo-count">${photos.length} photos</div><div class="photo-preview">${cover?`<img src="${cover}" alt="${escaped(b.name)}">`:'<div class="photo-empty">No photos</div>'}</div><div class="photo-body"><h4>${escaped(b.name)}</h4><small>${fmtLongDate(date)} · Full image · no cropping</small><div class="photo-thumbs">${photos.map((ph,i)=>`<div class="thumb"><img src="${ph.data}" alt=""><button class="thumb-remove" data-building="${b.id}" data-photo-index="${i}" type="button">Remove</button></div>`).join('')}</div><label class="btn light upload-label">Add Photos<input class="photo-input" data-building="${b.id}" type="file" accept="image/*" multiple hidden></label></div></div>`}).join('');wrap.querySelectorAll('.photo-input').forEach(inp=>inp.onchange=(e)=>handlePhotoUpload(inp.dataset.building,e.target.files,date));wrap.querySelectorAll('.thumb-remove').forEach(btn=>btn.onclick=()=>removePhoto(btn.dataset.building,Number(btn.dataset.photoIndex),date))}
function compressPhoto(file){return new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve({name:file.name,data:canvas.toDataURL('image/jpeg',.72)});};img.src=String(reader.result)};reader.readAsDataURL(file)})}
async function handlePhotoUpload(buildingId,files,date=reportDate()){
  if(!files?.length)return;
  if(!supabaseClient||!session)return alert('Sign in to the shared cloud project first.');
  const d=validDateString(date)||reportDate();
  try{
    const tasks=[...files].slice(0,5).map(compressPhoto);const loaded=await Promise.all(tasks);
    for(const ph of loaded)await uploadPhotoRecord(buildingId,{...ph,date:d},d);
    photoCloudLoadedDates.delete(d);await loadCloudPhotosForDate(d,true);
  }catch(e){console.error(e);alert('Cloud photo upload failed: '+e.message)}
}
async function removePhoto(buildingId,index,date=reportDate()){
  if(!supabaseClient||!session)return;
  const d=validDateString(date)||reportDate();const day=photoDay(d,false);const ph=(day[buildingId]||[])[index];if(!ph)return;
  try{
    if(ph.path){const {error}=await supabaseClient.storage.from(PHOTO_BUCKET).remove([ph.path]);if(error)throw error}
    if(ph.id){const {error}=await supabaseClient.from('project_photos').delete().eq('id',ph.id).eq('project_id',PROJECT_ID);if(error)throw error}
    photoCloudLoadedDates.delete(d);await loadCloudPhotosForDate(d,true);
  }catch(e){console.error(e);alert('Cloud photo delete failed: '+e.message)}
}
async function removeCloudPhotosForBuilding(buildingId){
  if(!supabaseClient||!session)return;
  const {data:rows,error}=await supabaseClient.from('project_photos').select('id,storage_path,report_date').eq('project_id',PROJECT_ID).eq('building_id',buildingId);
  if(error){console.error(error);return}
  const paths=(rows||[]).map(r=>r.storage_path).filter(Boolean);if(paths.length)await supabaseClient.storage.from(PHOTO_BUCKET).remove(paths);
  await supabaseClient.from('project_photos').delete().eq('project_id',PROJECT_ID).eq('building_id',buildingId);
  (rows||[]).forEach(r=>photoCloudLoadedDates.delete(String(r.report_date)));
}

function projectActualAtDate(date){return projectActualAt(validDateString(date)||reportDate())}

function setProgressManualEditMode(on){progressManualEditMode=!!on;document.documentElement.classList.toggle('manual-progress-mode',progressManualEditMode);const btn=document.getElementById('progressManualEditBtn');if(btn){btn.textContent=progressManualEditMode?'✎ Manual Edit: ON':'✎ Manual Edit: OFF';btn.classList.toggle('primary',progressManualEditMode);btn.classList.toggle('light',!progressManualEditMode);}renderProgress();}
function renderProgress(){
  const list=document.getElementById('wbsList');if(!list)return;list.innerHTML='';
  const search=(document.getElementById('progressSearch')?.value||'').toLowerCase();
  const filter=document.getElementById('progressFilter')?.value||'all';
  const rd=reportDate();
  let totalActs=0,completedActs=0,notStarted=0,inProgress=0,behind=0,ahead=0,onSchedule=0,noBaseline=0,startAlerts=0;
  const transformerCount=state.buildings.filter(b=>/transformer/i.test(b.name)).length;

  state.buildings.forEach(b=>{
    const acts=b.activities||[];
    totalActs+=acts.length;

    acts.forEach(a=>{
      const actual=activityActualAtDate(b,a,rd);
      const st=(a.status&&['Not Started','In Progress','Completed'].includes(a.status))?a.status:statusFor({...a,actual});
      const sched=progressScheduleFor(a,actual,rd);
      if(actual>=99.9||st==='Completed')completedActs++;
      else if(actual>0||st==='In Progress')inProgress++;
      else notStarted++;
      if(sched==='Behind')behind++;
      else if(sched==='Ahead')ahead++;
      else if(sched==='No Baseline')noBaseline++;
      else onSchedule++;
      if(validDateString(a.start)&&rd>validDateString(a.start)&&actual<=0)startAlerts++;
    });

    const visible=acts.filter(a=>{
      const st=(a.status&&['Not Started','In Progress','Completed'].includes(a.status))?a.status:statusFor({...a,actual:activityActualAtDate(b,a,rd)});
      return (b.name+' '+a.name+' '+(a.id||'')).toLowerCase().includes(search)&&(filter==='all'||st===filter);
    });
    if((search||filter!=='all')&&!visible.length)return;

    const actualPct=buildingActualAtDate(b,rd);
    const completedCount=acts.filter(a=>activityActualAtDate(b,a,rd)>=99.9).length;

    const div=document.createElement('div');
    div.className='building-block progress-building-card';
    div.dataset.building=b.id;

    div.innerHTML=`
      <div class="progress-building-head-ref">
        <div class="progress-building-title-ref">
          <div class="progress-building-icon-ref">⌂</div>
          <div>
            <h3 class="progress-building-name" data-b="${b.id}" title="Edit this name with Manual Edit → Edit Building">${escaped(b.name)}</h3>
            <small>${acts.length} baseline activities · ${completedCount} completed · weighted progress ${fmt(actualPct,2)}%</small>
          </div>
        </div>
        <div class="progress-building-meter-ref">
          <div class="progress-building-meter-track"><div class="progress-building-meter-fill" style="width:${Math.max(0,Math.min(100,actualPct))}%"></div></div>
        </div>
        <div class="progress-building-end-ref">
          <div class="progress-building-pct-ref">${fmt(actualPct,2)}%</div>
          <button class="btn light toggle-building progress-chevron" type="button">⌄</button>
        </div>
        <div class="progress-building-admin-actions progress-admin-only">
          <button class="btn light edit-progress-building" data-b="${b.id}" type="button">✎ Edit Building</button>
          <button class="btn primary add-activity" data-b="${b.id}" type="button">+ Add Activity</button>
        </div>
      </div>`;

    const table=document.createElement('table');
    table.className='activity-table modern-progress-table hidden';
    table.innerHTML='<thead><tr><th>Activity Name</th><th>Weight</th><th>Actual Progress</th><th>Planned Start</th><th>Planned Finish</th><th>Current Status</th><th>Schedule Status</th><th class="progress-admin-only">Actions</th></tr></thead>';

    const tb=document.createElement('tbody');
    visible.forEach(a=>{
      const actual=activityActualAtDate(b,a,rd);
      const st=(a.status&&['Not Started','In Progress','Completed'].includes(a.status))?a.status:statusFor({...a,actual});
      const sched=progressScheduleFor(a,actual,rd);
      const earned=Number(a.weight||0)*(actual/100);
      let source=String(a.weightSource||'BOQ').toUpperCase();
      if(source==='BOQSPLIT')source='BOQ SPLIT';
      if(!['BOQ','BOQ SPLIT','ESTIMATED'].includes(source))source='BOQ';
      const sourceClass=source==='ESTIMATED'?'estimated':source==='BOQ SPLIT'?'split':'boq';

      const tr=document.createElement('tr');
      tr.dataset.activity=a.id;
      tr.innerHTML=`
        <td class="bp-activity-cell">
          <div class="view-value bp-activity-wrap">
            <div class="bp-activity-name">${escaped(a.name)}</div>
            <div class="activity-code">${escaped(a.id||'')}</div>
          </div>
          <input class="edit-field activity-name hidden" type="text" value="${escaped(a.name)}">
        </td>
        <td class="bp-weight-cell">
          <span class="view-value bp-weight-chip ${sourceClass}">
            <strong>${fmt(a.weight,2)}%</strong>
            <small>${escaped(source)}</small>
          </span>
          <input class="edit-field activity-weight hidden" type="number" min="0" max="100" step="0.01" value="${Number(a.weight||0)}">
        </td>
        <td class="bp-actual-cell">
          <div class="bp-actual-wrap always-editable">
            <div class="bp-actual-box">
              <input class="activity-actual-live" type="number" min="0" max="100" step="0.01" value="${Number(actual||0)}">
              <em>%</em>
            </div>
            <small>Earned ${fmt(earned,2)}% of building</small>
          </div>
        </td>
        <td class="bp-date-cell">
          <span class="view-value bp-date-pill">${escaped(fmtShortDate(a.start))}</span>
          <input class="edit-field activity-start hidden" type="date" value="${validDateString(a.start)}">
        </td>
        <td class="bp-date-cell">
          <span class="view-value bp-date-pill">${escaped(fmtShortDate(a.finish))}</span>
          <input class="edit-field activity-finish hidden" type="date" value="${validDateString(a.finish)}">
        </td>
        <td class="bp-status-cell">
          <select class="activity-status-live ${st.toLowerCase().replaceAll(' ','-')}">
            <option ${st==='Not Started'?'selected':''}>Not Started</option>
            <option ${st==='In Progress'?'selected':''}>In Progress</option>
            <option ${st==='Completed'?'selected':''}>Completed</option>
          </select>
        </td>
        <td class="bp-schedule-cell"><span class="schedule bp-schedule-chip ${sched.toLowerCase().replaceAll(' ','-')} ${sched==='No Baseline'&&actual>0?'working-no-baseline':''}">${escaped(sched.toUpperCase())}</span></td>
        <td class="progress-admin-only">
          <div class="row-actions">
            <button class="btn light edit-activity" data-b="${b.id}" data-a="${a.id}" type="button">Edit</button>
            <button class="btn light danger delete-activity" data-b="${b.id}" data-a="${a.id}" type="button">Delete</button>
          </div>
          <span class="hidden view-value"> </span>
        </td>`;
      tb.appendChild(tr);
    });

    table.appendChild(tb);
    div.appendChild(table);
    list.appendChild(div);

    const tg=div.querySelector('.toggle-building');
    tg.onclick=()=>{table.classList.toggle('hidden');tg.textContent=table.classList.contains('hidden')?'⌄':'⌃'};
    div.querySelector('.edit-progress-building')?.addEventListener('click',()=>openProgressBuildingEditor(b));
    div.querySelector('.progress-building-name')?.addEventListener('dblclick',()=>{if(progressManualEditMode)openProgressBuildingEditor(b)});
    div.querySelector('.add-activity')?.addEventListener('click',()=>addActivity(b.id));

    div.querySelectorAll('.activity-actual-live').forEach(inp=>{
      inp.onchange=()=>{
        const tr=inp.closest('tr'); const aid=tr?.dataset.activity;
        const act=(b.activities||[]).find(x=>x.id===aid); if(!act)return;
        const newActual=clampPct(inp.value); act.actual=newActual;
        if(newActual>=99.9) act.status='Completed'; else if(newActual>0&&act.status==='Not Started') act.status='In Progress';
        const d=reportDate();
        const existing=state.pgEntries.find(e=>e.date===d&&e.building===b.id&&e.activity===act.name);
        if(existing) existing.actual=newActual;
        else state.pgEntries.push({date:d,building:b.id,activity:act.name,actual:newActual,qty:0,remarks:'Updated from Building Progress'});
        save(); renderAll(); openPage('progress'); setProgressManualEditMode(true);
      };
    });

    div.querySelectorAll('.activity-status-live').forEach(sel=>{
      sel.onchange=()=>{
        const tr=sel.closest('tr'); const aid=tr?.dataset.activity;
        const act=(b.activities||[]).find(x=>x.id===aid); if(!act)return;
        act.status=sel.value;
        if(sel.value==='Completed'&&Number(act.actual||0)<99.9)act.actual=100;
        save();renderAll();openPage('progress');setProgressManualEditMode(true);
      };
    });
  });

  const overallActual=projectActual();
  const scheduleLabel=behind>0?'BEHIND':(noBaseline===totalActs&&totalActs>0?'NO BASELINE':'ON TRACK');
  const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};

  setText('progressHeroOverall',fmt(overallActual,2)+'%');
  const ring=document.getElementById('progressHeroRing');if(ring)ring.style.setProperty('--pct',Math.max(0,Math.min(100,overallActual)));
  setText('summaryTrackedLocations',`${state.buildings.length} TRACKED LOCATIONS / PACKAGES`);
  setText('summaryBaselineActivities',`${totalActs} BASELINE ACTIVITIES`);
  setText('summaryTransformers',`${transformerCount} INDEPENDENT TRANSFORMERS`);
  setText('kpiTotalActivities',totalActs);
  setText('kpiNotStarted',notStarted);
  setText('kpiInProgress',inProgress);
  setText('kpiCompleted',completedActs);
  setText('kpiAhead',ahead);
  setText('kpiOnSchedule',onSchedule);
  setText('kpiBehind',behind);
  setText('kpiNoBaseline',noBaseline);
  setText('kpiScheduleLabel',scheduleLabel);
  setText('kpiScheduleNote',`As of ${fmtShortDate(rd)}`);

  const hint=document.getElementById('progressSearchHint');
  if(hint)hint.textContent=`Showing ${totalActs} of ${totalActs} activities across ${state.buildings.length} packages / locations.`;

  const box=document.getElementById('attentionBox');
  if(box){
    if(behind||startAlerts){
      box.classList.remove('hidden');
      box.innerHTML=`<div class="attention-ref-left"><div class="attention-icon-ref">!</div><div><strong>Attention Required${startAlerts?` · ${startAlerts} start alert${startAlerts>1?'s':''}`:''}</strong><div>${behind?`${behind} building activit${behind>1?'ies':'y'} overdue · `:''}${startAlerts?`${startAlerts} due today/started late`:''}${(!behind&&!startAlerts)?'Review baseline dates.':''}</div></div></div><button class="btn light attention-ref-btn" type="button">Show first alert</button>`;
      box.querySelector('.attention-ref-btn').onclick=()=>{
        const first=[...document.querySelectorAll('.progress-building-card')].find(el=>el.querySelector('.bp-schedule-chip.behind'));
        if(first){first.scrollIntoView({behavior:'smooth',block:'center'});first.querySelector('.modern-progress-table')?.classList.remove('hidden');first.querySelector('.toggle-building').textContent='⌃'}
      };
    }else box.classList.add('hidden');
  }

  document.querySelectorAll('.edit-activity').forEach(btn=>btn.onclick=()=>{const b=state.buildings.find(x=>x.id===btn.dataset.b);const a=b?.activities?.find(x=>x.id===btn.dataset.a);if(b&&a)openActivityModal(b,a)});
  document.querySelectorAll('.delete-activity').forEach(btn=>btn.onclick=()=>deleteActivity(btn.dataset.b,btn.dataset.a));
}
function setActivityRowEdit(bid,aid,on){
  const root=document.querySelector(`.building-block[data-building="${bid}"]`);const tr=root?.querySelector(`tr[data-activity="${aid}"]`);if(!tr)return;
  tr.classList.toggle('editing',!!on);
  tr.querySelectorAll('.view-value').forEach(el=>el.classList.toggle('hidden',!!on));
  tr.querySelectorAll('.edit-field').forEach(el=>el.classList.toggle('hidden',!on));
  tr.querySelector('.edit-activity')?.classList.toggle('hidden',!!on);
  tr.querySelector('.save-row')?.classList.toggle('hidden',!on);
  tr.querySelector('.cancel-row')?.classList.toggle('hidden',!on);
  if(on)tr.querySelector('.activity-name')?.focus();
}

function addActivity(bid){
  const b=state.buildings.find(x=>x.id===bid);if(!b)return;
  openActivityModal(b);
}


function openProgressBuildingEditor(b){
  if(!b)return;
  document.getElementById('progressBuildingModal')?.remove();
  ensureGlobalCustomizationState();
  const lp=state.uiPrefs.siteLayout?.[b.id]||{};
  const rd=reportDate();
  const actual=buildingActualAtDate(b,rd);
  const planned=buildingPlannedAtDate(b,rd);
  const mp=state.mpEntries.filter(e=>e.date===rd&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0);
  const eq=state.eqEntries.filter(e=>e.date===rd&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0);

  const wrap=document.createElement('div');
  wrap.id='progressBuildingModal';
  wrap.className='modal-backdrop';
  wrap.innerHTML=`<div class="activity-modal building-modal" role="dialog" aria-modal="true">
    <div class="modal-head">
      <div><span class="eyebrow">SHARED BUILDING DATA</span><h2>Edit Building — ${escaped(b.name)}</h2></div>
      <button type="button" class="btn light modal-close">✕</button>
    </div>
    <form id="progressBuildingForm" class="activity-form-grid">
      <label class="wide">Building / Location Name<input name="name" required value="${escaped(b.name)}"></label>
      <label>Project Weight %<input name="weight" type="number" min="0" max="100" step="0.01" value="${Number(b.weight||0)}"></label>
      <label>Layout Column<input name="col" type="number" min="1" max="12" value="${Number(lp.col||1)}"></label>
      <label>Layout Row<input name="row" type="number" min="1" max="30" value="${Number(lp.row||1)}"></label>
      <label>Box Width<input name="w" type="number" min="1" max="12" value="${Number(lp.w||3)}"></label>
      <label>Box Height<input name="h" type="number" min="1" max="8" value="${Number(lp.h||1)}"></label>
      <label>Box Background<select name="background">
        <option value="default" ${(lp.background||'default')==='default'?'selected':''}>Default</option>
        <option value="white" ${lp.background==='white'?'selected':''}>White</option>
        <option value="lavender" ${lp.background==='lavender'?'selected':''}>Light Lavender</option>
        <option value="blue" ${lp.background==='blue'?'selected':''}>Light Blue</option>
        <option value="green" ${lp.background==='green'?'selected':''}>Light Green</option>
        <option value="warm" ${lp.background==='warm'?'selected':''}>Warm Cream</option>
      </select></label>

      <div class="building-editor-derived wide">
        <div><span>Activities</span><b>${(b.activities||[]).length}</b></div>
        <div><span>Actual Progress</span><b>${fmt(actual,2)}%</b></div>
        <div><span>Planned To Date</span><b>${fmt(planned,2)}%</b></div>
        <div><span>Manpower Today</span><b>${mp}</b></div>
        <div><span>Equipment Today</span><b>${eq}</b></div>
      </div>

      <div class="modal-note wide">
        Building Actual Progress is derived from its Activities and Activity Weights.
        Edit the Activities below to change progress; the Substation Layout percentage updates from the same data.
      </div>

      <div class="modal-actions wide">
        <button type="button" class="btn light open-layout-editor">Open Layout Customize</button>
        <button type="button" class="btn light modal-cancel">Cancel</button>
        <button type="submit" class="btn primary">Save Building</button>
      </div>
    </form>
  </div>`;

  document.body.appendChild(wrap);
  const close=()=>wrap.remove();
  wrap.querySelector('.modal-close').onclick=close;
  wrap.querySelector('.modal-cancel').onclick=close;
  wrap.onclick=e=>{if(e.target===wrap)close()};

  wrap.querySelector('.open-layout-editor').onclick=()=>{
    close();
    openPage('dashboard');
    toggleGlobalCustomizer(true);
    setTimeout(()=>{
      const sel=document.getElementById('siteLayoutBuildingSelect');
      if(sel){sel.value=b.id;renderSiteLayoutCustomizer('dashboard')}
    },0);
  };

  wrap.querySelector('#progressBuildingForm').onsubmit=e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    const oldName=b.name;
    const newName=String(f.get('name')||'').trim();
    if(!newName)return;

    b.name=newName;
    b.weight=Math.max(0,Number(f.get('weight')||0));

    const p=siteLayoutPref(b.id);
    p.col=Math.max(1,Math.min(12,Number(f.get('col')||1)));
    p.row=Math.max(1,Math.min(30,Number(f.get('row')||1)));
    p.w=Math.max(1,Math.min(12,Number(f.get('w')||3)));
    p.h=Math.max(1,Math.min(8,Number(f.get('h')||1)));
    p.background=String(f.get('background')||'default');

    // If this page was opened by clicking the location, keep the renamed location visible.
    const search=document.getElementById('progressSearch');
    if(search && search.value.trim().toLowerCase()===String(oldName).trim().toLowerCase()){
      search.value=newName;
    }

    // Clear any stale old visual-text override that may have existed before V42.
    ['progress','dashboard'].forEach(page=>{
      const prefs=state.uiPrefs?.pages?.[page]?.text;
      if(!prefs)return;
      Object.keys(prefs).forEach(k=>{
        if(String(prefs[k]||'').trim().toLowerCase()===String(oldName).trim().toLowerCase()) delete prefs[k];
      });
    });

    save();
    close();

    // One shared state -> refresh all linked views.
    renderAll();
    openPage('progress');
    setProgressManualEditMode(true);
  };
}

function openActivityModal(b,existing=null){
  document.getElementById('activityModal')?.remove();const editing=!!existing,a=existing||{},next=actsNextId(b),defaultId=`${b.id}-${String(next).padStart(2,'0')}`,wrap=document.createElement('div');wrap.id='activityModal';wrap.className='modal-backdrop';
  wrap.innerHTML=`<div class="activity-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><span class="eyebrow">${editing?'EDIT WBS ACTIVITY':'NEW WBS ACTIVITY'}</span><h2>${editing?'Edit':'Add'} Activity — ${escaped(b.name)}</h2></div><button type="button" class="btn light modal-close">✕</button></div><form id="activityAddForm" class="activity-form-grid"><label>Activity Code<input name="code" required value="${escaped(a.id||defaultId)}"></label><label>Activity Name<input name="name" required value="${escaped(a.name||'')}"></label><label>Unit<input name="unit" value="${escaped(a.unit||'m³')}"></label><label>BOQ Quantity<input name="qty" type="number" min="0" step="0.01" value="${Number(a.qty||0)}"></label><label>Weight %<input name="weight" type="number" min="0" max="100" step="0.01" value="${Number(a.weight??5)}"></label><label>Weight Source<select name="weightSource"><option ${String(a.weightSource||'BOQ').toUpperCase()==='BOQ'?'selected':''}>BOQ</option><option ${String(a.weightSource||'').toUpperCase()==='BOQ SPLIT'?'selected':''}>BOQ SPLIT</option><option ${String(a.weightSource||'').toUpperCase()==='ESTIMATED'?'selected':''}>ESTIMATED</option></select></label><label>Actual %<input name="actual" type="number" min="0" max="100" step="0.01" value="${Number(a.actual||0)}"></label><label>Planned %<input name="planned" type="number" min="0" max="100" step="0.01" value="${Number(a.planned||0)}"></label><label>Planned Start<input name="start" type="date" value="${validDateString(a.start)||validDateString(state.project.start)}"></label><label>Planned Finish<input name="finish" type="date" value="${validDateString(a.finish)||validDateString(state.project.finish)}"></label><label>Current Status<select name="status"><option ${String(a.status||'Not Started')==='Not Started'?'selected':''}>Not Started</option><option ${String(a.status||'')==='In Progress'?'selected':''}>In Progress</option><option ${String(a.status||'')==='Completed'?'selected':''}>Completed</option></select></label><label class="wide">Remarks<textarea name="remarks" rows="3">${escaped(a.remarks||'')}</textarea></label><div class="modal-actions wide"><button type="button" class="btn light modal-cancel">Cancel</button><button type="submit" class="btn primary">${editing?'Save Activity':'Add Activity'}</button></div></form></div>`;
  document.body.appendChild(wrap);const close=()=>wrap.remove();wrap.querySelector('.modal-close').onclick=close;wrap.querySelector('.modal-cancel').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};wrap.querySelector('#activityAddForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')||'').trim(),code=String(f.get('code')||'').trim();if(!name||!code)return;if((b.activities||[]).some(x=>x!==existing&&String(x.id)===code))return alert('Activity Code already exists in this building.');const oldName=existing?.name||'',target=existing||{};target.id=code;target.name=name;target.unit=String(f.get('unit')||'');target.qty=Math.max(0,Number(f.get('qty')||0));target.weight=Math.max(0,Number(f.get('weight')||0));target.weightSource=String(f.get('weightSource')||'BOQ');target.actual=clampPct(f.get('actual'));target.planned=clampPct(f.get('planned'));target.start=validDateString(f.get('start'));target.finish=validDateString(f.get('finish'));target.status=String(f.get('status')||'Not Started');target.remarks=String(f.get('remarks')||'');if(!existing)b.activities.push(target);if(editing&&oldName!==name)state.pgEntries.forEach(pe=>{if(pe.building===b.id&&pe.activity===oldName)pe.activity=name});const d=reportDate(),pe=state.pgEntries.find(x=>x.date===d&&x.building===b.id&&x.activity===name);if(pe)pe.actual=target.actual;else if(target.actual>0)state.pgEntries.push({date:d,building:b.id,activity:name,actual:target.actual,qty:0,remarks:target.remarks||'Updated from Building Progress'});save();close();renderAll();openPage('progress');setProgressManualEditMode(true);};
}
function actsNextId(b){
  let max=0;(b.activities||[]).forEach(a=>{const m=String(a.id||'').match(/-(\d+)$/);if(m)max=Math.max(max,Number(m[1]))});return max+1;
}
function saveActivityRow(bid,aid){
  const b=state.buildings.find(x=>x.id===bid);const a=b?.activities.find(x=>x.id===aid);if(!a)return;
  const root=document.querySelector(`.building-block[data-building="${bid}"]`);const tr=root?.querySelector(`tr[data-activity="${aid}"]`);if(!tr)return;
  const oldName=a.name;const name=String(tr.querySelector('.activity-name')?.value||'').trim();if(!name)return alert('Activity Name is required.');
  a.name=name;a.unit=String(tr.querySelector('.activity-unit')?.value||'');a.qty=Math.max(0,Number(tr.querySelector('.activity-qty')?.value||0));a.weight=Math.max(0,Number(tr.querySelector('.activity-weight')?.value||0));
  const newActual=clampPct(tr.querySelector('.activity-actual')?.value);a.actual=newActual;a.planned=clampPct(tr.querySelector('.activity-planned')?.value);a.start=validDateString(tr.querySelector('.activity-start')?.value);a.finish=validDateString(tr.querySelector('.activity-finish')?.value);a.status=String(tr.querySelector('.activity-status')?.value||statusFor(a));
  if(oldName!==name)state.pgEntries.forEach(e=>{if(e.building===b.id&&e.activity===oldName)e.activity=name});
  const d=reportDate();const existing=state.pgEntries.find(e=>e.date===d&&e.building===b.id&&e.activity===a.name);if(existing)existing.actual=newActual;else state.pgEntries.push({date:d,building:b.id,activity:a.name,actual:newActual,qty:0,remarks:'Updated from Building Progress'});
  save();renderAll();alert('Activity updated successfully for '+d+'.');
}
function deleteActivity(bid,aid){const b=state.buildings.find(x=>x.id===bid);if(!b)return;const idx=(b.activities||[]).findIndex(a=>a.id===aid);if(idx<0)return;const name=b.activities[idx].name;if(!confirm(`Delete activity \"${name}\" from ${b.name}?`))return;b.activities.splice(idx,1);save();renderAll();}
function openBuilding(id){document.querySelector('[data-page="progress"]')?.click();setTimeout(()=>{const b=state.buildings.find(x=>x.id===id);document.getElementById('progressSearch').value=b?.name||'';renderProgress()},30)}

const TRADE_ICONS={'Carpenter + Helper':'🔨','Steel Fixer':'▦','Plumber':'🔧','Electricians':'⚡','Labour':'👷','Builders':'🧱','Scaffolder':'🪜','Plasters':'🪣'};
const EQ_ICONS={'Excavator':'🚜','Crane':'🏗️','Loader':'🚚','Dumper':'🚛','Roller':'🚧'};
function allocationForTrade(name,date=reportDate()){return state.mpEntries.filter(e=>e.date===date&&e.trade===name).reduce((s,e)=>s+Number(e.count||0),0)}
function allocationForEquipment(name,date=reportDate()){return state.eqEntries.filter(e=>e.date===date&&e.type===name).reduce((s,e)=>s+Number(e.count||0),0)}

function resourceRowHealth(kind,name,date=reportDate()){
  const isMp=kind==='mp';
  const entries=isMp?state.mpEntries:state.eqEntries;
  const field=isMp?'trade':'type';
  const available=isMp?availableTradeTotal(name,date):availableEquipmentTotal(name,date);
  const allocated=entries.filter(e=>e.date===date&&e[field]===name).reduce((s,e)=>s+Number(e.count||0),0);
  return {
    available,
    allocated,
    remaining:available-allocated,
    active:allocated>0,
    matched:available===allocated
  };
}

function locationResourceHealth(buildingId,date=reportDate()){
  let active=false;
  let mismatch=false;

  state.trades.forEach(t=>{
    const local=state.mpEntries.filter(e=>e.date===date&&e.building===buildingId&&e.trade===t.name).reduce((s,e)=>s+Number(e.count||0),0);
    if(local>0){
      active=true;
      if(!resourceRowHealth('mp',t.name,date).matched)mismatch=true;
    }
  });

  state.equipmentTypes.forEach(t=>{
    const local=state.eqEntries.filter(e=>e.date===date&&e.building===buildingId&&e.type===t.name).reduce((s,e)=>s+Number(e.count||0),0);
    if(local>0){
      active=true;
      if(!resourceRowHealth('eq',t.name,date).matched)mismatch=true;
    }
  });

  return {active,mismatch};
}

function resourceCardHtml(kind,t,date=reportDate()){
  const isMp=kind==='mp',name=t.name;
  const h=resourceRowHealth(kind,name,date);
  const available=h.available,allocated=h.allocated,remaining=h.remaining,matched=h.matched,active=h.active;
  const icon=isMp?(TRADE_ICONS[name]||'👤'):(EQ_ICONS[name]||'⚙️');
  const tone=!matched?'error':active?'ok':'neutral';
  const light=!matched?'red':active?'green':'neutral';
  const status=!matched?(remaining>0?`⚠ ${remaining} remaining`:`⚠ Exceeded by ${Math.abs(remaining)}`):(active?'✓ MATCHED':'NO ACTIVITY');
  return `<div class="trade-card ${tone}"><div class="resource-title"><span class="resource-icon">${icon}</span><h4>${escaped(name)}</h4><span class="status-light ${light}"></span></div><input data-${isMp?'trade':'eq'}="${escaped(name)}" type="number" min="0" value="${available}"><span class="unit-label">${isMp?'workers':'units'}</span><div class="resource-metrics"><div><span>Available</span><b>${available}</b></div><div><span>Allocated</span><b>${allocated}</b></div><div><span>Remaining</span><b>${remaining}</b></div></div><div class="resource-status ${tone}">${status}</div></div>`;
}
function distributionTableHtml(kind,date=reportDate(),inputPrefix=''){
  const isMp=kind==='mp',defs=isMp?state.trades:state.equipmentTypes,entries=isMp?state.mpEntries:state.eqEntries,field=isMp?'trade':'type';
  const head=`<thead><tr><th>Category</th><th>Available</th><th>Allocated</th><th>Remaining</th>${state.buildings.map(b=>`<th>${escaped(b.name)}</th>`).join('')}<th>Status</th></tr></thead>`;
  const rows=defs.map(t=>{
    const es=entries.filter(e=>e.date===date&&e[field]===t.name);
    const h=resourceRowHealth(kind,t.name,date);
    const alloc=h.allocated,avail=h.available,rem=h.remaining,matched=h.matched,active=h.active;
    const tone=!matched?'row-error':active?'row-ok':'row-neutral';
    const attr=isMp?'mpalloc':'eqalloc';
    const icon=isMp?(TRADE_ICONS[t.name]||'👤'):(EQ_ICONS[t.name]||'⚙️');
    const status=!matched?'MISMATCH':active?'MATCHED':'NO ACTIVITY';
    const statusTone=!matched?'error':active?'ok':'neutral';
    return `<tr class="${tone}"><td><span class="resource-icon small">${icon}</span>${escaped(t.name)}</td><td>${avail}</td><td>${alloc}</td><td class="${rem<0?'negative-cell':''}">${rem}${rem<0?`<small>Exceeded by ${Math.abs(rem)}</small>`:''}</td>${state.buildings.map(b=>`<td><input data-${inputPrefix}${attr}="${escaped(t.name)}|${b.id}" type="number" min="0" value="${es.filter(e=>e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0)}"></td>`).join('')}<td><span class="table-status ${statusTone}">● ${status}</span></td></tr>`;
  }).join('');
  const totalAvail=isMp?availableMP(date):availableEQ(date),totalAlloc=entries.filter(e=>e.date===date).reduce((s,e)=>s+Number(e.count||0),0);
  const totalMatched=totalAvail===totalAlloc,totalActive=totalAlloc>0;
  const totalTone=!totalMatched?'total-error':totalActive?'total-ok':'total-neutral';
  return head+`<tbody>${rows}<tr class="total-row ${totalTone}"><td>TOTAL ALLOCATED</td><td>${totalAvail}</td><td>${totalAlloc}</td><td>${totalAvail-totalAlloc}</td>${state.buildings.map(b=>`<td>${entries.filter(e=>e.date===date&&e.building===b.id).reduce((s,e)=>s+Number(e.count||0),0)}</td>`).join('')}<td>${!totalMatched?'● CHECK':totalActive?'● MATCHED':'● NO ACTIVITY'}</td></tr></tbody>`;
}
function bindResourceControls(scope=document,prefix=''){
  scope.querySelectorAll(`[data-${prefix}trade]`).forEach(i=>i.onchange=()=>{setAvailability('mp',i.dataset[prefix+'trade'],i.value);renderAll()});
  scope.querySelectorAll(`[data-${prefix}eq]`).forEach(i=>i.onchange=()=>{setAvailability('eq',i.dataset[prefix+'eq'],i.value);renderAll()});
  scope.querySelectorAll(`[data-${prefix}mpalloc]`).forEach(i=>i.onchange=()=>updateAllocation('mp',i.dataset[prefix+'mpalloc'],i.value));
  scope.querySelectorAll(`[data-${prefix}eqalloc]`).forEach(i=>i.onchange=()=>updateAllocation('eq',i.dataset[prefix+'eqalloc'],i.value));
}
function renderDashboardResources(){
  const mp=document.getElementById('dashTradeCards'),eq=document.getElementById('dashEquipmentCards');if(!mp||!eq)return;const d=reportDate();
  mp.innerHTML=state.trades.map(t=>resourceCardHtml('mp',t,d).replaceAll('data-trade=','data-dashtrade=')).join('');
  eq.innerHTML=state.equipmentTypes.map(t=>resourceCardHtml('eq',t,d).replaceAll('data-eq=','data-dasheq=')).join('');
  document.getElementById('dashAvailableMp').textContent=availableMP(d);document.getElementById('dashAvailableEq').textContent=availableEQ(d);
  document.getElementById('dashMpDistributionTable').innerHTML=distributionTableHtml('mp',d,'dash');document.getElementById('dashEqDistributionTable').innerHTML=distributionTableHtml('eq',d,'dash');
  bindResourceControls(document.getElementById('page-dashboard'),'dash');
  const at=document.getElementById('dashAddTradeBtn');if(at)at.onclick=addTrade;const ae=document.getElementById('dashAddEquipmentBtn');if(ae)ae.onclick=addEquipment;
}

function renderOverviewCharts(){
  if(!window.Chart)return;
  ['overviewManpowerChart','overviewEquipmentChart'].forEach(destroyChart);
  const d=reportDate();

  const mpRows=reportResourceRows('mp',d);
  const mpLabels=mpRows.map(r=>r.name);
  const mpValues=mpRows.map(r=>r.allocated);
  const mpMode=getChartMode('overviewManpowerChart','bar');
  chartRefs.overviewManpowerChart=buildChart(
    'overviewManpowerChart',
    'bar',
    {labels:mpLabels,datasets:[{label:'Allocated Workers',data:mpValues,borderWidth:2}]},
    {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},pointLabelPlugin:{enabled:mpMode==='line'}},scales:{x:{ticks:{maxRotation:35,minRotation:0}},y:{beginAtZero:true,ticks:{stepSize:1}}}},
    'bar'
  );

  const eqRows=reportResourceRows('eq',d);
  const eqLabels=eqRows.map(r=>r.name);
  const eqValues=eqRows.map(r=>r.allocated);
  const eqMode=getChartMode('overviewEquipmentChart','bar');
  chartRefs.overviewEquipmentChart=buildChart(
    'overviewEquipmentChart',
    'bar',
    {labels:eqLabels,datasets:[{label:'Allocated Units',data:eqValues,borderWidth:2}]},
    {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},pointLabelPlugin:{enabled:eqMode==='line'}},scales:{x:{ticks:{maxRotation:35,minRotation:0}},y:{beginAtZero:true,ticks:{stepSize:1}}}},
    'bar'
  );

  syncChartSelectors(document.getElementById('page-overview'));
}

function syncOverviewDateControls(){
  const d=reportDate();
  const reportEl=document.getElementById('overviewReportDate');
  const fromEl=document.getElementById('overviewFromDate');
  const toEl=document.getElementById('overviewToDate');
  const note=document.getElementById('overviewRangeNote');
  if(reportEl) reportEl.value=d;
  if(fromEl) fromEl.value=overviewRangeFrom||d;
  if(toEl) toEl.value=overviewRangeTo||d;
  if(note){
    note.textContent=(overviewRangeFrom&&overviewRangeTo)
      ? `Selected range: ${fmtLongDate(overviewRangeFrom)} → ${fmtLongDate(overviewRangeTo)} · Overview snapshot: ${fmtLongDate(d)}`
      : `Selected report: ${fmtLongDate(d)}`;
  }
}

function setOverviewSharedDate(value){
  const d=validDateString(value);if(!d)return;
  const globalDate=document.getElementById('reportDate');
  if(globalDate)globalDate.value=d;
  renderAll();
}

function applyOverviewRange(){
  const from=validDateString(document.getElementById('overviewFromDate')?.value);
  const to=validDateString(document.getElementById('overviewToDate')?.value);
  overviewRangeFrom=from||'';
  overviewRangeTo=to||'';
  setOverviewSharedDate(to||from||reportDate());
  openPage('overview');
}

function resetOverviewRange(){
  overviewRangeFrom='';overviewRangeTo='';
  syncOverviewDateControls();
  renderOverview();
}

function renderOverviewPhotoReport(){
  const host=document.getElementById('overviewPhotoReportContent');if(!host)return;
  const date=reportDate();
  const photoItems=reportPhotoItems(date,5);
  host.innerHTML=`
    <div class="daily-print-header photo-header overview-photo-header">
      <div class="brand-col"><div class="print-brand">${escaped(state.project.client||'Scatec')}</div><div class="print-title-wrap"><h1>DAILY SITE PHOTO REPORT</h1><p>${escaped(state.project.name)} - Civil Works</p></div></div>
      <div class="photo-meta"><div>Date: <b>${fmtLongDate(date)}</b></div><div>Civil Engineer: <b>${escaped(state.project.engineer||'Civil Engineer')}</b></div><div>Photos: <b>5</b></div></div>
    </div>
    <div class="photo-grid overview-photo-grid">${[0,1,2,3,4].map(i=>{const ph=photoItems[i];return `<div class="photo-print-card"><div class="photo-print-top"><span>${i+1}/5</span></div><div class="photo-frame">${ph?.data?`<img src="${ph.data}" alt="">`:'<div class="photo-placeholder">No photo</div>'}</div><div class="photo-caption">${escaped(ph?.building||'Project Site')}</div></div>`}).join('')}</div>`;
}

function renderOverview(){
  const d=reportDate();
  syncOverviewDateControls();
  document.getElementById('tradeCards').innerHTML=state.trades.map(t=>resourceCardHtml('mp',t,d)).join('');
  document.getElementById('tradeList').innerHTML=state.trades.map(t=>`<option value="${escaped(t.name)}"></option>`).join('');
  document.getElementById('equipmentCards').innerHTML=state.equipmentTypes.map(t=>resourceCardHtml('eq',t,d)).join('');
  document.getElementById('eqList').innerHTML=state.equipmentTypes.map(t=>`<option value="${escaped(t.name)}"></option>`).join('');
  document.getElementById('mpDistributionTable').innerHTML=distributionTableHtml('mp',d,'');
  document.getElementById('eqDistributionTable').innerHTML=distributionTableHtml('eq',d,'');
  bindResourceControls(document.getElementById('page-overview'),'');
  renderOverviewCharts();
  renderOverviewPhotoReport();
  fillSelect('mpBuilding',state.buildings);fillSelect('eqBuilding',state.buildings);fillSelect('pgBuilding',state.buildings);updateActivitySelect();renderRecentProgress();
}
function updateAllocation(kind,key,value){const [name,bid]=key.split('|');const d=reportDate();const arr=kind==='mp'?state.mpEntries:state.eqEntries;const field=kind==='mp'?'trade':'type';const n=Math.max(0,Number(value||0));let i=arr.findIndex(e=>e.date===d&&e[field]===name&&e.building===bid);if(i<0){if(n>0)arr.push({date:d,building:bid,[field]:name,count:n})}else if(n===0){arr.splice(i,1)}else{arr[i].count=n}save();renderOverview();renderDashboard()}
function addTrade(){const name=prompt('Trade / Manpower category name');if(!name)return;const clean=name.trim();if(state.trades.some(t=>t.name.toLowerCase()===clean.toLowerCase()))return alert('Trade already exists.');const total=Math.max(0,Number(prompt('Available workers today:','0')||0));state.trades.push({name:clean,total:0});setAvailability('mp',clean,total);renderAll()}
function addEquipment(){const name=prompt('Equipment type name');if(!name)return;const clean=name.trim();if(state.equipmentTypes.some(t=>t.name.toLowerCase()===clean.toLowerCase()))return alert('Equipment type already exists.');const total=Math.max(0,Number(prompt('Available units today:','0')||0));state.equipmentTypes.push({name:clean,total:0});setAvailability('eq',clean,total);renderAll()}

function updateActivitySelect(){const bid=document.getElementById('pgBuilding').value;const b=state.buildings.find(x=>x.id===bid);fillSelect('pgActivity',b?.activities||[])}
function renderRecentProgress(){const tb=document.getElementById('recentProgressTable');const entries=[...state.pgEntries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);tb.innerHTML='<thead><tr><th>Date</th><th>Building</th><th>Activity</th><th>Actual %</th><th>Qty</th><th>Remarks</th><th></th></tr></thead><tbody>'+entries.map((e,i)=>{const b=state.buildings.find(x=>x.id===e.building);return `<tr><td>${e.date}</td><td>${escaped(b?.name||e.building)}</td><td>${escaped(e.activity)}</td><td>${fmt(e.actual)}%</td><td>${e.qty??0}</td><td>${escaped(e.remarks||'')}</td><td><button class="btn light delete-pg" data-index="${state.pgEntries.indexOf(e)}">Delete</button></td></tr>`}).join('')+'</tbody>';document.querySelectorAll('.delete-pg').forEach(btn=>btn.onclick=()=>{state.pgEntries.splice(Number(btn.dataset.index),1);save();renderAll()})}

function reportRange(kind){
  const base=reportDate();
  const dataStart=validDateString(state.project.dataStartDate);
  const clampFrom=(from)=>dataStart&&from<dataStart?dataStart:from;
  if(kind==='custom'){let from=validDateString(customReportFrom)||base,to=validDateString(customReportTo)||base;if(from>to)[from,to]=[to,from];from=clampFrom(from);if(from>to)to=from;return {from,to,label:`${from} → ${to}`}}
  const d=dateObj(base);
  if(kind==='weekly'){const s=new Date(d);s.setDate(s.getDate()-6);const from=clampFrom(isoLocal(s));return {from,to:base,label:`${dateObj(from).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} → ${d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}`}}
  if(kind==='monthly'){const s=new Date(d.getFullYear(),d.getMonth(),1,12),e=new Date(d.getFullYear(),d.getMonth()+1,0,12);const from=clampFrom(isoLocal(s));return {from,to:isoLocal(e),label:`${dateObj(from).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} → ${e.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}`}}
  return {from:base,to:base,label:d.toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'short',year:'numeric'})};
}
function datesBetween(from,to){const out=[];let d=dateObj(from),end=dateObj(to);while(d<=end&&out.length<366){out.push(isoLocal(d));d.setDate(d.getDate()+1)}return out}
function resourceSeries(entries,from,to){const days=datesBetween(from,to);return days.map(day=>entries.filter(e=>e.date===day).reduce((s,e)=>s+Number(e.count||0),0))}
function reportDayLabel(date){
  const d=validDateString(date);if(!d)return String(date||'');
  const obj=dateObj(d);return obj.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
}
function periodLocationAllocation(mpRows,eqRows){
  return state.buildings.map(b=>({
    id:b.id,
    name:b.name,
    manpower:mpRows.filter(e=>e.building===b.id).reduce((sum,e)=>sum+Number(e.count||0),0),
    equipment:eqRows.filter(e=>e.building===b.id).reduce((sum,e)=>sum+Number(e.count||0),0)
  })).filter(r=>r.manpower>0||r.equipment>0);
}


function fmtLongDate(date){const d=new Date((validDateString(date)||reportDate())+'T12:00:00');return d.toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'short',year:'numeric'})}
function fmtShortDate(date){const clean=validDateString(date);if(!clean)return '—';const d=new Date(clean+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}).replace(/ /g,'-')}
function reportBuildingResources(buildingId,date=reportDate()){return {mp:state.mpEntries.filter(e=>e.date===date&&e.building===buildingId).reduce((s,e)=>s+Number(e.count||0),0),eq:state.eqEntries.filter(e=>e.date===date&&e.building===buildingId).reduce((s,e)=>s+Number(e.count||0),0)}}
function topValuesForBuilding(kind,buildingId,date=reportDate(),limit=2){const rows=(kind==='mp'?state.mpEntries:state.eqEntries).filter(e=>e.date===date&&e.building===buildingId&&Number(e.count||0)>0);const field=kind==='mp'?'trade':'type';const sums={};rows.forEach(r=>sums[r[field]]=(sums[r[field]]||0)+Number(r.count||0));return Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([name,val])=>({name,val}))}
function normLabel(s=''){return String(s).toLowerCase().replace(/[^a-z0-9]/g,'')}
function layoutOverviewHtml(date=reportDate()){
  ensureReportCustomizationState();
  const ls=state.reportPrefs.layoutStyle;
  const zoom=Number(ls.zoom||1);
  const html=state.buildings.map((b)=>{
    const pos=currentReportLayoutForBuilding(b);
    pos.w=Math.min(pos.w,13-pos.col);pos.h=Math.min(pos.h,9-pos.row);
    const r=reportBuildingResources(b.id,date);
    const actual=buildingActualAtDate(b,date);
    const scheduleState=buildingScheduleState(b,date);
    const resourceHealth=locationResourceHealth(b.id,date);
    const working=(r.mp+r.eq+actual)>0;
    const isProblem=scheduleState==='Behind'||resourceHealth.mismatch;
    const isGreen=!isProblem&&working;
    const bgMap={soft:'#fafafa',lavender:'#faf7ff',blue:'#f4f9ff',green:'#f4fff9',warm:'#fffaf2'};
    const neutralBg=pos.background!=='default'&&!isGreen&&!isProblem?(bgMap[pos.background]||''):' ';
    const boxStyle=`grid-column:${pos.col}/span ${pos.w};grid-row:${pos.row}/span ${pos.h};border-radius:${pos.radius}px;border-width:${pos.borderWidth}px;--rl-name-font:${pos.nameFont}px;--rl-metrics-font:${pos.metricsFont}px;--rl-pct-font:${pos.pctFont}px;${neutralBg.trim()?`background:${neutralBg.trim()};`:''}`;
    return `<div class="layout-item report-layout-item map-item rl-w-${pos.w} rl-h-${pos.h} ${reportCustomizeMode?pos.color:''} ${isGreen?'active':''} ${isProblem?'overdue':''} ${reportCustomizeMode?'layout-editable':''}" data-building-id="${escaped(b.id)}" data-col="${pos.col}" data-row="${pos.row}" data-w="${pos.w}" data-h="${pos.h}" style="${boxStyle}"><h4>${escaped(b.name)}</h4><div class="mini report-layout-metrics"><span class="rl-metric rl-mp"><b>MP</b><em>${r.mp}</em></span><span class="rl-metric rl-eq"><b>EQ</b><em>${r.eq}</em></span></div>${reportCustomizeMode?'<button class="layout-resize-handle" type="button" aria-label="Resize building"></button>':''}</div>`;
  }).join('');
  const gridWidth=(100/zoom).toFixed(4);
  const gridHeight=Math.round(Number(ls.canvasHeight||360)/zoom);
  return `<div class="report-layout-viewport"><div class="layout-grid report-layout-grid clean-map ${reportCustomizeMode?'layout-edit-mode':''}" style="zoom:${zoom};width:${gridWidth}%;min-height:${gridHeight}px;grid-auto-rows:minmax(${Math.max(54,Math.round((gridHeight-(Number(ls.padding||18)*2)-(Number(ls.gap||10)*7))/8))}px,auto);gap:${Number(ls.gap||10)}px;padding:${Number(ls.padding||18)}px;--rl-radius:${Number(ls.radius||12)}px;--rl-name-font:${Number(ls.nameFont||12)}px;--rl-metrics-font:${Number(ls.metricsFont||9)}px;--rl-pct-font:${Number(ls.pctFont||9)}px">${html}</div></div>`;
}

function reportResourceRows(kind,date=reportDate()){
  const isMp=kind==='mp';
  const defs=isMp?state.trades:state.equipmentTypes;
  const entries=isMp?state.mpEntries:state.eqEntries;
  const field=isMp?'trade':'type';

  return defs.map(def=>{
    const available=isMp?availableTradeTotal(def.name,date):availableEquipmentTotal(def.name,date);
    const related=entries.filter(e=>e.date===date&&e[field]===def.name);
    const allocated=related.reduce((s,e)=>s+Number(e.count||0),0);
    const remaining=available-allocated;

    const locations=state.buildings.map(b=>{
      const count=related
        .filter(e=>e.building===b.id)
        .reduce((s,e)=>s+Number(e.count||0),0);
      return {id:b.id,name:b.name,count};
    }).filter(x=>x.count>0);

    return {
      name:def.name,
      available,
      allocated,
      remaining,
      locations,
      matched:remaining===0
    };
  });
}

function reportResourceDistributionTableHtml(kind,date=reportDate()){
  const isMp=kind==='mp';
  const rows=reportResourceRows(kind,date);
  const totalAvailable=rows.reduce((s,r)=>s+r.available,0);
  const totalAllocated=rows.reduce((s,r)=>s+r.allocated,0);

  const body=rows.map(r=>{
    const locations=r.locations.length
      ? r.locations.map(x=>`<span class="resource-location-chip">${escaped(x.name)} <b>${x.count}</b></span>`).join('')
      : '<span class="resource-no-location">—</span>';

    const rowTone=!r.matched?'resource-row-error':r.allocated>0?'resource-row-ok':'resource-row-neutral';
    return `<tr class="${rowTone}">
      <td class="resource-type-name">${escaped(r.name)}</td>
      <td class="resource-number">${r.available}</td>
      <td class="resource-number">${r.allocated}</td>
      <td class="resource-location-cell">${locations}</td>
    </tr>`;
  }).join('');

  return `<div class="report-resource-table-block ${isMp?'manpower':'equipment'}">
    <div class="report-resource-table-title">
      <div>
        <span>${isMp?'DIRECT MANPOWER':'DIRECT MACHINERY'}</span>
        <h4>${isMp?'Manpower Distribution':'Equipment Distribution'}</h4>
      </div>
      <div class="report-resource-totals">
        <b>${totalAllocated}</b>
        <small>${isMp?'allocated workers':'allocated units'}</small>
      </div>
    </div>
    <div class="report-resource-table-wrap">
      <table class="report-resource-table">
        <thead>
          <tr>
            <th>${isMp?'Trade':'Equipment Type'}</th>
            <th>Available</th>
            <th>Allocated</th>
            <th>Distribution by Location</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
        <tfoot>
          <tr class="${totalAvailable!==totalAllocated?'resource-row-error':totalAllocated>0?'resource-row-ok':'resource-row-neutral'}">
            <td>Total</td>
            <td>${totalAvailable}</td>
            <td>${totalAllocated}</td>
            <td>${totalAvailable===totalAllocated?(totalAllocated>0?'Matched':'No Activity'):'Check Allocation'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>`;
}

function reportDistributionCardsHtml(date=reportDate()){
  const ranked=[...state.buildings].map(b=>{const r=reportBuildingResources(b.id,date); return {b,mp:r.mp,eq:r.eq,total:r.mp+r.eq}}).sort((a,b)=>b.total-a.total||a.b.name.localeCompare(b.b.name));
  const list=ranked.slice(0,7);
  return list.map(x=>{const topTrades=topValuesForBuilding('mp',x.b.id,date,2); const topEq=topValuesForBuilding('eq',x.b.id,date,2); let status='Balanced', statusClass='balanced'; if(x.mp>0&&x.eq===0){status='Manpower Only';statusClass='mp-only'} else if(x.eq>0&&x.mp===0){status='Equipment Only';statusClass='eq-only'} else if(x.mp===0&&x.eq===0){status='No Activity';statusClass='idle'}; const intensity=x.total>=Math.max(6,Math.ceil((availableMP(date)+availableEQ(date))/Math.max(state.buildings.length,1)))?'High Activity':'Low Activity'; return `<div class="dist-card"><div class="dist-card-top"><h4>${escaped(x.b.name)}</h4><span class="dist-badge ${intensity.startsWith('High')?'high':'low'}">${escaped(intensity)}</span></div><div class="dist-pill-row"><span class="pill mp">MP <b>${x.mp}</b></span><span class="pill eq">EQ <b>${x.eq}</b></span></div><ul class="dist-list"><li><span>Top Trades</span><b>${topTrades.length?topTrades.map(t=>escaped(t.name)).join('<br>'):'No manpower details'}</b></li><li><span>Top Equipment</span><b>${topEq.length?topEq.map(t=>escaped(t.name)).join('<br>'):'No equipment details'}</b></li></ul><div class="dist-status ${statusClass}">Status <b>${status}</b></div></div>`}).join('')
}
function reportActivityRows(date=reportDate()){
  const items=[]; state.buildings.forEach(b=>(b.activities||[]).forEach(a=>{const actual=activityActualAtDate(b,a,date); const sched=scheduleFor({...a,actual}); if((actual>0&&actual<100)||sched==='Behind'){items.push({building:b.name,name:a.name,actual:actual,status:sched})}}));
  state.manualActivities.filter(x=>x.date===date).forEach(x=>{const b=state.buildings.find(z=>z.id===x.building); items.push({building:b?.name||'General',name:x.name,actual:0,status:'In Progress'})});
  return items.sort((a,b)=>(a.status==='Behind'? -1:0)-(b.status==='Behind'? -1:0) || b.actual-a.actual).slice(0,5)
}
function dailyResourceSummary(date=reportDate()){
  const rows=state.buildings.map(b=>{
    const r=reportBuildingResources(b.id,date);
    return {name:b.name,mp:Number(r.mp||0),eq:Number(r.eq||0)};
  });
  const byMaxMp=[...rows].sort((a,b)=>b.mp-a.mp||a.name.localeCompare(b.name));
  const byMinMp=[...rows].sort((a,b)=>a.mp-b.mp||a.name.localeCompare(b.name));
  const byMaxEq=[...rows].sort((a,b)=>b.eq-a.eq||a.name.localeCompare(b.name));
  const byMinEq=[...rows].sort((a,b)=>a.eq-b.eq||a.name.localeCompare(b.name));
  return {
    maxMp:byMaxMp[0]||{name:'—',mp:0},
    minMp:byMinMp[0]||{name:'—',mp:0},
    maxEq:byMaxEq[0]||{name:'—',eq:0},
    minEq:byMinEq[0]||{name:'—',eq:0}
  };
}
function reportPhotoItems(date=reportDate(),limit=5){const items=[];const day=photoDay(date,false);state.buildings.forEach(b=>{(day[b.id]||[]).forEach(ph=>items.push({building:b.name,data:ph.data,date}))});return items.slice(0,limit)}
function renderDailyReport(){
  const date=reportDate();
  const totalManpower=availableMP(date), totalEquipment=availableEQ(date), activeLocations=activeLoc(), distPct=distributionMatch(), civilProgress=Math.round(projectActualAt(date));
  const ranked=[...state.buildings].map(b=>{const r=reportBuildingResources(b.id,date); return {name:b.name, mp:r.mp, eq:r.eq, total:r.mp+r.eq}}).sort((a,b)=>b.total-a.total);
  const highest=ranked.find(x=>x.total>0)||{name:'—',mp:0,eq:0};
  const lowest=(ranked.filter(x=>x.total>0).sort((a,b)=>a.total-b.total)[0])||ranked[ranked.length-1]||{name:'—',mp:0,eq:0};
  const activities=reportActivityRows(date);
  const activeCount=activities.filter(x=>x.status!=='Behind').length; const delayedCount=activities.filter(x=>x.status==='Behind').length;
  const photoItems=reportPhotoItems(date,5);
  const resourceSummary=dailyResourceSummary(date);
  ensureReportCustomizationState();
  const labels=state.reportPrefs.labels;
  const reportScale=state.reportPrefs.fontScale||1;
  const reportFontVars=`--report-title-size:${16*reportScale}px;--report-section-size:${14*reportScale}px;--report-card-title-size:${10*reportScale}px;--report-map-size:${7*reportScale}px;--report-body-size:${8*reportScale}px`;
  document.getElementById('reportContent').innerHTML=`
    <div class="daily-report-page ${reportCustomizeMode?'report-customizing':''}" style="${reportFontVars}">
      <div class="daily-print-header">
        <div class="brand-col"><div class="print-brand">${escaped(state.project.client||'Scatec')}</div><div class="print-title-wrap"><h1 class="report-editable-text" data-report-label="reportTitle" contenteditable="${reportCustomizeMode}">${escaped(labels.reportTitle)}</h1><p>${escaped(state.project.name)} - Civil Works</p></div></div>
        <div class="print-meta-grid"><div><span>Date</span><b>${fmtLongDate(date)}</b></div><div><span>Civil Engineer</span><b>${escaped(state.project.engineer||'Civil Engineer')}</b></div><div><span>Substation</span><b>${escaped(state.project.type||'500/33/33 kV')}</b></div><div><span>Civil Progress</span><b>${civilProgress}%</b></div></div>
      </div>
      <div class="daily-kpi-grid">
        <div class="daily-kpi orange"><div class="kpi-icon">👷</div><div><span>Total Manpower</span><strong>${totalManpower}</strong><small>Direct manpower: ${totalManpower}</small></div><div class="sparkline spark-orange"></div></div>
        <div class="daily-kpi blue"><div class="kpi-icon">🚜</div><div><span>Total Equipment</span><strong>${totalEquipment}</strong><small>Allocated units</small></div><div class="sparkline spark-blue"></div></div>
        <div class="daily-kpi green"><div class="kpi-icon">📍</div><div><span>Active Locations</span><strong>${activeLocations}</strong><small>From ${state.buildings.length} locations</small></div><div class="sparkline spark-green"></div></div>
        <div class="daily-kpi purple"><div class="kpi-icon">✔</div><div><span>Distribution Match</span><strong>${distPct}%</strong><small>Fully reconciled</small></div><div class="sparkline spark-purple"></div></div>
        <div class="daily-side-kpis"><div class="mini-status success"><span>Highest Activity</span><strong>${escaped(highest.name)}</strong><small>${highest.mp} manpower / ${highest.eq} equipment</small></div><div class="mini-status warn"><span>Low Resource Location</span><strong>${escaped(lowest.name)}</strong><small>${lowest.mp} manpower / ${lowest.eq} equipment</small></div></div>
      </div>
      <div class="daily-two-col">
        <div class="daily-panel"><div class="panel-head panel-head-split site-head"><div><span>Site Overview</span><h3 class="report-editable-text" data-report-label="siteOverview" contenteditable="${reportCustomizeMode}">${escaped(labels.siteOverview)}</h3></div><div class="site-status-legend"><span><i class="dot early"></i>Early</span><span><i class="dot active"></i>Active</span><span><i class="dot advanced"></i>Advanced</span><span><i class="dot complete"></i>Complete</span></div></div>${layoutOverviewHtml(date)}<div class="layout-legend"><span class="pill mp">MP Manpower</span><span class="pill eq">EQ Equipment</span></div></div>
        <div class="daily-panel resource-distribution-panel">
          <div class="panel-head">
            <span>RESOURCE DISTRIBUTION</span>
            <h3 class="report-editable-text" data-report-label="distribution" contenteditable="${reportCustomizeMode}">${escaped(labels.distribution)}</h3>
          </div>
          <div class="report-resource-tables">
            ${reportResourceDistributionTableHtml('mp',date)}
            ${reportResourceDistributionTableHtml('eq',date)}
          </div>
        </div>
      </div>
      <div class="daily-chart-row">
        <div class="daily-chart-panel"><div class="panel-head panel-head-split"><div><span>Overall Manpower</span><h3 class="report-editable-text" data-report-label="manpowerChart" contenteditable="${reportCustomizeMode}">${escaped(labels.manpowerChart)}</h3></div><div class="chart-toolbar daily-chart-selector"><select class="chart-type-select" data-chart-target="reportMpHistogram"><option value="bar">Bar</option><option value="line">Line</option><option value="area">Area</option><option value="doughnut">Doughnut</option><option value="pie">Pie</option><option value="polarArea">Polar Area</option><option value="radar">Radar</option></select></div></div><div class="chart-kpis"><span class="dot good"></span> MAX ${Math.max(...reportResourceRows('mp',date).map(r=>r.allocated),0)}<span class="dot warn"></span> MIN ${Math.min(...reportResourceRows('mp',date).map(r=>r.allocated),0)}</div><div class="chart-wrap report-print-chart"><canvas id="reportMpHistogram"></canvas></div></div>
        <div class="daily-chart-panel"><div class="panel-head panel-head-split"><div><span>Overall Equipment</span><h3 class="report-editable-text" data-report-label="equipmentChart" contenteditable="${reportCustomizeMode}">${escaped(labels.equipmentChart)}</h3></div><div class="chart-toolbar daily-chart-selector"><select class="chart-type-select" data-chart-target="reportEqHistogram"><option value="bar">Bar</option><option value="line">Line</option><option value="area">Area</option><option value="doughnut">Doughnut</option><option value="pie">Pie</option><option value="polarArea">Polar Area</option><option value="radar">Radar</option></select></div></div><div class="chart-kpis"><span class="dot good"></span> MAX ${Math.max(...reportResourceRows('eq',date).map(r=>r.allocated),0)}<span class="dot warn"></span> MIN ${Math.min(...reportResourceRows('eq',date).map(r=>r.allocated),0)}</div><div class="chart-wrap report-print-chart"><canvas id="reportEqHistogram"></canvas></div></div>
      </div>
      <div class="daily-panel activity-panel"><div class="panel-head panel-head-split"><div><h3 class="report-editable-text" data-report-label="activities" contenteditable="${reportCustomizeMode}">${escaped(labels.activities)}</h3></div><div class="activity-counts">${activeCount} Active • ${delayedCount} Delayed</div></div><div class="activity-stack">${activities.length?activities.map(x=>`<div class="activity-row ${x.status==='Behind'?'delayed':x.status==='Completed'?'completed':'progress'}"><div class="activity-meta"><strong>${escaped(x.building)}</strong><span>${escaped(x.name)}</span></div><div class="activity-status">${escaped(x.status==='Behind'?'Delayed':x.status==='Completed'?'Completed':'In Progress')}</div><div class="activity-bar"><div class="activity-fill" style="width:${Math.max(2,Math.min(100,Number(x.actual||0)))}%"></div></div><div class="activity-pct">${fmt(x.actual)}%</div></div>`).join(''):'<div class="empty-note">No active or delayed activities for this date.</div>'}</div></div>
      <div class="daily-bottom-grid daily-summary-only">
        <div class="daily-panel executive-summary-panel">
          <div class="panel-head"><span>Smart Insights</span><h3 class="report-editable-text" data-report-label="summary" contenteditable="${reportCustomizeMode}">${escaped(labels.summary)}</h3></div>
          <div class="executive-summary-grid">
            <div class="executive-summary-card mp-max"><span>Max Manpower</span><strong>${resourceSummary.maxMp.mp}</strong><small>${escaped(resourceSummary.maxMp.name)}</small></div>
            <div class="executive-summary-card mp-min"><span>Min Manpower</span><strong>${resourceSummary.minMp.mp}</strong><small>${escaped(resourceSummary.minMp.name)}</small></div>
            <div class="executive-summary-card eq-max"><span>Max Equipment</span><strong>${resourceSummary.maxEq.eq}</strong><small>${escaped(resourceSummary.maxEq.name)}</small></div>
            <div class="executive-summary-card eq-min"><span>Min Equipment</span><strong>${resourceSummary.minEq.eq}</strong><small>${escaped(resourceSummary.minEq.name)}</small></div>
          </div>
        </div>
      </div>
      <div class="print-footer"><span>${escaped(state.project.client)} - ${escaped(state.project.name)}</span><span>Daily Activities: ${activeCount} Active • ${delayedCount} Delayed</span><span>Daily Report</span></div>
    </div>
    <div class="daily-report-page photo-report-page ${reportCustomizeMode?'report-customizing':''}" style="${reportFontVars}">
      <div class="daily-print-header photo-header"><div class="brand-col"><div class="print-brand">${escaped(state.project.client||'Scatec')}</div><div class="print-title-wrap"><h1 class="report-editable-text" data-report-label="photoTitle" contenteditable="${reportCustomizeMode}">${escaped(labels.photoTitle)}</h1><p>${escaped(state.project.name)} - Civil Works</p></div></div><div class="photo-meta"><div>Date: <b>${fmtLongDate(date)}</b></div><div>Civil Engineer: <b>${escaped(state.project.engineer||'Civil Engineer')}</b></div><div>Photos: <b>${Math.max(photoItems.length,5)}</b></div></div></div>
      <div class="photo-grid">${[0,1,2,3,4].map(i=>{const ph=photoItems[i]; return `<div class="photo-print-card"><div class="photo-print-top"><span>${i+1}/5</span></div><div class="photo-frame">${ph?.data?`<img src="${ph.data}" alt="">`:'<div class="photo-placeholder">No photo</div>'}</div><div class="photo-caption">${escaped(ph?.building||'Project Site')}</div></div>`}).join('')}</div>
    </div>`;
  renderReportCharts(datesBetween(date,date),[],[],'daily_print');
  syncChartSelectors(document.getElementById('reportContent'));
  setupEditableReportLabels();
  setupReportLayoutEditorInteractions();
  renderReportCustomizerControls();
}
function setupEditableReportLabels(){
  document.querySelectorAll('#reportContent .report-editable-text[data-report-label]').forEach(el=>{
    if(!reportCustomizeMode){el.removeAttribute('contenteditable');return;}
    el.setAttribute('contenteditable','true');
    el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();el.blur()}};
    el.onblur=()=>{ensureReportCustomizationState();const key=el.dataset.reportLabel;const value=el.textContent.trim();if(key&&value){state.reportPrefs.labels[key]=value;save();renderReportCustomizerControls();}};
  });
}
function selectReportLayoutBuilding(id){
  selectedLayoutBuildingId=id||state.buildings[0]?.id||'';
  renderReportCustomizerControls();
  document.querySelectorAll('#reportContent .map-item').forEach(el=>el.classList.toggle('layout-selected',el.dataset.buildingId===selectedLayoutBuildingId));
}
function renderReportCustomizerControls(){
  const panel=document.getElementById('reportCustomizePanel');if(!panel)return;
  ensureReportCustomizationState();
  const select=document.getElementById('layoutBuildingSelect');
  if(select){const keep=selectedLayoutBuildingId||select.value||state.buildings[0]?.id||'';select.innerHTML=state.buildings.map(b=>`<option value="${escaped(b.id)}">${escaped(b.name)}</option>`).join('');selectedLayoutBuildingId=state.buildings.some(b=>b.id===keep)?keep:(state.buildings[0]?.id||'');select.value=selectedLayoutBuildingId;}
  const b=state.buildings.find(x=>x.id===selectedLayoutBuildingId)||state.buildings[0];
  if(b){
    const pos=currentReportLayoutForBuilding(b);
    [['layoutCol',pos.col],['layoutRow',pos.row],['layoutWidth',pos.w],['layoutHeight',pos.h],['layoutBoxRadius',pos.radius],['layoutBorderWidth',pos.borderWidth],['layoutNameFont',pos.nameFont],['layoutMetricsFont',pos.metricsFont]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v});
    const c=document.getElementById('layoutColor');if(c)c.value=pos.color;
    const bg=document.getElementById('layoutBoxBackground');if(bg)bg.value=pos.background||'default';
  }
  const scale=document.getElementById('reportFontScale'),sv=document.getElementById('reportFontScaleValue');if(scale){scale.value=Math.round((state.reportPrefs.fontScale||1)*100);if(sv)sv.textContent=scale.value+'%';}
  const ls=state.reportPrefs.layoutStyle;
  const pairs=[
    ['reportLayoutZoom',Math.round(ls.zoom*100),'reportLayoutZoomValue',Math.round(ls.zoom*100)+'%'],
    ['reportLayoutHeight',ls.canvasHeight,'reportLayoutHeightValue',ls.canvasHeight+'px'],
    ['reportLayoutGap',ls.gap,'reportLayoutGapValue',ls.gap+'px'],
    ['reportLayoutPadding',ls.padding,'reportLayoutPaddingValue',ls.padding+'px'],
    ['reportLayoutRadius',ls.radius,'reportLayoutRadiusValue',ls.radius+'px'],
    ['reportLayoutNameFont',ls.nameFont,'reportLayoutNameFontValue',ls.nameFont+'px'],
    ['reportLayoutMetricsFont',ls.metricsFont,'reportLayoutMetricsFontValue',ls.metricsFont+'px']
  ];
  pairs.forEach(([id,v,outId,label])=>{const el=document.getElementById(id),o=document.getElementById(outId);if(el)el.value=v;if(o)o.textContent=label;});
}
function applySelectedLayoutFromControls(){
  const b=state.buildings.find(x=>x.id===selectedLayoutBuildingId);if(!b)return;
  const col=Math.max(1,Math.min(12,Number(document.getElementById('layoutCol').value||1)));
  const row=Math.max(1,Math.min(8,Number(document.getElementById('layoutRow').value||1)));
  const w=Math.max(1,Math.min(13-col,Number(document.getElementById('layoutWidth').value||1)));
  const h=Math.max(1,Math.min(9-row,Number(document.getElementById('layoutHeight').value||1)));
  const color=document.getElementById('layoutColor').value||'map-slate';
  const radius=Math.max(0,Math.min(30,Number(document.getElementById('layoutBoxRadius').value||12)));
  const borderWidth=Math.max(1,Math.min(4,Number(document.getElementById('layoutBorderWidth').value||1)));
  const nameFont=Math.max(7,Math.min(18,Number(document.getElementById('layoutNameFont').value||12)));
  const metricsFont=Math.max(6,Math.min(14,Number(document.getElementById('layoutMetricsFont').value||9)));
  const background=document.getElementById('layoutBoxBackground').value||'default';
  state.reportLayout[b.id]={col,row,w,h,color,radius,borderWidth,nameFont,metricsFont,background};save();renderDailyReport();
}
function resetSelectedReportLayout(){if(!selectedLayoutBuildingId)return;delete state.reportLayout[selectedLayoutBuildingId];save();renderDailyReport()}
function resetAllReportLayout(){if(!confirm('Reset the full Site Layout positions and box overrides?'))return;state.reportLayout={};save();renderDailyReport()}
function resizeSelectedReportBox(delta){
  const b=state.buildings.find(x=>x.id===selectedLayoutBuildingId);if(!b)return;
  const p=currentReportLayoutForBuilding(b);
  const w=Math.max(1,Math.min(13-p.col,p.w+delta));
  const h=Math.max(1,Math.min(9-p.row,p.h+delta));
  state.reportLayout[b.id]=Object.assign({},state.reportLayout[b.id]||{},p,{w,h});save();renderDailyReport();
}
function updateReportLayoutStyle(patch,render=true){
  ensureReportCustomizationState();Object.assign(state.reportPrefs.layoutStyle,patch||{});save();if(render)renderDailyReport();
}
function resetReportLayoutStyle(){state.reportPrefs.layoutStyle={zoom:1,canvasHeight:360,gap:10,padding:18,radius:12,nameFont:12,metricsFont:9};save();renderDailyReport();}
function changeReportZoom(delta){ensureReportCustomizationState();const z=Math.max(.6,Math.min(1.5,Math.round((state.reportPrefs.layoutStyle.zoom+delta)*20)/20));state.reportPrefs.layoutStyle.zoom=z;save();renderDailyReport();}

function gridMetrics(grid){ensureReportCustomizationState();const zoom=Number(state.reportPrefs.layoutStyle.zoom||1);const cs=getComputedStyle(grid);const rect=grid.getBoundingClientRect();const padL=(parseFloat(cs.paddingLeft)||0)*zoom,padR=(parseFloat(cs.paddingRight)||0)*zoom,padT=(parseFloat(cs.paddingTop)||0)*zoom,padB=(parseFloat(cs.paddingBottom)||0)*zoom,gapX=(parseFloat(cs.columnGap)||0)*zoom,gapY=(parseFloat(cs.rowGap)||0)*zoom;const innerW=rect.width-padL-padR,innerH=rect.height-padT-padB;return {cellW:(innerW-gapX*11)/12,cellH:(innerH-gapY*7)/8,gapX,gapY}}
function setupReportLayoutEditorInteractions(){
  if(!reportCustomizeMode)return;
  const grid=document.querySelector('#reportContent .clean-map');if(!grid)return;
  const metrics=()=>gridMetrics(grid);
  grid.querySelectorAll('.map-item[data-building-id]').forEach(item=>{
    item.addEventListener('click',()=>selectReportLayoutBuilding(item.dataset.buildingId));
    item.addEventListener('pointerdown',e=>{
      if(e.target.closest('.layout-resize-handle'))return;
      if(e.button!==0)return;e.preventDefault();selectReportLayoutBuilding(item.dataset.buildingId);item.setPointerCapture(e.pointerId);
      const startX=e.clientX,startY=e.clientY,startCol=Number(item.dataset.col),startRow=Number(item.dataset.row),w=Number(item.dataset.w),h=Number(item.dataset.h);
      const move=ev=>{const m=metrics(),dc=Math.round((ev.clientX-startX)/(m.cellW+m.gapX)),dr=Math.round((ev.clientY-startY)/(m.cellH+m.gapY));const col=Math.max(1,Math.min(13-w,startCol+dc)),row=Math.max(1,Math.min(9-h,startRow+dr));item.style.gridColumn=`${col}/span ${w}`;item.style.gridRow=`${row}/span ${h}`;item.dataset.col=col;item.dataset.row=row;};
      const up=()=>{item.removeEventListener('pointermove',move);item.removeEventListener('pointerup',up);const id=item.dataset.buildingId,b=state.buildings.find(x=>x.id===id);if(b){const pos=currentReportLayoutForBuilding(b);state.reportLayout[id]=Object.assign({},state.reportLayout[id]||{},pos,{col:Number(item.dataset.col),row:Number(item.dataset.row),w:Number(item.dataset.w),h:Number(item.dataset.h)});save();renderReportCustomizerControls();}};
      item.addEventListener('pointermove',move);item.addEventListener('pointerup',up);
    });
    const handle=item.querySelector('.layout-resize-handle');if(handle)handle.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();selectReportLayoutBuilding(item.dataset.buildingId);handle.setPointerCapture(e.pointerId);const startX=e.clientX,startY=e.clientY,col=Number(item.dataset.col),row=Number(item.dataset.row),startW=Number(item.dataset.w),startH=Number(item.dataset.h);const move=ev=>{const m=metrics(),dw=Math.round((ev.clientX-startX)/(m.cellW+m.gapX)),dh=Math.round((ev.clientY-startY)/(m.cellH+m.gapY));const w=Math.max(1,Math.min(13-col,startW+dw)),h=Math.max(1,Math.min(9-row,startH+dh));item.style.gridColumn=`${col}/span ${w}`;item.style.gridRow=`${row}/span ${h}`;item.dataset.w=w;item.dataset.h=h;};const up=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);const id=item.dataset.buildingId,b=state.buildings.find(x=>x.id===id);if(b){const pos=currentReportLayoutForBuilding(b);state.reportLayout[id]=Object.assign({},state.reportLayout[id]||{},pos,{col,row,w:Number(item.dataset.w),h:Number(item.dataset.h)});save();renderReportCustomizerControls();}};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);});
  });
}
function toggleReportCustomizer(force){
  const panel=document.getElementById('reportCustomizePanel');if(!panel)return;
  reportCustomizeMode=typeof force==='boolean'?force:!reportCustomizeMode;
  panel.classList.toggle('hidden',!reportCustomizeMode);
  if(reportCustomizeMode&&currentReportKind!=='daily'){currentReportKind='daily';renderReports('daily');}
  else if(currentReportKind==='daily')renderDailyReport();
  renderReportCustomizerControls();
}
function renderReports(kind='daily'){
  currentReportKind=kind;
  if(kind==='daily'){
    document.getElementById('reportRangeNote').textContent=`Selected report: ${fmtLongDate(reportDate())}`;
    document.getElementById('reportBaseDate').value=reportDate();document.getElementById('reportFromDate').value=reportDate();document.getElementById('reportToDate').value=reportDate();
    renderDailyReport();
    return;
  }
  const range=reportRange(kind),days=datesBetween(range.from,range.to);
  const pgRows=state.pgEntries.filter(e=>validDateString(e.date)&&e.date>=range.from&&e.date<=range.to);
  const mpRows=state.mpEntries.filter(e=>validDateString(e.date)&&e.date>=range.from&&e.date<=range.to);
  const eqRows=state.eqEntries.filter(e=>validDateString(e.date)&&e.date>=range.from&&e.date<=range.to);
  const latestDate=range.to;
  const latestProg=projectActualAt(latestDate),latestPlan=projectPlannedAt(latestDate),variance=latestProg-latestPlan;
  const mpPeak=Math.max(...days.map(d=>mpRows.filter(e=>e.date===d).reduce((s,e)=>s+Number(e.count||0),0)),0);
  const eqPeak=Math.max(...days.map(d=>eqRows.filter(e=>e.date===d).reduce((s,e)=>s+Number(e.count||0),0)),0);
  document.getElementById('reportRangeNote').textContent=`${kind==='custom'?'Custom range':'Selected report'}: ${range.label}`;
  document.getElementById('reportBaseDate').value=reportDate();document.getElementById('reportFromDate').value=range.from;document.getElementById('reportToDate').value=range.to;

  if(kind==='weekly'||kind==='monthly'){
    const mpDaily=resourceSeries(mpRows,range.from,range.to);
    const eqDaily=resourceSeries(eqRows,range.from,range.to);
    const mpAvg=days.length?mpDaily.reduce((a,b)=>a+b,0)/days.length:0;
    const eqAvg=days.length?eqDaily.reduce((a,b)=>a+b,0)/days.length:0;
    document.getElementById('reportContent').innerHTML=`
      <div class="report-hero management-report-hero"><span class="project-tag">● MANAGEMENT RESOURCE SUMMARY</span><h2>${kind==='weekly'?'Weekly':'Monthly'} — ${escaped(state.project.name)}</h2><p>${escaped(range.label)}</p><div class="hero-tags"><span>CLIENT <b>${escaped(state.project.client)}</b></span><span>ENGINEER <b>${escaped(state.project.engineer||'Civil Engineer')}</b></span></div></div>
      <div class="management-kpis">
        <div class="report-kpi"><span>AVG MANPOWER / DAY</span><strong>${fmt(mpAvg,1)}</strong></div>
        <div class="report-kpi"><span>PEAK MANPOWER</span><strong>${mpPeak}</strong></div>
        <div class="report-kpi"><span>AVG EQUIPMENT / DAY</span><strong>${fmt(eqAvg,1)}</strong></div>
        <div class="report-kpi"><span>PEAK EQUIPMENT</span><strong>${eqPeak}</strong></div>
      </div>
      <div class="management-resource-grid">
        <div class="section-card management-chart-card"><div class="section-head"><div><span class="eyebrow">MANPOWER</span><h2>Daily Manpower</h2><p>Total manpower deployed each day.</p></div></div><div class="chart-wrap management-chart-wrap"><canvas id="mgmtManpowerDaily"></canvas></div></div>
        <div class="section-card management-chart-card"><div class="section-head"><div><span class="eyebrow">MANPOWER</span><h2>Manpower by Building</h2><p>Total manpower-days allocated to each active building.</p></div></div><div class="chart-wrap management-chart-wrap"><canvas id="mgmtManpowerBuilding"></canvas></div></div>
        <div class="section-card management-chart-card"><div class="section-head"><div><span class="eyebrow">EQUIPMENT</span><h2>Daily Equipment</h2><p>Total equipment deployed each day.</p></div></div><div class="chart-wrap management-chart-wrap"><canvas id="mgmtEquipmentDaily"></canvas></div></div>
        <div class="section-card management-chart-card"><div class="section-head"><div><span class="eyebrow">EQUIPMENT</span><h2>Equipment by Building</h2><p>Total equipment-days allocated to each active building.</p></div></div><div class="chart-wrap management-chart-wrap"><canvas id="mgmtEquipmentBuilding"></canvas></div></div>
      </div>`;
    renderManagementResourceCharts(days,mpRows,eqRows);
    return;
  }

  document.getElementById('reportContent').innerHTML=`
    <div class="report-hero"><span class="project-tag">● DAILY / WEEKLY / MONTHLY PROGRESS REPORT</span><h2>${kind==='daily'?'Daily':kind==='weekly'?'Weekly':kind==='monthly'?'Monthly':'Custom Range'} — ${escaped(state.project.name)}</h2><p>${escaped(range.label)}</p><div class="hero-tags"><span>CLIENT <b>${escaped(state.project.client)}</b></span><span>ENGINEER <b>${escaped(state.project.engineer||'Civil Engineer')}</b></span><span>OWNER <b>${escaped(session?.user?.email||'')}</b></span></div></div>
    <div class="report-kpis"><div class="report-kpi"><span>ACTUAL</span><strong>${fmt(latestProg)}%</strong></div><div class="report-kpi"><span>PLANNED</span><strong>${fmt(latestPlan)}%</strong></div><div class="report-kpi"><span>VARIANCE</span><strong>${fmt(variance)}%</strong></div><div class="report-kpi"><span>MANPOWER PEAK</span><strong>${mpPeak}</strong></div><div class="report-kpi"><span>EQUIPMENT PEAK</span><strong>${eqPeak}</strong></div></div>
    <div class="report-charts-grid"><div class="section-card"><div class="section-head"><div><span class="eyebrow">RESOURCES</span><h2>Manpower by Trade</h2><p>${kind==='daily'?'Selected day':'Peak daily headcount'} by trade.</p></div></div><div class="chart-toolbar"><select class="chart-type-select" data-chart-target="reportMpHistogram"><option value="bar">Bar</option><option value="line">Line</option><option value="area">Area</option><option value="doughnut">Doughnut</option><option value="pie">Pie</option><option value="polarArea">Polar Area</option><option value="radar">Radar</option></select></div><div class="chart-wrap"><canvas id="reportMpHistogram"></canvas></div></div><div class="section-card"><div class="section-head"><div><span class="eyebrow">RESOURCES</span><h2>Equipment by Type</h2><p>${kind==='daily'?'Selected day':'Peak daily units'} by equipment type.</p></div></div><div class="chart-toolbar"><select class="chart-type-select" data-chart-target="reportEqHistogram"><option value="bar">Bar</option><option value="line">Line</option><option value="area">Area</option><option value="doughnut">Doughnut</option><option value="pie">Pie</option><option value="polarArea">Polar Area</option><option value="radar">Radar</option></select></div><div class="chart-wrap"><canvas id="reportEqHistogram"></canvas></div></div><div class="section-card"><div class="section-head"><div><span class="eyebrow">PROJECT CONTROL</span><h2>Progress by Building</h2><p>Latest actual vs planned.</p></div></div><div class="chart-toolbar"><select class="chart-type-select" data-chart-target="reportProgressHistogram"><option value="bar">Bar</option><option value="line">Line</option><option value="radar">Radar</option></select></div><div class="chart-wrap"><canvas id="reportProgressHistogram"></canvas></div></div><div class="section-card"><div class="section-head"><div><span class="eyebrow">TREND</span><h2>Progress Trend / S-Curve</h2><p>Actual vs planned project progress across the selected period.</p></div></div><div class="chart-toolbar"><select class="chart-type-select" data-chart-target="reportTrendChart"><option value="line">Line</option><option value="bar">Bar</option></select></div><div class="chart-wrap"><canvas id="reportTrendChart"></canvas></div></div><div class="section-card"><div class="section-head"><div><span class="eyebrow">DAILY RESOURCE TREND</span><h2>Manpower Daily Trend</h2><p>Total allocated manpower for every day in the selected reporting window.</p></div></div><div class="chart-toolbar"><select class="chart-type-select" data-chart-target="reportManpowerDailyTrend"><option value="line">Line</option><option value="bar">Bar</option><option value="area">Area</option></select></div><div class="chart-wrap period-daily-chart"><canvas id="reportManpowerDailyTrend"></canvas></div></div><div class="section-card"><div class="section-head"><div><span class="eyebrow">DAILY RESOURCE TREND</span><h2>Equipment Daily Trend</h2><p>Total allocated equipment for every day in the selected reporting window.</p></div></div><div class="chart-toolbar"><select class="chart-type-select" data-chart-target="reportEquipmentDailyTrend"><option value="line">Line</option><option value="bar">Bar</option><option value="area">Area</option></select></div><div class="chart-wrap period-daily-chart"><canvas id="reportEquipmentDailyTrend"></canvas></div></div><div class="section-card report-wide-chart"><div class="section-head"><div><span class="eyebrow">LOCATION ALLOCATION</span><h2>Resource Allocation by Location</h2><p>Total manpower-days and equipment-days allocated to each active location during the selected period.</p></div></div><div class="chart-toolbar"><select class="chart-type-select" data-chart-target="reportLocationAllocation"><option value="bar">Bar</option><option value="line">Line</option></select></div><div class="chart-wrap period-location-chart"><canvas id="reportLocationAllocation"></canvas></div></div></div>
    <div class="section-card"><div class="section-head"><div><span class="eyebrow">BUILDING SUMMARY</span><h2>Weighted Progress by Building</h2></div></div><div class="table-scroll"><table class="activity-table"><thead><tr><th>Building</th><th>Weight</th><th>Planned</th><th>Actual</th><th>Variance</th><th>Schedule</th><th>Performance</th></tr></thead><tbody>${state.buildings.map(b=>{const ba=buildingActualAtDate(b,latestDate),bp=buildingPlannedAtDate(b,latestDate),v=ba-bp,hasActs=(b.activities||[]).length,late=hasActs&&(b.activities||[]).some(a=>validDateString(a.finish)&&latestDate>a.finish&&activityActualAtDate(b,a,latestDate)<99.9),done=hasActs&&(b.activities||[]).every(a=>activityActualAtDate(b,a,latestDate)>=99.9),sched=done?'Completed':late?'Behind':'On Schedule';return `<tr><td>${escaped(b.name)}</td><td>${fmt(b.weight,1)}%</td><td>${fmt(bp)}%</td><td>${fmt(ba)}%</td><td class="${v< -Number(state.project.warn||5)?'attention':''}">${fmt(v)}%</td><td><span class="schedule ${sched==='Behind'?'behind':sched==='Completed'?'completed':'on-schedule'}">${sched}</span></td><td>${v>Number(state.project.warn||5)?'Ahead':v< -Number(state.project.warn||5)?'Behind':'On Target'}</td></tr>`}).join('')}</tbody></table></div></div>
    <div class="section-card"><div class="section-head"><div><span class="eyebrow">ACTIVITY LOG</span><h2>${kind==='daily'?'Daily':'Period'} Progress Entries</h2></div></div><div class="table-scroll"><table class="activity-table"><thead><tr><th>Date</th><th>Building</th><th>Activity</th><th>Actual %</th><th>Executed Qty</th><th>Remarks</th></tr></thead><tbody>${pgRows.length?pgRows.map(e=>{const b=state.buildings.find(x=>x.id===e.building);return `<tr><td>${escaped(e.date)}</td><td>${escaped(b?.name||e.building)}</td><td>${escaped(e.activity)}</td><td>${fmt(e.actual)}%</td><td>${Number(e.qty||0)}</td><td>${escaped(e.remarks||'')}</td></tr>`}).join(''):'<tr><td colspan="6">No saved progress records for this period.</td></tr>'}</tbody></table></div></div>
    <div class="report-footer-grid"><div><b>Manpower records:</b> ${mpRows.length}</div><div><b>Equipment records:</b> ${eqRows.length}</div><div><b>Progress records:</b> ${pgRows.length}</div><div><b>Reporting window:</b> ${range.from} → ${range.to}</div></div>`;
  renderReportCharts(days,mpRows,eqRows,'generic');
}
function renderManagementResourceCharts(days,mpRows,eqRows){
  ['mgmtManpowerDaily','mgmtManpowerBuilding','mgmtEquipmentDaily','mgmtEquipmentBuilding'].forEach(destroyChart);
  const labels=days.map(reportDayLabel);
  const mpDaily=resourceSeries(mpRows,days[0]||reportDate(),days[days.length-1]||reportDate());
  const eqDaily=resourceSeries(eqRows,days[0]||reportDate(),days[days.length-1]||reportDate());
  const dailyMode=days.length<=10?'bar':'line';
  const dailyOptions={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},pointLabelPlugin:{enabled:days.length<=10}},scales:{x:{ticks:{autoSkip:days.length>14,maxTicksLimit:days.length>14?16:days.length,maxRotation:days.length>14?45:0,minRotation:0}},y:{beginAtZero:true,ticks:{precision:0}}}};

  chartRefs.mgmtManpowerDaily=buildChart('mgmtManpowerDaily',dailyMode,{labels,datasets:[{label:'Total Manpower',data:mpDaily,borderWidth:2}]},dailyOptions,dailyMode);
  chartRefs.mgmtEquipmentDaily=buildChart('mgmtEquipmentDaily',dailyMode,{labels,datasets:[{label:'Total Equipment',data:eqDaily,borderWidth:2}]},dailyOptions,dailyMode);

  const mpByBuilding=state.buildings.map(b=>({name:b.name,value:mpRows.filter(e=>e.building===b.id).reduce((sum,e)=>sum+Number(e.count||0),0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
  const eqByBuilding=state.buildings.map(b=>({name:b.name,value:eqRows.filter(e=>e.building===b.id).reduce((sum,e)=>sum+Number(e.count||0),0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);

  const mpB=mpByBuilding.length?mpByBuilding:[{name:'No allocation',value:0}];
  const eqB=eqByBuilding.length?eqByBuilding:[{name:'No allocation',value:0}];
  const buildingOptions={responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0}},y:{ticks:{autoSkip:false}}}};
  chartRefs.mgmtManpowerBuilding=buildChart('mgmtManpowerBuilding','bar',{labels:mpB.map(x=>x.name),datasets:[{label:'Manpower-days',data:mpB.map(x=>x.value),borderWidth:2}]},buildingOptions,'bar');
  chartRefs.mgmtEquipmentBuilding=buildChart('mgmtEquipmentBuilding','bar',{labels:eqB.map(x=>x.name),datasets:[{label:'Equipment-days',data:eqB.map(x=>x.value),borderWidth:2}]},buildingOptions,'bar');
}

function peakByName(rows,field,days){const names=[...new Set(rows.map(e=>e[field]).filter(Boolean))];return names.map(name=>{const values=days.map(d=>rows.filter(e=>e.date===d&&e[field]===name).reduce((s,e)=>s+Number(e.count||0),0));return {name,value:Math.max(...values,0)}})}
function renderReportCharts(days,mpRows,eqRows,mode='generic'){
  ['reportMpHistogram','reportEqHistogram','reportProgressHistogram','reportTrendChart','reportResourceTrend','reportManpowerDailyTrend','reportEquipmentDailyTrend','reportLocationAllocation','reportReconcileChart'].forEach(destroyChart);
  if(mode==='daily_print'){
    const date=reportDate();
    const mpRows=reportResourceRows('mp',date), mpLabels=mpRows.map(r=>r.name), mpValues=mpRows.map(r=>r.allocated);
    const mpChartMode=getChartMode('reportMpHistogram','bar');
    chartRefs.reportMpHistogram=buildChart('reportMpHistogram','bar',{labels:mpLabels,datasets:[{label:'Workers',data:mpValues,backgroundColor:mpChartMode==='bar'?'#f5a623':'rgba(245,166,35,.16)',borderColor:'#f39c12',borderWidth:2,barThickness:16,borderRadius:2}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:9,weight:'800'},color:'#5f5574',maxRotation:0,minRotation:0},grid:{display:false}},y:{beginAtZero:true,ticks:{stepSize:1,font:{size:9},color:'#8b83a2'},grid:{color:'rgba(111,53,230,.08)',drawBorder:false}}}},'bar');
    const eqRows=reportResourceRows('eq',date), eqLabels=eqRows.map(r=>r.name), eqValues=eqRows.map(r=>r.allocated);
    const eqChartMode=getChartMode('reportEqHistogram','bar');
    chartRefs.reportEqHistogram=buildChart('reportEqHistogram','bar',{labels:eqLabels,datasets:[{label:'Units',data:eqValues,backgroundColor:eqChartMode==='bar'?'#2f8ee5':'rgba(47,142,229,.16)',borderColor:'#1f7df1',borderWidth:2,barThickness:16,borderRadius:2}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:9,weight:'800'},color:'#5f5574',maxRotation:0,minRotation:0},grid:{display:false}},y:{beginAtZero:true,ticks:{stepSize:1,font:{size:9},color:'#8b83a2'},grid:{color:'rgba(111,53,230,.08)',drawBorder:false}}}},'bar');
    return;
  }
  ['reportMpHistogram','reportEqHistogram','reportProgressHistogram','reportTrendChart','reportResourceTrend','reportManpowerDailyTrend','reportEquipmentDailyTrend','reportLocationAllocation'].forEach(destroyChart);
  const rangeEnd=days[days.length-1]||reportDate();
  const mpData=peakByName(mpRows,'trade',days);
  chartRefs.reportMpHistogram=buildChart('reportMpHistogram','bar',{labels:mpData.map(x=>x.name),datasets:[{label:days.length===1?'Workers':'Peak daily workers',data:mpData.map(x=>x.value),borderWidth:2,fill:false}]},{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}},plugins:{legend:{position:'bottom'}}},'bar');
  const eqData=peakByName(eqRows,'type',days);
  chartRefs.reportEqHistogram=buildChart('reportEqHistogram','bar',{labels:eqData.map(x=>x.name),datasets:[{label:days.length===1?'Units':'Peak daily units',data:eqData.map(x=>x.value),borderWidth:2,fill:false}]},{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}},plugins:{legend:{position:'bottom'}}},'bar');
  chartRefs.reportProgressHistogram=buildChart('reportProgressHistogram','bar',{labels:state.buildings.map(b=>b.name),datasets:[{label:'Actual %',data:state.buildings.map(b=>buildingActualAtDate(b,rangeEnd)),borderWidth:2,fill:false},{label:'Planned %',data:state.buildings.map(b=>buildingPlannedAtDate(b,rangeEnd)),borderWidth:2,fill:false}]},chartOptionsPercent(),'bar');
  chartRefs.reportTrendChart=buildChart('reportTrendChart','line',{labels:days.map(d=>d.slice(5)),datasets:[{label:'Actual %',data:days.map(projectActualAt),tension:.2,fill:false,borderWidth:2},{label:'Planned %',data:days.map(projectPlannedAt),tension:.2,fill:false,borderWidth:2}]},chartOptionsPercent(),'line');
  const dayLabels=days.map(reportDayLabel);
  const mpDaily=resourceSeries(mpRows,days[0]||rangeEnd,rangeEnd);
  const eqDaily=resourceSeries(eqRows,days[0]||rangeEnd,rangeEnd);
  chartRefs.reportManpowerDailyTrend=buildChart('reportManpowerDailyTrend','line',{labels:dayLabels,datasets:[{label:'Allocated Manpower',data:mpDaily,tension:.22,fill:false,borderWidth:2}]},{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{maxRotation:45,minRotation:0,autoSkip:days.length>14,maxTicksLimit:days.length>14?16:days.length}},y:{beginAtZero:true,ticks:{precision:0}}},plugins:{legend:{position:'bottom'}}},'line');
  chartRefs.reportEquipmentDailyTrend=buildChart('reportEquipmentDailyTrend','line',{labels:dayLabels,datasets:[{label:'Allocated Equipment',data:eqDaily,tension:.22,fill:false,borderWidth:2}]},{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{maxRotation:45,minRotation:0,autoSkip:days.length>14,maxTicksLimit:days.length>14?16:days.length}},y:{beginAtZero:true,ticks:{precision:0}}},plugins:{legend:{position:'bottom'}}},'line');
  const locRows=periodLocationAllocation(mpRows,eqRows);
  const locLabels=locRows.length?locRows.map(r=>r.name):['No allocations'];
  const locMp=locRows.length?locRows.map(r=>r.manpower):[0];
  const locEq=locRows.length?locRows.map(r=>r.equipment):[0];
  chartRefs.reportLocationAllocation=buildChart('reportLocationAllocation','bar',{labels:locLabels,datasets:[{label:'Manpower-days',data:locMp,borderWidth:2},{label:'Equipment-days',data:locEq,borderWidth:2}]},{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{maxRotation:35,minRotation:0,autoSkip:locRows.length>10,maxTicksLimit:12}},y:{beginAtZero:true,ticks:{precision:0}}},plugins:{legend:{position:'bottom'}}},'bar');
  syncChartSelectors(document.getElementById('page-reports'));
}


function downloadTemplate(){const csv=`type,date,building,trade_or_equipment,count,activity,actual_percent,quantity,remarks
manpower_available,2026-09-25,,Labour,20,,,,
equipment_available,2026-09-25,,Excavator,2,,,,
manpower,2026-09-25,Control Building,Labour,10,,,,
equipment,2026-09-25,Control Building,Excavator,1,,,,
progress,2026-09-25,Control Building,,,Excavation,25,300,Started excavation works
`;const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='substation_progress_template.csv';a.click();URL.revokeObjectURL(a.href)}
function importCsv(file){const reader=new FileReader();reader.onload=()=>{const lines=String(reader.result).split(/\r?\n/).filter(Boolean);if(lines.length<2)return alert('CSV is empty.');const h=lines.shift().split(',').map(x=>x.trim());const idx=k=>h.indexOf(k);lines.forEach(line=>{const parts=line.split(',').map(x=>x.trim());const type=parts[idx('type')],date=validDateString(parts[idx('date')])||reportDate(),category=parts[idx('trade_or_equipment')]||'',count=Math.max(0,Number(parts[idx('count')]||0));if(type==='manpower_available'){if(category&&!state.trades.some(t=>t.name.toLowerCase()===category.toLowerCase()))state.trades.push({name:category,total:0});const t=state.trades.find(t=>t.name.toLowerCase()===category.toLowerCase());if(t)setAvailability('mp',t.name,count,date);return}if(type==='equipment_available'){if(category&&!state.equipmentTypes.some(t=>t.name.toLowerCase()===category.toLowerCase()))state.equipmentTypes.push({name:category,total:0});const t=state.equipmentTypes.find(t=>t.name.toLowerCase()===category.toLowerCase());if(t)setAvailability('eq',t.name,count,date);return}const buildingName=parts[idx('building')];const b=state.buildings.find(x=>x.name.toLowerCase()===String(buildingName).toLowerCase());if(!b)return;if(type==='manpower')state.mpEntries.push({date,building:b.id,trade:category||'Labour',count});if(type==='equipment')state.eqEntries.push({date,building:b.id,type:category||'Excavator',count});if(type==='progress'){const actName=parts[idx('activity')];const a=(b.activities||[]).find(x=>x.name.toLowerCase()===String(actName).toLowerCase());if(a){a.actual=Number(parts[idx('actual_percent')]||0);state.pgEntries.push({date,building:b.id,activity:a.name,actual:a.actual,qty:Number(parts[idx('quantity')]||0),remarks:parts[idx('remarks')]||''})}}});save();renderAll();alert('CSV imported and linked to the selected daily records.');};reader.readAsText(file)}

function renderSettings(){
  const p=state.project;document.getElementById('sProjectName').value=p.name;document.getElementById('sClient').value=p.client;document.getElementById('sEngineer').value=p.engineer||'Civil Engineer';document.getElementById('sStart').value=p.start;document.getElementById('sFinish').value=p.finish;document.getElementById('sWarn').value=p.warn;document.getElementById('sCrit').value=p.crit;document.getElementById('ownerEmail').textContent=session?.user?.email||'';
  document.getElementById('settingsBuildings').innerHTML='<thead><tr><th>Building / Location</th><th>Project Weight %</th><th>Activities</th><th>Actual %</th><th>Actions</th></tr></thead><tbody>'+state.buildings.map((b,i)=>`<tr><td><input data-sb="name" data-i="${i}" value="${escaped(b.name)}"></td><td><input data-sb="weight" data-i="${i}" type="number" min="0" max="100" step="0.01" value="${Number(b.weight||0)}"></td><td>${(b.activities||[]).length}</td><td>${fmt(buildingActual(b))}%</td><td><div class="settings-building-actions"><button class="btn light manage-activities" data-i="${i}" type="button">Activities</button><button class="btn light edit-building-layout" data-i="${i}" type="button">Layout</button><button class="btn light danger remove-building" data-i="${i}" type="button">Remove</button></div></td></tr>`).join('')+'</tbody>';
  document.querySelectorAll('[data-sb]').forEach(inp=>inp.onchange=()=>{const b=state.buildings[Number(inp.dataset.i)];b[inp.dataset.sb]=inp.dataset.sb==='weight'?Math.max(0,Number(inp.value||0)):inp.value;save();renderAll();renderSettings()});
  document.querySelectorAll('.manage-activities').forEach(btn=>btn.onclick=()=>{const b=state.buildings[Number(btn.dataset.i)];if(!b)return;openPage('progress');document.getElementById('progressSearch').value=b.name;setProgressManualEditMode(true);renderProgress()});
  document.querySelectorAll('.edit-building-layout').forEach(btn=>btn.onclick=()=>{const b=state.buildings[Number(btn.dataset.i)];if(!b)return;openPage('dashboard');toggleGlobalCustomizer(true);setTimeout(()=>{const sel=document.getElementById('siteLayoutBuildingSelect');if(sel){sel.value=b.id;renderSiteLayoutCustomizer('dashboard')}},0)});
  document.querySelectorAll('.remove-building').forEach(btn=>btn.onclick=()=>{if(state.buildings.length<=1)return;const i=Number(btn.dataset.i),b=state.buildings[i];if(!b)return;if(!confirm(`Remove "${b.name}" and its linked records?`))return;state.buildings.splice(i,1);state.mpEntries=state.mpEntries.filter(e=>e.building!==b.id);state.eqEntries=state.eqEntries.filter(e=>e.building!==b.id);state.pgEntries=state.pgEntries.filter(e=>e.building!==b.id);state.manualActivities=state.manualActivities.filter(e=>e.building!==b.id);if(state.uiPrefs?.siteLayout)delete state.uiPrefs.siteLayout[b.id];if(state.reportLayout)delete state.reportLayout[b.id];Object.values(photoStore.dates||{}).forEach(day=>{if(day&&day[b.id])delete day[b.id]});savePhotos();removeCloudPhotosForBuilding(b.id);save();renderAll();renderSettings()});
}

function addBuilding(){
  document.getElementById('buildingModal')?.remove();const wrap=document.createElement('div');wrap.id='buildingModal';wrap.className='modal-backdrop';wrap.innerHTML=`<div class="activity-modal building-modal"><div class="modal-head"><div><span class="eyebrow">NEW LOCATION</span><h2>Add Building / Location</h2></div><button type="button" class="btn light modal-close">✕</button></div><form id="buildingAddForm" class="activity-form-grid"><label>Building / Location Name<input name="name" required></label><label>Project Weight %<input name="weight" type="number" min="0" max="100" step="0.01" value="0"></label><label>Layout Column<input name="col" type="number" min="1" max="12" value="1"></label><label>Layout Row<input name="row" type="number" min="1" max="30" value="1"></label><label>Box Width<input name="w" type="number" min="1" max="12" value="3"></label><label>Box Height<input name="h" type="number" min="1" max="8" value="1"></label><label>Background<select name="background"><option value="default">Default</option><option value="white">White</option><option value="lavender">Light Lavender</option><option value="blue">Light Blue</option><option value="green">Light Green</option><option value="warm">Warm Cream</option></select></label><div class="modal-actions wide"><button type="button" class="btn light modal-cancel">Cancel</button><button type="submit" class="btn primary">Add Location</button></div></form></div>`;document.body.appendChild(wrap);const close=()=>wrap.remove();wrap.querySelector('.modal-close').onclick=close;wrap.querySelector('.modal-cancel').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};wrap.querySelector('#buildingAddForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')||'').trim();if(!name)return;const id='B'+Date.now();state.buildings.push({id,name,weight:Math.max(0,Number(f.get('weight')||0)),mp:0,eq:0,activities:[]});ensureGlobalCustomizationState();state.uiPrefs.siteLayout[id]={col:Number(f.get('col')||1),row:Number(f.get('row')||1),w:Number(f.get('w')||3),h:Number(f.get('h')||1),background:String(f.get('background')||'default')};save();close();renderAll();renderSettings()};}
function openPage(page){document.querySelectorAll('.nav-btn[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page));document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));const target=document.getElementById('page-'+page);if(target)target.classList.remove('hidden');if(page==='dashboard')renderDashboard();if(page==='progress')renderProgress();if(page==='overview')renderOverview();if(page==='insert'){}if(page==='reports')renderReports(currentReportKind);if(page==='settings')renderSettings();globalCustomizePage=page;setTimeout(()=>{applyGlobalCustomizationToAllPages();if(globalCustomizeMode){selectedGlobalBlockKey='';renderGlobalCustomizerControls();}},0)}
function renderAll(){setDefaults();renderDashboard();renderProgress();renderOverview();renderSettings();renderReports(currentReportKind);if(state.dark)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');setTimeout(()=>{applyGlobalCustomizationToAllPages();if(globalCustomizeMode)renderGlobalCustomizerControls()},0)}
function setup(){
  document.getElementById('reportDate').value=new Date().toISOString().slice(0,10);

  document.querySelectorAll('.nav-btn[data-page]').forEach(btn=>btn.onclick=()=>openPage(btn.dataset.page));

  document.getElementById('loginForm').onsubmit=async e=>{
    e.preventDefault();
    if(!supabaseClient){
      alert('Supabase is not connected yet. Complete supabase-config.js first.');
      return;
    }
    const email=document.getElementById('loginEmail').value.trim();
    const password=document.getElementById('loginPassword').value;
    const btn=e.target.querySelector('button[type="submit"]');
    btn.disabled=true;btn.textContent='Signing In...';
    const {error}=await supabaseClient.auth.signInWithPassword({email,password});
    btn.disabled=false;btn.textContent='Sign In';
    if(error) alert('Sign in failed: '+error.message);
  };

  document.getElementById('signOutBtn').onclick=async()=>{if(supabaseClient) await supabaseClient.auth.signOut()};
  document.getElementById('reportDate').onchange=async()=>{if(session)await loadCloudPhotosForDate(reportDate(),true);renderAll()};const editHeroBtn=document.getElementById('editHeroBtn');if(editHeroBtn)editHeroBtn.onclick=()=>{if(heroEditMode)saveHeroEdits();else setHeroEditMode(true)};const freshTodayBtn=document.getElementById('freshTodayBtn');if(freshTodayBtn)freshTodayBtn.onclick=startFreshToday;const smr=document.getElementById('showMonthlyRecords');if(smr)smr.onclick=()=>{currentReportKind='monthly';openPage('reports');renderReports('monthly')};
  document.getElementById('refreshBtn').onclick=async()=>{if(session){await loadFromCloud();photoCloudLoadedDates.delete(reportDate());await loadCloudPhotosForDate(reportDate(),true);renderAll();}else{state=loadLocal();renderAll()}};
  document.getElementById('saveBtn').onclick=async()=>{const r=await saveToCloud(true);if(r.ok)alert('Saved to the shared project dashboard.');else if(r.offline)alert('No cloud session. Connect Supabase and sign in first.');};
  document.getElementById('resetBtn').onclick=async()=>{if(confirm('Reset all project data to the default V4 template?')){state=clone(DEFAULT);await saveToCloud(true);renderAll()}};
  document.getElementById('themeBtn').onclick=async()=>{state.dark=!state.dark;await saveToCloud(false);renderAll()};
  const engineerChip=document.getElementById('engineerChip'); if(engineerChip) engineerChip.onclick=()=>openPage('settings');
  const topbarCollapseBtn=document.getElementById('topbarCollapseBtn'); if(topbarCollapseBtn) topbarCollapseBtn.onclick=()=>openPage('settings');

  const pme=document.getElementById('progressManualEditBtn');if(pme)pme.onclick=()=>setProgressManualEditMode(!progressManualEditMode);document.getElementById('progressSearch').oninput=renderProgress;document.getElementById('progressFilter').onchange=renderProgress;document.getElementById('expandAll').onclick=()=>{document.querySelectorAll('.modern-progress-table').forEach(t=>t.classList.remove('hidden'));document.querySelectorAll('.toggle-building').forEach(b=>b.textContent='⌃')};document.getElementById('collapseAll').onclick=()=>{document.querySelectorAll('.modern-progress-table').forEach(t=>t.classList.add('hidden'));document.querySelectorAll('.toggle-building').forEach(b=>b.textContent='⌄')};const resetBtn=document.getElementById('resetProgressBtn');if(resetBtn)resetBtn.onclick=()=>{if(!confirm('Reset all activity actual progress values to 0%?'))return;state.buildings.forEach(b=>(b.activities||[]).forEach(a=>a.actual=0));state.pgEntries=[];save();renderAll();};
  document.getElementById('mpForm').onsubmit=e=>{e.preventDefault();state.mpEntries.push({date:mpDate.value,building:mpBuilding.value,trade:mpTrade.value,count:Number(mpCount.value)});save();e.target.reset();setDefaults();renderAll();alert('Manpower saved.')};
  document.getElementById('eqForm').onsubmit=e=>{e.preventDefault();state.eqEntries.push({date:eqDate.value,building:eqBuilding.value,type:eqType.value,count:Number(eqCount.value)});save();e.target.reset();setDefaults();renderAll();alert('Equipment saved.')};
  document.getElementById('pgForm')?.remove();
  document.getElementById('progressForm').onsubmit=e=>{e.preventDefault();const b=state.buildings.find(x=>x.id===pgBuilding.value);const a=b?.activities.find(x=>x.id===pgActivity.value);if(a){a.actual=Number(pgActual.value);state.pgEntries.push({date:pgDate.value,building:b.id,activity:a.name,actual:a.actual,qty:Number(pgQty.value||0),remarks:pgRemarks.value});save();e.target.reset();setDefaults();renderAll();alert('Progress saved.')}};
  document.getElementById('pgBuilding').onchange=updateActivitySelect;
  document.getElementById('reportDailyBtn').onclick=()=>{currentReportKind='daily';renderReports('daily')};document.getElementById('reportWeeklyBtn').onclick=()=>{currentReportKind='weekly';renderReports('weekly')};document.getElementById('reportMonthlyBtn').onclick=()=>{currentReportKind='monthly';renderReports('monthly')};
  document.getElementById('reportCustomizeBtn').onclick=()=>toggleReportCustomizer();
  document.getElementById('closeReportCustomizeBtn').onclick=()=>toggleReportCustomizer(false);
  document.getElementById('layoutBuildingSelect').onchange=e=>selectReportLayoutBuilding(e.target.value);
  document.getElementById('applyLayoutBtn').onclick=applySelectedLayoutFromControls;
  document.getElementById('smallerLayoutBoxBtn').onclick=()=>resizeSelectedReportBox(-1);
  document.getElementById('largerLayoutBoxBtn').onclick=()=>resizeSelectedReportBox(1);
  document.getElementById('resetSelectedLayoutBtn').onclick=resetSelectedReportLayout;
  document.getElementById('resetAllLayoutBtn').onclick=resetAllReportLayout;
  document.getElementById('resetReportLayoutStyleBtn').onclick=resetReportLayoutStyle;
  document.getElementById('reportZoomOutBtn').onclick=()=>changeReportZoom(-.05);
  document.getElementById('reportZoomInBtn').onclick=()=>changeReportZoom(.05);
  document.getElementById('reportZoom100Btn').onclick=()=>updateReportLayoutStyle({zoom:1});
  [['reportLayoutZoom','zoom',v=>Number(v)/100],['reportLayoutHeight','canvasHeight',Number],['reportLayoutGap','gap',Number],['reportLayoutPadding','padding',Number],['reportLayoutRadius','radius',Number],['reportLayoutNameFont','nameFont',Number],['reportLayoutMetricsFont','metricsFont',Number]].forEach(([id,key,cast])=>{const el=document.getElementById(id);if(el)el.oninput=()=>{const patch={};patch[key]=cast(el.value);updateReportLayoutStyle(patch,true);};});
  document.getElementById('reportFontScale').oninput=e=>{ensureReportCustomizationState();state.reportPrefs.fontScale=Math.max(.85,Math.min(1.2,Number(e.target.value||100)/100));document.getElementById('reportFontScaleValue').textContent=e.target.value+'%';document.querySelectorAll('.daily-report-page').forEach(el=>{const s=state.reportPrefs.fontScale;el.style.setProperty('--report-title-size',(16*s)+'px');el.style.setProperty('--report-section-size',(14*s)+'px');el.style.setProperty('--report-card-title-size',(10*s)+'px');el.style.setProperty('--report-map-size',(7*s)+'px');el.style.setProperty('--report-body-size',(8*s)+'px');});};
  document.getElementById('reportFontScale').onchange=()=>{save();renderDailyReport()};
  document.getElementById('reportCustomBtn').onclick=()=>{currentReportKind='custom';customReportFrom=document.getElementById('reportFromDate').value;customReportTo=document.getElementById('reportToDate').value;renderReports('custom')};
  document.getElementById('applyReportRange').onclick=()=>{customReportFrom=document.getElementById('reportFromDate').value;customReportTo=document.getElementById('reportToDate').value;currentReportKind='custom';renderReports('custom')};
  document.getElementById('resetReportRange').onclick=()=>{customReportFrom='';customReportTo='';currentReportKind='daily';renderReports('daily')};
  document.getElementById('reportBaseDate').onchange=()=>{document.getElementById('reportDate').value=document.getElementById('reportBaseDate').value;renderReports(currentReportKind)};
  document.getElementById('printReportBtn').onclick=()=>window.print();
  const overviewReportDate=document.getElementById('overviewReportDate');
  if(overviewReportDate)overviewReportDate.onchange=()=>{overviewRangeFrom='';overviewRangeTo='';setOverviewSharedDate(overviewReportDate.value);openPage('overview')};
  const applyOverviewRangeBtn=document.getElementById('applyOverviewRange');
  if(applyOverviewRangeBtn)applyOverviewRangeBtn.onclick=applyOverviewRange;
  const resetOverviewRangeBtn=document.getElementById('resetOverviewRange');
  if(resetOverviewRangeBtn)resetOverviewRangeBtn.onclick=resetOverviewRange;
  const printOverviewBtn=document.getElementById('printOverviewBtn');
  if(printOverviewBtn)printOverviewBtn.onclick=()=>{
    document.body.classList.add('print-overview');
    openPage('overview');
    renderOverview();
    setTimeout(()=>window.print(),80);
  };
  window.addEventListener('afterprint',()=>document.body.classList.remove('print-overview'));
  document.getElementById('printDaily').onclick=()=>{currentReportKind='daily';openPage('reports');renderReports('daily');setTimeout(()=>window.print(),50)};document.getElementById('printWeekly').onclick=()=>{currentReportKind='weekly';openPage('reports');renderReports('weekly');setTimeout(()=>window.print(),50)};document.getElementById('printMonthly').onclick=()=>{currentReportKind='monthly';openPage('reports');renderReports('monthly');setTimeout(()=>window.print(),50)};const pp=document.getElementById('printProgress');if(pp)pp.onclick=()=>{openPage('progress');setTimeout(()=>window.print(),80)};
  document.getElementById('saveSettingsBtn').onclick=()=>{state.project.name=sProjectName.value;state.project.client=sClient.value;state.project.engineer=document.getElementById('sEngineer')?.value||'Civil Engineer';state.project.start=sStart.value;state.project.finish=sFinish.value;state.project.warn=Number(sWarn.value||5);state.project.crit=Number(sCrit.value||10);save();renderAll();alert('Project settings saved.')};document.getElementById('addBuildingBtn').onclick=addBuilding;
  document.getElementById('addTradeBtn').onclick=addTrade;document.getElementById('addEquipmentBtn').onclick=addEquipment;document.getElementById('downloadTemplate').onclick=downloadTemplate;document.getElementById('csvInput').onchange=e=>{if(e.target.files?.[0])importCsv(e.target.files[0])};

  const gcb=document.getElementById('globalCustomizeBtn');if(gcb)gcb.onclick=()=>toggleGlobalCustomizer();
  const gcc=document.getElementById('closeGlobalCustomizeBtn');if(gcc)gcc.onclick=()=>toggleGlobalCustomizer(false);
  const gps=document.getElementById('globalPageSelect');if(gps)gps.onchange=e=>{openPage(e.target.value);globalCustomizePage=e.target.value;selectedGlobalBlockKey='';renderGlobalCustomizerControls()};
  const gbs=document.getElementById('globalBlockSelect');if(gbs)gbs.onchange=e=>{selectedGlobalBlockKey=e.target.value;applyGlobalPagePrefs(globalCustomizePage);renderGlobalCustomizerControls()};
  const gfs=document.getElementById('globalFontScale');if(gfs)gfs.oninput=e=>{const p=globalPagePrefs(globalCustomizePage);p.fontScale=Math.max(.8,Math.min(1.3,Number(e.target.value||100)/100));document.getElementById('globalFontScaleValue').textContent=e.target.value+'%';applyGlobalPagePrefs(globalCustomizePage)};if(gfs)gfs.onchange=()=>save();
  const gbh=document.getElementById('globalBlockHeight');if(gbh)gbh.oninput=e=>{const v=Number(e.target.value);const o=document.getElementById('globalBlockHeightValue');if(o)o.textContent=v<0?'Default':v+'px';};
  const gep=document.getElementById('globalEditText');if(gep)gep.onchange=()=>enableGlobalTextEditing(globalCustomizePage);
  const gap=document.getElementById('globalApplyBlockBtn');if(gap)gap.onclick=applyGlobalBlockControls;
  const gup=document.getElementById('globalMoveUpBtn');if(gup)gup.onclick=()=>moveGlobalBlock(-1);
  const gdn=document.getElementById('globalMoveDownBtn');if(gdn)gdn.onclick=()=>moveGlobalBlock(1);
  const grb=document.getElementById('globalResetBlockBtn');if(grb)grb.onclick=resetGlobalBlock;
  const grp=document.getElementById('globalResetPageBtn');if(grp)grp.onclick=resetGlobalPage;
  const gp=document.getElementById('globalBlockPadding'),gpv=document.getElementById('globalBlockPaddingValue');if(gp)gp.oninput=()=>{if(gpv)gpv.textContent=Number(gp.value)<0?'Default':gp.value+'px'};
  const gr=document.getElementById('globalBlockRadius'),grv=document.getElementById('globalBlockRadiusValue');if(gr)gr.oninput=()=>{if(grv)grv.textContent=Number(gr.value)<0?'Default':gr.value+'px'};
  const orc=document.getElementById('openReportCustomizerBtn');if(orc)orc.onclick=()=>{openPage('reports');if(!reportCustomizeMode)toggleReportCustomizer(true)};
  initSupabase();
}
setup();
