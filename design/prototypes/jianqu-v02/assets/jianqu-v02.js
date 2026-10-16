/* Jianqu / 见趣：非生产交互演示层。明确所有示例数据，禁止虚假报名/成交。 */
(() => {
"use strict";
const root=document.createElement("div");root.id="jkOverlay";root.className="jk-root";root.hidden=true;
root.innerHTML='<section class="jk-panel" role="dialog" aria-modal="true" aria-label="见趣互动演示" tabindex="-1"><header class="jk-top"><div><div class="jk-eyebrow">见趣 · JIANQU / 设计评审</div><h2 class="jk-heading" id="jkTitle"></h2></div><button type="button" class="jk-close" data-jk="close" aria-label="关闭并回到原页面">✕ 返回体验</button></header><div class="jk-content" id="jkBody"></div><footer class="jk-demo-strip">◇ 设计原型 · 所有活动、商品、价格和回执均为虚构示例 · 不产生真实交易或报名</footer></section>';
document.body.appendChild(root);
const toast=document.createElement("div");toast.className="jk-toast";toast.hidden=true;document.body.appendChild(toast);
let toastTimer=null,view="",focusBefore=null,selectedEvent=0,selectedProduct=0,qty=1,role=0;
const events=[{name:"晨练太极 · 入门班",time:"周六 7:00—8:00",where:"云栖公园东广场",price:"免费",icon:"☀️",detail:"适合没有基础的朋友，按自己的节奏参与。具体场次与名额以实际运营为准。"},{name:"邻里茶艺课",time:"周日 15:00—16:30",where:"社区活动中心",price:"免费体验",icon:"🍵",detail:"闻茶香、认识茶具、聊聊家乡茶文化。"},{"name":"老友读报会",time:"每日 9:30",where:"社区书屋",price:"免费",icon:"📖",detail:"一块读读新闻，聊聊身边的新鲜事。"}];
const goods=[{name:"家庭装洗衣液",spec:"2.5kg · 清新香型 · 示例商品",price:39,shipping:6,icon:"🧴",store:"见趣生活精选店（虚构）"},{name:"作品装裱服务",spec:"A3 相框 · 示例服务",price:68,shipping:0,icon:"🖼️",store:"见趣作品工坊（虚构）"},{name:"邻里茶艺体验",spec:"单人体验券 · 示例服务",price:29,shipping:0,icon:"🍵",store:"云栖茶室（虚构）"}];
const roles=[{name:"小暖",desc:"温和细致 · 女声（声线演示）",icon:"✦"},{name:"茶馆先生",desc:"风趣从容 · 男声（声线演示）",icon:"☕"},{name:"清和",desc:"简洁理性 · 中性声线（演示）",icon:"◉"}];
const pub=()=>document.querySelector('.screen.is-on')?.dataset.screen==="public";
const byId=id=>document.getElementById(id);
const btn=(text,action,main=false)=>'<button type="button" class="jk-btn'+(main?' jk-btn-main':'')+'" data-jk="'+action+'">'+text+'</button>';
function say(msg){clearTimeout(toastTimer);toast.textContent=msg;toast.hidden=false;toastTimer=setTimeout(()=>{toast.hidden=true},3600)}
function show(name,title,html){if(root.hidden)focusBefore=document.activeElement;view=name;byId("jkTitle").textContent=title;byId("jkBody").innerHTML=html;root.hidden=false;root.querySelector('.jk-panel').focus();byId('jkBody').scrollTop=0;document.body.style.overflow="hidden"}
function close(){root.hidden=true;document.body.style.overflow="";focusBefore?.focus?.();focusBefore=null}
const back=(target)=>'<button type="button" class="jk-breadcrumb" data-jk="'+target+'">‹ 返回上一层</button>';
function eventList(){show("events","家门口的新鲜事",'<p class="jk-intro">按设备所在服务网格展示。这里全部是体验数据，真实场次将由合作场地方提供。</p><div class="jk-grid">'+events.map((x,i)=>'<button class="jk-offer" type="button" data-jk="event-'+i+'"><span class="jk-art">'+x.icon+'</span><span><h3>'+x.name+'</h3><p>'+x.time+'<br>'+x.where+'</p><span class="jk-tag">'+x.price+' · 查看详情 ›</span></span></button>').join('')+'</div><div class="jk-actions">'+btn("看看生活商品","shop")+btn("让 AI 帮忙找","ai")+'</div>')}
function eventDetail(i){selectedEvent=i;const x=events[i];show("eventDetail","活动详情",back("events")+'<div class="jk-detail"><div class="jk-detail-art">'+x.icon+'</div><div class="jk-article"><h3>'+x.name+'</h3><p>'+x.detail+'</p><div class="jk-summary"><div class="jk-summary-line"><span>活动时间</span><strong>'+x.time+'</strong></div><div class="jk-summary-line"><span>活动地点</span><strong>'+x.where+'</strong></div><div class="jk-summary-line"><span>活动费用</span><strong>'+x.price+'</strong></div></div></div></div><div class="jk-actions">'+btn("大屏报名（演示）","event-confirm",true)+btn("手机接续报名","handoff")+'</div>')}
function eventConfirm(){const x=events[selectedEvent];show("eventConfirm","报名信息，请本人确认",back("event-"+selectedEvent)+'<p class="jk-intro">当前为'+(pub()?'公共':'个人')+'设备。提交前请看清活动和身份信息；演示不存储真实姓名与电话。</p><div class="jk-summary"><div class="jk-summary-line"><span>活动</span><strong>'+x.name+'</strong></div><div class="jk-summary-line"><span>时间</span><strong>'+x.time+'</strong></div><div class="jk-summary-line"><span>费用</span><strong>'+x.price+'</strong></div></div><div class="jk-note">尚无真实活动接口。点击下方按钮只展示模拟流程，不会产生真实报名凭证。</div><div class="jk-actions">'+btn("查看模拟报名结果","event-done",true)+btn("取消","close")+'</div>')}
function eventDone(){show("eventDone","报名流程演示完成",'<div class="jk-detail"><div class="jk-detail-art">🗓️</div><div class="jk-article"><h3>你已体验报名流程</h3><p>这不是实际报名成功。真实服务应在收到活动系统回执后才展示有效凭证。</p><p>公共设备应在用户离开时清除本次会话数据。</p></div></div><div class="jk-actions">'+btn("继续找活动","events",true)+btn("结束并清屏","clear")+'</div>')}
function shop(){show("shop","好物与生活服务",'<p class="jk-intro">商品在见趣自有商城中展示，商家负责履约。金额与卖家均为界面示意，不支持真实购买。</p><div class="jk-grid">'+goods.map((g,i)=>'<button class="jk-offer" type="button" data-jk="product-'+i+'"><span class="jk-art">'+g.icon+'</span><span><h3>'+g.name+'</h3><p>'+g.spec+'</p><span class="jk-tag">¥'+g.price+' · 查看商品 ›</span></span></button>').join('')+'</div><div class="jk-actions">'+btn("返回首页","close")+btn("看附近活动","events")+'</div>')}
function product(i){selectedProduct=i;qty=1;const x=goods[i];show("product","商品详情",back("shop")+'<div class="jk-detail"><div class="jk-detail-art">'+x.icon+'</div><div class="jk-article"><h3>'+x.name+'</h3><p>'+x.spec+'</p><p>'+x.store+'</p><span class="jk-price">¥'+x.price+'</span><p>示例运费 ¥'+x.shipping+' · 商品、库存与运费均非真实报价</p></div></div><div class="jk-actions">'+btn("加入购物车，核对金额","cart",true)+btn("暂不需要","close")+'</div>')}
function cart(){const x=goods[selectedProduct];show("cart","请核对订单信息",back("product-"+selectedProduct)+'<div class="jk-summary"><div class="jk-summary-line"><span>入驻商家</span><strong>'+x.store+'</strong></div><div class="jk-summary-line"><span>示例商品</span><strong>'+x.name+'</strong></div><div class="jk-summary-line"><span>规格</span><strong>'+x.spec+'</strong></div><div class="jk-summary-line"><span>数量</span><strong>1</strong></div><div class="jk-summary-line"><span>示例运费</span><strong>¥'+x.shipping+'</strong></div><div class="jk-summary-line total"><span>示例合计</span><strong>¥'+(x.price+x.shipping)+'</strong></div></div><div class="jk-note">必须由用户确认商品、商家、金额和配送条件后才能真正下单。本原型不收集地址、不创建订单、不发起支付。</div><div class="jk-actions">'+btn("体验确认步骤（不下单）","order-done",true)+btn("取消购买","close")+'</div>')}
function orderDone(){show("orderDone","已展示确认步骤",'<div class="jk-detail"><div class="jk-detail-art">✓</div><div class="jk-article"><h3>没有生成真实订单</h3><p>这只是产品交互预览。真实版本需要再次确认库存、运费、收件信息及支付授权，并收到后台回执。</p></div></div><div class="jk-actions">'+btn("继续逛商城","shop",true)+btn("回到原画面","close")+'</div>')}
function creative(){show("creative","把生活过成作品",'<p class="jk-intro">AI 趣玩的体验方向：个人写真、书画作品、口述故事。真实生成接口尚未接入，以下不伪装生成成功。</p><div class="jk-grid">'+[['📷','拍一张新的自己','肖像授权后用真实模型生成'],['✍️','为字画装个裱','把书画整理成可分享的作品'],['📚','说说年轻时候的事','语音讲述后整理成回忆稿'],['🎼','唱一段老歌','录一段属于自己的作品']].map((x,i)=>'<button type="button" class="jk-offer" data-jk="creative-'+i+'"><span class="jk-art">'+x[0]+'</span><span><h3>'+x[1]+'</h3><p>'+x[2]+'</p><span class="jk-tag">查看创作流程 ›</span></span></button>').join('')+'</div>')}
function creativeDetail(i){const arr=[["拍一张新的自己","上传本人照片 → 授权处理 → AI 生成 → 私密保存 → 自主分享"],["为字画装个裱","选择书画 → 调整画框效果 → 保存到作品集 → 自主分享"],["说说年轻时候的事","语音讲述 → AI 整理草稿 → 用户逐句确认 → 私密保存"],["唱一段老歌","录制作品 → 添加标题 → 私密保存 → 分享给指定亲友"]];show("creativeDetail",arr[i][0],back("creative")+'<div class="jk-detail"><div class="jk-detail-art">'+["📷","✍️","📚","🎼"][i]+'</div><div class="jk-article"><h3>创作流程预览</h3><p>'+arr[i][1]+'</p><div class="jk-note">实际拍摄、生成、存储、分享接口尚未接入。本步骤不上传素材、不调用模型，也不保存任何个人数据。</div></div></div><div class="jk-actions">'+btn("返回趣玩","creative",true)+'</div>')}
function persona(){show("persona","选择你的 AI 伙伴",'<p class="jk-intro">人设、声线和记忆是分开的。当前选择只改变本地演示中的人物称呼；声音、长期记忆和角色引擎尚未接入。</p><div class="jk-persona-list">'+roles.map((r,i)=>'<button type="button" class="jk-persona-card '+(role===i?'is-selected':'')+'" data-jk="role-'+i+'"><div style="font-size:42px">'+r.icon+'</div><strong>'+r.name+'</strong><span>'+r.desc+'</span></button>').join('')+'</div><div class="jk-sep"></div><label class="jk-switch">允许这台私人设备语音唤醒（仅设置示例） <input type="checkbox" id="jkWake" disabled></label><p class="jk-muted">公共模式不会加载私人角色、个人长期记忆或私密记录。</p><div class="jk-actions">'+btn("返回 AI 页面","go-ai",true)+'</div>')}
function profile(){show("profile","我的生活，自己作主",'<div class="jk-grid">'+[['🎞️','继续追剧','未连接真实观看记录','video'],['🪄','我的 AI 伙伴','选形象、声线和角色','persona'],['🖼️','我的作品','默认私密，主动分享','creative'],['🎫','我的活动','报名、福利和服务','events']].map(x=>'<button class="jk-offer" data-jk="'+x[3]+'"><span class="jk-art">'+x[0]+'</span><span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></span></button>').join('')+'</div><div class="jk-note">付费子女、场地方或商家不能因此读取用户私人聊天和长期记忆。当前仅为权限设计示意。</div>')}
function handoff(){show("handoff","用自己的手机继续",'<div class="jk-detail"><div class="jk-detail-art">📱</div><div class="jk-article"><h3>轻量手机接力</h3><p>未来将通过见趣自有网页继续报名、保留作品或确认订单，不要求安装微信小程序。</p><p>目前没有可用接力 URL，因此不展示无法扫码的假二维码。</p></div></div><div class="jk-actions">'+btn("返回活动","events",true)+btn("关闭","close")+'</div>')}
function search(){show("search","你想找什么？",'<label class="jk-field">输入节目、活动或生活商品<input class="jk-input" id="jkSearchInput" placeholder="例如：太极、洗衣液、茶艺" autocomplete="off"></label><div class="jk-actions">'+btn("搜索演示目录","search-do",true)+btn("附近活动","events")+btn("商城","shop")+'</div><div id="jkSearchResult" class="jk-note">只检索本原型的示例内容，不访问真实搜索服务。</div>');byId('jkSearchInput').focus()}
function searchDo(){const q=byId("jkSearchInput").value.trim();const t=byId('jkSearchResult');if(!q){t.textContent="输入一个关键词再查找。";return}t.textContent="已查找示例目录。请在下方打开对应结果。";const target=/太极|茶|活动|课/.test(q)?"events":/洗|商品|买|血压/.test(q)?"shop":/照片|写真|画|作品/.test(q)?"creative":"video";t.insertAdjacentHTML("beforeend",'<div class="jk-actions">'+btn("打开相关"+({events:"活动",shop:"商品",creative:"趣玩",video:"节目"}[target]),target,true)+'</div>')}
function goScreen(n){close();const el=document.querySelector('[data-screen-btn="'+n+'"]');if(el)el.click()}
function goAI(){goScreen('ai')}
function clear(){close();say("公共演示已结束；本次操作未存储个人资料")}
const paths={close,eventList,events:eventList,shop,cart,creative,persona,profile,handoff,search,clear};
function route(action){
if(action.startsWith("event-")&&/^event-\d+$/.test(action))return eventDetail(Number(action.split("-")[1]));
if(action.startsWith("product-"))return product(Number(action.split("-")[1]));
if(action.startsWith("creative-"))return creativeDetail(Number(action.split("-")[1]));
if(action.startsWith("role-")){role=Number(action.split("-")[1]);document.querySelectorAll('.a-ai-name,.b-ai-name,.a-companion-name').forEach(e=>e.textContent=roles[role].name);persona();say("当前仅切换人设文案，语音未接入");return}
if(action==="event-confirm")return eventConfirm();if(action==="event-done")return eventDone();if(action==="order-done")return orderDone();
if(action==="go-ai"||action==="ai")return goAI();if(action==="video")return goScreen("video");if(action==="search-do")return searchDo();
if(paths[action])return paths[action]();
}
root.addEventListener('click',e=>{const x=e.target.closest('[data-jk]');if(x){e.stopPropagation();route(x.dataset.jk)}else if(e.target===root)close()});
document.addEventListener('keydown',e=>{if(e.key==="Escape"&&!root.hidden)close()});
for(const s of document.querySelectorAll('.screen.a-screen,.screen.b-screen')){
let mark=document.createElement('span');mark.className='jk-demo-mark';mark.textContent='见趣 · 视觉与交互概念 / 非真实服务';s.appendChild(mark);
}
for(const n of document.querySelectorAll('.a-logo,.b-public-logo')){n.innerHTML=n.textContent.replace('闺蜜机','见趣 <span class="jk-brand-small">· 闺蜜机</span>')}
document.title='见趣 · 闺蜜机 / OpenDesign 视觉改造 V0.2';
document.querySelectorAll('.a-svc-card-product,.b-svc').forEach(card=>{if(card.textContent.includes("血压计")){const img=card.querySelector("img");if(img){const pic=document.createElement("div");pic.className="jk-art-icon";pic.textContent="🧴";pic.setAttribute("role","img");pic.setAttribute("aria-label","示例洗衣液商品占位图");img.replaceWith(pic)}const title=card.querySelector(".a-svc-name,.b-svc-name");if(title)title.textContent="家庭装洗衣液";const meta=card.querySelector(".a-svc-meta,.b-svc-meta");if(meta)meta.textContent="2.5kg · 清新香型 · 商品数据示例";const pr=card.querySelector(".a-svc-price,.b-svc-price");if(pr)pr.innerHTML="¥39 <span>示例运费 ¥6</span>"}});
document.querySelectorAll('.a-ai-status .a-chip,.b-ai-status .b-chip').forEach(n=>n.textContent='示例服务结果');
document.querySelectorAll('.a-ai-role,.b-ai-role').forEach(n=>n.textContent='你的私人 AI 伙伴 · 本页为示例对话');
for(const s of document.querySelectorAll('.a-ai-presence,.b-ai-stage')){const b=document.createElement('button');b.type="button";b.className="jk-btn";b.style.cssText='margin-top:16px;max-width:220px';b.textContent='选择形象与声线';b.dataset.jk='persona';s.appendChild(b)}
document.addEventListener("click",(e)=>{
const t=e.target,el=t.closest('button,article,.a-mini,.b-cover');
if(!el||!root.hidden)return;
const label=(el.textContent||"").trim(),parent=el.closest('.screen');
if(!parent)return;
const sel=el.matches.bind(el);
const go=el.dataset.goto;
let action=null;
if(el.matches('.act-signup')){const card=el.closest('article');const name=(card?.querySelector('h3')?.textContent||'').trim();const found=events.findIndex(x=>name.includes(x.name.split(' · ')[0])||x.name.includes(name));if(found>=0){selectedEvent=found}else{const meta=(card?.querySelector('.b-act-meta,.a-act-meta')?.textContent||'时间与场地以主办方实际安排为准').trim();events.push({name:name||'本地活动',time:meta,where:'请以活动主办方信息为准',price:el.textContent.includes('免费')?'免费（样例）':'具体费用待核实',icon:'🎫',detail:'这是公共终端的活动信息演示，不代表本地真实存在该活动。'});selectedEvent=events.length-1}action='event-confirm';}
else if(el.matches('.a-searchbtn,.b-search'))action='search';
else if(el.matches('[data-jk]'))action=el.dataset.jk;
else if(el.matches('.a-navitem,.b-dockitem')) {
 if(/活动|福利/.test(label))action='events';
 else if(/商城/.test(label))action='shop';
 else if(/我的/.test(label))action='profile';
} else if(el.matches('.a-more')) action=/活动/.test(el.closest('section')?.textContent||"")?'events':'video';
else if(el.matches('.a-create,.b-create'))action='creative';
else if(el.matches('.a-qchip,.b-qchip'))action=/活动/.test(label)?'events':/商品/.test(label)?'shop':/课程/.test(label)?'go-ai':'handoff';
else if(el.matches('.a-ai-send,.b-ai-input button')){say("目前仅展示预置对话；语音识别和 AI 服务尚未接入");e.stopImmediatePropagation();e.preventDefault();return}
else if(el.matches('.a-playbtn,.b-playbtn')){say("当前为静态画面示意，未接入有版权的视频播放源");e.stopImmediatePropagation();e.preventDefault();return}
else if(el.matches('.a-teacher,.b-teacher')){say("讲师文案已切换，音频与数字人唇形尚未接入");return}
else if(el.matches('.a-ep,.b-ep')){say("分集选择仅演示页面状态，未接真实内容源");return}
else if(/加入购物车|购买|去看看商品|查看商品|去商城/.test(label))action='product-0';
else if(/报名|参加/.test(label)&&el.tagName==='BUTTON')action='event-confirm';
else if(/保存|收藏|片单|追剧/.test(label)&&el.tagName==='BUTTON'){say("已演示收藏入口；登录存储尚未接入");e.stopImmediatePropagation();return}
else if(/分享/.test(label)&&el.tagName==='BUTTON')action='handoff';
if(action){e.preventDefault();e.stopImmediatePropagation();route(action)}
},true);
})();
