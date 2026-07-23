// @ts-nocheck
/* AUTO-GENERATED from legacy/월하사주.html by scripts/extract-from-legacy.mjs — 직접 수정 금지.
   텍스트를 고치려면 legacy HTML을 고치고 `pnpm extract`를 다시 실행하거나, 이 파일을 소스로 승격한 뒤 배너를 제거할 것. */

import { STEMS, BRANCHES, ELEM, EK, YUKHAP, SAMHAP, WONJIN, HAE, DOHWA } from "./constants";
import { stemIdxOf, branchIdxOf, gzName, isSamhap, isChung, branchRelation, tenGod } from "./relations";
import type { Person } from "./analyze";
import { analyzeTongbyeon } from "./tongbyeon";
import {
  DAY_LOVE,
  DAY_KEY,
  YINYANG_NOTE,
  STRENGTHS,
  CAUTIONS,
  SPOUSE_PALACE,
  SP_KEY,
  TG_GUNGHAP,
  TG_KEY,
  TG_TODAY,
  TG_TODAY_SCORE,
  BR_GUNGHAP,
  BR_KEY,
  REL_KEY,
  BR_TODAY,
  ELEM_EXCESS,
  ELEM_LACK,
  ELEM_COLOR_WORD,
  LUCK_TIPS,
  SAL_DESC,
  LOVER_PROFILE,
  MARRY_STAR_TXT,
  MARRY_PALACE_GOOD,
  MARRY_PALACE_CHUNG,
  MARRY_PALACE_WONJIN,
  MARRY_PALACE_GONGMANG,
  MARRIED_LIFE
} from "@/content";

let SECN = 0;

function sec(no,title,sub,body,key){
  SECN++;
  return `<section class="rp" id="sec-${SECN}"><h2><span class="no">${no}</span>${title}</h2>${sub?`<p class="sub">${sub}</p>`:''}${key?`<div class="key">${key}</div>`:''}${body}</section>`;
}

function paras(t){
  const s=t.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const out=[];
  for(let i=0;i<s.length;i+=2) out.push('<p>'+s.slice(i,i+2).join(' ')+'</p>');
  return out.join('');
}

function tocHTML(html,greet){
  const items=[];
  const re=/<section class="rp" id="(sec-\d+)"><h2><span class="no">(.*?)<\/span>(.*?)<\/h2>/g;
  let m; while((m=re.exec(html))) items.push({id:m[1],no:m[2],title:m[3]});
  return `<section class="rp toc">
    <h2><span class="no">目次</span>풀이의 차례</h2>
    <p class="toc-greet">${greet}</p>
    <ol>${items.map(it=>`<li><a href="#${it.id}"><span class="tno">${it.no}</span><span>${it.title}</span><span class="tdot"></span></a></li>`).join('')}</ol>
  </section>`;
}

function pillarsHTML(A,title){
  const pd=A.r.pillarDetails;
  const cell=(si,bi)=>`<div class="gz">
    <div class="cell e${STEMS[si].e}"><span class="hj">${STEMS[si].hj}</span><span class="kr">${STEMS[si].kr}</span></div>
    <div class="cell e${BRANCHES[bi].e}"><span class="hj">${BRANCHES[bi].hj}</span><span class="kr">${BRANCHES[bi].kr}</span></div></div>`;
  const col=(k,label)=>`<div class="pillar"><div class="pl">${label}</div>${
    k==='hour'&&!A.hourKnown?`<div class="unknown-hour">시간<br>모름</div>`:cell(pd[k].stemIdx,pd[k].branchIdx)}</div>`;
  return `${title?`<h3>${title}</h3>`:''}<div class="pillars">${col('hour','시주')}${col('day','일주')}${col('month','월주')}${col('year','년주')}</div>`;
}

function ohaengHTML(c){
  const max=Math.max(...c,1);
  return `<div class="ohaeng">`+ELEM.map((n,i)=>
    `<div class="ob"><span class="nm">${n}</span><span class="bar"><i class="b${i}" style="width:${c[i]/max*100}%"></i></span><span class="ct">${c[i]}</span></div>`
  ).join('')+`</div>`;
}

function baseChartSec(A){
  const adv=A.r.advanced;
  const T=analyzeTongbyeon(A);
  const strengthKo={strong:'신강(身强) — 기운이 강한 명',weak:'신약(身弱) — 주변의 힘을 빌리는 명',neutral:'중화(中和) — 균형 잡힌 명'}[T.strength.cls];
  const yong=ELEM[T.yongElem];
  return pillarsHTML(A)+ohaengHTML(A.elems)+
    `<div class="gukguk-line">
      <span class="chip">격국 <b>${adv.geukguk}</b></span>
      <span class="chip">${strengthKo}</span>
      <span class="chip">용신 <b>${yong}</b></span>
      ${A.r.gongmang?`<span class="chip">공망 <b>${A.r.gongmang.branchesKo.join('·')}</b></span>`:''}
    </div>
    <p style="margin-top:14px">사주의 중심은 <em>일간(日干)</em> — 태어난 날의 하늘 기운입니다. 당신의 일간은 <strong>${STEMS[A.ds].kr}(${STEMS[A.ds].hj})</strong>이고, 연애의 자리인 배우자궁(일지)에는 <strong>${BRANCHES[A.db].kr}(${BRANCHES[A.db].hj})</strong>가 앉아 있습니다. 이 두 글자가 당신 사랑의 골격입니다.</p>`;
}

const wolunSolarMonth = m=>m+1>12?m+1-12:m+1;

function charms(A){
  const out=new Set();
  for(const k of ['year','month','day','hour']){
    if(k==='hour'&&!A.hourKnown) continue;
    (A.r.sals[k].specialSals||[]).forEach(s=>out.add(s));
  }
  (A.r.advanced.sinsal.gilsin||[]).forEach(s=>out.add(s.endsWith('살')||s.endsWith('인')||s.endsWith('덕')?s:s));
  return [...out];
}

const partnerElem = A=>{const e=STEMS[A.ds].e; return A.sex==='F'?(e+3)%5:(e+2)%5;};

const partnerStars = A=>A.sex==='F'?['정관','편관']:['정재','편재'];

const starName = A=>A.sex==='F'?'관성(官星)':'재성(財星)';

