(() => {
"use strict";

/* ============================================================
   太虚问道 · 生死修行 —— 天道众生版
   · PvP 对手是 27 个有独立状态的个体 NPC（各自修炼/渡劫/互殴）
   · NPC 随机互相挑战、修炼、飞升，世界持续演化（在线/离线均推进）
   · 安全修炼消耗「修炼丹」；修炼丹来自离线挂机或 PvP 获胜
   · 天道榜实时展示众生修为
   ============================================================ */

const CLASSES = {
  sword:{name:"剑修",icon:"⚔",desc:"高爆发 · 连击剑意",base:{hp:125,atk:29,def:14,speed:25},skills:[
    {name:"青锋斩",desc:"造成 125% 攻击伤害",type:"damage",mult:1.25,cd:0},
    {name:"御剑术",desc:"造成 175% 攻击伤害",type:"damage",mult:1.75,cd:0},
    {name:"剑影分光",desc:"两次快速斩击（冷却1）",type:"double",mult:.78,cd:1},
    {name:"太虚剑阵",desc:"强力终结技（冷却3）",type:"ult",mult:2.65,cd:3}
  ]},
  spell:{name:"法修",icon:"✦",desc:"远程 · 元素爆发",base:{hp:105,atk:35,def:9,speed:21},skills:[
    {name:"火球术",desc:"造成 130% 攻击伤害",type:"damage",mult:1.3,cd:0},
    {name:"冰魄",desc:"造成 105% 并减速对手（冷却1）",type:"slow",mult:1.05,cd:1},
    {name:"雷引",desc:"造成 190% 攻击伤害（冷却2）",type:"damage",mult:1.9,cd:2},
    {name:"五行天罚",desc:"强力终结技（冷却3）",type:"ult",mult:2.55,cd:3}
  ]},
  body:{name:"体修",icon:"盾",desc:"高生存 · 反击",base:{hp:170,atk:30,def:23,speed:18},skills:[
    {name:"震岳拳",desc:"造成 145% 攻击伤害",type:"damage",mult:1.45,cd:0},
    {name:"金身",desc:"减伤 55%（冷却2）",type:"guard",mult:1,cd:2},
    {name:"反震",desc:"造成 190% 伤害并进入护体（冷却1）",type:"counter",mult:1.9,cd:1},
    {name:"霸体镇天",desc:"造成 270% 攻击伤害（冷却3）",type:"ult",mult:2.7,cd:3}
  ]},
  talisman:{name:"符修",icon:"符",desc:"控制 · 陷阱",base:{hp:105,atk:31,def:12,speed:22},skills:[
    {name:"雷符",desc:"造成 120% 伤害并麻痹（冷却1）",type:"stun",mult:1.2,cd:1},
    {name:"缚灵符",desc:"造成 95% 伤害并减速（冷却1）",type:"slow",mult:.95,cd:1},
    {name:"爆炎符",desc:"造成 175% 伤害",type:"damage",mult:1.75,cd:0},
    {name:"万符归宗",desc:"造成 250% 伤害（冷却3）",type:"ult",mult:2.5,cd:3}
  ]},
  alchemy:{name:"丹修",icon:"丹",desc:"续航 · 强化",base:{hp:148,atk:29,def:15,speed:19},skills:[
    {name:"回春",desc:"恢复 25% 最大生命（冷却1）",type:"heal",mult:1,cd:1},
    {name:"丹火",desc:"造成 160% 攻击伤害",type:"damage",mult:1.6,cd:0},
    {name:"暴血丹",desc:"攻击提升 25%（冷却2）",type:"buff",mult:1,cd:2},
    {name:"九转天丹",desc:"恢复 18% 生命并重击（冷却2）",type:"healhit",mult:2.25,cd:2}
  ]},
  beast:{name:"御兽师",icon:"兽",desc:"召唤 · 协同攻击",base:{hp:145,atk:32,def:16,speed:20},skills:[
    {name:"灵兽撕咬",desc:"造成 145% 伤害",type:"damage",mult:1.45,cd:0},
    {name:"青羽",desc:"灵兽追加两次攻击（冷却1）",type:"double",mult:.95,cd:1},
    {name:"兽魂护体",desc:"获得减伤 55%（冷却2）",type:"guard",mult:1,cd:2},
    {name:"万兽朝宗",desc:"三段协同攻击（冷却3）",type:"triple",mult:.95,cd:3}
  ]}
};

const REALMS = [
  {name:"炼气",need:1000,mult:1},
  {name:"筑基",need:3000,mult:1.55},
  {name:"金丹",need:7000,mult:2.35},
  {name:"元婴",need:15000,mult:3.45},
  {name:"化神",need:30000,mult:5.1},
  {name:"返虚",need:60000,mult:7.4},
  {name:"合道",need:120000,mult:10.5},
  {name:"渡劫",need:240000,mult:15},
  {name:"真仙",need:500000,mult:22}
];

const NPC_NAMES = ["青冥客","赤炎真人","玄霜仙子","无相道人","落星客","九幽散人","天枢子","妙法真人","沧澜剑仙","白眉老祖","紫霄上人","玉衡君","太乙散人","孤鸿客","玄夜","惊鸿仙子","墨白","红衣修罗","寒山道人","风雷客","北辰星主","青莲剑尊","蚀月真君","琉璃上仙","雷泽散仙","云中鹤","枯荣真人"];

/* ============ NPC 性格与 AI 对话 ============ */
const NPC_PERSONA = [
  {tone:"豪迈",mark:"哈哈哈",style:"豪迈"},
  {tone:"沉稳",mark:"嗯嗯",style:"沉稳"},
  {tone:"傲娇",mark:"哼，也就还行吧",style:"傲娇"},
  {tone:"咸鱼",mark:"躺平了躺平了",style:"咸鱼"},
  {tone:"热心",mark:"真的假的",style:"热心"}
];
const AI_LINES = {
  idle:[
    "{npc}：{mark} 兄弟们今天刷塔了吗？我卡在第{floor}层，妖王是真的肉。",
    "{npc}：{mark} 刚在野外秘境捡了件法宝，属性还不错，明天继续蹲。",
    "{npc}：{mark} 有谁一起组队刷悬赏？斩妖那个任务还差两个。",
    "{npc}：{mark} 法宝这玩意儿纯看脸，我都刷一晚上了还没见橙色。",
    "{npc}：{mark} 别卷了别卷了，慢慢修炼不香吗，卷死我了。",
    "{npc}：{mark} 天道榜又更新了，前面那几个战力是真的高，服气。",
    "{npc}：{mark} 修炼丹不够用啊，今晚挂机攒一波。",
    "{npc}：{mark} 听说橙品以上法宝带特效，有没有大佬晒一下？"
  ],
  trib:[
    "{npc}：{mark} 兄弟们我渡劫成功啦！现在已经是{realm}境了，起飞！",
    "{npc}：{mark} 渡劫是真的吓人，还好我苟住了，{realm}境拿捏。"
  ],
  win:[
    "{npc}：{mark} 刚刚把{foe}给打趴了，就这？就这？",
    "{npc}：{mark} 赢了{foe}，感觉我还能再打十个。"
  ],
  lose:[
    "{npc}：{mark} 输给{foe}了，心态有点崩，等我装备起来再战。",
    "{npc}：{mark} 被{foe}虐了，难受，先下线缓一缓。"
  ],
  playerWin:[
    "{npc}：{mark} 卧槽「无名散修」居然赢了，有点东西啊。",
    "{npc}：{mark} 「无名散修」这波操作可以，下次遇上得小心点。"
  ],
  talk:[
    "{npc}：{mark} 哟「{player}」道友来啦，有礼了。你现在主修什么方向？",
    "{npc}：{mark} 你问对人了，听我说——{tip}",
    "{npc}：{mark} 简单分享下我的经验：{tip}",
    "{npc}：{mark} 以后一起玩啊，互相关照。"
  ],
  replyPlayer:[
    "{npc}：{mark} 对对对，我也这么觉得。",
    "{npc}：{mark} 哈哈，正合我意，同道中人。",
    "{npc}：{mark} 有道理，学到了学到了。"
  ]
};
const AI_TIPS = [
  "修炼丹每天离线就能攒，生死战打赢也能拿，别浪费。",
  "野外秘境要境界够了才能进，越级硬闯会被妖兽按在地上摩擦。",
  "法宝分五个品级，红色最稀有，猎杀同境界妖王有概率爆。",
  "返虚之后才能开辅修，辅修有自己的修为池，跟主修不冲突。",
  "万妖塔每四层有镇塔之宝，值得一爬。",
  "渡劫前记得把修为拉满，道心越高成功率越高。",
  "连胜越高生死战收益越大，但是输了就清零，量力而行。",
  "每日悬赏记得清，奖励有灵石有丹药，偶尔还有法宝。"
];
function aiLine(npc,key,extra){
  const arr=AI_LINES[key]||AI_LINES.idle;
  const p=Math.floor(Math.random()*arr.length);
  let line=arr[p];
  const persona=npc.persona||NPC_PERSONA[0];
  /* 统一用现代语口癖（兼容旧存档中遗留的古风口癖） */
  const mp=NPC_PERSONA.find(q=>q.tone===persona.tone);
  const mark=mp?mp.mark:NPC_PERSONA[Math.floor(Math.random()*NPC_PERSONA.length)].mark;
  line=line.replace("{npc}",npc.name).replace("{mark}",mark);
  line=line.replace("{realm}",REALMS[npc.realm].name);
  line=line.replace("{player}","无名散修");
  line=line.replace("{floor}",Math.floor(Math.random()*((state.towerBest||1)*2))+1);
  line=line.replace("{tip}",(extra&&extra.tip)||AI_TIPS[Math.floor(Math.random()*AI_TIPS.length)]);
  if(extra){line=line.replace("{foe}",extra.foe||"他");}
  return line;
}
function aiChat(npc,key,extra){
  const msg=aiLine(npc,key,extra);
  chat(msg,"AI",npc);
}
function randomAIBanter(){
  const free=state.npcList.filter(n=>!npcIsBusy(n));
  if(!free.length)return;
  const n=free[Math.floor(Math.random()*free.length)];
  aiChat(n,"idle");
}
function playerTalkTo(npcId){
  const npc=state.npcList.find(n=>n.id===npcId);
  if(!npc)return;
  chat(`（@${npc.name}）你好呀，最近修炼得咋样？`,"你");
  setTimeout(()=>aiChat(npc,"talk",{tip:AI_TIPS[Math.floor(Math.random()*AI_TIPS.length)]}),600);
  setTimeout(()=>{chat(`（对${npc.name}）学到了，多谢啦！`,"你")},1400);
  npc.busyUntil=Date.now()+60000;
}

/* ============ 境界表现：基础属性大幅提升 + UI 配色 ============ */
const REALM_STAT = [1,1.7,2.6,3.8,5.4,7.4,10,13.5,18]; /* 每大境界基础属性倍率（大幅提升） */
const REALM_COLOR = ["#b8c0cf","#5fd0a0","#e7bd6b","#7fd6ff","#5b8cff","#b06bff","#ff6bd8","#ff8a5b","#ffd76b"];

/* ============ 法宝装备系统（6 槽位） ============ */
const RARITY = {
  white:{name:"白",color:"#cfd6e4",mult:1,weight:60},
  green:{name:"绿",color:"#5fd0a0",mult:1.35,weight:25},
  blue:{name:"蓝",color:"#5b8cff",mult:1.8,weight:10},
  orange:{name:"橙",color:"#ff9a3d",mult:2.4,weight:4},
  red:{name:"红",color:"#ff5b6b",mult:3.2,weight:1}
};
const EQ_SLOTS = [
  {id:"weapon",name:"兵刃",stat:"atk",hp:0},
  {id:"armor",name:"战甲",stat:"def",hp:.6},
  {id:"acc",name:"灵佩",stat:"speed",hp:.4},
  {id:"pants",name:"法裤",stat:"def",hp:.8},
  {id:"necklace",name:"项链",stat:"atk",hp:.5},
  {id:"shoes",name:"法靴",stat:"speed",hp:.5}
];
const EQ_TYPE_NAMES = {
  weapon:["青锋剑","斩魔刀","断水枪","陨星剑"],
  armor:["玄龟甲","云锦袍","磐石铠","星辰衣"],
  acc:["风灵佩","镇魂铃","踏云佩","紫金符"],
  pants:["缚灵裤","踏罡裤","玄冰裤","赤鳞裤"],
  necklace:["镇妖链","聚灵链","龙纹项链","星辉项链"],
  shoes:["凌波靴","踏云靴","追风靴","紫电靴"]
};
const RARITY_PREFIX = {white:"凡品",green:"精良",blue:"上品",orange:"极品",red:"仙品"};
/* 橙/红品法宝附带特殊攻击效果（按槽位） */
const RARE_EFF = {
  weapon:[{name:"裂甲",desc:"攻击有 25% 概率无视 30% 防御",type:"armpen",chance:.25,val:.3},{name:"灭世",desc:"攻击有 30% 概率造成 60% 额外伤害",type:"critx",chance:.3,val:.6}],
  armor:[{name:"玄铁",desc:"受到伤害降低 10%",type:"dmgred",val:.1},{name:"不灭",desc:"受到伤害降低 18%",type:"dmgred",val:.18}],
  acc:[{name:"凝神",desc:"暴击率提升 8%",type:"critr",val:.08},{name:"天心",desc:"暴击率提升 15%",type:"critr",val:.15}],
  pants:[{name:"回春",desc:"每回合回复 3% 最大生命",type:"regen",val:.03},{name:"生生",desc:"每回合回复 5% 最大生命",type:"regen",val:.05}],
  necklace:[{name:"汲灵",desc:"攻击回复造成伤害 15% 的生命",type:"lifesteal",val:.15},{name:"血契",desc:"攻击回复造成伤害 25% 的生命",type:"lifesteal",val:.25}],
  shoes:[{name:"风行",desc:"10% 概率闪避攻击",type:"dodge",val:.1},{name:"神行",desc:"15% 概率闪避攻击",type:"dodge",val:.15}]
};
/* 每职业每技能专属特效配色与样式 */
const SKILL_FX = {
  sword:[{c:"#cfe4ff",s:"slash"},{c:"#7fd6ff",s:"twin"},{c:"#9fb8ff",s:"rain"},{c:"#ffd76b",s:"nova"}],
  spell:[{c:"#ff8a5b",s:"fireball"},{c:"#8fe0ff",s:"ice"},{c:"#ffe36b",s:"lightning"},{c:"#b06bff",s:"chaos"}],
  body:[{c:"#ffb36b",s:"punch"},{c:"#ffd76b",s:"ward"},{c:"#ff8a5b",s:"shockwave"},{c:"#ff6b8a",s:"quake"}],
  talisman:[{c:"#cfe8ff",s:"bolt"},{c:"#7fd6ff",s:"chain"},{c:"#ffb36b",s:"blast"},{c:"#b06bff",s:"seal"}],
  alchemy:[{c:"#6fe9a0",s:"heal"},{c:"#ff9a3d",s:"flame"},{c:"#ff5b6b",s:"pill"},{c:"#e7bd6b",s:"divine"}],
  beast:[{c:"#b06bff",s:"claw"},{c:"#7fd6ff",s:"pounce"},{c:"#ffd76b",s:"ward"},{c:"#ff6b8a",s:"beast"}]
};

/* ============ 野外秘境（9 张图，按境界解锁） ============ */
const MAP_NAMES = ["黑风谷","落霞山","幽冥洞","冰渊泽","赤焰山","天元秘境","星陨海","劫雷渊","太虚仙境"];
const MONSTER_NAMES = [
  ["黑风狼","噬骨鼠","赤尾狐"],
  ["铁背熊","玄水蟒","青岩犀"],
  ["三眼魔狼","幽火鸦","血瞳豹"],
  ["寒霜蛟","冰魄蛛","九尾貂"],
  ["烈焰狮","熔岩巨猿","赤炎蝎"],
  ["虚空螳螂","噬灵蝠","幻影蛟"],
  ["星辰巨兽","天雷鹰","混沌兽"],
  ["劫雷魔龙","蚀骨鲲","灭世猿"],
  ["太虚古龙","混沌麒麟","九天神凤"]
];

/* ============ 辅修加成（辅修修为比例 × 该道途基础属性 × 系数） ============ */
const SUB_BONUS = {
  sword:{hp:.3,atk:.5,def:.3,speed:.4},
  spell:{hp:.3,atk:.45,def:.3,speed:.45},
  body:{hp:.6,atk:.3,def:.5,speed:.2},
  talisman:{hp:.3,atk:.4,def:.35,speed:.5},
  alchemy:{hp:.55,atk:.35,def:.4,speed:.3},
  beast:{hp:.4,atk:.45,def:.3,speed:.45}
};

const state = {
  cls:"sword", realm:0, cultivation:0, dao:50, streak:0, gold:1000, pills:0,
  pillTimer:0, lastSeen:0, npcList:[], battle:null, fx:{shake:0,floats:[],parts:[],hit:0}, page:"home",
  equip:{weapon:null,armor:null,acc:null,pants:null,necklace:null,shoes:null}, inv:[], subCls:null, subCult:0, subLevel:1, classLocked:false, auto:false,
  autoGlobal:true, autoContinue:true,
  towerFloor:1, towerBest:0, quests:[], questDay:"", achievements:[], stats:{wins:0,wild:0,tower:0,quests:0,auto:0},
  profile:null, lastResult:""
};

/* ============ 角色形象（AI 生成 2D 立绘） ============ */
const AVATAR = {sword:"assets/sword.png",spell:"assets/spell.png",body:"assets/body.png",talisman:"assets/talisman.png",alchemy:"assets/alchemy.png",beast:"assets/beast.png",monster:"assets/monster.png"};
function setAvatar(el,cls){if(el)el.src=AVATAR[cls]||AVATAR.monster}

/* ============ 除魔悬赏（每日日常） ============ */
const QUEST_POOL = [
  {type:"hunt",name:"斩妖",desc:"野外秘境猎杀妖兽",target:3},
  {type:"pvp",name:"论道",desc:"赢得生死战",target:3},
  {type:"cultivate",name:"苦修",desc:"修炼（安全/辅修修炼）",target:5},
  {type:"tower",name:"登塔",desc:"攻克万妖塔层数",target:2},
  {type:"trib",name:"渡劫",desc:"成功渡劫飞升",target:1}
];

/* ============ 成就体系 ============ */
const ACHIEVEMENTS = [
  {id:"first_win",name:"初试锋芒",desc:"赢得首场生死战",icon:"⚔"},
  {id:"win_5",name:"五连胜",desc:"生死战连胜达到 5 场",icon:"🔥"},
  {id:"realm_3",name:"金丹有成",desc:"修为突破至金丹境",icon:"☯"},
  {id:"realm_6",name:"返虚强者",desc:"修为突破至返虚境",icon:"🌌"},
  {id:"realm_9",name:"真仙临世",desc:"飞升真仙之境",icon:"✨"},
  {id:"wild_10",name:"猎妖狂人",desc:"野外猎杀妖兽 10 次",icon:"🐾"},
  {id:"gear_red",name:"红品在手",desc:"获得一件红色品级法宝",icon:"💎"},
  {id:"gear_5",name:"五宝齐备",desc:"同时拥有 5 件法宝",icon:"🗡"},
  {id:"tower_4",name:"初入妖塔",desc:"攻克万妖塔第 4 层",icon:"🏯"},
  {id:"tower_12",name:"塔中豪杰",desc:"攻克万妖塔第 12 层",icon:"🀄"},
  {id:"sub_3",name:"兼修有成",desc:"辅修突破至第 3 层",icon:"🪷"},
  {id:"quest_5",name:"悬赏达人",desc:"完成 5 个悬赏任务",icon:"📜"},
  {id:"auto_win",name:"挂机真仙",desc:"以自动战斗赢得一场",icon:"🤖"},
  {id:"gold_50k",name:"腰缠万贯",desc:"累计拥有 5 万灵石",icon:"💰"}
];

const $ = id => document.getElementById(id);
/* 中文大数：超过 5 位数（>=10万）以 万/亿 展示；其余千分位 */
function cnNum(n){
  n=Math.floor(Math.abs(n)||0);
  const fmt1=v=>{const r=Math.round(v*10)/10;return (r%1===0?Math.floor(r):r.toFixed(1))};
  if(n>=1e8)return fmt1(n/1e8)+"亿";
  if(n>=1e5)return fmt1(n/1e4)+"万";
  return n.toLocaleString("zh-CN");
}
const fmt = cnNum;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function currentRealm(){return REALMS[state.realm]}
function maxCult(){return currentRealm().need}
function stageOf(cult,realmIdx){const p=cult/REALMS[realmIdx].need;if(p>=.75)return "大圆满";if(p>=.5)return "后期";if(p>=.25)return "中期";return "初期"}
function smallStage(){return stageOf(state.cultivation,state.realm)}
function classMultiplier(){return 1+state.streak*.04+state.dao*.002}
function equipBonus(equip){
  const eq=equip||state.equip;
  const b={hp:0,atk:0,def:0,speed:0};
  Object.values(eq).forEach(it=>{if(it&&it.cls===state.cls){b.hp+=it.hp||0;b.atk+=it.atk||0;b.def+=it.def||0;b.speed+=it.speed||0}});
  return b;
}
function subBonus(){
  const b={hp:0,atk:0,def:0,speed:0};
  if(!state.subCls||state.subCult<=0)return b;
  const p=state.subCult/100,base=CLASSES[state.subCls].base,sb=SUB_BONUS[state.subCls];
  const lvMul=1+((state.subLevel||1)-1)*.4; /* 辅修每突破一层，加成倍率 +40% */
  b.hp=Math.floor(base.hp*sb.hp*p*lvMul);b.atk=Math.floor(base.atk*sb.atk*p*lvMul);
  b.def=Math.floor(base.def*sb.def*p*lvMul);b.speed=Math.floor(base.speed*sb.speed*p*lvMul);
  return b;
}
/* 辅修层级上限：随主修大境界放宽（返虚=6 层 → 真仙=9 层） */
function subMaxLevel(){return state.realm+1}
/* 辅修突破：修为圆满后突破一层，重铸修为并提升加成倍率 */
function subTribulate(){
  if(state.battle)return;
  if(!state.subCls){log("尚未开启辅修。","bad");return}
  if(state.subCult<100){log("辅修修为尚未圆满，无法突破。","bad");return}
  const lv=state.subLevel||1;
  if(lv>=subMaxLevel()){log("辅修已达当前境界上限，提升主修大境界后可继续突破。","bad");return}
  const cost=2+lv,goldCost=200+state.realm*300;
  if(state.pills<cost){log(`辅修突破需要修炼丹×${cost}，不足。`,"bad");return}
  if(state.gold<goldCost){log(`辅修突破需要灵石 ${fmt(goldCost)}，不足。`,"bad");return}
  state.pills-=cost;state.gold-=goldCost;
  state.subLevel=lv+1;state.subCult=0;
  log(`辅修突破！${CLASSES[state.subCls].name}辅修迈入第 ${state.subLevel} 层，属性加成大幅提升。`,"good");
  chat(`「无名散修」${CLASSES[state.subCls].name}辅修突破至第 ${state.subLevel} 层。`,"天道");
  render();draw();autosave();
}
/* 基础属性：每大境界大幅提升；extra 为法宝加成 */
function statsOf(cls,realm,cult,extra){
  const c=CLASSES[cls].base,rm=REALM_STAT[realm],p=cult/REALMS[realm].need;
  const s={hp:Math.floor(c.hp*rm*(1+p*.35)),atk:Math.floor(c.atk*rm*(1+p*.45)),def:Math.floor(c.def*rm*(1+p*.3)),speed:Math.floor(c.speed*rm*(1+p*.25))};
  if(extra){s.hp+=extra.hp||0;s.atk+=extra.atk||0;s.def+=extra.def||0;s.speed+=extra.speed||0}
  return s;
}
function stats(){return statsOf(state.cls,state.realm,state.cultivation,equipBonus())}
/* 战力 = (基础数值 + 法宝属性) × 修为增幅 × 道心/连胜加成；无上限 */
function powerMul(){return (1+state.cultivation/Math.max(1,maxCult())*.5)*(1+state.dao/100*.3+state.streak*.015)}
function calcPower(){
  const s=stats();
  return Math.floor((s.hp+s.atk*2+s.def*1.5+s.speed*3)*powerMul());
}
function powerOf(cls,realm,cult,dao,equip){
  const e=equipBonus(equip);
  const s=statsOf(cls,realm,cult,e);
  const m=(1+cult/Math.max(1,REALMS[realm].need)*.5)*(1+(dao||0)/100*.3);
  return Math.floor((s.hp+s.atk*2+s.def*1.5+s.speed*3)*m);
}
function log(msg,type=""){const el=document.createElement("div");el.className=type;el.textContent=msg;$("battleLog").prepend(el);while($("battleLog").children.length>40)$("battleLog").lastChild.remove()}
/* 世界频道消息：带说话人头像，点击头像看资料，长按用户名 @ 点名 */
function chat(msg,tag="系统",npc){
  const el=document.createElement("div");
  const head=npc
    ? `<span class="cuser" data-npc="${npc.id}" title="点击看资料 · 长按@"><img class="cav" src="${AVATAR[npc.cls]||AVATAR.monster}" alt=""><b>${esc(npc.name)}</b></span>`
    : `<span class="tag">[${esc(tag)}]</span>`;
  el.innerHTML=`${head} <span class="cmsg">${esc(msg)}</span>`;
  const box=$("worldChat");box.prepend(el);while(box.children.length>60)box.lastChild.remove();
  bindCuser(el);
}
function bindCuser(root){
  root.querySelectorAll(".cuser").forEach(u=>{
    u.addEventListener("click",e=>{e.stopPropagation();openProfile(u.dataset.npc)});
    /* 长按 500ms 触发 @（触屏：防止 iOS 长按选中/弹菜单） */
    u.addEventListener("contextmenu",e=>e.preventDefault());
    let timer=null,done=false;
    const start=e=>{e.preventDefault();timer=setTimeout(()=>{done=true;insertAt(u.querySelector("b").textContent)},500)};
    const clear=()=>{clearTimeout(timer);setTimeout(()=>{done=false},80)};
    u.addEventListener("mousedown",start);
    u.addEventListener("mouseup",clear);
    u.addEventListener("mouseleave",clear);
    u.addEventListener("touchstart",start,{passive:false});
    u.addEventListener("touchend",clear);
  });
}
function insertAt(name){
  const input=$("chatInput");
  if(!input)return;
  input.value=name==="无名散修"?"":`@${name} `;
  input.focus();
  goPage("chat");
}

/* ================= NPC 个体生态 ================= */
function makeNPCList(){
  const list=[],pool=[...NPC_NAMES];
  const ids=Object.keys(CLASSES);
  for(let realm=0;realm<REALMS.length;realm++){
    for(let k=0;k<3;k++){
      const name=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      const need=REALMS[realm].need;
      list.push({id:`n${realm}_${k}`,name,cls:ids[Math.floor(Math.random()*ids.length)],realm,
        cultivation:Math.floor(need*Math.random()*.5),dao:Math.floor(30+Math.random()*50),streak:0,
        gold:Math.floor(500+Math.random()*3000),wins:0,losses:0,busyUntil:0,
        persona:NPC_PERSONA[Math.floor(Math.random()*NPC_PERSONA.length)]});
    }
  }
  return list;
}
function npcStatsOf(npc){return statsOf(npc.cls,npc.realm,npc.cultivation,equipBonus(npcEquipOf(npc)))}
function npcPowerOf(npc){return powerOf(npc.cls,npc.realm,npc.cultivation,npc.dao,npcEquipOf(npc))}
function npcIsBusy(npc){return Date.now()<npc.busyUntil}
/* NPC 法宝：按境界概率生成，点击头像可见/参与战力 */
function npcEquipOf(npc){
  if(npc._eq)return npc._eq;
  const eq={weapon:null,armor:null,acc:null,pants:null,necklace:null,shoes:null};
  const n=1+Math.floor(Math.random()*2); /* 1~2 件 */
  for(let i=0;i<n;i++){
    const slot=EQ_SLOTS[Math.floor(Math.random()*EQ_SLOTS.length)];
    const r=Math.random();
    const rk=r<.5?"white":r<.8?"green":r<.95?"blue":"orange";
    eq[slot.id]=makeArtifact(npc.realm,npc.cls,rk);
  }
  npc._eq=eq;
  return eq;
}
function npcEquipList(npc){return Object.values(npcEquipOf(npc)).filter(Boolean)}

/* AI vs AI 快速结算（与玩家战斗同一套数值规则） */
function autoResolve(npcA,npcB){
  const A=npcStatsOf(npcA),B=npcStatsOf(npcB);
  let pa={hp:A.hp,max:A.hp,atk:A.atk,def:A.def,speed:A.speed,buff:1,guard:0,cd:[0,0,0,0],stun:0};
  let pb={hp:B.hp,max:B.hp,atk:B.atk,def:B.def,speed:B.speed,buff:1,guard:0,cd:[0,0,0,0],stun:0};
  const sa=CLASSES[npcA.cls].skills, sb=CLASSES[npcB.cls].skills;
  const ma=1+npcA.streak*.04+npcA.dao*.002, mb=1+npcB.streak*.04+npcB.dao*.002;
  const dmg=(att,def,sk,mult)=>{
    const hits=sk.type==="double"?2:sk.type==="triple"?3:1;
    let t=0;
    for(let h=0;h<hits;h++){
      let raw=att.atk*(sk.mult||1)*att.buff*mult;
      let d=Math.max(1,Math.floor(raw-def.def*.30));
      if(Math.random()<.12)d=Math.floor(d*1.7);
      if(def.guard>0){d=Math.floor(d*(1-def.guard));def.guard=0}
      t+=d;if(def.hp-t<=0)break;
    }
    return t;
  };
  const pick=(p,sk)=>{
    if(p.hp<p.max*.45){
      const hi=sk.findIndex(s=>s.type==="heal"||s.type==="healhit");
      if(hi>=0&&p.cd[hi]===0)return hi;
    }
    let bi=-1,bv=-1;
    sk.forEach((s,i)=>{if(p.cd[i]>0)return;let v=s.mult||1;if(s.type==="double")v*=.95*2;if(s.type==="triple")v*=.95*3;if(v>bv){bv=v;bi=i}});
    return bi;
  };
  for(let rnd=0;rnd<80;rnd++){
    pa.cd=pa.cd.map(x=>Math.max(0,x-1));pb.cd=pb.cd.map(x=>Math.max(0,x-1));
    if(pa.stun>0)pa.stun--;if(pb.stun>0)pb.stun--;
    const order=pa.speed>=pb.speed?["a","b"]:["b","a"];
    for(const who of order){
      if(pa.hp<=0||pb.hp<=0)break;
      const cur=who==="a"?pa:pb,foe=who==="a"?pb:pa,skl=who==="a"?sa:sb,m=who==="a"?ma:mb;
      if(cur.stun>0)continue;
      const i=pick(cur,skl);if(i<0)continue;
      const sk=skl[i];cur.cd[i]=sk.cd||0;
      if(sk.type==="heal")cur.hp=Math.min(cur.max,cur.hp+Math.floor(cur.max*.25));
      else if(sk.type==="healhit"){cur.hp=Math.min(cur.max,cur.hp+Math.floor(cur.max*.18));foe.hp=Math.max(0,foe.hp-dmg(cur,foe,sk,m))}
      else if(sk.type==="guard")cur.guard=.55;
      else if(sk.type==="buff")cur.buff=1.25;
      else{foe.hp=Math.max(0,foe.hp-dmg(cur,foe,sk,m));if(sk.type==="stun")foe.stun=1}
    }
    if(pa.hp<=0||pb.hp<=0)break;
  }
  if(pa.hp<=0)return "b";
  if(pb.hp<=0)return "a";
  return pa.hp>=pb.hp?"a":"b";
}
/* NPC 战斗结算（胜者涨修为/连胜，败者散功） */
function settleNpcBattle(winner,loser){
  const need=REALMS[winner.realm].need;
  const diff=Math.max(.7,npcPowerOf(loser)/Math.max(1,npcPowerOf(winner)));
  const reward=Math.floor(need*(.28+winner.streak*.02)*Math.min(2,.75+diff*.5));
  winner.cultivation=Math.min(need,winner.cultivation+reward);
  winner.streak++;winner.dao=clamp(winner.dao+Math.ceil(2+winner.streak*.15),0,100);winner.wins++;
  loser.cultivation=0;loser.streak=0;loser.dao=0;loser.losses++;
}
/* NPC 单次行动（修炼/渡劫/挑战） */
function npcAct(npc,now){
  if(now<npc.busyUntil)return;
  const r=REALMS[npc.realm];
  if(npc.cultivation>=r.need&&npc.realm<REALMS.length-1&&Math.random()<.1){
    const chance=clamp(.86-npc.realm*.035+npc.dao*.0015,.45,.95);
    if(Math.random()<chance){
      npc.realm++;npc.cultivation=0;npc.dao=clamp(npc.dao+15,0,100);npc.streak=0;
      chat(`「${npc.name}」渡过九重天劫，踏入${REALMS[npc.realm].name}！`,"天道");
      if(Math.random()<.5)aiChat(npc,"trib");
    }else{npc.cultivation=Math.floor(r.need*.55);npc.dao=clamp(npc.dao-18,0,100);}
    return;
  }
  const roll=Math.random();
  if(roll<.62){
    const gain=Math.floor(r.need*(.006+Math.random()*.012));
    npc.cultivation=Math.min(r.need,npc.cultivation+gain);
    return;
  }
  if(roll<.92){
    const rivals=state.npcList.filter(o=>o!==npc&&o.realm===npc.realm&&now>=o.busyUntil);
    if(rivals.length){
      const target=rivals[Math.floor(Math.random()*rivals.length)];
      const res=autoResolve(npc,target);
      if(res==="a"){settleNpcBattle(npc,target);if(Math.random()<.6)chat(`「${npc.name}」击败「${target.name}」，道行见长。`);if(Math.random()<.4)aiChat(npc,"win",{foe:target.name});}
      else{settleNpcBattle(target,npc);if(Math.random()<.6)chat(`「${target.name}」击败「${npc.name}」，道行见长。`);if(Math.random()<.4)aiChat(npc,"lose",{foe:target.name});}
      npc.busyUntil=now+180000;target.busyUntil=now+180000;
    }
    return;
  }
  /* 静坐感悟，无所事 */
}
function worldTick(){
  const now=Date.now();
  state.npcList.forEach(npc=>{if(Math.random()<.5)npcAct(npc,now)});
  if(Math.random()<.55)randomAIBanter(); /* AI 修士闲谈 */
  /* 在线挂机：每 10 分钟自动获得 1 枚修炼丹 */
  if(now>=state.pillTimer){
    state.pills++;state.pillTimer=now+600000;
    if(state.pills%5===0)chat(`闭关静修，炉中丹成，修炼丹 +5。`,"天机");
  }
  renderRanking();render();
}
function simulateWorld(hours){
  const actions=Math.min(120,Math.floor(hours*2.5));
  const base=Date.now();
  for(let i=0;i<actions;i++){
    state.npcList.forEach(npc=>{if(Math.random()<.8)npcAct(npc,base+i*30000)});
  }
}
function applyOffline(){
  const now=Date.now();
  const elapsed=Math.max(0,(now-state.lastSeen)/1000);
  if(elapsed<60)return;
  const hours=elapsed/3600;
  const pills=Math.min(200,Math.floor(elapsed/600));
  const gold=Math.floor(hours*2);
  state.pills+=pills;state.gold+=gold;
  simulateWorld(hours);
  const h=Math.floor(hours),m=Math.floor((hours-h)*60);
  const msg=`离线 ${h} 小时 ${m} 分：修炼丹 +${pills}，灵石 +${gold}，天机流转、众生各有所获。`;
  log(msg,"system");chat(msg,"天机");
}

/* ================= 法宝 · 野外秘境 · 辅修 ================= */
function canSub(){return state.realm>=5}
function makeArtifact(realm,cls,rk){
  const r=RARITY[rk];
  const slot=EQ_SLOTS[Math.floor(Math.random()*EQ_SLOTS.length)];
  const tn=EQ_TYPE_NAMES[slot.id][Math.floor(Math.random()*EQ_TYPE_NAMES[slot.id].length)];
  const atk=(8+realm*4)*r.mult, def=(6+realm*3)*r.mult, hp=(28+realm*18)*r.mult, speed=(2+realm*1)*r.mult;
  const it={uid:Date.now()+Math.floor(Math.random()*9999),name:`${RARITY_PREFIX[rk]}·${tn}`,rarity:rk,realm,cls,slot:slot.id,atk:0,def:0,hp:0,speed:0,eff:null};
  if(slot.stat==="atk"){it.atk=Math.floor(atk);if(slot.hp)it.hp=Math.floor(hp*slot.hp)}
  if(slot.stat==="def"){it.def=Math.floor(def);it.hp=Math.floor(hp*(slot.hp||.6))}
  if(slot.stat==="speed"){it.speed=Math.floor(speed);it.hp=Math.floor(hp*(slot.hp||.4))}
  /* 橙/红品附带特殊攻击效果 */
  if(rk==="orange"||rk==="red"){
    const pool=RARE_EFF[slot.id]||RARE_EFF.weapon;
    it.eff=pool[rk==="red"?1:0];
  }
  return it;
}
function rollDrop(realm){
  if(Math.random()>.5)return null; /* 50% 掉率 */
  const roll=Math.random()*100;let cum=0,rk="white";
  for(const k in RARITY){cum+=RARITY[k].weight;if(roll<cum){rk=k;break}}
  return makeArtifact(realm,state.cls,rk);
}
function statText(it){const p=[];if(it.atk)p.push(`攻+${it.atk}`);if(it.def)p.push(`防+${it.def}`);if(it.hp)p.push(`血+${it.hp}`);if(it.speed)p.push(`速+${it.speed}`);if(it.eff)p.push(`⚡${it.eff.name}`);return p.join(" ")}
function equipItem(uid){
  const i=state.inv.find(x=>x.uid===uid);if(!i)return;
  if(i.cls!==state.cls){log(`此法宝与你的道途不兼容（需${CLASSES[i.cls].name}）。`,"bad");return}
  const old=state.equip[i.slot];
  if(old)state.inv.push(old);
  state.equip[i.slot]=i;
  state.inv=state.inv.filter(x=>x.uid!==uid);
  log(`已装备【${i.name}】${i.eff?`（特效·${i.eff.name}）`:""}。`,"good");
  render();draw();renderEquip();autosave();
}
function unequipItem(slot){
  const it=state.equip[slot];if(!it)return;
  state.inv.push(it);state.equip[slot]=null;
  log(`已卸下【${it.name}】。`,"system");
  render();draw();renderEquip();autosave();
}
function dropItem(uid){
  state.inv=state.inv.filter(x=>x.uid!==uid);
  log("已丢弃一件法宝。","system");renderEquip();autosave();
}
function renderEquip(){
  const box=$("equipList");if(!box)return;
  const slots=EQ_SLOTS.map(s=>{
    const it=state.equip[s.id];
    if(!it)return `<div class="eq-slot empty"><b>${s.name}</b><span class="muted">未装备</span></div>`;
    const ok=it.cls===state.cls;
    return `<div class="eq-slot" style="border-color:${RARITY[it.rarity].color};box-shadow:0 0 10px ${RARITY[it.rarity].color}44"><b style="color:${RARITY[it.rarity].color}">${s.name} · ${esc(it.name)}</b><span class="muted">${RARITY[it.rarity].name}品 · ${REALMS[it.realm].name}${it.eff?` · 特效·${it.eff.name}`:""}${ok?"":" · 不兼容"}</span><span class="eq-stats">${statText(it)}</span><button data-unequip="${s.id}">卸下</button></div>`;
  }).join("");
  const inv=state.inv.length?state.inv.map(it=>
    `<div class="eq-item" style="border-color:${RARITY[it.rarity].color}"><b style="color:${RARITY[it.rarity].color}">${esc(it.name)}</b><span class="muted">${RARITY[it.rarity].name}品 · ${REALMS[it.realm].name} · ${CLASSES[it.cls].name}${it.eff?` · 特效·${it.eff.name}`:""}</span><span class="eq-stats">${statText(it)}</span><div class="eq-btns"><button data-equip="${it.uid}">装备</button><button data-drop="${it.uid}">丢弃</button></div></div>`).join("")
    :`<div class="muted">背包空空，去野外秘境猎杀妖兽吧。</div>`;
  box.innerHTML=`<div class="eq-slots">${slots}</div><div class="eq-title">背包（${state.inv.length}）</div><div class="eq-inv">${inv}</div>`;
  box.querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>equipItem(Number(b.dataset.equip)));
  box.querySelectorAll("[data-unequip]").forEach(b=>b.onclick=()=>unequipItem(b.dataset.unequip));
  box.querySelectorAll("[data-drop]").forEach(b=>b.onclick=()=>dropItem(Number(b.dataset.drop)));
}
function wildMonster(realm){
  const keys=Object.keys(CLASSES);
  const cls=keys[Math.floor(Math.random()*keys.length)];
  /* 妖兽修为严格低于玩家进度（玩家X% → 妖兽约 X*(0.5~0.8)-5%），始终可刷 */
  const pProgress=clamp(state.cultivation/Math.max(1,maxCult()),0,1);
  const mp=clamp(pProgress*(.5+Math.random()*.3)-.05,.05,.9);
  const cult=Math.floor(REALMS[realm].need*mp);
  const s=statsOf(cls,realm,cult),sc=.82; /* 妖兽属性略弱于同境界修士 */
  const name=MONSTER_NAMES[realm][Math.floor(Math.random()*MONSTER_NAMES[realm].length)];
  return {id:"wild_"+Date.now(),name,cls,realm,cultivation:cult,dao:0,streak:0,gold:0,wins:0,losses:0,busyUntil:0,isMonster:true,
    hp:Math.floor(s.hp*sc),atk:Math.floor(s.atk*sc),def:Math.floor(s.def*sc),speed:Math.floor(s.speed*sc),
    power:Math.floor((s.hp+s.atk*2+s.def*1.5+s.speed*3)*sc)};
}
function startWildBattle(realm){
  if(state.battle)return;
  if(realm>state.realm){log("境界不足，无法进入该秘境。","bad");return}
  if(!state.classLocked){log("请先选定主修道途，再入秘境。","bad");return}
  const m=wildMonster(realm);
  const e={npcId:m.id,name:m.name,cls:m.cls,avatarCls:"monster",isMonster:true,realm:m.realm,power:m.power,maxHp:m.hp,hp:m.hp,atk:m.atk,def:m.def,speed:m.speed,guard:0,buff:1,stun:0};
  openBattle(e,"wild");
  $("battleTitle").textContent="荒野秘境 · 猎杀";
  log(`你踏入${MAP_NAMES[realm]}，遭遇【${m.name}】（${REALMS[realm].name}妖兽）。`,"system");
}
function openBattle(e,kind){
  const s=stats();
  state.auto=state.autoGlobal; /* 全局自动默认开启，进入战斗即自动施法 */
  state.page="battle";
  state.battle={kind:kind||"pvp",enemy:e,playerHp:s.hp,maxPlayerHp:s.hp,playerAtk:s.atk,playerDef:s.def,playerSpeed:s.speed,
    playerGuard:0,playerBuff:1,playerStun:0,pCds:[0,0,0,0],
    enemyGuard:0,enemyBuff:1,enemyStun:0,eCds:[0,0,0,0],
    slowP:0,slowE:0,over:false,turn:0,round:0,phase:0,order:["P","E"],waiting:false,
    pAct:null,eAct:null,pHit:0,eHit:0};
  $("eName").textContent=e.name;
  $("eClass").textContent=(e.isMonster||e.avatarCls==="monster")?"妖兽":(CLASSES[e.cls]?CLASSES[e.cls].name:"?");
  setAvatar($("eAvatarImg"),e.avatarCls||e.cls);
  $("enemyPower").textContent=fmt(e.power);$("playerPower").textContent=fmt(calcPower());
  $("battleStatus").textContent=kind==="wild"?"猎杀进行中":"生死战进行中";
  $("battleTitle").textContent=kind==="wild"?"荒野秘境 · 猎杀":"青云斗法场";
  const eb=$("battleEyebrow");if(eb)eb.textContent=kind==="wild"?"野外猎杀 · 可掉法宝":"同境界生死战";
  $("challengeBtn").disabled=true;$("retreatBtn").disabled=false;
  goPage("battle");renderAuto();renderSkills();draw();updateBars();beginRound();
}
/* 辅修修炼：消耗修炼丹，辅修修为独立于主修 */
function subCultivate(){
  if(state.battle)return;
  if(!state.subCls){log("尚未开启辅修。","bad");return}
  if(state.pills<=0){log("修炼丹不足。","bad");return}
  if(state.subCult>=100){log("辅修修为已圆满，可点击「辅修突破」突破境界。","system");return}
  state.pills--;
  const gain=Math.floor(3+state.realm*.6);
  state.subCult=Math.min(100,state.subCult+gain);
  questTick("cultivate",1);
  log(`辅修 · ${CLASSES[state.subCls].name}修为 +${gain}（消耗修炼丹×1）。`,"system");
  render();draw();autosave();
}
function chooseSub(cls){
  if(cls===state.cls)return;
  if(!canSub())return;
  state.subCls=cls;state.subCult=0;state.subLevel=1;
  log(`你开启了辅修道途：${CLASSES[cls].name}。辅修修为独立，不影响主修。`,"good");
  chat(`「无名散修」返虚有成，兼修${CLASSES[cls].name}之道。`,"天道");
  render();draw();autosave();
}
function renderSub(){
  const box=$("subBox");if(!box)return;
  if(!canSub()){
    box.innerHTML=`<div class="muted">达到 <b style="color:${REALM_COLOR[5]}">返虚</b> 境可开启辅修道途。</div>`;
    return;
  }
  if(!state.subCls){
    const btns=Object.keys(CLASSES).filter(c=>c!==state.cls).map(c=>`<button class="sub-pick" data-sub="${c}">${CLASSES[c].icon} ${CLASSES[c].name}</button>`).join("");
    box.innerHTML=`<div class="muted">返虚后兼修一道：在主道途之外再择其一。</div><div class="sub-picks">${btns}</div>`;
    box.querySelectorAll(".sub-pick").forEach(b=>b.onclick=()=>chooseSub(b.dataset.sub));
    return;
  }
  const sb=subBonus(),parts=[];
  if(sb.hp)parts.push(`血+${sb.hp}`);if(sb.atk)parts.push(`攻+${sb.atk}`);if(sb.def)parts.push(`防+${sb.def}`);if(sb.speed)parts.push(`速+${sb.speed}`);
  const lv=state.subLevel||1,full=state.subCult>=100,atMax=lv>=subMaxLevel();
  const lvMul=1+(lv-1)*.4;
  const trib=full&&!atMax?`<button id="subTribBtn" class="wide trib" style="margin-top:8px">辅修突破 → 第 ${lv+1} 层（耗丹${2+lv}·灵石${fmt(200+state.realm*300)}）</button>`
    :`<div class="muted" style="margin-top:6px">${atMax?"辅修已达当前境界上限，提升主修大境界后可继续突破。":"辅修修为圆满后即可突破下一层。"}</div>`;
  box.innerHTML=`<div class="sub-active"><b style="color:${REALM_COLOR[5]}">${CLASSES[state.subCls].icon} ${CLASSES[state.subCls].name}（辅修）</b><span class="muted">辅修第 ${lv} 层 · 加成×${lvMul.toFixed(1)} · 加成：${parts.join("，")||"无"}</span></div>
    <div class="bar-label"><span>辅修修为</span><span>${Math.floor(state.subCult)}%</span></div>
    <div class="bar sub"><i style="width:${state.subCult}%"></i></div>
    <button id="subCultivateBtn" class="wide">${full?"辅修修为已圆满，可突破境界":"辅修修炼（耗1丹）"}</button>
    ${trib}`;
  $("subCultivateBtn").onclick=subCultivate;
  const tb=$("subTribBtn");if(tb)tb.onclick=subTribulate;
}
/* ================= 万妖塔（爬塔试炼） ================= */
function towerMaxFloor(){return (state.realm+1)*4}
function towerEnemyOf(floor){
  const realm=Math.floor((floor-1)/4),idx=(floor-1)%4;
  const ckeys=Object.keys(CLASSES),cls=ckeys[Math.floor(Math.random()*ckeys.length)];
  const st=statsOf(cls,realm,Math.floor(REALMS[realm].need*.5));
  const scale=.95+idx*.26+floor*.018;
  return {name:`妖塔·${REALMS[realm].name}妖将`,cls,avatarCls:"monster",isMonster:true,realm,
    power:Math.floor((st.hp+st.atk*2+st.def*1.5+st.speed*3)*scale),
    maxHp:Math.floor(st.hp*scale),hp:Math.floor(st.hp*scale),
    atk:Math.floor(st.atk*scale),def:Math.floor(st.def*scale),speed:Math.max(1,st.speed),
    guard:0,buff:1,stun:0,floor};
}
function startTowerBattle(){
  if(state.battle)return;
  if(!state.classLocked){log("请先选定主修道途，再入万妖塔。","bad");return}
  const maxF=towerMaxFloor();
  if(state.towerFloor>maxF){log(`当前境界最多可挑战到第 ${maxF} 层，渡劫提升境界后再来。`,"bad");return}
  const e=towerEnemyOf(state.towerFloor);
  openBattle(e,"tower");
  $("battleTitle").textContent=`万妖塔 · 第 ${state.towerFloor} 层`;
  if($("battleEyebrow"))$("battleEyebrow").textContent="妖塔试炼 · 逐层登峰";
  log(`你踏入万妖塔第 ${state.towerFloor} 层，妖气扑面而来！`,"system");
}
function renderTower(){
  const box=$("towerBox");if(!box)return;
  const f=state.towerFloor||1,best=state.towerBest||0,maxF=towerMaxFloor();
  const locked=f>maxF;
  box.innerHTML=`<div class="tower-head"><b>第 ${f} 层</b><span class="muted">最佳 ${best} 层</span></div>
    <div class="bar sub" style="margin:8px 0"><i style="width:${Math.min(100,(f/maxF)*100)}%"></i></div>
    <div class="muted">每大境界 4 层 · 当前最高 ${maxF} 层${locked?"（境界不足）":""}</div>
    <button id="towerBtn" class="wide trib" ${locked?"disabled":""}>${locked?"渡劫提升境界后继续挑战":"挑战第 "+f+" 层"}</button>`;
  const tb=$("towerBtn");if(tb)tb.onclick=startTowerBattle;
}
/* ================= 除魔悬赏（每日日常任务） ================= */
function genQuests(){
  const pool=[...QUEST_POOL],picked=[];
  for(let i=0;i<3;i++){if(!pool.length)break;const idx=Math.floor(Math.random()*pool.length);picked.push(pool.splice(idx,1)[0])}
  state.quests=picked.map(q=>({
    type:q.type,name:q.name,desc:q.desc,
    target:q.target+(state.realm>3&&q.type==="pvp"?1:0)+(state.realm>5?1:0),
    prog:0,reward:{gold:350+state.realm*240,pills:2+Math.floor(state.realm/2),gear:Math.random()<.22},done:false,claimed:false
  }));
  state.questDay=new Date().toDateString();
}
function questTick(type,n){
  if(!state.quests||!state.quests.length)return;
  let ch=false;
  state.quests.forEach(q=>{if(!q.done&&!q.claimed&&q.type===type){q.prog=Math.min(q.target,q.prog+n);if(q.prog>=q.target){q.done=true;log(`悬赏达成：【${q.name}】${q.desc}，快去领取奖励！`,"good")}ch=true}});
  if(ch){renderQuest();autosave()}
}
function claimQuest(i){
  const q=state.quests[i];
  if(!q||!q.done||q.claimed)return;
  q.claimed=true;state.stats.quests++;
  state.gold+=q.reward.gold;state.pills+=q.reward.pills;
  log(`领取悬赏：灵石 +${q.reward.gold}，修炼丹 +${q.reward.pills}。`,"good");
  if(q.reward.gear){const it=makeArtifact(state.realm,state.cls,Math.random()<.55?"white":Math.random()<.7?"green":"blue");state.inv.push(it);renderEquip();log(`额外获得法宝【${it.name}】！`,"drop")}
  checkAchievements();renderQuest();render();draw();autosave();
}
function refreshQuests(){genQuests();log("除魔悬赏已刷新。","system");renderQuest();autosave()}
function renderQuest(){
  const box=$("questBox");if(!box)return;
  if(!state.quests||!state.quests.length){box.innerHTML=`<div class="muted">今日悬赏尚未发布。</div>`;return}
  box.innerHTML=state.quests.map((q,i)=>{
    const pct=Math.min(100,Math.floor(q.prog/q.target*100));
    return `<div class="quest-item">
      <div class="q-title"><b style="color:${q.done?"#9fe8a0":"var(--gold)"}">${q.done?"✓ ":""}${q.name}</b> · ${q.desc} ×${q.target}</div>
      <div class="q-prog">进度 ${q.prog}/${q.target} · 奖励：灵石+${q.reward.gold}、丹+${q.reward.pills}${q.reward.gear?"、法宝":""}</div>
      <div class="q-bar"><i style="width:${pct}%"></i></div>
      ${q.done&&!q.claimed?`<button class="claim wide" data-qi="${i}">领取奖励</button>`:q.claimed?`<div class="muted" style="text-align:center;margin-top:6px">已领取</div>`:""}
    </div>`;
  }).join("")+`<button id="refreshQuestBtn" class="wide">刷新悬赏</button>`;
  box.querySelectorAll("[data-qi]").forEach(b=>b.onclick=()=>claimQuest(Number(b.dataset.qi)));
  const rb=$("refreshQuestBtn");if(rb)rb.onclick=refreshQuests;
}
/* ================= 成就体系 ================= */
function checkAchievements(){
  if(!Array.isArray(state.achievements))state.achievements=[];
  const st=state.stats||{};
  const all=[...state.inv,state.equip.weapon,state.equip.armor,state.equip.acc].filter(Boolean);
  const cond={
    first_win:(st.wins||0)>=1,win_5:state.streak>=5,realm_3:state.realm>=2,realm_6:state.realm>=5,realm_9:state.realm>=8,
    wild_10:(st.wild||0)>=10,gear_red:all.some(it=>it.rarity==="red"),gear_5:all.length>=5,
    tower_4:(state.towerBest||0)>=4,tower_12:(state.towerBest||0)>=12,sub_3:(state.subLevel||1)>=3,
    quest_5:(st.quests||0)>=5,auto_win:(st.auto||0)>=1,gold_50k:state.gold>=50000
  };
  let fresh=false;
  ACHIEVEMENTS.forEach(a=>{
    if(!state.achievements.includes(a.id)&&cond[a.id]){
      state.achievements.push(a.id);state.gold+=300;
      log(`成就达成：【${a.name}】${a.desc}（灵石+300）`,"good");
      chat(`「无名散修」达成成就：${a.name}`,"天道");
      fresh=true;
    }
  });
  if(fresh){renderAchieve();render();draw();autosave()}
}
function renderAchieve(){
  const box=$("achieveBox");if(!box)return;
  const done=state.achievements||[];
  box.innerHTML=ACHIEVEMENTS.map(a=>{
    const d=done.includes(a.id);
    return `<div class="achieve-item ${d?"done":""}"><span class="a-icon">${d?a.icon:"◌"}</span><span class="a-name">${a.name}</span><span class="muted">${d?"已达成":a.desc}</span></div>`;
  }).join("")+`<div class="achieve-count">已达成 ${done.length} / ${ACHIEVEMENTS.length}</div>`;
}
/* ============ 全页面导航（每个选项=一个全新页面） ============ */
const PAGES=["home","battle","sub","equip","wild","tower","quest","achieve","rank","settings","chat","profile"];
function goPage(key){
  if(!PAGES.includes(key))return;
  state.page=key;
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const el=$("page_"+key);
  if(el)el.classList.add("active");
  document.querySelectorAll(".dock-btn[data-page]").forEach(b=>{
    b.classList.toggle("active",b.dataset.page===key);
  });
  /* 进入对应页面时即时渲染 */
  if(key==="battle"){renderSkills();updateBars();draw();}
  if(key==="equip")renderEquip();
  if(key==="rank")renderRanking();
  if(key==="wild")renderWild();
  if(key==="tower")renderTower();
  if(key==="quest")renderQuest();
  if(key==="sub")renderSub();
  if(key==="achieve")renderAchieve();
  if(key==="settings")renderSettings();
  if(key==="chat"){const ci=$("chatInput");if(ci)setTimeout(()=>ci.focus(),80)}
  if(key==="profile")renderProfile();
}
function setupPages(){
  document.querySelectorAll("[data-page]").forEach(b=>{
    b.onclick=()=>goPage(b.dataset.page);
  });
  /* 战斗页头像：点击查看资料 */
  const pA=$("pAvatarImg");if(pA)pA.onclick=()=>{if(state.battle)return;openProfile("player")};
  const eA=$("eAvatarImg");
  if(eA)eA.onclick=()=>{
    if(!state.battle||state.battle.over)return;
    const e=state.battle.enemy;
    if(e&&e.npcId)openProfile(e.npcId);
  };
}
/* 战斗页面按钮：进入斗法场 / 返回修炼台 */
function enterArena(){goPage("battle");renderSkills();draw()}
function exitArena(){if(!state.battle)goPage("home")}
/* 主画面刷新：战斗进行中强制显示战斗页 */
function updateMainView(){
  const b=state.battle;
  if(b&&!b.over){goPage("battle");return}
}
/* ============ 设置面板 ============ */
function renderSettings(){
  const box=$("settingsBox");if(!box)return;
  const s=state;
  box.innerHTML=`
    <div class="setting-row"><div><div class="s-name">全程自动施法</div><div class="s-desc">进入战斗即自动选技能，无需反复点开关</div></div><label class="toggle"><input type="checkbox" id="setAuto" ${s.autoGlobal?"checked":""}><span class="slider"></span></label></div>
    <div class="setting-row"><div><div class="s-name">自动续战挂机</div><div class="s-desc">野外/万妖塔胜利后自动开下一场</div></div><label class="toggle"><input type="checkbox" id="setCont" ${s.autoContinue?"checked":""}><span class="slider"></span></label></div>
    <div class="setting-row"><div><div class="s-name">战斗震屏特效</div><div class="s-desc">受击震屏开关</div></div><label class="toggle"><input type="checkbox" id="setShake" ${s.fxShake===false?"":"checked"}><span class="slider"></span></label></div>
    <div class="set-hint">修改即时生效并自动存档</div>
  `;
  const sa=$("setAuto");if(sa)sa.onchange=()=>{s.autoGlobal=sa.checked;s.auto=s.autoGlobal;renderAuto();autosave()};
  const sc=$("setCont");if(sc)sc.onchange=()=>{s.autoContinue=sc.checked;autosave()};
  const ss=$("setShake");if(ss)ss.onchange=()=>{s.fxShake=!ss.checked;autosave()};
}
/* ============ 世界频道：玩家发言 + AI 回复 ============ */
function playerSendChat(){
  const input=$("chatInput");if(!input)return;
  const raw=(input.value||"").trim();
  if(!raw)return;
  input.value="";
  chat(raw,"你");
  /* @点名 NPC 搭话 */
  const m=raw.match(/@([^\s，。！？!,]+)/);
  const target=m?state.npcList.find(n=>n.name===m[1]):null;
  if(target){setTimeout(()=>playerTalkTo(target.id),400);return}
  /* 普通发言：随机 NPC 回应 */
  if(Math.random()<.7){
    const free=state.npcList.filter(n=>!npcIsBusy(n));
    if(free.length){
      const n=free[Math.floor(Math.random()*free.length)];
      setTimeout(()=>aiChat(n,"replyPlayer"),700);
      setTimeout(()=>aiChat(n,"idle"),2000);
    }
  }
  autosave();
}
function setupChat(){
  const send=$("chatSend");if(send)send.onclick=playerSendChat;
  const input=$("chatInput");
  if(input)input.addEventListener("keydown",e=>{if(e.key==="Enter")playerSendChat()});
}
function renderWild(){
  const box=$("wildList");if(!box)return;
  box.innerHTML=MAP_NAMES.map((name,i)=>{
    const locked=i>state.realm;
    const btn=locked?`<span class="muted lock">境界不足</span>`:`<button class="wild-btn" data-realm="${i}">巡猎</button>`;
    return `<div class="wild-row"><b style="color:${REALM_COLOR[i]}">${name}</b><span class="muted">${REALMS[i].name}境妖兽</span>${btn}</div>`;
  }).join("");
  box.querySelectorAll(".wild-btn").forEach(b=>b.onclick=()=>startWildBattle(Number(b.dataset.realm)));
}
function applyRealmStyle(){
  const rc=REALM_COLOR[state.realm];
  const rt=$("realmText");if(rt)rt.style.color=rc;
  const pn=$("playerName");if(pn)pn.style.color=rc;
  const av=$("playerAvatar");if(av)av.style.boxShadow=`0 0 18px ${rc}66, inset 0 0 14px ${rc}44`;
  const tt=$("battleTitle");if(tt)tt.style.color=rc;
  document.documentElement.style.setProperty("--realm",rc);
}

/* ================= 匹配与玩家战斗 ================= */
function matchEnemyNPC(){
  const cand=state.npcList.filter(n=>n.realm===state.realm&&!npcIsBusy(n));
  if(!cand.length)return null;
  const myP=calcPower();
  const inBand=cand.filter(n=>{const p=npcPowerOf(n);return p>=myP*.75&&p<=myP*1.5});
  /* 优先匹配不高于玩家战力的对手，新人生存更稳；无则退而求其次 */
  const prefer=inBand.filter(n=>npcPowerOf(n)<=myP*1.0);
  const pool=prefer.length?prefer:(inBand.length?inBand:cand);
  return pool[Math.floor(Math.random()*pool.length)];
}
function startBattle(){startBattleWith(null)}
function startBattleWith(npcId){
  if(state.battle)return;
  if(!state.classLocked){log("请先选定主修道途，再入斗法场。","bad");return}
  const npc=npcId?state.npcList.find(n=>n.id===npcId):matchEnemyNPC();
  if(!npc){log("当前境界暂无空闲对手，稍后再试。","system");return}
  if(npc.realm!==state.realm){log("只能挑战相同大境界的对手。","bad");return}
  const st=npcStatsOf(npc);
  const e={npcId:npc.id,name:npc.name,cls:npc.cls,power:npcPowerOf(npc),maxHp:st.hp,hp:st.hp,atk:st.atk,def:st.def,speed:st.speed,guard:0,buff:1,stun:0};
  npc.busyUntil=Date.now()+120000; /* 玩家战斗期间该 NPC 不参与世界活动 */
  openBattle(e,"pvp");
  log(`匹配成功：${e.name} · ${CLASSES[e.cls].name}，同境界对手。`,"system");
  chat(`「${e.name}」接受了你的生死邀约。`);
}
function beginRound(){
  const b=state.battle;if(!b||b.over)return;
  b.round++;
  b.pCds=b.pCds.map(x=>Math.max(0,x-1));
  b.eCds=b.eCds.map(x=>Math.max(0,x-1));
  /* 回春/生生特效：每回合回复一定比例最大生命 */
  const pe=equippedEff(state.equip),ee=enemyEff(b);
  if(pe.regen){const n=Math.floor(b.maxPlayerHp*pe.regen.val);if(n>0&&b.playerHp<b.maxPlayerHp){b.playerHp=clamp(b.playerHp+n,0,b.maxPlayerHp);addFloat("+"+n,true);log(`⚡${pe.regen.name}生效：回复 ${n} 点生命。`,"good")}}
  if(ee.regen){const n=Math.floor(b.enemy.maxHp*ee.regen.val);if(n>0&&b.enemy.hp<b.enemy.maxHp){b.enemy.hp=clamp(b.enemy.hp+n,0,b.enemy.maxHp)}}
  const ps=b.playerSpeed*(b.slowP?.72:1), es=b.enemy.speed*(b.slowE?.72:1);
  const first=ps>=es?"P":"E";
  b.order=[first,first==="P"?"E":"P"];
  b.phase=0;
  $("battleStatus").textContent=`生死战 · 第 ${b.round} 回合`;
  log(`—— 第 ${b.round} 回合 ——`,"round");
  stepTurn();
}
function stepTurn(){
  const b=state.battle;if(!b||b.over)return;
  if(b.phase>=2){beginRound();return}
  const who=b.order[b.phase];
  b.phase++;
  if(who==="P"){
    if(b.playerStun>0){b.playerStun=0;log("你被眩晕，本回合无法行动。","bad");setTimeout(()=>stepTurn(),450);return}
    b.waiting=true;renderSkills();draw();
    if(state.auto)setTimeout(autoStep,550); /* 自动施法节奏 */
  }else{
    b.waiting=false;renderSkills();
    setTimeout(enemyAct,600);
  }
}
function computeDamage(aStats,dStats,sk,mult,aEff,dEff){
  const hits=sk.type==="double"?2:sk.type==="triple"?3:1;
  let total=0,crit=false,dodged=false,armpen=false,critx=false;
  aEff=aEff||{};dEff=dEff||{};
  if(dEff.dodge&&Math.random()<dEff.dodge)return {total:0,crit:false,dodged:true,armpen:false,critx:false};
  for(let h=0;h<hits;h++){
    let raw=aStats.atk*(sk.mult||1)*aStats.buff*mult;
    let d=Math.max(1,Math.floor(raw-dStats.def*.30));
    if(aEff.armpen&&Math.random()<aEff.armpen.chance){d=Math.max(1,Math.floor(raw-dStats.def*.30*(1-aEff.armpen.val)));armpen=true}
    if(Math.random()<(aEff.critr||0)+.12){d=Math.floor(d*1.7);crit=true}
    if(aEff.critx&&Math.random()<aEff.critx.chance){d=Math.floor(d*(1+aEff.critx.val));crit=true;critx=true}
    if(dStats.guard>0){d=Math.floor(d*(1-dStats.guard));dStats.guard=0}
    if(dEff.dmgred)d=Math.floor(d*(1-dEff.dmgred.val));
    total+=d;
    if(dStats.hp-total<=0)break;
  }
  return {total,crit,dodged,armpen,critx};
}
/* 聚合已装备法宝的橙色/红色特效 */
function equippedEff(equip){
  const out={};
  Object.values(equip).forEach(it=>{
    if(it&&it.eff){const e=it.eff;if(!out[e.type])out[e.type]={type:e.type,chance:e.chance,val:e.val,name:e.name}}
  });
  return out;
}
/* 战斗敌方（NPC）的特效；妖兽无装备 */
function enemyEff(b){
  if(!b||!b.enemy||b.enemy.isMonster)return {};
  const n=b.enemy.npcId?state.npcList.find(x=>x.id===b.enemy.npcId):null;
  return n?equippedEff(npcEquipOf(n)):{};
}
function playerUseSkill(i){
  const b=state.battle;if(!b||b.over||!b.waiting)return;
  if(b.pCds[i]>0)return;
  b.waiting=false;
  const sk=CLASSES[state.cls].skills[i];
  b.pCds[i]=sk.cd||0;b.turn++;
  const cm=classMultiplier();
  const fxcfg=(SKILL_FX[state.cls]||[])[i]||{c:"#cfe4ff",s:"slash"};
  b.pAct={name:sk.name,color:fxcfg.c,style:fxcfg.s,t:0,idx:i};
  b.eHit=0;
  const eff=equippedEff(state.equip),eEff=enemyEff(b);
  if(sk.type==="heal"){
    const n=Math.floor(b.maxPlayerHp*.25);b.playerHp=clamp(b.playerHp+n,0,b.maxPlayerHp);
    log(`${sk.name}：恢复 ${n} 点生命。`,"good");addFloat("+"+n,true);
    spawnSkillFx({s:"heal",c:"#6fe9a0"},245,235,true);fxRing(245,235,"#6fe9a0");
  }else if(sk.type==="buff"){
    b.playerBuff=1.25;log("暴血丹入体：攻击提升 25%。","good");spawnSkillFx({s:"ward",c:"#ffd76b"},245,235,true);
  }else if(sk.type==="guard"){
    b.playerGuard=.55;log(`${sk.name}：下一次受到的伤害降低 55%。`,"good");spawnSkillFx({s:"ward",c:"#8fd0ff"},245,235,true);
  }else if(sk.type==="counter"){
    const r=computeDamage({atk:b.playerAtk,buff:b.playerBuff},b.enemy,sk,cm,eff,eEff);
    b.enemy.hp=clamp(b.enemy.hp-r.total,0,b.enemy.maxHp);
    b.playerGuard=.35;
    b.eHit=1;
    log(`${sk.name}：造成 ${r.total}${r.crit?"（暴击）":""} 点伤害，并进入护体。${r.armpen?"⚡裂甲触发！":""}${r.critx?"⚡灭世触发！":""}`,"good");
    addFloat("-"+r.total,false,!!(r.armpen||r.critx));state.fx.shake=6;spawnSkillFx(fxcfg,245,235,true);fxHit(r.total,r.crit,655,235,!!(r.armpen||r.critx));
  }else if(sk.type==="healhit"){
    const n=Math.floor(b.maxPlayerHp*.18);b.playerHp=clamp(b.playerHp+n,0,b.maxPlayerHp);
    const r=computeDamage({atk:b.playerAtk,buff:b.playerBuff},b.enemy,sk,cm,eff,eEff);
    b.enemy.hp=clamp(b.enemy.hp-r.total,0,b.enemy.maxHp);
    b.eHit=1;
    log(`${sk.name}：恢复 ${n}，并造成 ${r.total}${r.crit?"（暴击）":""} 点伤害。${r.armpen?"⚡裂甲触发！":""}${r.critx?"⚡灭世触发！":""}`,"good");
    addFloat("-"+r.total,false,!!(r.armpen||r.critx));state.fx.shake=6;spawnSkillFx(fxcfg,245,235,true);fxHeal(245,235);fxHit(r.total,r.crit,655,235,!!(r.armpen||r.critx));
  }else{
    const r=computeDamage({atk:b.playerAtk,buff:b.playerBuff},b.enemy,sk,cm,eff,eEff);
    b.enemy.hp=clamp(b.enemy.hp-r.total,0,b.enemy.maxHp);
    b.eHit=1;
    if(sk.type==="stun"){b.enemyStun=1;fxLightning(655,235)}
    if(sk.type==="slow"){b.slowE=1;fxRing(655,235,"#7fc6ff")}
    const proc=[];if(r.armpen)proc.push(`⚡${eff.armpen.name}触发！无视${Math.round(eff.armpen.val*100)}%防御`);if(r.critx)proc.push(`⚡${eff.critx.name}触发！额外${Math.round(eff.critx.val*100)}%伤害`);
    log(`${sk.name}：造成 ${r.total}${r.crit?"（暴击）":""} 点伤害。${eff.lifesteal?`（汲取${Math.floor(r.total*eff.lifesteal.val)}点生命）`:""}${proc.length?proc.join("，"):""}`,"good");
    if(eff.lifesteal)b.playerHp=clamp(b.playerHp+Math.floor(r.total*eff.lifesteal.val),0,b.maxPlayerHp);
    addFloat("-"+r.total,false,!!(r.armpen||r.critx));state.fx.shake=Math.max(state.fx.shake,6);
    spawnSkillFx(fxcfg,245,235,true);fxHit(r.total,r.crit,655,235,!!(r.armpen||r.critx));
  }
  draw();updateBars();renderSkills();
  if(b.enemy.hp<=0){endBattle(true);return}
  stepTurn();
}
function pickEnemySkill(){
  const b=state.battle,list=CLASSES[b.enemy.cls].skills;
  const avail=list.map((s,i)=>b.eCds[i]===0?i:-1).filter(i=>i>=0);
  if(!avail.length)return -1;
  const hpR=b.enemy.hp/b.enemy.maxHp;
  if(hpR<.3){
    const def=avail.find(i=>list[i].type==="heal"||list[i].type==="healhit"||list[i].type==="guard");
    if(def!==undefined&&Math.random()<.4)return def;
  }
  const ults=avail.filter(i=>list[i].type==="ult"||(list[i].mult||0)>=1.9);
  if(ults.length&&Math.random()<.6)return ults[0];
  const dmg=avail.filter(i=>!["heal","buff","guard"].includes(list[i].type));
  if(dmg.length)return dmg[Math.floor(Math.random()*dmg.length)];
  return avail[Math.floor(Math.random()*avail.length)];
}
function enemyAct(){
  const b=state.battle;if(!b||b.over)return;
  if(b.enemyStun>0){b.enemyStun=0;log(`${b.enemy.name} 被麻痹，无法行动。`,"system");draw();stepTurn();return}
  const list=CLASSES[b.enemy.cls].skills;
  const idx=pickEnemySkill();
  if(idx<0){stepTurn();return}
  const sk=list[idx];b.eCds[idx]=sk.cd||0;b.turn++;
  const fxcfg=(SKILL_FX[b.enemy.cls]||[])[idx]||{c:"#ff8a5b",s:"fireball"};
  b.eAct={name:sk.name,color:fxcfg.c,style:fxcfg.s,t:0,idx};
  b.pHit=0;
  if(sk.type==="heal"){
    const n=Math.floor(b.enemy.maxHp*.25);b.enemy.hp=clamp(b.enemy.hp+n,0,b.enemy.maxHp);
    log(`${b.enemy.name} · ${sk.name}：恢复 ${n} 点生命。`,"system");
    spawnSkillFx({s:"heal",c:"#6fe9a0"},655,235,false);fxRing(655,235,"#6fe9a0");
  }else if(sk.type==="guard"){
    b.enemyGuard=.55;log(`${b.enemy.name} · ${sk.name}：进入减伤状态。`,"system");spawnSkillFx({s:"ward",c:"#8fd0ff"},655,235,false);
  }else if(sk.type==="buff"){
    b.enemyBuff=1.25;log(`${b.enemy.name} · ${sk.name}：攻击提升。`,"system");spawnSkillFx({s:"ward",c:"#ffd76b"},655,235,false);
  }else{
    let mult=1;
    if(sk.type==="double")mult=1.5;
    if(sk.type==="triple")mult=1.8;
    const eEff=enemyEff(b),pEff=equippedEff(state.equip);
    const r=computeDamage({atk:b.enemy.atk,buff:b.enemyBuff},{def:b.playerDef,guard:b.playerGuard,hp:b.playerHp},sk,mult,eEff,pEff);
    b.playerHp=clamp(b.playerHp-r.total,0,b.maxPlayerHp);
    b.pHit=1;
    if(sk.type==="stun"){b.playerStun=1;fxLightning(245,235)}
    if(sk.type==="slow"){b.slowP=1;fxRing(245,235,"#7fc6ff")}
    const dodgeNote=r.dodged?(pEff.dodge?`（⚡${pEff.dodge.name}闪避！）`:"（被闪避）"):"";
    const dmgNote=(!r.dodged&&pEff.dmgred)?`（⚡${pEff.dmgred.name}生效，伤害降低${Math.round(pEff.dmgred.val*100)}%）`:"";
    log(`${b.enemy.name} · ${sk.name} 对你造成 ${r.total}${r.crit?"（暴击）":""} 点伤害。${dodgeNote}${dmgNote}${eEff.lifesteal?`（汲取${Math.floor(r.total*eEff.lifesteal.val)}点生命）`:""}`,"bad");
    if(eEff.lifesteal)b.enemy.hp=clamp(b.enemy.hp+Math.floor(r.total*eEff.lifesteal.val),0,b.enemy.maxHp);
    addFloat("-"+r.total,true,!!(r.armpen||r.critx));state.fx.shake=Math.max(state.fx.shake,5);
    spawnSkillFx(fxcfg,655,235,false);fxHit(r.total,r.crit,245,235,!!(r.armpen||r.critx));
  }
  updateBars();draw();
  if(b.playerHp<=0){endBattle(false);return}
  stepTurn();
}
function updateBars(){
  const b=state.battle;if(!b)return;
  $("playerHp").textContent=`${fmt(b.playerHp)} / ${fmt(b.maxPlayerHp)}`;
  $("enemyHp").textContent=`${fmt(b.enemy.hp)} / ${fmt(b.enemy.maxHp)}`;
  $("playerHpBar").style.width=`${b.playerHp/b.maxPlayerHp*100}%`;
  $("enemyHpBar").style.width=`${b.enemy.hp/b.enemy.maxHp*100}%`;
}
/* 玩家战斗结果 → 结算玩家 + 更新对应 NPC 个体 */
function endBattle(win){
  const b=state.battle;b.over=true;
  state.lastResult=win?"win":"lose";
  const wasAuto=state.auto;state.auto=false;
  $("retreatBtn").disabled=true;$("challengeBtn").disabled=false;
  renderAuto();
  /* ---- 野外猎杀结算：无死亡惩罚，胜则掉落同境界法宝 ---- */
  if(b.kind==="wild"){
    if(win){
      state.stats.wild++;
      const mrealm=b.enemy.realm;
      const need=REALMS[mrealm].need;
      const diff=Math.max(.7,b.enemy.power/Math.max(1,calcPower()));
      const reward=Math.floor(need*(.16+state.streak*.01)*Math.min(2,.75+diff*.5));
      const gold=Math.floor(15+need*.01+reward*.02);
      state.cultivation=Math.min(maxCult(),state.cultivation+reward);
      state.gold+=gold;
      log(`猎杀成功！获得修为 +${fmt(reward)}、灵石 +${gold}。`,"good");
      const drop=rollDrop(mrealm);
      if(drop){state.inv.push(drop);log(`掉落法宝：【${drop.name}】（${RARITY[drop.rarity].name}品 · ${REALMS[mrealm].name}）！`,"drop");chat(`你从${b.enemy.name}身上夺得【${drop.name}】。`,"秘境");renderEquip();}
      else log(`${b.enemy.name}并未掉落法宝。`,"system");
      questTick("hunt",1);
      autoContinueBattle("wild",mrealm);
    }else{
      log(`你被 ${b.enemy.name} 击退，重伤逃回营地（无死亡惩罚）。`,"bad");
    }
    state.battle=null;$("battleStatus").textContent=win?"胜利":"败退";$("enemyPower").textContent="—";
    state.fx.floats=[];updateBarsClear();render();draw();autosave();
    return;
  }
  /* ---- 万妖塔结算：逐层登峰，无死亡惩罚 ---- */
  if(b.kind==="tower"){
    if(win){
      state.stats.tower++;state.stats.auto+=wasAuto?1:0;
      const floor=state.towerFloor;
      state.towerBest=Math.max(state.towerBest||0,floor);
      const reward=Math.floor(maxCult()*.1)+floor*7;
      const gold=40+floor*12;
      state.cultivation=Math.min(maxCult(),state.cultivation+reward);
      state.gold+=gold;
      log(`万妖塔第 ${floor} 层攻克！修为 +${reward}，灵石 +${gold}。`,"good");
      if(floor%4===0){
        const it=makeArtifact(state.realm,state.cls,Math.random()<.45?"white":Math.random()<.6?"green":Math.random()<.7?"blue":"orange");
        state.inv.push(it);renderEquip();
        log(`镇塔之宝！获得法宝 【${it.name}】（${RARITY[it.rarity].name}品）。`,"drop");
      }
      state.towerFloor++;
      questTick("tower",1);
      chat(`你攻克万妖塔第 ${floor} 层，声名远播。`,"天道");
      autoContinueBattle("tower");
    }else{
      log("妖塔凶险，你败退而归（塔内无死亡惩罚，可重整旗鼓再战）。","bad");
    }
    state.battle=null;$("battleStatus").textContent=win?"胜利":"败退";$("enemyPower").textContent="—";
    state.fx.floats=[];updateBarsClear();render();draw();autosave();
    return;
  }
  /* ---- PvP 结算（与 NPC 众生交互） ---- */
  const npc=state.npcList.find(n=>n.id===b.enemy.npcId);
  if(win){
    state.stats.wins++;state.stats.auto+=wasAuto?1:0;
    const diff=Math.max(.7,b.enemy.power/calcPower());
    const need=currentRealm().need;
    const reward=Math.floor(need*(.28+state.streak*.02)*Math.min(2,0.75+diff*.5));
    const gold=Math.floor(25+need*.015+reward*.03);
    const pills=Math.floor(3+Math.random()*3); /* PvP 获胜获得修炼丹 */
    state.cultivation=Math.min(maxCult(),state.cultivation+reward);
    state.streak++;state.dao=clamp(state.dao+Math.ceil(2+state.streak*.15),0,100);state.gold+=gold;state.pills+=pills;
    log(`胜利！获得修为 +${fmt(reward)}、灵石 +${gold}、修炼丹 +${pills}，连胜 ${state.streak}。`,"good");
    chat(`你击败「${b.enemy.name}」，道行大增！`);
    questTick("pvp",1);
    if(npc){npc.cultivation=0;npc.streak=0;npc.dao=0;npc.losses++;if(Math.random()<.7)aiChat(npc,"playerWin")}
    if(state.cultivation>=maxCult() && state.realm<REALMS.length-1)chat(`你的修为已圆满，可以渡劫。`,"天道");
  }else{
    const old=state.cultivation;state.cultivation=0;state.streak=0;state.dao=0;
    log(`你在生死战中陨落。本大境界修为 ${fmt(old)} → 0，退回 ${currentRealm().name}·初期。`,"bad");
    chat(`你在生死战中陨落，修为散尽。`);
    if(npc){const need=REALMS[npc.realm].need;const rw=Math.floor(need*(.28+npc.streak*.02)*Math.min(2,.75+(calcPower()/Math.max(1,npcPowerOf(npc)))*.5));npc.cultivation=Math.min(need,npc.cultivation+rw);npc.streak++;npc.dao=clamp(npc.dao+Math.ceil(2+npc.streak*.15),0,100);npc.wins++;}
    showDeath();
  }
  state.battle=null;$("battleStatus").textContent=win?"胜利":"神魂寂灭";$("enemyPower").textContent="—";
  state.fx.floats=[];
  updateBarsClear();render();draw();autosave();
}
function updateBarsClear(){$("playerHp").textContent="—";$("enemyHp").textContent="—";$("playerHpBar").style.width="0%";$("enemyHpBar").style.width="0%"}
function retreat(){
  if(!state.battle||state.battle.over)return;
  endBattle(false);
}
/* ================= 自动战斗（自动攻击/自动施法） ================= */
/* AI 施法决策：返回要施放的技能下标，-1 表示无可施放 */
function autoPickSkill(){
  const b=state.battle;if(!b)return -1;
  const cls=state.cls,list=CLASSES[cls].skills;
  const avail=list.map((s,i)=>b.pCds[i]===0?i:-1).filter(i=>i>=0);
  if(!avail.length)return -1;
  const en=avail.map(i=>({i,s:list[i]}));
  const hpR=b.playerHp/b.maxPlayerHp;
  const find=t=>{const x=en.find(e=>e.s.type===t);return x?x.i:-1};
  /* 1) 濒危：优先治疗/回血重击 */
  if(hpR<.45){
    const h=find("heal");if(h>=0)return h;
    const hh=find("healhit");if(hh>=0)return hh;
  }
  /* 2) 体修/御兽：血量承压时开护盾 */
  if((cls==="body"||cls==="beast")&&hpR<.6){
    const g=find("guard");if(g>=0)return g;
  }
  /* 3) 控制：法修先减速、符修有限度地麻痹（不无限连晕） */
  if(cls==="spell"){const sl=find("slow");if(sl>=0&&!b.slowE)return sl}
  if(cls==="talisman"){
    const st=find("stun");
    if(st>=0&&(b.enemy.hp/b.enemy.maxHp<.35||b.round%3===0))return st;
  }
  /* 4) 丹修：开局挂攻击强化；低血量优先续命回血重击 */
  if(cls==="alchemy"){
    if(b.playerBuff<=1){const bu=find("buff");if(bu>=0)return bu}
    if(hpR<.65){const hh=find("healhit");if(hh>=0)return hh}
  }
  /* 5) 体修：反震攻守兼备优先；遇更快的对手先开金身 */
  if(cls==="body"){
    const cn=find("counter");if(cn>=0)return cn;
    if(b.enemy.speed>b.playerSpeed&&hpR<.85){const g=find("guard");if(g>=0)return g}
  }
  /* 6) 默认：最高等效伤害 */
  let best=en[0],bv=-1;
  en.forEach(x=>{
    let v=x.s.mult||1;
    if(x.s.type==="double")v*=.95*2;
    if(x.s.type==="triple")v*=.95*3;
    if(v>bv){bv=v;best=x}
  });
  return best.i;
}
/* 自动施法一拍：玩家回合自动选技能 */
function autoStep(){
  const b=state.battle;
  if(!b||b.over||!state.auto)return;
  if(!b.waiting)return;
  const i=autoPickSkill();
  if(i<0){state.auto=false;renderAuto();return}
  playerUseSkill(i);
}
function toggleAuto(){
  if(!state.battle||state.battle.over)return;
  /* 本场/全局自动：点击即切换全局偏好并记忆 */
  state.autoGlobal=!state.autoGlobal;
  state.auto=state.autoGlobal;
  if(state.auto){
    log("全程自动已开启：进入战斗自动施法，安全玩法可挂机续战。","system");
    renderAuto();renderSettings();renderSkills();
    setTimeout(autoStep,300);
  }else{
    log("自动已关闭，回到手动操作。","system");
    renderAuto();renderSettings();renderSkills();
  }
  autosave();
}
function renderAuto(){
  const b=state.battle,ab=$("autoBtn");
  if(!ab)return;
  ab.disabled=!b||b.over;
  ab.classList.toggle("active",!!state.autoGlobal);
  ab.textContent=state.autoGlobal?"自动 · 开":"自动 · 关";
}
/* 自动续战：野外/万妖塔胜利后自动开下一场（挂机） */
function autoContinueBattle(kind,realm){
  if(!state.autoContinue||!state.autoGlobal)return;
  if(state.battle&&!state.battle.over)return;
  if(kind==="wild"&&realm<=state.realm){
    log("自动巡猎下一只妖兽……","system");
    setTimeout(()=>startWildBattle(realm),900);
  }else if(kind==="tower"){
    log("继续攀登万妖塔下一层……","system");
    setTimeout(()=>startTowerBattle(),900);
  }
}
/* 安全修炼：消耗修炼丹 */
function safeCultivate(){
  if(state.battle)return;
  if(!state.classLocked){log("请先选定主修道途。","bad");return}
  if(state.pills<=0){log("修炼丹不足：可通过离线挂机或 PvP 获胜获取。","bad");return}
  state.pills--;
  const gain=Math.floor(30*currentRealm().mult);
  state.cultivation=Math.min(maxCult(),state.cultivation+gain);
  state.gold+=5;
  questTick("cultivate",1);
  log(`安全修炼（消耗修炼丹×1）：修为 +${gain}，灵石 +5。`,"system");
  if(state.cultivation>=maxCult()&&state.realm<REALMS.length-1)chat(`你已达到${currentRealm().name}修为圆满，天劫将临。`,"天道");
  render();draw();autosave();
}
function showDeath(){
  const r=currentRealm();
  showModal(`<h2>神魂寂灭</h2><p>你在生死战中败北。<br><b>${r.name}·${smallStage()}</b> → <b>${r.name}·初期</b><br>本境界修为归零、连胜归零、道心归零。<br>已经解锁的大境界不会倒退。</p><button class="primary" onclick="closeModal()">重新修炼</button>`);
}
function tribulation(){
  if(state.cultivation<maxCult()||state.battle||state.realm>=REALMS.length-1)return;
  const r=currentRealm(),next=REALMS[state.realm+1];
  let hp=100,phase=0;
  showModal(`<h2>九重天劫</h2><p id="tribText">天门震动，第一重天雷即将降临……</p><div class="bar" style="margin:18px 0;height:12px"><i id="tribBar" style="width:0%"></i></div><button id="tribAction" class="primary">承受天劫</button>`);
  $("tribAction").onclick=()=>{
    phase++;
    const chance=clamp(.86 - state.realm*.035 + state.dao*.0015, .45, .95);
    const roll=Math.random();
    if(roll>chance){showModal(`<h2>渡劫失败</h2><p>第 ${phase} 重天劫击穿道心。你仍保留 ${r.name} 境界，但本次渡劫失败。</p><button class="primary" onclick="closeModal()">返回修炼</button>`);state.cultivation=Math.floor(maxCult()*.55);state.dao=clamp(state.dao-18,0,100);render();autosave();return}
    hp=phase*100/9;$("tribBar").style.width=`${hp}%`;
    if(phase<9){$("tribText").textContent=`第 ${phase} 重天劫已渡过。下一重天劫威势更盛。`;return}
    state.realm++;state.cultivation=0;state.dao=clamp(state.dao+15,0,100);state.streak=0;
    questTick("trib",1);
    closeModal();showAscension(r,next);
    chat(`恭贺「无名散修」渡过九重天劫，踏入${next.name}！`,"天道通告");
    render();draw();autosave();
  };
}
function showAscension(oldR,nextR){
  showModal(`<div class="ascension"><h2>飞升 · ${nextR.name}</h2><p>九重天雷散去，天门于云海之上开启。</p><div style="font-size:62px;margin:18px">☯</div><p><b>天地异象：太虚仙门</b><br>你已踏入新的大境界。</p><button class="primary" onclick="closeModal()">踏入上界</button></div>`);
}
function showModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
window.closeModal=closeModal;
function addFloat(text,onPlayer,gold){
  state.fx.floats.push({x:onPlayer?245:655,y:235,text,life:34,onPlayer,gold});
}
/* ============ 战斗特效：命中粒子 / 剑气 / 光效 / 暴击 ============ */
function fxSpawn(part){state.fx.parts.push(part)}
function fxBurst(x,y,color,n,spd){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,v=spd*(.5+Math.random()*1.1);
    fxSpawn({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:24+Math.random()*16,max:36,color,size:2+Math.random()*2.5,type:"dot"});
  }
}
function fxSlash(x,y,dirX,color,big){
  fxSpawn({x,y,vx:dirX*4,vy:0,life:18,max:18,color,size:big?6:4,type:"slash",rot:Math.atan2(0,dirX)+Math.PI/2});
}
function fxRing(x,y,color){
  fxSpawn({x,y,vx:0,vy:0,life:16,max:16,color,size:3,type:"ring"});
}
function fxHeal(x,y){
  for(let i=0;i<10;i++)fxSpawn({x:x+ (Math.random()-.5)*40,y:y+(Math.random()-.5)*20,vx:(Math.random()-.5)*.6,vy:-1.2-Math.random(),life:26,max:26,color:"#6fe9a0",size:2,type:"rise"});
}
function fxLightning(x,y){
  for(let i=0;i<5;i++)fxSpawn({x:x+(Math.random()-.5)*70,y:y+(Math.random()-.5)*80,vx:(Math.random()-.5)*1,vy:2+Math.random()*2,life:14,max:14,color:"#cfe8ff",size:2.5,type:"bolt"});
}
function fxBuff(x,y){
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;fxSpawn({x:x+Math.cos(a)*6,y:y+Math.sin(a)*6,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4,life:22,max:22,color:"#ffb36b",size:2.2,type:"dot"})}
}
function fxHit(dmg,crit,targetX,targetY,gold){
  const color=gold?"#ffd76b":(crit?"#ffd76b":"#9fd6ff");
  fxBurst(targetX,targetY,color,gold?26:(crit?22:12),gold?6.5:(crit?6:3.6));
  if(crit||gold)fxRing(targetX,targetY,"#ffd76b");
  if(crit||gold)fxSlash(targetX,targetY,(Math.random()<.5?1:-1),color,true);
  if(gold)fxBurst(targetX,targetY,"#fff2b3",8,3.5);
  state.fx.hit=crit||gold?10:5;
}
/* 立绘缓存：头像/对战建模用 AI 2D 立绘 */
const _imgCache={};
function imgOf(cls){
  if(typeof Image==="undefined")return null; /* 无头测试环境 */
  const key=cls||"monster";
  if(_imgCache[key])return _imgCache[key];
  const im=new Image();
  const src=(typeof AVATAR!=="undefined"&&AVATAR[key])?AVATAR[key]:"assets/monster.png";
  im.src=src;
  _imgCache[key]=im;
  return im;
}
/* 每个技能的专属特效（攻击方脚下/朝向目标爆发） */
function spawnSkillFx(cfg,fromX,fromY,isPlayer){
  const dir=isPlayer?1:-1; /* 玩家朝右打，敌人朝左打 */
  const tx=fromX+dir*150, ty=fromY;
  const c=cfg.c||"#cfe4ff";
  const style=cfg.s||"slash";
  switch(style){
    case "slash": for(let i=0;i<3;i++)fxSlash(tx,ty,dir,c,i===1);break;
    case "twin": fxSlash(tx,ty,dir,c,true);fxSlash(tx,ty-20,dir,c,false);fxSlash(tx,ty+20,dir,c,false);break;
    case "rain": for(let i=0;i<10;i++)fxSpawn({x:fromX+dir*80+(Math.random()-.5)*90,y:fromY-120+Math.random()*40,vx:dir*3.2,vy:3.2,life:26,max:26,color:c,size:2.2,type:"dot"});break;
    case "nova": fxBurst(tx,ty,c,24,5.5);fxRing(tx,ty,c);fxRing(tx,ty,"#ffffff");break;
    case "fireball": for(let i=0;i<8;i++)fxSpawn({x:fromX+dir*30,y:fromY+(Math.random()-.5)*10,vx:dir*(4+Math.random()*2),vy:(Math.random()-.5)*.6,life:22,max:22,color:i%3===0?"#ffe36b":c,size:3+Math.random()*2,type:"dot"});break;
    case "ice": for(let i=0;i<9;i++)fxSpawn({x:tx,y:ty,vx:(Math.random()-.5)*3,vy:1.4+Math.random()*1.6,life:24,max:24,color:"#bfeaff",size:2.5,type:"dot"});fxRing(tx,ty,"#bfeaff");break;
    case "lightning": fxLightning(tx,ty);for(let i=0;i<4;i++)fxSpawn({x:tx,y:ty-40+Math.random()*80,vx:(Math.random()-.5)*1,vy:3,life:14,max:14,color:"#cfe8ff",size:2.4,type:"bolt"});break;
    case "chaos": fxBurst(tx,ty,"#b06bff",30,6);fxBurst(tx,ty,"#ff6bd8",18,4);fxRing(tx,ty,"#b06bff");break;
    case "punch": for(let i=0;i<7;i++)fxSpawn({x:tx,y:ty,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:16,max:16,color:c,size:3,type:"dot"});fxRing(tx,ty,"#ffb36b");break;
    case "shockwave": for(let i=0;i<3;i++)fxRing(tx,ty,c);fxRing(tx,ty,"#ffd76b");break;
    case "quake": for(let i=0;i<16;i++)fxSpawn({x:tx+(Math.random()-.5)*90,y:ty-30+Math.random()*60,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:20,max:20,color:i%2?"#ff8a5b":"#ffe36b",size:3,type:"dot"});break;
    case "bolt": for(let i=0;i<6;i++)fxSpawn({x:tx,y:ty,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:20,max:20,color:c,size:2.6,type:"dot"});fxRing(tx,ty,c);break;
    case "chain": for(let i=0;i<3;i++)fxLightning(tx+i*20,ty+(Math.random()-.5)*40);break;
    case "blast": fxBurst(tx,ty,c,22,5);fxRing(tx,ty,"#ffb36b");break;
    case "seal": for(let i=0;i<5;i++)fxRing(tx,ty,"#b06bff");fxBurst(tx,ty,"#b06bff",10,2);break;
    case "heal": fxHeal(fromX,fromY);fxRing(fromX,fromY,"#6fe9a0");break;
    case "flame": for(let i=0;i<12;i++)fxSpawn({x:tx,y:ty,vx:(Math.random()-.5)*2.4,vy:-2-Math.random()*2,life:22,max:22,color:i%2?"#ff5b3d":"#ffb36b",size:2.6,type:"rise"});break;
    case "pill": fxBurst(tx,ty,c,20,5);fxHeal(tx,ty);break;
    case "divine": fxBurst(fromX,fromY,"#ffe36b",18,3);fxRing(fromX,fromY,"#e7bd6b");fxRing(fromX,fromY,"#ffffff");break;
    case "claw": for(let i=0;i<5;i++)fxSlash(tx+i*14,ty+(Math.random()-.5)*40,dir,c,i===2);break;
    case "pounce": fxBurst(tx,ty,"#7fd6ff",16,4);fxRing(tx,ty,"#7fd6ff");break;
    case "beast": for(let i=0;i<6;i++)fxSlash(tx,ty,dir,i%2?"#ff6b8a":c,false);fxRing(tx,ty,"#ff6b8a");break;
    case "ward": fxRing(fromX,fromY,c);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;fxSpawn({x:fromX+Math.cos(a)*8,y:fromY+Math.sin(a)*8,vx:Math.cos(a)*2,vy:Math.sin(a)*2,life:20,max:20,color:c,size:2,type:"dot"})}break;
    default: fxBurst(tx,ty,c,14,4);break;
  }
}
function fxRenderParticles(ctx,w,h){
  const t=Date.now()*.001;
  for(let i=state.fx.parts.length-1;i>=0;i--){
    const p=state.fx.parts[i];
    p.life--;p.x+=p.vx;p.y+=p.vy;
    if(p.type==="dot"){p.vy+=.05}
    if(p.type==="rise"){p.x+=Math.sin(t*6+i)*.4}
    if(p.life<=0){state.fx.parts.splice(i,1);continue}
    const k=p.life/p.max;
    ctx.globalAlpha=k*.9;
    if(p.type==="ring"){ctx.strokeStyle=p.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,(1-k)*46+8,0,Math.PI*2);ctx.stroke();}
    else if(p.type==="slash"){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=k;ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(26,0);ctx.stroke();ctx.restore();}
    else if(p.type==="bolt"){ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(Math.random()-.5)*26,p.y+22);ctx.stroke();}
    else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*k+0.4,0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
  if(state.fx.hit>0){ctx.fillStyle=`rgba(255,255,255,${state.fx.hit*.014})`;ctx.fillRect(0,0,w,h);state.fx.hit--}
}
/* ================= 天道榜（实时众生） ================= */
function renderRanking(){
  const list=state.npcList.map(n=>({id:n.id,name:n.name,power:npcPowerOf(n),realm:n.realm,cult:n.cultivation,isPlayer:false,wins:n.wins}));
  list.push({id:"player",name:"无名散修",power:calcPower(),realm:state.realm,cult:state.cultivation,isPlayer:true,wins:state.streak});
  list.sort((a,b)=>b.power-a.power);
  const top=list.slice(0,5);
  const pRank=list.findIndex(x=>x.id==="player");
  let html=top.map((x,i)=>{
    const fightBtn=(!x.isPlayer&&x.realm===state.realm&&!state.battle)?`<button class="rank-fight" data-npc="${x.id}">挑战</button>`:"";
    const talkBtn=(!x.isPlayer&&!state.battle)?`<button class="rank-talk" data-npc="${x.id}">搭话</button>`:"";
    return `<div class="rank"><div class="rank-no">${i+1}</div><div class="rank-info"><b ${x.isPlayer?"":"data-npc='"+x.id+"'"} title="${x.isPlayer?"":"点击看资料"}">${esc(x.name)}${x.isPlayer?"（你）":""}</b><span>${REALMS[x.realm].name}·${stageOf(x.cult,x.realm)}${x.isPlayer?"":` · 胜${x.wins}`}</span></div><div class="rank-power">${fmt(x.power)}</div>${talkBtn}${fightBtn}</div>`;
  }).join("");
  if(pRank>=5){
    const x=list[pRank];
    html+=`<div class="rank"><div class="rank-no">${pRank+1}</div><div class="rank-info"><b>无名散修（你）</b><span>${REALMS[x.realm].name}·${stageOf(x.cult,x.realm)}</span></div><div class="rank-power">${fmt(x.power)}</div></div>`;
  }
  /* 同境界可挑战区块：保证玩家始终有明确的挑战目标 */
  const shown=new Set(top.map(t=>t.id));shown.add("player");
  const same=state.npcList.filter(n=>n.realm===state.realm&&!shown.has(n.id)).slice(0,3);
  if(same.length){
    html+=`<div class="rank-sep">同境界 · 可挑战</div>`;
    same.forEach(n=>{
      const btn=state.battle?"":`<button class="rank-fight" data-npc="${n.id}">挑战</button>`;
      const talk=state.battle?"":`<button class="rank-talk" data-npc="${n.id}">搭话</button>`;
      html+=`<div class="rank"><div class="rank-no">邀</div><div class="rank-info"><b data-npc="${n.id}" title="点击看资料">${esc(n.name)}</b><span>${REALMS[n.realm].name}·${stageOf(n.cultivation,n.realm)} · ${fmt(npcPowerOf(n))}</span></div>${talk}${btn}</div>`;
    });
  }
  $("ranking").innerHTML=html;
  $("ranking").querySelectorAll(".rank-fight").forEach(b=>{b.onclick=()=>{if(state.battle)return;startBattleWith(b.dataset.npc)}});
  $("ranking").querySelectorAll(".rank-talk").forEach(b=>{b.onclick=()=>{if(state.battle)return;playerTalkTo(b.dataset.npc)}});
  $("ranking").querySelectorAll(".rank-info b[data-npc]").forEach(b=>{b.onclick=()=>{if(state.battle)return;openProfile(b.dataset.npc)}});
}
/* ================= 道友资料页（点击头像/用户名查看对方属性·修为·法宝） ================= */
function openProfile(npcId){
  if(npcId&&npcId!=="player"){
    const n=state.npcList.find(x=>x.id===npcId);
    if(!n){log("未找到该道友。","bad");return}
    state.profile=n;
  }else{
    state.profile="player";
  }
  goPage("profile");
}
function renderProfile(){
  const box=$("profileBox");if(!box)return;
  const t=state.profile;
  if(!t){box.innerHTML=`<div class="muted">未选择查看对象。</div>`;return}
  if(t==="player"){
    const s=stats(),c=CLASSES[state.cls],r=currentRealm();
    const eqList=Object.values(state.equip).filter(Boolean);
    box.innerHTML=`
      <div class="pf-head"><img src="${AVATAR[state.cls]}" class="pf-av"><div><h3>无名散修 <span style="color:${REALM_COLOR[state.realm]}">· ${r.name}</span></h3>
      <div class="muted">${c.name} · ${smallStage()} · 主修</div></div><div class="pf-power">战力 ${fmt(calcPower())}</div></div>
      <div class="pf-grid">
        <div class="pf-cell"><b>${fmt(s.hp)}</b><span>生命</span></div><div class="pf-cell"><b>${fmt(s.atk)}</b><span>攻击</span></div>
        <div class="pf-cell"><b>${fmt(s.def)}</b><span>防御</span></div><div class="pf-cell"><b>${fmt(s.speed)}</b><span>速度</span></div>
        <div class="pf-cell"><b>${state.dao}</b><span>道心</span></div><div class="pf-cell"><b>${state.streak}</b><span>连胜</span></div>
      </div>
      <div class="pf-sec">法宝（${eqList.length}/6）</div>
      <div class="pf-eq">${eqList.length?eqList.map(it=>`<span class="pf-eq-item" style="border-color:${RARITY[it.rarity].color};color:${RARITY[it.rarity].color}">${esc(it.name)}</span>`).join(""):`<span class="muted">未装备</span>`}</div>
      ${state.subCls?`<div class="pf-sec">辅修 · ${CLASSES[state.subCls].name} 第${state.subLevel}层</div>`:""}`;
    return;
  }
  const n=t,s=npcStatsOf(n),eqs=npcEquipList(n);
  const c=CLASSES[n.cls];
  box.innerHTML=`
    <div class="pf-head"><img src="${AVATAR[n.cls]}" class="pf-av"><div><h3>${esc(n.name)} <span style="color:${REALM_COLOR[n.realm]}">· ${REALMS[n.realm].name}</span></h3>
    <div class="muted">${c.name} · ${stageOf(n.cultivation,n.realm)}${n.persona?` · 性格：${n.persona.tone}`:""}</div></div><div class="pf-power">战力 ${fmt(npcPowerOf(n))}</div></div>
    <div class="pf-grid">
      <div class="pf-cell"><b>${fmt(s.hp)}</b><span>生命</span></div><div class="pf-cell"><b>${fmt(s.atk)}</b><span>攻击</span></div>
      <div class="pf-cell"><b>${fmt(s.def)}</b><span>防御</span></div><div class="pf-cell"><b>${fmt(s.speed)}</b><span>速度</span></div>
      <div class="pf-cell"><b>${Math.floor(n.dao||50)}</b><span>道心</span></div><div class="pf-cell"><b>${n.streak||0}</b><span>连胜</span></div>
    </div>
    <div class="pf-sec">法宝（${eqs.length}/6）</div>
    <div class="pf-eq">${eqs.length?eqs.map(it=>`<span class="pf-eq-item" style="border-color:${RARITY[it.rarity].color};color:${RARITY[it.rarity].color}" title="${esc(statText(it))}">${esc(it.name)}</span>`).join(""):`<span class="muted">无</span>`}</div>
    <div class="pf-sec">战绩</div>
    <div class="muted" style="padding:0 4px 8px">累计胜场 ${n.wins||0} 场 · 修炼中</div>
    <button class="wide" style="margin-top:8px" onclick="if(state.battle){}else{playerTalkTo('${n.id}')}">跟 TA 搭话</button>`;
}
/* ================= 画面绘制 ================= */
function draw(){
  const cv=$("battleCanvas"),ctx=cv.getContext("2d"),w=cv.width,h=cv.height;
  const t=Date.now()*.001;
  ctx.save();
  if(state.fx.shake>.3){const s=state.fx.shake;ctx.translate((Math.random()-.5)*s,(Math.random()-.5)*s)}
  /* 星云背景 */
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,"#151f38");g.addColorStop(.5,"#0c1324");g.addColorStop(1,"#070a13");
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  /* 星云光晕 */
  let rg=ctx.createRadialGradient(w*.22,h*.18,10,w*.22,h*.18,240);
  rg.addColorStop(0,"rgba(112,140,255,.22)");rg.addColorStop(1,"rgba(112,140,255,0)");
  ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
  rg=ctx.createRadialGradient(w*.82,h*.3,10,w*.82,h*.3,260);
  rg.addColorStop(0,"rgba(231,120,180,.16)");rg.addColorStop(1,"rgba(231,120,180,0)");
  ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
  /* 漂浮星点 */
  for(let i=0;i<26;i++){
    const sx=(i*167+t*(6+i%3))%(w+40)-20, sy=((i*311)+(i%5)*13)%h;
    ctx.globalAlpha=.25+(i%4)*.12;
    ctx.fillStyle=i%7===0?"#f7dfa0":"#cdd6e4";
    ctx.fillRect(sx,sy,1.6,1.6);
  }
  ctx.globalAlpha=1;
  /* 中央法阵光晕 */
  ctx.fillStyle="rgba(231,189,107,.10)";ctx.beginPath();ctx.arc(w*.5,120,86+Math.sin(t)*6,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(231,189,107,.16)";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(w*.5,120,86+Math.sin(t)*6,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(w*.5,120,116+Math.cos(t)*5,0,Math.PI*2);ctx.stroke();
  /* 地面法台 */
  ctx.strokeStyle="#3a4a6a";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w/2,h*.68,340,76,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="rgba(231,189,107,.18)";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(w/2,h*.68,318,70,0,0,Math.PI*2);ctx.stroke();
  /* 远山剪影（战斗场景背景） */
  ctx.fillStyle="#0b1220";
  ctx.beginPath();ctx.moveTo(0,h*.62);ctx.lineTo(w*.12,h*.5);ctx.lineTo(w*.26,h*.58);ctx.lineTo(w*.4,h*.48);ctx.lineTo(w*.55,h*.57);ctx.lineTo(w*.7,h*.47);ctx.lineTo(w*.85,h*.56);ctx.lineTo(w,h*.5);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
  /* 擂台地面 */
  const gg=ctx.createLinearGradient(0,h*.74,0,h);
  gg.addColorStop(0,"#1b2740");gg.addColorStop(1,"#0a0f1c");
  ctx.fillStyle=gg;ctx.fillRect(0,h*.74,w,h*.26);
  ctx.strokeStyle="rgba(120,150,220,.25)";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(w*.08,h*.74);ctx.lineTo(w*.92,h*.74);ctx.stroke();
  /* 战场光柱 */
  ctx.globalAlpha=.10;const pg=ctx.createLinearGradient(w*.5,h*.3,w*.5,h*.72);
  pg.addColorStop(0,"#8fb6ff");pg.addColorStop(1,"rgba(143,182,255,0)");
  ctx.fillStyle=pg;ctx.fillRect(w*.5-4,h*.3,8,h*.42);ctx.globalAlpha=1;
  if(!state.battle){
    ctx.fillStyle="#e7bd6b";ctx.font="700 26px 'Microsoft YaHei',system-ui";ctx.textAlign="center";ctx.fillText("选择同境界对手，踏入生死斗场",w/2,222);
    ctx.fillStyle="#8f99ae";ctx.font="13px 'Microsoft YaHei',system-ui";ctx.fillText("胜则暴涨 · 死则散功 · 亦可入万妖塔登峰",w/2,252);
  }else{
    const b=state.battle;
    const eR=Math.min(REALMS.length-1,b.enemy.realm||state.realm);
    drawFighter(ctx,250,300,state.cls,CLASSES[state.cls],false,b.playerHp/b.maxPlayerHp,state.realm,b.pAct,b.pHit);
    drawFighter(ctx,650,300,b.enemy.avatarCls||b.enemy.cls,CLASSES[b.enemy.cls],true,b.enemy.hp/b.enemy.maxHp,eR,b.eAct,b.eHit);
    ctx.textAlign="center";ctx.fillStyle="#e7bd6b";ctx.font="900 26px 'Microsoft YaHei',system-ui";ctx.shadowColor="#e7bd6b";ctx.shadowBlur=14;ctx.fillText("VS",w/2,315);ctx.shadowBlur=0;
  }
  state.fx.floats=state.fx.floats.filter(f=>f.life>0);
  state.fx.floats.forEach(f=>{
    ctx.globalAlpha=Math.min(1,f.life/20);
    ctx.fillStyle=f.gold?"#ffd76b":(f.onPlayer?"#75d2a0":"#ee858b");
    ctx.font=f.gold?"900 24px 'Microsoft YaHei',system-ui":"700 20px 'Microsoft YaHei',system-ui";
    ctx.textAlign="center";
    if(f.gold){ctx.shadowColor="#ffd76b";ctx.shadowBlur=16}
    ctx.fillText(f.text,f.x,f.y-(34-f.life)*.9);
    ctx.shadowBlur=0;
    f.life--;
  });
  ctx.globalAlpha=1;
  fxRenderParticles(ctx,w,h);
  ctx.restore();
}
function drawFighter(ctx,x,y,clsKey,c,enemy,hp,realm,act,hit){
  const rc=REALM_COLOR[realm]||"#cdd6e4";
  const now=Date.now();
  let dx=0,flash=0,ang=0,scale=1;
  if(act&&act.t){
    const el=(now-act.t)/1000;
    const dir=enemy?-1:1;
    if(el<.42){ /* 出手前摇后突进 */
      const p=el/.42;
      dx=dir*(p<.55?p*1.6*90:(1-p)*.4*90);
      ang=-dir*(p<.55?0:Math.sin(p*3))*.08;
    }else if(el<.62){ /* 命中爆发 */
      dx=dir*42;scale=1.04;
    }else{ /* 归位 */
      const p=(el-.62)/.4;
      dx=dir*42*(1-p);scale=1+(.04*(1-p));
    }
  }
  if(hit>0)flash=Math.min(1,hit);
  const sway=Math.sin(now*.002+(enemy?2:0))*.03;
  const bob=Math.sin(now*.004+(enemy?1:0))*3;
  ctx.save();ctx.translate(x+dx,y+bob);
  /* 地面阴影 */
  ctx.globalAlpha=.4;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(0,86,58,13,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  /* 境界灵光环 */
  ctx.strokeStyle=rc;ctx.globalAlpha=.55;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,-8,72+Math.sin(now*.004+(enemy?1:0))*3,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=.22;ctx.beginPath();ctx.arc(0,-8,72,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  /* AI 2D 人物立绘（含换装法袍染色 + 受击/施法高光） */
  const img=imgOf(clsKey||"monster");
  const drawImg=()=>{
    if(img&&img.complete&&img.naturalWidth>0){
      ctx.save();
      ctx.translate(0,-8);
      ctx.rotate(ang+sway);
      ctx.scale(scale,scale);
      if(enemy)ctx.scale(-1,1); /* 敌人朝左 */
      ctx.drawImage(img,-44,-46,88,92);
      if(act&&act.t){ /* 施法灵光罩 */
        const g=ctx.createRadialGradient(0,0,6,0,0,60);
        g.addColorStop(0,act.color+"88");g.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,60,0,Math.PI*2);ctx.fill();
      }
      if(flash>0){ /* 受击白闪 */
        ctx.globalAlpha=flash*.7;ctx.globalCompositeOperation="source-atop";
        ctx.fillStyle="#ffffff";ctx.beginPath();ctx.arc(0,0,44,0,Math.PI*2);ctx.fill();
        ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
      }
      ctx.restore();
    }else{
      /* 加载中/兜底：风格化小人建模 */
      ctx.save();ctx.translate(0,-8);ctx.rotate(ang);
      ctx.fillStyle=enemy?"#743642":"#3b587a";ctx.beginPath();ctx.arc(0,-34,22,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#e7d8c2";ctx.beginPath();ctx.arc(0,-40,12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=enemy?"#7a3b4a":"#3f5f86";ctx.fillRect(-16,-12,32,44);
      ctx.fillStyle="#dce5f3";ctx.font="bold 20px system-ui";ctx.textAlign="center";ctx.fillText(c.icon,0,-32);
      ctx.restore();
    }
  };
  drawImg();
  ctx.globalAlpha=1;
  /* 技能名飘字（施法瞬间） */
  if(act&&act.t&&(now-act.t)<900){
    const el=(now-act.t)/1000;
    ctx.globalAlpha=1-el*1.1;ctx.fillStyle=act.color;ctx.font="800 19px 'Microsoft YaHei',system-ui";ctx.textAlign="center";
    ctx.fillText(act.name,0,-72-el*14);
    ctx.globalAlpha=1;
  }
  /* 血条 + 名字 */
  const bw=120;
  ctx.fillStyle="#080b12";ctx.fillRect(-bw/2,96,bw,10);
  const grad=ctx.createLinearGradient(-bw/2,0,bw/2,0);
  grad.addColorStop(0,enemy?"#ff7a80":"#62e0d6");grad.addColorStop(1,enemy?"#e0434f":"#3aa9c8");
  ctx.fillStyle=grad;ctx.fillRect(-bw/2,96,bw*Math.max(0,hp),10);
  ctx.strokeStyle=rc;ctx.globalAlpha=.6;ctx.lineWidth=1;ctx.strokeRect(-bw/2,96,bw,10);ctx.globalAlpha=1;
  ctx.fillStyle="#dbe3f2";ctx.font="700 13px 'Microsoft YaHei',system-ui";ctx.fillText(c.name,0,116);
  ctx.restore();
}
let lastUi=0,lastFx=0;
function loop(t){
  if(t-lastFx>60){lastFx=t;if(state.fx.shake>.3||state.fx.floats.length){state.fx.shake*=.85;draw()}}
  if(t-lastUi>600){lastUi=t;if(state.battle)updateBars();draw()}
  requestAnimationFrame(loop);
}
/* ================= 渲染 ================= */
function renderClasses(){
  $("classList").innerHTML="";
  Object.entries(CLASSES).forEach(([id,c])=>{
    const b=document.createElement("button");b.className="class-btn"+(id===state.cls?" active":"");
    b.innerHTML=`<strong>${c.icon} ${c.name}</strong><span>${c.desc}</span>`;
    b.onclick=()=>{
      if(state.battle)return;
      if(id===state.cls){
        if(!state.classLocked){state.classLocked=true;log(`你选择了道途：${c.name}。此后再无法改修。`,"good");render();draw();autosave();}
        return;
      }
      if(state.classLocked){
        if(canSub()&&!state.subCls)chooseSub(id);
        else log(state.subCls?"主修道途已定，辅修亦已开启。":"主修道途已定，无法改修。返虚后可开启辅修。","bad");
        return;
      }
      state.cls=id;state.classLocked=true;
      log(`你选择了道途：${c.name}。此后再无法改修。`,"good");
      render();draw();renderEquip();autosave();
    };
    $("classList").appendChild(b);
  });
}
function render(){
  const c=CLASSES[state.cls],s=stats(),r=currentRealm(),pct=state.cultivation/r.need*100;
  $("realmText").textContent=`${r.name}·${smallStage()}`;
  $("cultivationText").textContent=`${fmt(state.cultivation)} / ${fmt(r.need)}`;
  $("powerText").textContent=fmt(calcPower());
  $("goldText").textContent=fmt(state.gold);
  $("pillsText").textContent=fmt(state.pills);
  $("playerName").textContent="无名散修";$("pName").textContent="无名散修";$("classText").textContent=c.name;$("pClass").textContent=c.name;
  setAvatar($("playerAvatar"),state.cls);setAvatar($("brandAvatar"),state.cls);setAvatar($("pAvatarImg"),state.cls);
  $("cultivationPct").textContent=`${Math.floor(pct)}%`;$("cultivationBar").style.width=`${pct}%`;
  $("daoText").textContent=state.dao;$("daoBar").style.width=`${state.dao}%`;
  const bonus=Math.round((classMultiplier()-1)*100);
  const hint=$("daoHint");if(hint)hint.textContent=`连胜 ${state.streak} · 战力加成 +${bonus}%（连胜/道心越强，生死战越有优势）。`;
  $("hpStat").textContent=fmt(s.hp);$("atkStat").textContent=fmt(s.atk);$("defStat").textContent=fmt(s.def);$("speedStat").textContent=fmt(s.speed);
  $("tribulationBtn").disabled=!(state.cultivation>=r.need && !state.battle && state.realm<REALMS.length-1);
  $("cultivateBtn").disabled=state.battle;
  renderAuto();
  $("cultivationBar").style.background=REALM_COLOR[state.realm];
  /* 修炼台（主画面·修为进度） */
  const hr=$("homeRealm");if(hr){hr.textContent=`${r.name}·${smallStage()}`;hr.style.color=REALM_COLOR[state.realm]}
  const hs=$("homeStreak");if(hs)hs.textContent=state.streak;
  const hd=$("homeDao");if(hd)hd.textContent=state.dao;
  const hc=$("homeCultText");if(hc)hc.textContent=`修为 ${fmt(state.cultivation)} / ${fmt(r.need)}${state.cultivation>=r.need?" · 圆满，可渡劫":""}`;
  applyRealmStyle();
  $("classList").querySelectorAll(".class-btn").forEach((b,i)=>b.classList.toggle("active",Object.keys(CLASSES)[i]===state.cls));
  renderSkills();renderRanking();renderEquip();renderWild();renderSub();renderTower();renderQuest();renderAchieve();renderSettings();
  updateMainView();
  checkAchievements();
}
function renderSkills(){
  const skills=CLASSES[state.cls].skills,b=state.battle;
  $("skillRow").innerHTML="";
  skills.forEach((s,i)=>{
    const btn=document.createElement("button");btn.className="skill";
    const active=b&&!b.over&&b.waiting;
    const cd=b?b.pCds[i]:0;
    btn.disabled=!active||cd>0||state.auto; /* 自动模式下手动按钮禁用 */
    if(cd>0)btn.classList.add("on-cd");
    btn.innerHTML=`<strong>${i+1}. ${s.name}</strong><span>${state.auto&&active&&cd===0?"自动施法中…":s.desc}</span>${cd>0?`<em class="cd">冷却 ${cd} 回合</em>`:""}`;
    btn.onclick=()=>playerUseSkill(i);
    $("skillRow").appendChild(btn);
  });
}
/* ================= 存档 ================= */
const SAVE_KEY="taixu_save";
function autosave(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({v:8,cls:state.cls,realm:state.realm,cultivation:state.cultivation,dao:state.dao,streak:state.streak,gold:state.gold,pills:state.pills,pillTimer:state.pillTimer,lastSeen:Date.now(),npcList:state.npcList,
    equip:state.equip,inv:state.inv,subCls:state.subCls,subCult:state.subCult,subLevel:state.subLevel,classLocked:state.classLocked,
    towerFloor:state.towerFloor,towerBest:state.towerBest,quests:state.quests,questDay:state.questDay,achievements:state.achievements,stats:state.stats,
    autoGlobal:state.autoGlobal,autoContinue:state.autoContinue}))}catch(e){}
}
function tryLoad(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return false;
    const d=JSON.parse(raw);
    if(d.v!==3&&d.v!==4&&d.v!==5&&d.v!==6&&d.v!==7&&d.v!==8)return false; /* v3~v8 均可读取，缺省字段自动补齐 */
    state.cls=CLASSES[d.cls]?d.cls:"sword";
    state.realm=clamp(d.realm||0,0,REALMS.length-1);
    state.cultivation=clamp(d.cultivation||0,0,REALMS[state.realm].need);
    state.dao=clamp(d.dao||50,0,100);
    state.streak=Math.max(0,d.streak||0);
    state.gold=Math.max(0,d.gold||1000);
    state.pills=Math.max(0,d.pills||0);
    state.autoGlobal=d.autoGlobal!==false;
    state.autoContinue=d.autoContinue!==false;
    state.pillTimer=d.pillTimer||(Date.now()+600000);
    state.lastSeen=d.lastSeen||Date.now();
    state.npcList=Array.isArray(d.npcList)?d.npcList:makeNPCList();
    state.equip=d.equip&&typeof d.equip==="object"&&d.equip.weapon!==undefined?{weapon:d.equip.weapon||null,armor:d.equip.armor||null,acc:d.equip.acc||null,pants:d.equip.pants||null,necklace:d.equip.necklace||null,shoes:d.equip.shoes||null}:{weapon:null,armor:null,acc:null,pants:null,necklace:null,shoes:null};
    state.inv=Array.isArray(d.inv)?d.inv:[];
    state.subCls=CLASSES[d.subCls]?d.subCls:null;
    state.subCult=clamp(d.subCult||0,0,100);
    state.subLevel=clamp(d.subLevel||1,1,REALMS.length);
    state.classLocked=!!d.classLocked;
    state.towerFloor=Math.max(1,Math.floor(d.towerFloor||1));
    state.towerBest=Math.max(0,Math.floor(d.towerBest||0));
    state.quests=Array.isArray(d.quests)?d.quests:[];
    state.questDay=d.questDay||"";
    state.achievements=Array.isArray(d.achievements)?d.achievements:[];
    state.stats=Object.assign({wins:0,wild:0,tower:0,quests:0,auto:0},d.stats||{});
    /* 旧存档兼容：给已有橙/红法宝补上特殊攻击效果 */
    const allItems=[...Object.values(state.equip),...state.inv];
    allItems.forEach(it=>{
      if(it&&(it.rarity==="orange"||it.rarity==="red")&&!it.eff){
        const pool=RARE_EFF[it.slot]||RARE_EFF.weapon;
        it.eff=pool[it.rarity==="red"?1:0];
      }
    });
    return true;
  }catch(e){return false}
}