function renderLove(A){
  const ds=A.ds, db=A.db, e=A.elems;
  const maxE=e.indexOf(Math.max(...e)), minE=e.indexOf(Math.min(...e));
  const ch=charms(A);
  const r=A.r;
  let html='';

  html+=sec('第一章','당신의 사주 원국(原局)',
    `${A.y}년 ${A.m}월 ${A.d}일생 · 일주 ${gzName(ds,db)} · ${BRANCHES[r.pillarDetails.year.branchIdx].animal}띠 · ${r.currentAge}세`,
    baseChartSec(A));

  html+=sec('第二章','일간으로 본 당신의 연애 본능','타고난 사랑의 기질',
    paras(DAY_LOVE[ds])+`<p><strong>${YINYANG_NOTE[STEMS[ds].yang?0:1]}</strong></p>`,
    DAY_KEY[ds]);

  html+=sec('第三章','배우자궁이 말하는 사랑의 자리','일지(日支) — 연인이 머무는 방',
    paras(SPOUSE_PALACE[db]),
    SP_KEY[db]);

  html+=sec('第四章','오행의 저울 — 애정 에너지 진단','넘치는 기운과 모자란 기운',
    paras(ELEM_EXCESS[maxE])+paras(ELEM_LACK[minE]),
    `${ELEM[maxE]} 기운은 넘치고 ${ELEM[minE]} 기운은 부족 — 이 저울의 균형이 곧 연애운`);

  const known=ch.filter(c=>SAL_DESC[c]);
  const charmBody = known.length
    ? `<div class="badges">${known.map(c=>`<span class="badge">${c}</span>`).join('')}</div>
       <ul class="pts gold">${known.map(c=>`<li><strong>${c}</strong> — ${SAL_DESC[c]}</li>`).join('')}</ul>
       <p>매력과 귀인의 별이 많다는 것은 사람이 모이고 유혹도 많다는 뜻입니다. 이 별들은 잘 쓰면 인기운, 잘못 쓰면 구설이 됩니다. 마음에 없는 친절을 절제하는 것이 이 별들을 복으로 쓰는 법입니다.`
    : `<p>당신의 원국에는 도화살이나 홍염살 같은 화려한 매력의 별이 강하게 드러나 있지는 않습니다. 이것은 매력이 없다는 뜻이 아니라, 당신의 매력이 <em>첫눈에 반하는 유형이 아니라 알수록 빠져드는 유형</em>이라는 뜻입니다. 스쳐 가는 인연이 적은 대신 한번 맺어진 인연은 깊고 오래갑니다. 당신에게 필요한 것은 더 많은 매력이 아니라 더 많은 "노출 시간" — 사람들과 오래 겪을 수 있는 자리가 곧 연애운의 통로입니다.`;
  html+=sec('第五章','매력 진단 — 당신에게 깃든 별','신살(神殺)로 보는 인연의 별자리',charmBody,
    known.length?`${known.join(' · ')} — 타고난 매력 자산이 있는 사주`:'과시형 매력 대신 스며드는 매력 — 노출 시간이 무기');

  html+=sec('第六章','연애의 강점과 그림자','알고 쓰면 무기, 모르면 덫',
    `<p><strong>당신의 강점 세 가지</strong></p><ul class="pts blue">${STRENGTHS[ds].map(s=>`<li>${s}</li>`).join('')}</ul>
     <p><strong>조심해야 할 그림자 세 가지</strong></p><ul class="pts">${CAUTIONS[ds].map(s=>`<li>${s}</li>`).join('')}</ul>
     <p>강점은 이미 잘 쓰고 계실 것입니다. 운을 바꾸는 것은 언제나 그림자 쪽입니다. 위 세 가지 중 뜨끔한 것 하나만 올해 안에 고쳐도, 다음 인연의 온도가 달라집니다.`);

  /* 올해 세운 — ssaju seyun 사용 */
  const now=new Date(), thisYear=r.currentYear;
  const sy=r.seyun.find(s=>s.year===thisYear);
  const pe=partnerElem(A), stars=partnerStars(A);
  let yHtml='';
  if(sy){
    const yb=branchIdxOf(sy.branch), ys=stemIdxOf(sy.stem);
    const rel=branchRelation(yb,db);
    const hasStar=stars.includes(sy.tenGodStem)||stars.includes(sy.tenGodBranch);
    const relText={
      yukhap:`올해의 지지가 당신의 배우자궁과 <strong>육합</strong>을 이룹니다. 인연이 몸으로 다가오는 해 — 만남이 연애로, 연애가 결실로 이어지기 매우 좋은 흐름입니다.`,
      samhap:`올해의 지지가 당신의 배우자궁과 <strong>삼합</strong>을 이룹니다. 주변의 도움과 자연스러운 자리로 인연이 이어지는, 순풍이 부는 해입니다.`,
      chung:`올해의 지지가 당신의 배우자궁을 <strong>충</strong>합니다. 애정의 자리가 흔들리는 해 — 솔로에게는 뜻밖의 만남이 들이닥치는 해이기도 하고, 커플에게는 관계가 시험대에 오르는 해이기도 합니다. 충은 문이 열리는 소리이기도 하니, 흔들림을 나쁘게만 보지 마세요.`,
      wonjin:`올해의 지지가 당신의 배우자궁과 <strong>원진</strong> 관계입니다. 애정사에 잔 신경전과 오해가 끼기 쉬운 해이니, 확인되지 않은 말은 흘려듣는 지혜가 필요합니다.`,
      hae:`올해의 지지가 당신의 배우자궁과 <strong>해(害)</strong> 관계입니다. 크게 나쁘진 않으나 소소한 엇갈림이 있는 해 — 약속과 연락을 평소보다 한 번 더 챙기면 무난히 지나갑니다.`,
      same:`올해의 지지가 당신의 배우자궁과 같은 글자입니다. 애정의 방에 같은 기운이 겹치는 해로, 기존 관계는 깊어지고 새 인연은 익숙한 공간에서 나타납니다.`,
      none:`올해의 지지와 배우자궁은 무난한 관계입니다. 큰 파도는 없는 대신, 움직인 만큼 만나는 정직한 해입니다.`
    }[rel.k];
    /* 남은 달 — wolun 사용 */
    const remaining=[];
    for(const w of r.wolun){
      const sm=wolunSolarMonth(w.month);
      if(sm<=now.getMonth()+1&&w.month!==12) continue;
      const mb=branchIdxOf(w.branch);
      const mr=branchRelation(mb,db);
      let note=null;
      if(mr.k==='yukhap') note='배우자궁과 육합 — 고백·소개팅·상견례에 길한 달';
      else if(mb===DOHWA[db]) note='도화가 발동하는 달 — 이성운이 눈에 띄게 밝아지는 시기';
      else if(mr.k==='samhap') note='배우자궁과 삼합 — 자연스러운 만남과 진전의 달';
      else if(stars.includes(w.branchTenGod)) note=`${starName(A)}이 흐르는 달 — 인연의 그림자가 어른거리는 시기`;
      else if(mr.k==='chung') note='배우자궁 충 — 감정 기복 주의, 다만 뜻밖의 만남 가능';
      if(note) remaining.push(`<li><strong>${sm}월(${w.monthName.slice(0,2)})</strong> · ${note}</li>`);
    }
    yHtml=sec('第七章',`${thisYear}년 ${sy.ganzhi} ${gzName(ys,yb).slice(0,2)}년의 연애운`,
      `올해의 세운 십성: 천간 ${sy.tenGodStem} · 지지 ${sy.tenGodBranch}`,
      `<p>${relText}</p>
       <p>${hasStar
          ?`더욱이 올해의 세운에는 당신의 <em>배우자별(${starName(A)})</em>이 흐르고 있습니다. 하늘이 애정사의 무대를 미리 깔아 둔 해이니, 들어오는 제안과 소개를 가볍게 거절하지 마세요.`
          :`올해의 세운에 배우자별이 직접 드러나 있지는 않으니, 인연은 요란한 사건보다 조용한 일상 속에서 스며들 것입니다. 아래의 길한 달을 놓치지 않는 것이 중요합니다.`}</p>
       ${remaining.length?`<p><strong>남은 달의 흐름</strong></p><ul class="pts gold">${remaining.join('')}</ul>`:`<p>올해 남은 기간은 잔잔한 흐름입니다. 내년의 큰 흐름을 준비하는 시간으로 쓰세요.</p>`}`,
      REL_KEY[rel.k]);
  }
  html+=yHtml;

  html+=sec('終章','월하노인의 조언','달 아래에서 전하는 마지막 한마디',
    `<p class="prophecy">"${STEMS[ds].kr}(${STEMS[ds].hj})의 사람아, 너의 사랑은 ${['숲처럼 오래 자라고','꽃처럼 섬세하게 피고','태양처럼 뜨겁게 빛나고','촛불처럼 깊게 타오르고','산처럼 묵묵히 지키고','대지처럼 넉넉히 품고','무쇠처럼 곧게 벼려지고','보석처럼 귀하게 빛나고','바다처럼 넓게 흐르고','봄비처럼 다정히 스며드니'][ds]}, 서두르지 않아도 붉은 실은 이미 너의 새끼손가락에 매여 있느니라."</p>
     <p>연애운은 기다리는 사람이 아니라 자신을 가꾸는 사람에게 흘러듭니다. 위에서 짚어 드린 그림자 하나를 다듬고, 길한 달에 한 걸음만 움직이세요. 그 한 걸음의 자리에 월하노인이 실을 당겨 두겠습니다.</p>`);
  return html;
}