/* ================= 事件绑定 ================= */
$("challengeBtn").onclick=startBattle;
$("retreatBtn").onclick=retreat;
$("cultivateBtn").onclick=safeCultivate;
$("tribulationBtn").onclick=tribulation;
$("autoBtn").onclick=toggleAuto;
const _bg=$("battleGateBtn");if(_bg)_bg.onclick=enterArena;
const _ex=$("exitBattleBtn");if(_ex)_ex.onclick=()=>{if(!state.battle)exitArena()};
setupPages();setupChat();
renderClasses();render();draw();
/* 动画循环：战斗中持续刷新（驱动战斗特效粒子） */
if(typeof requestAnimationFrame==="function"){
  (function animLoop(){
    requestAnimationFrame(function tick(){
      if((state.battle&&!state.battle.over)||state.fx.parts.length||state.fx.floats.length||state.fx.shake>.3)draw();
      requestAnimationFrame(tick);
    });
  })();
}
/* 调试/测试句柄（GM 控制台与冒烟测试使用） */
if(typeof window!=="undefined"){try{Object.defineProperty(window,"__taixu",{configurable:true,get:()=>state})}catch(e){}}

if(!tryLoad()){
  state.npcList=makeNPCList();
  state.pillTimer=Date.now()+600000;
  state.lastSeen=Date.now();
  genQuests();
  autosave();
}else{
  applyOffline();
  if(state.questDay!==new Date().toDateString()){genQuests();log("新的一日，除魔悬赏已刷新。","system")}
}
render();draw();