function renderGunghap(A,B){
  const tg=tenGod(A.ds,B.ds);
  const br=branchRelation(A.db,B.db);
  const ya=A.r.pillarDetails.year.branchIdx, yb=B.r.pillarDetails.year.branchIdx;
  const zr=branchRelation(ya,yb);
  let score=50;
  score+={'비견':6,'겁재':3,'식신':11,'상관':7,'편재':9,'정재':14,'편관':7,'정관':14,'편인':9,'정인':12}[tg];
  score+={'yukhap':16,'samhap':13,'same':7,'none':4,'hae':-5,'wonjin':-9,'chung':-10}[br.k];
  score+={'yukhap':8,'samhap':6,'same':4,'none':2,'hae':-3,'wonjin':-5,'chung':-5}[zr.k];
  const lackA=A.elems.indexOf(Math.min(...A.elems)), lackB=B.elems.indexOf(Math.min(...B.elems));
  const compAB=B.elems[lackA]>=2, compBA=A.elems[lackB]>=2;
  if(compAB) score+=5; if(compBA) score+=5;
  score=Math.max(8,Math.min(99,score));
  const line= score>=85?'하늘이 미리 이어 둔 인연':score>=70?'노력이 아깝지 않은 좋은 인연':score>=55?'가꾸는 만큼 자라는 인연':score>=40?'서로를 배우게 하는 인연':'다름을 공부해야 하는 인연';

  let html='';
  html+=sec('第一章','두 사람의 사주 원국','나란히 펼쳐 놓은 두 개의 하늘',
    `<div class="duo">
      <div>${pillarsHTML(A,`${A.name} · ${gzName(A.ds,A.db).slice(0,2)}일주`)}</div>
      <div>${pillarsHTML(B,`${B.name} · ${gzName(B.ds,B.db).slice(0,2)}일주`)}</div>
    </div>
    <p style="margin-top:14px">${A.name}님은 <strong>${STEMS[A.ds].kr}(${STEMS[A.ds].hj})</strong> 일간, ${B.name}님은 <strong>${STEMS[B.ds].kr}(${STEMS[B.ds].hj})</strong> 일간입니다. 두 하늘의 기운이 어떻게 만나는지 지금부터 겹쳐 보겠습니다.</p>`);

  html+=sec('第二章','인연의 총점','월하노인의 저울에 올린 두 사람',
    `<div class="score-wrap">
      <div class="score-big">${score}<small> / 100</small></div>
      <div class="gauge"><i style="width:${score}%"></i></div>
      <div class="score-line">"${line}"</div>
    </div>
    <p style="margin-top:14px">이 점수는 일간의 십성 관계, 배우자궁의 합·충, 띠의 조화, 오행의 상호 보완을 모두 저울에 올려 얻은 숫자입니다. 다만 기억하세요 — 궁합은 예언이 아니라 <em>지도</em>입니다. 낮은 점수는 "험한 길"이라는 뜻이지 "가지 말라"는 뜻이 아니며, 험한 길을 함께 걸어 낸 인연이 가장 단단해집니다.</p>`);

  const tgArr=TG_GUNGHAP[tg];
  html+=sec('第三章','마음의 결 — 일간 궁합',`${A.name}에게 ${B.name}은(는) ${tg}의 별`,
    `<p>${tgArr[0]}</p>`+paras(tgArr[1]),
    TG_KEY[tg]);

  html+=sec('第四章','살을 맞대는 인연 — 배우자궁 궁합',
    `${A.name}의 일지 ${BRANCHES[A.db].kr}(${BRANCHES[A.db].hj}) · ${B.name}의 일지 ${BRANCHES[B.db].kr}(${BRANCHES[B.db].hj}) — ${br.label}`,
    paras(BR_GUNGHAP[br.k])+
    `<p>일지는 연애의 살갗이자 결혼 후의 안방입니다. 십성이 "마음이 통하는가"를 본다면, 일지는 "생활이 붙는가"를 봅니다. 두 검사가 다르게 나왔다면 — 마음은 통하는데 생활이 부딪히거나, 그 반대라면 — 잘 맞는 영역을 관계의 중심 무대로 삼으세요.</p>`,
    BR_KEY[br.k]);

  html+=sec('第五章','오행의 상호 보완','서로의 빈 곳을 채워 주는가',
    `<div class="duo">
       <div><h3>${A.name}의 오행</h3>${ohaengHTML(A.elems)}</div>
       <div><h3>${B.name}의 오행</h3>${ohaengHTML(B.elems)}</div>
     </div>
     <p style="margin-top:14px">${A.name}님에게 가장 부족한 기운은 <strong>${ELEM[lackA]}</strong>인데, ${B.name}님의 사주에 그 기운이 ${compAB?`넉넉히 흐르고 있습니다. ${B.name}님과 있으면 이유 없이 편안해지는 까닭이 여기에 있습니다 — 상대가 당신의 빈 곳을 존재만으로 채워 주는 것입니다.`:`많지는 않습니다. 이 기운만큼은 두 사람이 밖에서 함께 채워야 할 숙제입니다.`}</p>
     <p>${B.name}님에게 가장 부족한 기운은 <strong>${ELEM[lackB]}</strong>이며, ${A.name}님의 사주가 그 기운을 ${compBA?`품고 있습니다. ${B.name}님에게 당신은 곁에 두는 것만으로 보약이 되는 사람입니다.`:`많이 품고 있지는 않습니다. 서로에게 기대기보다 함께 그 기운을 찾아 나서는 동반자가 되어야 합니다.`}</p>`);

  const zrText={
    yukhap:`두 분의 띠(년지)는 육합 — 어른들이 보기에도, 집안끼리 보기에도 좋은 조합입니다. 가족 관계와 대외 운이 순탄하게 흐릅니다.`,
    samhap:`두 분의 띠는 삼합의 짝 — 함께하면 큰 그림이 잘 굴러가는 조합으로, 결혼·동업 같은 공동 프로젝트에 강합니다.`,
    same:`두 분은 같은 띠 — 같은 시대의 감성을 공유하는 동갑내기식 편안함이 있습니다.`,
    chung:`두 분의 띠는 충 — 집안 문화나 어른 문제, 생활 배경의 차이가 숙제로 등장할 수 있는 조합입니다. 둘의 문제라기보다 둘을 둘러싼 환경의 문제이니, 부부는 한 팀이라는 원칙만 지키면 넘을 수 있습니다.`,
    wonjin:`두 분의 띠는 원진 — 명절이나 가족 행사에서 잔가시가 돋을 수 있는 조합입니다. 서로의 원가족 이야기는 농담으로라도 함부로 하지 않는 것이 규칙입니다.`,
    hae:`두 분의 띠는 해(害) — 큰 문제는 아니나 주변 사람으로 인한 소소한 오해가 낄 수 있으니, 남의 말보다 서로의 말을 먼저 믿으세요.`,
    none:`두 분의 띠는 무난한 관계 — 배경의 운은 평탄하니, 관계의 성패는 온전히 두 사람의 몫입니다.`
  }[zr.k];
  html+=sec('第六章','띠 궁합과 집안의 기운',
    `${BRANCHES[ya].animal}띠 ${A.name} · ${BRANCHES[yb].animal}띠 ${B.name}`,
    `<p>${zrText}</p>`);

  const conflict=[];
  if(br.k==='chung'||br.k==='wonjin') conflict.push(`생활 습관의 정면충돌 — 데이트 방식, 연락 빈도, 돈 쓰는 법에서 "어떻게 저럴 수 있지?"가 나옵니다. 고치려 들지 말고 규칙으로 합의하세요.`);
  if(tg==='상관'||tg==='겁재') conflict.push(`말로 내는 상처 — 이 조합의 싸움은 논리 대결로 번지기 쉽습니다. 싸움의 목적은 이기는 것이 아니라 화해라는 것을 벽에 붙여 두세요.`);
  if(tg==='편관') conflict.push(`힘의 불균형 — 한쪽이 늘 맞추는 구도가 생기기 쉽습니다. 한 달에 한 번은 맞추는 쪽이 정하는 날을 만드세요.`);
  if(!conflict.length) conflict.push(`이 궁합의 갈등은 큰 파도보다 잔물결입니다 — 서운함을 말하지 않고 넘기는 습관이 유일한 적입니다. "괜찮아"가 세 번 쌓이기 전에 말하세요.`);
  conflict.push(`두 사람 모두에게 통하는 만능 처방 — 갈등이 생긴 날, 잠들기 전에 한 문장만 보내세요. "그래도 네 편이야." 명리학의 어떤 합(合)보다 강한 것이 이 한마디입니다.`);
  html+=sec('第七章','갈등의 지도와 해법','부딪히는 지점을 미리 알면 피할 수 있습니다',
    `<ul class="pts">${conflict.map(c=>`<li>${c}</li>`).join('')}</ul>`);

  html+=sec('終章','월하노인의 당부','두 사람에게 전하는 붉은 실의 전언',
    `<p class="prophecy">"점수는 하늘이 매기나, 인연은 사람이 완성하느니라. ${score}점의 실을 ${score>=70?'끊지 않도록 아껴 쓰고':'백 점으로 꼬아 가는 것이 너희의 몫이며'}, 오늘 서로에게 건네는 다정한 말 한마디가 곧 실 한 가닥이니라."</p>
     <p>궁합에서 가장 좋은 소식은 점수가 아니라 이것입니다 — 두 사람이 지금 서로의 인연을 궁금해하고 있다는 사실. 그 마음이 있는 한, 위의 모든 그림자는 넘을 수 있는 언덕에 불과합니다.</p>`);
  return html;
}

function renderForecast(A){
  const db=A.db, r=A.r;
  const pe=partnerElem(A), stars=partnerStars(A), sName=starName(A);
  const prof=LOVER_PROFILE[pe];
  const thisYear=r.currentYear;
  const now=new Date();

  /* 연도별 점수 — ssaju 세운(십성 포함) 사용 */
  const years=[];
  for(const sYun of r.seyun){
    if(sYun.year<thisYear||sYun.year>thisYear+3) continue;
    const gb=branchIdxOf(sYun.branch);
    let s=1, why=[];
    if(stars.includes(sYun.tenGodStem)){s+=2.4;why.push(`천간에 ${sYun.tenGodStem} — ${sName}이 하늘에 뜨는 해`);}
    if(stars.includes(sYun.tenGodBranch)){s+=2.6;why.push(`지지에 ${sYun.tenGodBranch} — ${sName}이 발밑에 흐르는 해`);}
    if(YUKHAP[gb]===db){s+=3;why.push('배우자궁과 육합');}
    if(isSamhap(gb,db)){s+=2;why.push('배우자궁과 삼합');}
    if(isChung(gb,db)){s+=1.2;why.push('배우자궁 충 — 변동 속의 만남');}
    if(gb===DOHWA[db]){s+=2.4;why.push('도화 발동');}
    if(why.length===0) why.push('잔잔한 흐름');
    years.push({y:sYun.year,gz:sYun.ganzhi,gb,s,why});
  }
  const best=years.reduce((a,b)=>b.s>a.s?b:a,years[0]);
  const maxS=Math.max(...years.map(v=>v.s));
  /* 길한 달 — wolun(십성 포함) 사용 */
  const goodMonths=[];
  for(const w of r.wolun){
    const mb=branchIdxOf(w.branch);
    let why=null;
    if(YUKHAP[mb]===db) why='배우자궁 육합';
    else if(mb===DOHWA[db]) why='도화 발동';
    else if(stars.includes(w.branchTenGod)) why=`${w.branchTenGod}의 달`;
    if(why) goodMonths.push({mm:wolunSolarMonth(w.month),why});
  }
  const monthsInBest=(best.y===thisYear?goodMonths.filter(m=>m.mm>now.getMonth()+1):goodMonths).slice(0,4);
  const speed= best.y===thisYear?'이미 올해 안':best.y===thisYear+1?'늦어도 내년':`${best.y-thisYear}년 안`;
  /* 대운 참고 */
  const du=r.daeun.current;
  const duHasStar=du&&(stars.includes(du.stemTenGod)||stars.includes(du.branchTenGod));

  let html='';
  html+=sec('第一章','인연 예보의 근거 — 당신의 원국',
    `${A.y}년 ${A.m}월 ${A.d}일생 · 일주 ${gzName(A.ds,db)} · ${r.currentAge}세`,
    baseChartSec(A)+
    `<p style="margin-top:14px">명리학에서 다가올 연인은 <em>배우자별</em>로 읽습니다. ${A.sex==='F'?'여성에게 배우자별은 나를 이끌고 감싸는 관성(官星)':'남성에게 배우자별은 내가 아끼고 쟁취하는 재성(財星)'} — 당신의 일간 ${STEMS[A.ds].kr}(${STEMS[A.ds].hj}) 기준으로 <strong>${ELEM[pe]}의 기운</strong>이 바로 그 별입니다. 이 별이 어떤 얼굴로, 어디에서, 언제 오는지 차례로 읽어 드리겠습니다.</p>`);

  html+=sec('第二章','그 사람의 얼굴 — 외모와 분위기',`${ELEM[pe]} 기운의 연인`,
    `<div class="badges"><span class="badge blue">${sName} = ${ELEM[pe]}</span></div>`
    +paras(prof.look)+
    `<p>물론 명리학이 몽타주를 그려 주지는 않습니다. 그러나 오행은 사람의 <em>기질이 밖으로 배어 나오는 결</em>을 말해 줍니다. 어느 날 이런 분위기의 사람이 유난히 눈에 들어온다면 — 그날은 그냥 지나치지 마세요.</p>`,
    `다가올 연인의 기운: ${ELEM[pe]} — ${['단정하고 성장하는 사람','화사하고 정열적인 사람','온화하고 믿음직한 사람','절제되고 반듯한 사람','신비롭고 지적인 사람'][pe]}`);

  html+=sec('第三章','그 사람의 마음 — 성격과 살아가는 법','함께하게 될 사람의 내면',
    paras(prof.mind)+
    `<p>중요한 것은 이 사람이 당신의 ${sName}이라는 사실입니다. 즉 스쳐 가는 인연이 아니라, 당신 사주가 <strong>배우자의 자리에 앉혀 놓고 기다리는 기운</strong>이라는 뜻입니다.</p>`);

  html+=sec('第四章','만남의 장소 — 붉은 실이 걸리는 길목','어디에서 마주치게 되는가',
    paras(prof.where)+
    `<p>배우자궁 ${BRANCHES[db].kr}(${BRANCHES[db].hj})의 기운까지 겹쳐 보면, ${[3,6,9,0].includes(db)?'당신의 배우자궁은 도화의 자리 — 사람 많은 곳에서 시선이 먼저 도착하는 유형이니, 모임과 행사를 피하지 마세요.':'당신의 배우자궁은 차분한 자리 — 시끄러운 곳보다 소수의 깊은 자리, 소개와 지인의 다리에서 인연이 맺힐 확률이 높습니다.'}</p>`);

  const yearsHtml=`<div class="years">${years.map(v=>`
    <div class="yr${v===best?' best':''}">
      <span class="yn">${v.y}년 ${v.gz}년</span>
      <span class="bar"><i style="width:${v.s/maxS*100}%"></i></span>
      <span class="pt">${v.s.toFixed(1)}</span>
    </div>
    <p class="yr-why">└ ${v.why.join(' · ')}</p>`).join('')}</div>`;
  html+=sec('第五章','언제 오는가 — 인연의 시간표','세운(歲運)으로 읽는, 인연의 문이 열리는 순서',
    `${du?`<p>먼저 큰 물줄기부터 보면, 지금 당신은 <strong>${du.ganzhi} 대운</strong>(${du.startAge}세~${du.endAge}세)을 지나고 있습니다. ${duHasStar?`이 대운 자체에 ${sName}의 기운이 흐르고 있어, <em>10년 단위의 큰 흐름이 이미 인연 쪽으로 기울어 있는 시기</em>입니다.`:`이 대운은 인연보다 자기 성장에 무게가 실린 시기지만, 그 위로 흐르는 해(세운)가 문을 열어 줍니다.`}</p>`:''}
     ${yearsHtml}
     <p>저울이 가리키는 가장 큰 문은 <strong>${best.y}년 ${best.gz}년</strong>입니다. 즉 당신의 인연은 <em>${speed}</em>에 올 가능성이 가장 높습니다.</p>
     ${monthsInBest.length?`<p>그 해 안에서도 특히 문이 활짝 열리는 달은 <strong>${monthsInBest.map(m=>m.mm+'월('+m.why+')').join(', ')}</strong>입니다. 이 달들에는 새 모임 제안, 소개, 우연한 재회를 절대 흘려보내지 마세요.</p>`:''}
     <p>${isChung(best.gb,db)?'참고로 그 해는 배우자궁이 흔들리는 충의 해이기도 합니다 — 이사, 이직, 환경 변화의 소용돌이 속에서 인연이 들어오는 그림이니, 변화를 두려워하지 마세요. 변화가 곧 중매쟁이입니다.':'그 해의 기운은 당신의 애정 자리를 부드럽게 데우는 흐름이니, 억지로 서두르지 않아도 물이 차오르듯 인연이 다가옵니다.'}</p>`,
    `가장 큰 인연의 문: ${best.y}년 — ${speed}에 올 가능성이 가장 높다`);

  html+=sec('第六章','만남의 시나리오','월하노인이 미리 본 장면 하나',
    `<p>장면은 이렇습니다. ${best.y}년의 어느 날, ${['새로 시작한 배움의 자리에서 옆자리에 앉은','웃음소리가 큰 어느 모임에서 유난히 눈이 마주치던','지인이 "꼭 소개해 주고 싶은 사람이 있다"며 데려온','실력을 겨루거나 배우는 자리에서 당신을 도와준','밤이 깊은 조용한 공간에서 우연히 말을 섞게 된'][pe]} 사람 — 첫인상은 ${['단정하고 싱그러운','환하고 눈부신','수수하지만 믿음직한','차갑지만 반듯한','조용하지만 깊은'][pe]} 느낌일 것입니다. 대화는 예상보다 길어지고, 헤어져 돌아오는 길에 당신은 스스로도 놀랍니다. "왜 자꾸 생각나지?"</p>
     <p>그 순간을 위해 기억할 것은 하나입니다. 그 사람은 당신의 ${sName}, 즉 ${A.sex==='F'?'당신을 존중하며 이끌어 주는':'당신이 아끼고 지켜 주고 싶어지는'} 기운입니다. 첫 만남에서 화려하게 빛나지 않아도, 두 번째 만남을 거절하지 마세요. 이 인연은 <em>두 번째 만남부터 본색을 드러내는 별</em>입니다.</p>`);

  html+=sec('第七章','인연을 앞당기는 개운법',`${ELEM[pe]}의 기운을 부르는 생활 처방`,
    paras(LUCK_TIPS[pe])+
    `<p>그리고 모든 오행에 공통되는 최고의 개운법 — <strong>지금 마음에 걸려 있는 지난 인연이 있다면 이번 달 안에 정리하세요.</strong> 월하노인은 손이 비어 있는 사람에게만 새 실을 쥐여 줍니다.</p>`);

  html+=sec('終章','월하노인의 예언','붉은 실의 끝에서',
    `<p class="prophecy">"${A.name}아, 너의 실은 끊어진 적이 없다. 다만 ${best.y}년의 바람이 불 때까지 접혀 있을 뿐이니, 그때 ${EK[pe]}의 기운을 두른 사람이 실을 당기거든 — 모르는 척 세 걸음만 마주 걸어 나오너라."</p>
     <p>예보는 여기까지입니다. 우산을 챙기는 것은 언제나 사람의 몫이듯, 이 예보를 현실로 만드는 것도 ${best.y}년의 그 달, 문밖으로 나서는 당신의 한 걸음입니다.</p>`);
  return html;
}