/* AI 世界在线推进：每 30 秒 */
setInterval(worldTick,30000);

/* =========================
   GM 控制台（本地开发版）
   注意：纯前端项目不存在真正安全的 GM 权限。
   ========================= */
(function initGM(){
  const GM_PASSWORD = "admin"; // 仅用于本地 Demo，正式联机版必须移到服务器

  const style = document.createElement("style");
  style.textContent = `
    .gm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:50;display:grid;place-items:center;padding:20px}
    .gm-panel{width:min(880px,100%);max-height:90vh;overflow:auto;background:#111722;border:1px solid #59647d;border-radius:18px;box-shadow:0 30px 100px #000;padding:22px}
    .gm-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #293246;padding-bottom:12px;margin-bottom:14px}
    .gm-head h2{font-size:22px;margin:0;color:#e7bd6b}.gm-close{min-width:40px}
    .gm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.gm-field{background:#0b1019;border:1px solid #242d40;border-radius:10px;padding:10px}
    .gm-field label{display:block;color:#8f99ae;font-size:11px;margin-bottom:5px}.gm-field input,.gm-field select,.gm-field textarea{width:100%;background:#171e2b;color:#edf1fa;border:1px solid #303a50;border-radius:7px;padding:8px}
    .gm-section{border-top:1px solid #293246;margin-top:16px;padding-top:15px}.gm-section h3{font-size:13px;color:#c9d0df;margin:0 0 9px}
    .gm-actions{display:flex;flex-wrap:wrap;gap:7px}.gm-actions button{flex:1;min-width:130px}
    .gm-danger{border-color:#713541;background:#341b22}.gm-ok{border-color:#497d69;background:#17352d}
    .gm-status{color:#70d5d1;font-size:11px;min-height:18px;margin-top:9px}
    @media(max-width:700px){.gm-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.textContent = "GM";
  btn.title = "GM 控制台（F10）";
  btn.style.cssText = "position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:10;font-size:11px;padding:7px 10px;opacity:.65;touch-action:manipulation";
  document.body.appendChild(btn);

  let overlay=null;

  function open(){
    if(overlay){overlay.remove();overlay=null;return;}
    overlay=document.createElement("div");
    overlay.className="gm-overlay";
    overlay.innerHTML=`
      <div class="gm-panel">
        <div class="gm-head"><h2>GM 控制台 · 本地开发模式</h2><button class="gm-close">×</button></div>
        <div class="gm-grid">
          <div class="gm-field"><label>境界</label><select id="gmRealm">${REALMS.map((r,i)=>`<option value="${i}">${i+1}. ${r.name}</option>`).join("")}</select></div>
          <div class="gm-field"><label>修为</label><input id="gmCult" type="number" min="0"></div>
          <div class="gm-field"><label>灵石</label><input id="gmGold" type="number" min="0"></div>
          <div class="gm-field"><label>修炼丹</label><input id="gmPills" type="number" min="0"></div>
          <div class="gm-field"><label>道心 0~100</label><input id="gmDao" type="number" min="0" max="100"></div>
          <div class="gm-field"><label>连胜</label><input id="gmStreak" type="number" min="0"></div>
          <div class="gm-field"><label>职业</label><select id="gmClass">${Object.entries(CLASSES).map(([id,c])=>`<option value="${id}">${c.name}</option>`).join("")}</select></div>
        </div>
        <div class="gm-section"><h3>角色控制</h3>
          <div class="gm-actions">
            <button class="gm-ok" data-gm="apply">应用全部数值</button>
            <button data-gm="maxcult">本境界修为圆满</button>
            <button data-gm="heal">满血（战斗中）</button>
            <button data-gm="reset">重置角色</button>
            <button class="gm-danger" data-gm="clearcult">清空当前境界修为</button>
          </div>
        </div>
        <div class="gm-section"><h3>PvP 测试</h3>
          <div class="gm-grid">
            <div class="gm-field"><label>测试对手职业</label><select id="gmEnemyClass">${Object.entries(CLASSES).map(([id,c])=>`<option value="${id}">${c.name}</option>`).join("")}</select></div>
            <div class="gm-field"><label>对手战力倍率</label><input id="gmEnemyRatio" type="number" step="0.1" min="0.1" value="1"></div>
            <div class="gm-field"><label>强制结算</label><select id="gmForce"><option value="win">强制胜利</option><option value="lose">强制死亡</option></select></div>
          </div>
          <div class="gm-actions" style="margin-top:9px">
            <button data-gm="battle">开始指定 PvP</button>
            <button data-gm="force">强制结算当前 PvP</button>
          </div>
        </div>
        <div class="gm-section"><h3>法宝 · 辅修</h3>
          <div class="gm-grid">
            <div class="gm-field"><label>掉落品级</label><select id="gmGearRarity">${Object.entries(RARITY).map(([k,r])=>`<option value="${k}">${r.name}品</option>`).join("")}</select></div>
            <div class="gm-field"><label>掉落境界</label><select id="gmGearRealm">${REALMS.map((r,i)=>`<option value="${i}">${r.name}</option>`).join("")}</select></div>
            <div class="gm-field"><label>辅修方向</label><select id="gmSub"><option value="">无</option>${Object.entries(CLASSES).map(([id,c])=>`<option value="${id}" ${id===state.cls?"disabled":""}>${c.name}</option>`).join("")}</select></div>
            <div class="gm-field"><label>辅修层级</label><input id="gmSubLevel" type="number" min="1" max="${REALMS.length}" value="1"></div>
          </div>
          <div class="gm-actions" style="margin-top:9px">
            <button data-gm="giveGear">发放法宝（入背包）</button>
            <button data-gm="clearGear" class="gm-danger">清空法宝</button>
            <button data-gm="setSub">设置辅修</button>
            <button data-gm="subFull">辅修修为圆满</button>
            <button data-gm="subTrib">辅修突破</button>
          </div>
        </div>
        <div class="gm-section"><h3>玩法 · 万妖塔 / 悬赏 / 成就</h3>
          <div class="gm-grid">
            <div class="gm-field"><label>万妖塔当前层</label><input id="gmTowerFloor" type="number" min="1" value="1"></div>
            <div class="gm-field"><label>万妖塔最佳层</label><input id="gmTowerBest" type="number" min="0" value="0"></div>
          </div>
          <div class="gm-actions" style="margin-top:9px">
            <button data-gm="applyTower">应用万妖塔层数</button>
            <button data-gm="refreshQuest">刷新悬赏</button>
            <button data-gm="resetAchieve" class="gm-danger">清空成就</button>
            <button data-gm="resetStats" class="gm-danger">清空统计</button>
          </div>
        </div>
        <div class="gm-section"><h3>AI 世界</h3>
          <div class="gm-actions">
            <button data-gm="advance">推进世界 ×1天</button>
            <button data-gm="npcTick">众生行动 ×20</button>
            <button data-gm="regen" class="gm-danger">重置众生（重新生成 NPC）</button>
          </div>
          <div class="gm-field" style="margin-top:9px"><label>NPC 列表（当前 ${state.npcList.length} 位）</label><textarea id="gmNpcList" rows="4" readonly>${state.npcList.map(n=>`${n.name}·${REALMS[n.realm].name}·${n.cls}·修为${fmt(n.cultivation)}·战力${fmt(npcPowerOf(n))}`).join("\n")}</textarea></div>
        </div>
        <div class="gm-section"><h3>世界通告</h3>
          <div class="gm-field"><label>公告内容</label><textarea id="gmNotice" rows="2" placeholder="输入全服公告……"></textarea></div>
          <div class="gm-actions" style="margin-top:9px"><button data-gm="notice">发布天道通告</button></div>
        </div>
        <div class="gm-section"><h3>本地存档（自动存档已开启）</h3>
          <div class="gm-actions">
            <button data-gm="save">保存到浏览器</button>
            <button data-gm="load">读取存档</button>
            <button data-gm="clearSave" class="gm-danger">删除存档</button>
          </div>
        </div>
        <div id="gmStatus" class="gm-status"></div>
      </div>`;
    document.body.appendChild(overlay);
    fill();
    overlay.querySelector(".gm-close").onclick=()=>{overlay.remove();overlay=null};

    overlay.addEventListener("click", e=>{
      const action=e.target.dataset.gm;
      if(!action)return;
      try{
        if(action==="apply")apply();
        if(action==="maxcult"){state.cultivation=maxCult();say("已将当前境界修为设为圆满。");render();draw();autosave();}
        if(action==="clearcult"){state.cultivation=0;say("已清空当前境界修为。");render();draw();autosave();}
        if(action==="heal"){if(state.battle){state.battle.playerHp=state.battle.maxPlayerHp;updateBars();draw();say("战斗生命已恢复。")}else say("当前没有进行中的 PvP。");}
        if(action==="reset"){state.realm=0;state.cultivation=0;state.dao=50;state.streak=0;state.gold=1000;state.pills=0;state.cls="sword";state.classLocked=false;state.equip={weapon:null,armor:null,acc:null};state.inv=[];state.subCls=null;state.subCult=0;state.subLevel=1;state.towerFloor=1;state.towerBest=0;state.achievements=[];state.stats={wins:0,wild:0,tower:0,quests:0,auto:0};state.battle=null;$("battleStatus").textContent="等待挑战";$("challengeBtn").disabled=false;$("retreatBtn").disabled=true;updateBarsClear();render();draw();fill();autosave();say("角色已重置。");}
        if(action==="battle")startSpecifiedBattle();
        if(action==="force")forceBattle();
        if(action==="giveGear"){const it=makeArtifact(Math.min(state.realm,Number($("gmGearRealm").value)||0),state.cls,$("gmGearRarity").value);state.inv.push(it);renderEquip();say("已发放法宝："+it.name);}
        if(action==="clearGear"){state.equip={weapon:null,armor:null,acc:null};state.inv=[];renderEquip();render();draw();say("法宝与背包已清空。");}
        if(action==="setSub"){const v=$("gmSub").value;state.subCls=v&&CLASSES[v]?v:null;state.subCult=0;state.subLevel=clamp(Number($("gmSubLevel").value)||1,1,REALMS.length);render();draw();say("辅修已设置："+(state.subCls?`${CLASSES[state.subCls].name} · 第 ${state.subLevel} 层`:"无"));}
        if(action==="subFull"){if(!state.subCls){say("请先设置辅修方向。",true);return}state.subCult=100;render();draw();say("辅修修为已圆满，可点击辅修突破。");}
        if(action==="subTrib"){subTribulate();}
        if(action==="advance"){simulateWorld(24);refreshNpcList();say("已推进世界 1 天。");render();draw();}
        if(action==="npcTick"){for(let i=0;i<20;i++)worldTick();refreshNpcList();say("众生已行动 20 次。");render();draw();}
        if(action==="regen"){state.npcList=makeNPCList();refreshNpcList();say("已重新生成众生。");render();draw();autosave();}
        if(action==="notice")notice();
        if(action==="save")save();
        if(action==="load")load();
        if(action==="clearSave"){localStorage.removeItem(SAVE_KEY);say("本地存档已删除。");}
        if(action==="applyTower"){state.towerFloor=Math.max(1,Math.floor(Number($("gmTowerFloor").value)||1));state.towerBest=Math.max(0,Math.floor(Number($("gmTowerBest").value)||0));render();draw();autosave();say(`万妖塔已设为第 ${state.towerFloor} 层，最佳 ${state.towerBest} 层。`);}
        if(action==="refreshQuest"){refreshQuests();say("悬赏已刷新。");}
        if(action==="resetAchieve"){state.achievements=[];renderAchieve();render();autosave();say("成就已清空。");}
        if(action==="resetStats"){state.stats={wins:0,wild:0,tower:0,quests:0,auto:0};render();autosave();say("统计已清空。");}
      }catch(err){say("操作失败："+err.message,true);}
    });
  }

  function refreshNpcList(){
    const el=$("gmNpcList");if(el)el.value=state.npcList.map(n=>`${n.name}·${REALMS[n.realm].name}·${n.cls}·修为${fmt(n.cultivation)}·战力${fmt(npcPowerOf(n))}`).join("\n");
  }
  function fill(){
    $("gmRealm").value=state.realm;$("gmCult").value=state.cultivation;$("gmGold").value=state.gold;$("gmPills").value=state.pills;
    $("gmDao").value=state.dao;$("gmStreak").value=state.streak;$("gmClass").value=state.cls;
    if($("gmSub"))$("gmSub").value=state.subCls||"";
    if($("gmSubLevel"))$("gmSubLevel").value=state.subLevel||1;
    if($("gmTowerFloor"))$("gmTowerFloor").value=state.towerFloor||1;
    if($("gmTowerBest"))$("gmTowerBest").value=state.towerBest||0;
  }
  function say(msg,bad=false){const el=$("gmStatus");if(el){el.textContent=msg;el.style.color=bad?"#e86b73":"#70d5d1"}}
  function apply(){
    const realm=Number($("gmRealm").value);
    state.realm=clamp(realm,0,REALMS.length-1);
    state.cultivation=clamp(Number($("gmCult").value)||0,0,REALMS[state.realm].need);
    state.gold=Math.max(0,Math.floor(Number($("gmGold").value)||0));
    state.pills=Math.max(0,Math.floor(Number($("gmPills").value)||0));
    state.dao=clamp(Math.floor(Number($("gmDao").value)||0),0,100);
    state.streak=Math.max(0,Math.floor(Number($("gmStreak").value)||0));
    state.cls=$("gmClass").value;
    if($("gmSubLevel"))state.subLevel=clamp(Math.floor(Number($("gmSubLevel").value)||1),1,REALMS.length);
    if(state.battle){state.battle=null;$("battleStatus").textContent="等待挑战";$("challengeBtn").disabled=false;$("retreatBtn").disabled=true;updateBarsClear()}
    render();draw();autosave();say("GM 数值已应用。");
  }
  function startSpecifiedBattle(){
    if(state.battle){say("已经在 PvP 中。",true);return}
    const cand=state.npcList.filter(n=>n.realm===state.realm);
    const base=cand.length?cand[Math.floor(Math.random()*cand.length)]:null;
    if(!base){say("当前境界没有 NPC 可作为对手。",true);return}
    const eid=$("gmEnemyClass").value;
    const ratio=Math.max(.1,Number($("gmEnemyRatio").value)||1);
    const synth={id:base.id,name:base.name,cls:eid,realm:state.realm,cultivation:Math.floor(REALMS[state.realm].need*.4),dao:50,streak:0,gold:0,wins:0,losses:0,busyUntil:0};
    const st=npcStatsOf(synth),s=stats();
    const e={npcId:synth.id,name:synth.name,cls:eid,power:npcPowerOf(synth)*ratio,maxHp:Math.max(10,Math.floor(st.hp*ratio)),hp:Math.max(10,Math.floor(st.hp*ratio)),atk:Math.max(1,Math.floor(st.atk*(.7+ratio*.3))),def:Math.max(1,Math.floor(st.def*(.7+ratio*.3))),speed:st.speed,guard:0,buff:1,stun:0};
    state.battle={enemy:e,playerHp:s.hp,maxPlayerHp:s.hp,playerAtk:s.atk,playerDef:s.def,playerSpeed:s.speed,
      playerGuard:0,playerBuff:1,playerStun:0,pCds:[0,0,0,0],
      enemyGuard:0,enemyBuff:1,enemyStun:0,eCds:[0,0,0,0],
      slowP:0,slowE:0,over:false,turn:0,round:0,phase:0,order:["P","E"],waiting:false};
    $("eName").textContent=e.name;$("eClass").textContent=CLASSES[e.cls].name;$("enemyPower").textContent=fmt(e.power);$("playerPower").textContent=fmt(calcPower());
    $("battleStatus").textContent="GM 指定生死战";$("challengeBtn").disabled=true;$("retreatBtn").disabled=false;
    log(`GM 指定对手：${e.name} · ${CLASSES[e.cls].name} · 战力 ${fmt(e.power)}。`,"system");
    updateBars();draw();renderSkills();say("指定 PvP 已开始。");beginRound();
  }
  function forceBattle(){
    if(!state.battle){say("没有进行中的 PvP。",true);return}
    const mode=$("gmForce").value;
    endBattle(mode==="win");
    say(mode==="win"?"已强制胜利。":"已强制死亡。");
  }
  function notice(){
    const msg=$("gmNotice").value.trim();
    if(!msg){say("公告不能为空。",true);return}
    chat(msg,"GM天道通告");log("GM全服公告："+msg,"system");$("gmNotice").value="";say("公告已发布。");
  }
  function save(){autosave();say("角色与众生数据已保存到本浏览器。");}
  function load(){
    if(tryLoad()){$("battleStatus").textContent="等待挑战";$("challengeBtn").disabled=false;$("retreatBtn").disabled=true;updateBarsClear();render();draw();fill();say("存档已读取。");}
    else say("没有找到有效存档。",true);
  }
  /* 游戏内嵌密码弹窗（Electron 不支持 window.prompt，必须用页面内输入框） */
  function auth(){
    if(overlay)return;
    const m=document.createElement("div");
    m.className="gm-overlay";
    m.style.zIndex="60";
    m.innerHTML=`<div class="gm-panel" style="max-width:380px;text-align:center">
      <div class="gm-head"><h2>GM 控制台</h2><button class="gm-close">×</button></div>
      <p style="color:#8f99ae;margin:4px 0 14px">请输入 GM 密码（本地 Demo）</p>
      <input id="gmPassInput" type="password" autocomplete="off" placeholder="输入密码…" style="width:100%;background:#171e2b;color:#edf1fa;border:1px solid #303a50;border-radius:7px;padding:10px;box-sizing:border-box">
      <div style="margin-top:14px;display:flex;gap:8px;justify-content:center">
        <button class="gm-ok" id="gmPassOk">进入</button>
        <button id="gmPassCancel">取消</button>
      </div>
      <div id="gmPassErr" style="color:#e86b73;font-size:12px;min-height:16px;margin-top:8px"></div>
    </div>`;
    document.body.appendChild(m);
    const input=m.querySelector("#gmPassInput"),err=m.querySelector("#gmPassErr");
    m.querySelector(".gm-close").onclick=()=>m.remove();
    m.querySelector("#gmPassCancel").onclick=()=>m.remove();
    function submit(){
      if(input.value===GM_PASSWORD){m.remove();open();}
      else{err.textContent="GM 密码错误。";input.value="";input.focus();}
    }
    m.querySelector("#gmPassOk").onclick=submit;
    m.addEventListener("keydown",e=>{if(e.key==="Enter")submit();if(e.key==="Escape")m.remove()});
    input.focus();
  }
  btn.onclick=auth;
  window.addEventListener("keydown",e=>{if(e.key==="F10"){e.preventDefault();auth()}});
})();

requestAnimationFrame(loop);
log("欢迎来到太虚问道。你的第一步，是选择一条道途。","system");
chat("天道已开启，生死修行正式开始。","天道");
/* 手机版：暴露存档钩子供切后台时保存 */
window.__taixuSave=autosave;
window.__taixuSetTouch=()=>{if(state.autoGlobal!==false)state.autoGlobal=true;if(state.autoContinue!==false)state.autoContinue=true;autosave()};
})();

/* ============ 手机版补充：切后台自动存档（iOS 触屏） ============ */
document.addEventListener("visibilitychange",()=>{if(document.hidden&&typeof window.__taixuSave==="function"){try{window.__taixuSave()}catch(e){}}});
window.addEventListener("pagehide",()=>{if(typeof window.__taixuSave==="function"){try{window.__taixuSave()}catch(e){}}});
/* 触屏设备默认开启自动战斗与自动续战 */
if("ontouchstart" in window&&typeof window.__taixuSetTouch==="function"){try{window.__taixuSetTouch()}catch(e){}}