function renderMarriage(A){
  const r=A.r, db=A.db;
  const stars=partnerStars(A), sName=starName(A), pe=partnerElem(A);
  const thisYear=r.currentYear;
  /* 배우자별 개수: 원국 십성에서 집계(시주는 모를 때 제외) */
  let starCount=0;
  for(const k of ['year','month','day','hour']){
    if(k==='hour'&&!A.hourKnown) continue;
    const t=r.tenGods[k];
    if(stars.includes(t.stem)) starCount++;
    if(stars.includes(t.branch)) starCount++;
  }
  const cat=starCount===0?0:starCount<=2?1:2;
  /* 배우자궁 상태 */
  const rel=r.branchRelations;
  const dayHit=k=>rel[k]&&Object.keys(rel[k]).includes('day');
  const palaceNotes=[];
  if(dayHit('육합')||dayHit('삼합')||dayHit('반합')) palaceNotes.push(MARRY_PALACE_GOOD);
  if(dayHit('충')) palaceNotes.push(MARRY_PALACE_CHUNG);
  if(dayHit('원진')) palaceNotes.push(MARRY_PALACE_WONJIN);
  const gongmangHit=r.gongmang&&r.gongmang.branches.includes(BRANCHES[db].hj);
  if(gongmangHit) palaceNotes.push(MARRY_PALACE_GONGMANG);
  if(!palaceNotes.length) palaceNotes.push(`배우자궁은 큰 합도 충도 없이 고요합니다. 혼인의 방이 담백하고 안정되어 있다는 뜻으로, 결혼 생활의 품질이 <strong>운보다 두 사람의 습관</strong>에 달린 자율형 구조입니다. 명리학적으로는 오히려 예측 가능한 좋은 그림입니다.`);
  /* 혼인 시기 — 세운 */
  const marryYears=[];
  for(const s of r.seyun){
    if(s.year<thisYear||s.year>thisYear+5) continue;
    const gb=branchIdxOf(s.branch);
    let sc=0, why=[];
    const primary=A.sex==='F'?'정관':'정재', secondary=A.sex==='F'?'편관':'편재';
    if(s.tenGodStem===primary||s.tenGodBranch===primary){sc+=3;why.push(primary+'의 해 — 정식 혼인의 별');}
    else if(s.tenGodStem===secondary||s.tenGodBranch===secondary){sc+=1.6;why.push(secondary+'의 해 — 강한 인연의 해');}
    if(YUKHAP[gb]===db){sc+=2.4;why.push('배우자궁 육합 — 혼인이 몸에 붙는 해');}
    if(isSamhap(gb,db)){sc+=1.5;why.push('배우자궁 삼합');}
    if(why.length) marryYears.push({y:s.year,gz:s.ganzhi,sc,why});
  }
  marryYears.sort((a,b)=>b.sc-a.sc);
  const top=marryYears.slice(0,2);
  const du=r.daeun.current;
  const duHasStar=du&&(stars.includes(du.stemTenGod)||stars.includes(du.branchTenGod));

  let html='';
  html+=sec('第一章','혼인 감정의 근거 — 당신의 원국',
    `${A.y}년 ${A.m}월 ${A.d}일생 · 일주 ${gzName(A.ds,db)} · ${r.currentAge}세`,
    baseChartSec(A));

  html+=sec('第二章','배우자별 진단 — 내 사주에 예비된 인연',
    `${sName}이 원국에 ${starCount}곳 — ${['숨어 있는 구조','알맞은 구조','여럿인 구조'][cat]}`,
    paras(MARRY_STAR_TXT[cat]),
    ['배우자별이 숨은 사주 — 운이 실어 오는 때를 잡는 것이 전부','배우자별이 알맞은 사주 — 찾는 것이 아니라 알아보는 것이 과제','배우자별이 많은 사주 — 비교를 멈추는 순간 혼인운이 열린다'][cat]);

  html+=sec('第三章','배우자궁 감정 — 혼인의 방 상태',
    `일지 ${BRANCHES[db].kr}(${BRANCHES[db].hj})${gongmangHit?' · 공망':''}`,
    palaceNotes.map(t=>paras(t)).join('')+paras(SPOUSE_PALACE[db]),
    SP_KEY[db]);

  html+=sec('第四章','혼인의 때 — 대운과 세운이 가리키는 시기',
    `현재 대운 ${du?du.ganzhi+' ('+du.startAge+'~'+du.endAge+'세)':'-'}`,
    `${du?`<p>지금 흐르는 <strong>${du.ganzhi} 대운</strong>은 ${duHasStar?`그 자체로 ${sName}의 기운을 싣고 있는 <em>혼인 대운</em>입니다. 이 10년 안에 혼사가 성사될 가능성이 높으니, 아래의 해들을 실기(失期)하지 마세요.`:`혼인보다 자기 기반에 무게가 실린 대운입니다. 그러나 대운이 조용해도 세운이 문을 여는 법 — 아래의 해들이 그 문입니다.`}</p>`:''}
     ${top.length?`<p>앞으로 6년 사이, 혼인의 별이 가장 밝게 뜨는 해는 다음과 같습니다.</p>
     <ul class="pts gold">${top.map(t=>`<li><strong>${t.y}년 ${t.gz}년</strong> — ${t.why.join(' · ')}</li>`).join('')}</ul>
     <p>이런 해에는 소개가 들어오면 나가고, 만나던 사람이 있다면 관계의 매듭(동거, 약혼, 결혼)을 짓기에 하늘의 협조가 붙습니다. 반대로 이 해들을 그냥 흘려보내면 다음 문까지 몇 년을 기다리게 되니, 달력에 표시해 두세요.</p>`
     :`<p>앞으로 6년 사이에는 혼인의 별이 강하게 드는 해가 뚜렷하지 않습니다. 이것은 늦는다는 뜻이 아니라 <em>서두를 이유가 없다는 뜻</em>입니다. 이 기간에 자기 기반을 다져 두면, 다음 혼인운이 들 때 훨씬 좋은 조건에서 인연을 맞게 됩니다.`}</p>`,
    top.length?`혼인의 대길년: ${top.map(t=>t.y+'년').join(', ')} — 이 해의 인연과 결정을 놓치지 말 것`:'지금은 기반을 다지는 시기 — 혼인운은 준비된 사람에게 크게 온다');

  html+=sec('第五章','결혼 생활의 그림 — 어떤 가정을 이루는가',`${ELEM[pe]} 기운의 배우자와 꾸리는 집`,
    paras(MARRIED_LIFE[pe])+
    `<p>배우자의 결은 앞의 배우자별(${ELEM[pe]})을 따릅니다. ${LOVER_PROFILE[pe].mind.split('.').slice(0,2).join('.')}.</p>`);

  html+=sec('第六章','배우자복을 키우는 개운법','혼인운은 가꾸는 만큼 자랍니다',
    `<ul class="pts blue">
      <li>${LUCK_TIPS[pe].split('.').slice(0,2).join('.')}.</li>
      <li>배우자궁(일지)은 곧 "내 집의 안방"입니다 — 침실과 잠자리를 정갈하게 유지하는 것이 명리학의 오래된 혼인 개운법입니다.</li>
      <li>${cat===2?'여러 인연 사이에서 저울질이 길어질 때는, 조건이 아니라 "이 사람과 싸우고 화해하는 방식"을 기준으로 고르세요.':'결혼은 인연 반, 결심 반입니다. 혼인의 대길년이 왔을 때 "아직 준비가 안 됐다"는 말로 문을 닫지 않도록, 준비는 미리 해 두세요.'}</li>
      <li>혼인을 앞둔 갈등은 대부분 두 집안의 문화 차이에서 옵니다 — 상대의 가족 이야기를 험담이 아닌 관찰로 듣는 연습을 지금부터 하세요.</li>
    </ul>`);

  html+=sec('終章','월하노인의 혼인 전언','붉은 실의 매듭에 관하여',
    `<p class="prophecy">"혼인이란 붉은 실의 끝과 끝이 만나 매듭이 되는 일 — ${A.name}아, ${top.length?`${top[0].y}년의 바람이 불 때 매듭 지을 손을 비워 두어라`:'매듭은 늦게 지을수록 단단해지니 조급해 말라'}. 좋은 배필은 하늘이 내리나, 좋은 부부는 사람이 만드느니라."</p>
     <p>결혼운 풀이는 여기까지입니다. 사주가 보여 주는 것은 문이 열리는 시기와 방의 모양일 뿐, 그 방을 어떤 온기로 채울지는 언제나 두 사람의 몫입니다.</p>`);
  return html;
}

function renderToday(A){
  const r=A.r, db=A.db;
  const todayGz=r.reference.codes.today;
  const ts=stemIdxOf(todayGz[0]), tb=branchIdxOf(todayGz[1]);
  const tg=tenGod(A.ds,ts);
  const brRel=branchRelation(tb,db);
  const brInfo=BR_TODAY[brRel.k];
  let score=60+(TG_TODAY_SCORE[tg]||0)+brInfo.s;
  if(tb===DOHWA[db]) score+=8;
  score=Math.max(15,Math.min(98,score));
  const line=score>=85?'별이 쏟아지는 날':score>=70?'맑음, 사랑하기 좋은 날':score>=55?'구름 조금, 무난한 날':score>=40?'흐림, 말조심의 날':'소나기 주의, 한 템포 쉬어 갈 날';
  /* 행운 포인트 */
  const luckBranch=YUKHAP[tb];
  const HOUR_RANGE=['23시~1시','1시~3시','3시~5시','5시~7시','7시~9시','9시~11시','11시~13시','13시~15시','15시~17시','17시~19시','19시~21시','21시~23시'];
  const yongsinElem=(()=>{const i=stemIdxOf(r.advanced.yongsin[0]);return i>=0?STEMS[i].e:partnerElem(A);})();
  const today=new Date();
  const dateStr=`${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;

  let html='';
  html+=sec('一','오늘의 애정 일기예보',`${dateStr} · ${todayGz}일 (${STEMS[ts].kr}${BRANCHES[tb].kr}일) · ${A.name}님의 일주 ${gzName(A.ds,db).slice(0,2)}`,
    `<div class="score-wrap">
      <div class="score-big">${score}<small> / 100</small></div>
      <div class="gauge"><i style="width:${score}%"></i></div>
      <div class="score-line">"${line}"</div>
    </div>
    <p style="margin-top:14px">오늘의 일진 ${todayGz}은(는) 당신의 일간에게 <strong>${tg}</strong>의 기운으로, 배우자궁에는 <strong>${brRel.label}</strong>(으)로 다가옵니다. 이 두 기운이 오늘 하루 당신의 애정 날씨를 만듭니다.</p>`);

  html+=sec('二','오늘의 마음 날씨 — 일진 십성 풀이',`오늘의 기운: ${tg}`,
    paras(TG_TODAY[tg]),
    TG_KEY[tg]?`오늘의 관계 기류: ${TG_KEY[tg]}`:null);

  html+=sec('三','오늘의 행동 지침 — 배우자궁과의 합',`오늘의 지지 ${BRANCHES[tb].kr}(${BRANCHES[tb].hj}) ↔ 나의 일지 ${BRANCHES[db].kr}(${BRANCHES[db].hj})`,
    paras(brInfo.t)+
    (tb===DOHWA[db]?`<p><em>덧붙여 오늘은 당신의 도화가 발동하는 날입니다.</em> 평소보다 시선이 모이는 날이니, 거울 한 번 더 보고 나가셔도 좋겠습니다.</p>`:''));

  html+=sec('四','오늘의 행운 포인트','작지만 확실한 개운',
    `<ul class="pts gold">
      <li><strong>행운의 시간</strong> — ${HOUR_RANGE[luckBranch]} (${BRANCHES[luckBranch].kr}시): 오늘의 기운과 합을 이루는 시간대입니다. 중요한 연락, 데이트 약속은 이 언저리에.</li>
      <li><strong>행운의 색</strong> — ${ELEM_COLOR_WORD[yongsinElem]}: 당신의 용신(用神) 기운을 돋우는 색입니다. 옷이든 소품이든 한 점이면 충분합니다.</li>
      <li><strong>오늘의 한 문장</strong> — "${['오늘은 이기지 말고 웃자','질투는 확인 후에, 애정은 확인 없이','맛있는 것을 나누면 마음도 나뉜다','재치는 살리고 뼈는 빼자','설렘은 즐기되 지갑은 지키자','성실한 다정함이 오늘의 무기','예민한 날엔 예고를 하자','단정한 하루가 인연을 부른다','오늘의 결론은 내일 다시 검토','깊은 대화가 가장 깊은 데이트'][['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'].indexOf(tg)]}"</li>
    </ul>
    <p>일진은 하루짜리 날씨입니다. 오늘이 흐렸다면 내일은 다른 하늘이 뜨니, 무거워하지 말고 우산 하나 챙기는 마음이면 충분합니다.</p>`);
  return html;
}

export { sec, paras, tocHTML, pillarsHTML, ohaengHTML, baseChartSec, wolunSolarMonth, charms, partnerElem, partnerStars, starName, renderLove, renderGunghap, renderForecast, renderMarriage, renderToday };
// 참고: 이 파일은 legacy 추출본에서 소스로 승격되었다 (2026-07-12, 6모드 개편). 이제 직접 수정한다.

export type Mode = "love" | "gunghap" | "forecast" | "marriage" | "today";

const GREET = {
  love: (A) => `어서 오셔요, ${A.name}님. 오늘은 ${A.name}님의 사랑 이야기를 풀어 보는 날입니다. 사주는 정답이 아니라 지도예요. 어디에 꽃길이 있고 어디에 돌부리가 있는지, 제가 등불을 들고 앞서 걸을 테니 편한 마음으로 따라오셔요.`,
  gunghap: (A, B) => `어서 오셔요, ${A.name}님. 그리고 ${B.name}님. 두 분의 사주를 나란히 펼쳐 놓고 보니, 벌써부터 재미있는 그림이 보입니다. 급할 것 없으니, 차 한 잔 두고 처음부터 끝까지 천천히 함께 읽어 보셔요.`,
  forecast: (A) => `어서 오셔요, ${A.name}님. 궁금하시지요 — 나의 인연은 어떤 얼굴로, 어디에서, 언제쯤 오려나. 오늘은 그 붉은 실의 끝을 함께 따라가 보겠습니다. 조급해하지 않으셔도 됩니다. 실은 이미 매여 있으니까요.`,
  marriage: (A) => `어서 오셔요, ${A.name}님. 혼인이란 인생에서 가장 큰 매듭이지요. 오늘은 ${A.name}님의 사주에 예비된 배필의 그릇과 혼인의 때를, 과장도 겁주기도 없이 있는 그대로 감정해 드리겠습니다.`,
  today: (A) => `어서 오셔요, ${A.name}님. 오늘 하루의 애정 날씨를 짚어 보는 자리입니다. 일진은 하루살이 운 — 가볍게 읽고, 좋은 것만 챙겨 가셔요.`,
};

/** 모드별 전체 리포트 HTML (홍실 구분선 + 목차 + 본문) */
export function renderReading(mode: Mode, A: Person, B?: Person): string {
  SECN = 0;
  let html = "";
  if (mode === "gunghap") {
    if (!B) throw new Error("궁합 모드에는 상대(B)가 필요합니다");
    html = renderGunghap(A, B);
  } else if (mode === "love") html = renderLove(A);
  else if (mode === "forecast") html = renderForecast(A);
  else if (mode === "marriage") html = renderMarriage(A);
  else html = renderToday(A);
  const greet = GREET[mode](A, B);
  return `<hr class="thread">` + tocHTML(html, greet) + html;
}
