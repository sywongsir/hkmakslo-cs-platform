/* 羅桂祥X現代：公民科學習平台 —— 程式（不含課題內容；內容在 data/ 資料檔） */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var STEPS = CSD.steps, KEY = 'lkc-csd-v1';

  /* ── 學習紀錄：存於瀏覽器（localStorage），無法使用時改存於記憶體 ── */
  var mem = { steps: {}, quiz: {}, known: {}, prac: {}, ans: {}, last: null };
  var S = (function () { try { return Object.assign(mem, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return mem; } })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ── 工具 ── */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function allLps() { var out = []; Object.keys(CSD.units).forEach(function (u) { CSD.units[u].lps.forEach(function (l) { l.unit = u; out.push(l); }); }); return out; }
  function findLp(code) { return allLps().filter(function (l) { return l.code === code; })[0]; }
  function lpDone(code) { return (S.steps[code] || []).length; }
  function unitPct(uid) { var u = CSD.units[uid]; if (!u) return 0; var d = 0; u.lps.forEach(function (l) { d += lpDone(l.code); }); return Math.round(d / (u.lps.length * STEPS.length) * 100); }
  function lvTag(lv) { return '<span class="tag ' + (lv === '基礎' ? 'ok' : lv === '進階' ? 'navy' : '') + '">' + lv + '</span>'; }
  function pending(uid) { return CSD.units[uid] && !CSD.units[uid].reviewed; }
  function allQuestions() {
    var qs = [];
    allLps().forEach(function (l) {
      l.quiz.forEach(function (q, i) { qs.push({ id: l.code + '-M' + (i + 1), type: '多項選擇題', lp: l, d: q, lv: q.lv }); });
      var src = null;
      l.practice.forEach(function (p) { if (p.src) src = p.src; qs.push({ id: p.id, type: p.type, lp: l, d: p, lv: p.lv, src: p.src || src }); });
      (l.tb || []).forEach(function (t) { qs.push({ id: t.id, type: '課本題目', lp: l, d: t, lv: t.lv }); });
    });
    return qs;
  }

  /* ── 各類題目的顯示 ── */
  function mcHtml(id, q) {
    var st = S.quiz[id];
    return '<div class="card" data-mc="' + id + '"><div class="row between"><span class="mute"><span class="code">' + id + '</span>　多項選擇題</span>' + lvTag(q.lv) + '</div>' +
      '<p class="q">' + esc(q.q) + '</p>' +
      q.o.map(function (o, i) {
        var cls = st ? (i === q.a ? ' right' : (i === st.pick ? ' wrong' : '')) : '';
        return '<button class="opt' + cls + '" data-i="' + i + '"' + (st ? ' disabled' : '') + '>' + 'ABCD'[i] + '. ' + esc(o) + '</button>';
      }).join('') +
      '<div class="why' + (st ? ' show' : '') + '"><b>' + (st ? (st.ok ? '答對了！' : '答案是 ' + 'ABCD'[q.a] + '。') : '') + '</b> ' + esc(q.why) + '</div>' +
      (st ? '<button class="btn ghost small" data-retry="' + id + '" style="margin-top:10px">再做一次</button>' : '') + '</div>';
  }
  function pracHtml(p, src, lp, inLp) {
    if (!p.src) src = inLp ? null : (p.q.indexOf('資料') > -1 ? src : null);
    var st = S.prac[p.id];
    return '<div class="card" data-prac="' + p.id + '"><div class="row between"><span class="mute"><span class="code">' + p.id + '</span>　' + p.type + '（' + p.marks + '分）</span>' + lvTag(p.lv) + '</div>' +
      (src ? '<div class="srcbox"><b>' + esc(src.t) + '</b>' + esc(src.x) + '</div>' : '') +
      '<p class="q">' + esc(p.q) + '</p>' +
      '<details><summary>作答提示</summary><ul class="pts">' + p.frame.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></details>' +
      '<p class="mute" style="margin-top:12px">先自己寫，再對照參考要點：</p>' +
      '<textarea data-ans="' + p.id + '" placeholder="在這裏輸入你的答案（會儲存在本機瀏覽器）">' + esc(S.ans[p.id] || '') + '</textarea>' +
      '<details><summary>參考要點</summary><ul class="pts">' + p.pts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '<p class="mute">自我評估：</p><div class="row">' +
      '<button class="chip' + (st === 'ok' ? ' on' : '') + '" data-self="ok">已掌握</button>' +
      '<button class="chip' + (st === 'again' ? ' on' : '') + '" data-self="again">需要重溫</button></div></details>' +
      (pending(lp.unit) ? '<div class="pending">來源：新擬題（按公開試模式擬題，待老師審批）・學習重點 ' + lp.code + '</div>' : '<p class="mute">來源：新擬題・學習重點 ' + lp.code + '</p>') +
      '</div>';
  }

  function srcHtml(x) {
    return '<div class="srcbox"><b>' + esc(x.t) + '</b>' +
      (x.img ? '<img src="' + x.img + '" alt="' + esc(x.alt || '') + '">' : '') +
      (x.tb ? '<div class="tw"><table><tr>' + x.tb.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>' + x.tb.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' : '') +
      (x.x ? esc(x.x) : '') + '</div>';
  }
  function tbHtml(t, lp) {
    return '<div class="card tbq"><div class="row between"><span class="mute"><span class="code">' + t.id + '</span>　課本' + t.kind + '</span>' + lvTag(t.lv) + '</div>' +
      '<h3 style="margin:6px 0">' + esc(t.title) + '</h3>' + t.srcs.map(srcHtml).join('') +
      t.parts.map(function (p) {
        var head = (p.n ? '<b class="pn">' + p.n + '</b> ' : '') + esc(p.q) + (p.marks ? '（' + p.marks + '分）' : '');
        if (p.o) {
          var id = t.id + p.n, st = S.quiz[id];
          return '<div class="part" data-mc="' + id + '"><p class="q">' + head + '</p>' + p.o.map(function (o, i) {
            var cls = st ? (i === p.a ? ' right' : (i === st.pick ? ' wrong' : '')) : '';
            return '<button class="opt' + cls + '" data-i="' + i + '"' + (st ? ' disabled' : '') + '>' + 'ABCD'[i] + '. ' + esc(o) + '</button>';
          }).join('') + '<div class="why' + (st ? ' show' : '') + '"><b>' + (st ? (st.ok ? '答對了！' : '答案是 ' + 'ABCD'[p.a] + '。') : '') + '</b> 題解：' + esc(p.why) + '</div>' +
            (st ? '<button class="btn ghost small" data-retry="' + id + '" style="margin-top:8px">再做一次</button>' : '') + '</div>';
        }
        return '<div class="part"><p class="q">' + head + '</p>' + (p.tip ? '<div class="hint">提示：' + esc(p.tip) + '</div>' : '') +
          '<textarea data-ans="' + t.id + p.n + '" placeholder="在這裏輸入你的答案">' + esc(S.ans[t.id + p.n] || '') + '</textarea>' +
          '<details><summary>課本參考答案</summary><ul class="pts">' + p.ans.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></details></div>';
      }).join('') +
      '<p class="mute" style="margin-top:12px">來源：課本' + t.page + '（' + t.kind + '）・學習重點 ' + lp.code + '</p></div>';
  }

  /* ── 頁面 ── */
  var V = {};
  V.home = function () {
    var qs = allQuestions(), mc = []; qs.forEach(function (q) { if (q.type === '多項選擇題') mc.push(q); if (q.type === '課本題目') q.d.parts.forEach(function (p) { if (p.o) mc.push({ id: q.d.id + p.n }); }); });
    var right = mc.filter(function (q) { return S.quiz[q.id] && S.quiz[q.id].ok; }).length;
    var stepsDone = 0; allLps().forEach(function (l) { stepsDone += lpDone(l.code); });
    var last = S.last && findLp(S.last.code);
    return '<section class="card hero"><h1>讀得懂、記得住、寫得出</h1><p>跟着七個步驟，逐個學習重點掌握公民與社會發展科。</p>' +
      '<a class="btn" href="' + (last ? '#/lp/' + S.last.code + '/' + S.last.step : '#/lp/1A-1/1') + '">' + (last ? '繼續學習 ' + S.last.code : '開始學習 1A-1') + '　→</a></section>' +
      '<div class="stats"><div class="stat"><b>' + stepsDone + '</b><span>已完成步驟</span></div><div class="stat"><b>' + Object.keys(S.known).length + '</b><span>已掌握概念</span></div><div class="stat"><b>' + right + '/' + mc.length + '</b><span>選擇題答對</span></div></div>' +
      '<div class="sec"><h2>主題學習區</h2><a class="mute" href="#/themes">全部 →</a></div>' +
      CSD.themes.map(function (t) {
        return '<a class="card" style="display:block" href="#/themes"><div class="row between"><span class="tag navy">' + t.form + '　主題' + t.id + '</span><span class="mute">' + t.units.length + ' 個課題</span></div><h3 style="margin-top:6px">' + t.title + '</h3></a>';
      }).join('') +
      '<div class="row" style="margin-top:14px"><a class="btn ghost" style="flex:1" href="#/concepts">概念庫</a><a class="btn ghost" style="flex:1" href="#/training">答題訓練營</a></div>' +
      '<footer class="foot">香港管理專業協會羅桂祥中學　公民與社會發展科<br>內容依據《公民與社會發展科課程及評估指引（中四至中六）》及現代教育研究社課本<br>學習紀錄只儲存在這部裝置的瀏覽器內</footer>';
  };

  V.themes = function () {
    return '<h1>主題學習區</h1><p class="mute">3 個主題・10 個課題・29 個學習重點</p>' + CSD.themes.map(function (t) {
      return '<div class="sec"><h2>主題' + t.id + '　' + t.title + '</h2><span class="tag navy">' + t.form + '</span></div><div class="card"><ul class="list">' +
        t.units.map(function (u) {
          var ready = !!CSD.units[u.id], p = unitPct(u.id);
          return '<li class="item' + (ready ? '' : ' off') + '">' + (ready ? '<a class="row grow" style="flex-wrap:nowrap" href="#/unit/' + u.id + '">' : '<div class="row grow" style="flex-wrap:nowrap">') +
            '<span class="ring" style="--p:' + p + '"><i>' + u.id + '</i></span><span class="grow"><b>' + u.title + '</b><br><span class="mute">' + u.lps.length + ' 個學習重點' + (ready ? '・完成 ' + p + '%' : '・製作中') + '</span></span>' +
            (ready ? '<span class="chev">›</span></a>' : '</div>') + '</li>';
        }).join('') + '</ul></div>';
    }).join('');
  };

  V.unit = function (uid) {
    var u = CSD.units[uid]; if (!u) return V.themes();
    var meta; CSD.themes.forEach(function (t) { t.units.forEach(function (x) { if (x.id === uid) meta = x; }); });
    return '<a class="back" href="#/themes">‹ 主題學習區</a><h1><span class="code">' + uid + '</span>　' + meta.title + '</h1>' +
      '<div class="bar" style="margin:10px 0 4px"><span style="width:' + unitPct(uid) + '%"></span></div><p class="mute">整體進度 ' + unitPct(uid) + '%　每個學習重點有七個步驟</p>' +
      (pending(uid) ? '<div class="pending">樣板單元：內容及新擬題目待老師審批。</div>' : '') +
      '<div class="card"><ul class="list">' + u.lps.map(function (l) {
        var d = lpDone(l.code), next = Math.min(d + 1, STEPS.length);
        return '<li class="item"><a class="row grow" style="flex-wrap:nowrap" href="#/lp/' + l.code + '/' + next + '"><span class="ring" style="--p:' + Math.round(d / STEPS.length * 100) + '"><i>' + d + '/7</i></span>' +
          '<span class="grow"><span class="code">' + l.code + '</span><br><b>' + l.title + '</b><br><span class="mute">' + l.pages + '</span></span><span class="chev">›</span></a></li>';
      }).join('') + '</ul></div>';
  };

  V.lp = function (code, n) {
    var l = findLp(code); if (!l) return V.themes();
    n = Math.max(1, Math.min(STEPS.length, parseInt(n, 10) || 1));
    var st = STEPS[n - 1], done = S.steps[code] || [], body = '';
    S.last = { code: code, step: n }; save();

    if (st.key === 'intro') body = '<div class="card"><p>' + esc(l.intro.scene) + '</p><p class="ask">' + esc(l.intro.ask) + '</p><details><summary>給我一點提示</summary><div class="hint">' + esc(l.intro.hint) + '</div></details></div><p class="mute">不用急着找答案，帶着這個問題開始學習。</p>';
    if (st.key === 'goals') {
      var g = l.goals, li = function (a) { return '<ul class="pts">' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
      body = '<div class="card goal"><h3>知識</h3>' + li(g.k) + '<h3>技能</h3>' + li(g.s) + '<h3>價值觀</h3>' + li(g.v) + '</div><div class="card"><h3>問題導向</h3><p class="mute">學完後，你應該能回答：</p>' + li(g.q) + '</div>';
    }
    if (st.key === 'vocab') body = '<p class="mute">先猜意思，再點按翻開；記住了就按「已掌握」。</p>' + l.vocab.map(function (v) {
      return '<div class="flip' + (S.known[v.t] ? ' known' : '') + '" data-term="' + esc(v.t) + '" role="button" tabindex="0"><span class="k">點按翻開</span><span class="t">' + esc(v.t) + '</span><div class="d">' + esc(v.d) + '<br><button class="chip' + (S.known[v.t] ? ' on' : '') + '" data-known style="margin-top:8px">' + (S.known[v.t] ? '已掌握 ✓' : '已掌握') + '</button></div></div>';
    }).join('');
    if (st.key === 'notes') body = '<p class="mute">每張卡只講一件事，逐張讀。（' + l.pages + '）</p>' + l.notes.map(function (x, i) {
      return '<div class="card note"><span class="mute">' + (i + 1) + ' / ' + l.notes.length + '</span><h3>' + esc(x.h) + '</h3><ul class="pts">' + x.p.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' + (x.asOf ? '<div class="asof">資料日期：' + esc(x.asOf) + '</div>' : '') + '</div>';
    }).join('');
    if (st.key === 'organizer') {
      var o = l.organizer;
      body = '<div class="card"><h3>' + esc(o.title) + '</h3>' + (o.type === 'timeline'
        ? '<ol class="tl">' + o.rows.map(function (r) { return '<li><b>' + r[0] + '</b>' + esc(r[1]) + '</li>'; }).join('') + '</ol>'
        : '<div class="tw"><table><tr>' + o.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>' + o.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>') +
        '</div><p class="mute">試試合上畫面，憑記憶把這個圖表默寫一次。</p>';
    }
    if (st.key === 'quiz') body = (pending(l.unit) ? '<div class="pending">本頁為新擬題（待老師審批）。</div>' : '') + l.quiz.map(function (q, i) { return mcHtml(code + '-M' + (i + 1), q); }).join('');
    if (st.key === 'practice') {
      var src = null;
      body = l.practice.map(function (p) { if (p.src) src = p.src; return pracHtml(p, p.src || src, l, true); }).join('') +
        '<div class="card"><h3>重點溫習</h3><ul class="pts">' + l.recap.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>' +
        '';
      body = '<div class="sec"><h2>課本題目</h2></div>' + (l.tb || []).map(function (t) { return tbHtml(t, l); }).join('') + '<div class="sec"><h2>公開試模式新擬題</h2></div>' + body;
    }

    var isLast = n === STEPS.length;
    return '<a class="back" href="#/unit/' + l.unit + '">‹ ' + l.unit + ' 課題</a><div class="row between"><span class="code">' + code + '</span><span class="mute">' + l.pages + '</span></div><h2>' + l.title + '</h2>' +
      '<div class="steps">' + STEPS.map(function (s, i) { return '<a href="#/lp/' + code + '/' + (i + 1) + '" title="' + s.name + '" aria-label="第' + (i + 1) + '步 ' + s.name + '" class="' + (i + 1 === n ? 'now' : done.indexOf(i + 1) > -1 ? 'done' : '') + '"></a>'; }).join('') + '</div>' +
      '<div class="stephead"><b>第 ' + n + ' 步／共 7 步</b><h2>' + st.name + '</h2><span class="mute">' + st.desc + '</span></div>' + body +
      '<div class="stepnav">' + (n > 1 ? '<a class="btn ghost" href="#/lp/' + code + '/' + (n - 1) + '">‹ 上一步</a>' : '') +
      '<button class="btn" data-next="' + code + '|' + n + '">' + (isLast ? '完成這個學習重點 ✓' : '完成，下一步 ›') + '</button></div>';
  };

  V.done = function (code) {
    var l = findLp(code), u = CSD.units[l.unit], i = u.lps.indexOf(l), nx = u.lps[i + 1];
    return '<div class="card done-box"><div class="big">🎉</div><h1>完成 ' + code + '</h1><p>' + l.title + '</p>' +
      '<div class="row" style="justify-content:center;margin-top:14px">' + (nx ? '<a class="btn" href="#/lp/' + nx.code + '/1">下一個：' + nx.code + ' ›</a>' : '<a class="btn" href="#/training">到答題訓練營 ›</a>') +
      '<a class="btn ghost" href="#/unit/' + l.unit + '">返回課題</a></div></div>';
  };

  var cf = { q: '', only: false };
  V.concepts = function () {
    var items = []; allLps().forEach(function (l) { l.vocab.forEach(function (v) { items.push({ v: v, lp: l }); }); });
    var show = items.filter(function (x) { return (!cf.q || (x.v.t + x.v.d).indexOf(cf.q) > -1) && (!cf.only || !S.known[x.v.t]); });
    return '<h1>概念庫</h1><p class="mute">共 ' + items.length + ' 個概念・已掌握 ' + items.filter(function (x) { return S.known[x.v.t]; }).length + ' 個</p>' +
      '<input type="search" id="cq" placeholder="搜尋概念，例如：主權" value="' + esc(cf.q) + '">' +
      '<div class="filters" style="margin-top:8px"><button class="chip' + (cf.only ? '' : ' on') + '" data-conly="0">全部</button><button class="chip' + (cf.only ? ' on' : '') + '" data-conly="1">只看未掌握</button></div>' +
      '<div id="clist">' + (show.length ? show.map(function (x) {
        return '<div class="flip' + (S.known[x.v.t] ? ' known' : '') + '" data-term="' + esc(x.v.t) + '" role="button" tabindex="0"><span class="k code">' + x.lp.code + '</span><span class="t">' + esc(x.v.t) + '</span><div class="d">' + esc(x.v.d) + '<br><button class="chip' + (S.known[x.v.t] ? ' on' : '') + '" data-known style="margin-top:8px">' + (S.known[x.v.t] ? '已掌握 ✓' : '已掌握') + '</button>　<a class="mute" href="#/lp/' + x.lp.code + '/3">前往 ' + x.lp.code + ' ›</a></div></div>';
      }).join('') : '<p class="mute">找不到相關概念。</p>') + '</div>';
  };

  var tf = { type: '全部', lv: '全部', lp: '全部' };
  V.training = function () {
    var qs = allQuestions(), codes = ['全部'].concat(allLps().map(function (l) { return l.code; }));
    var show = qs.filter(function (q) { return (tf.type === '全部' || q.type === tf.type) && (tf.lv === '全部' || q.lv === tf.lv) && (tf.lp === '全部' || q.lp.code === tf.lp); });
    function chips(k, arr) { return '<div class="filters">' + arr.map(function (a) { return '<button class="chip' + (tf[k] === a ? ' on' : '') + '" data-tf="' + k + '|' + a + '">' + a + '</button>'; }).join('') + '</div>'; }
    return '<h1>答題訓練營</h1><p class="mute">按公開試資料回應題模式：多項選擇題、短題目、短文章式問題</p>' +
      chips('type', ['全部', '課本題目', '多項選擇題', '短題目', '短文章式問題']) + chips('lv', ['全部', '基礎', '進階', '挑戰']) + chips('lp', codes) +
      '<p class="mute">共 ' + show.length + ' 項（課本題目以一組資料為一項）</p>' +
      show.map(function (q) { return q.type === '課本題目' ? tbHtml(q.d, q.lp) : q.type === '多項選擇題' ? mcHtml(q.id, q.d) + (pending(q.lp.unit) ? '<div class="pending" style="margin-top:-6px">來源：新擬題（待老師審批）・學習重點 ' + q.lp.code + '</div>' : '') : pracHtml(q.d, q.src, q.lp); }).join('');
  };

  /* ── 路由 ── */
  /* 在網站上用網址 # 記錄頁面（可用返回鍵）；在預覽框內則改用記憶體路由，避免連結失效 */
  var useHash = false, route = '/';
  try { useHash = window.self === window.top && /^(https?|file):$/.test(location.protocol); } catch (e) {}
  if (useHash && location.hash) route = location.hash.slice(1);
  function nav(p) { route = p; if (useHash) { location.hash = '#' + p; } else { go(); } }
  function render() {
    var h = route.slice(1).split('/'), name = h[0] || 'home';
    var html = name === 'unit' ? V.unit(h[1]) : name === 'lp' ? V.lp(h[1], h[2]) : name === 'done' ? V.done(h[1]) : (V[name] || V.home)();
    app.innerHTML = html;
    var tab = name === 'unit' || name === 'lp' || name === 'done' ? 'themes' : name;
    Array.prototype.forEach.call(document.querySelectorAll('.tabs a'), function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === tab); });
  }
  function go() { render(); window.scrollTo(0, 0); }
  window.addEventListener('hashchange', function () { if (useHash) { route = location.hash.slice(1) || '/'; go(); } });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (a) { e.preventDefault(); nav(a.getAttribute('href').slice(1)); }
  });

  /* ── 互動 ── */
  function findMc(id) {
    var hit = null;
    allQuestions().forEach(function (q) {
      if (q.id === id) hit = q.d;
      if (q.type === '課本題目') q.d.parts.forEach(function (p) { if (p.o && q.d.id + p.n === id) hit = p; });
    });
    return hit;
  }
  app.addEventListener('click', function (e) {
    var t = e.target, el;
    if ((el = t.closest('[data-known]'))) { var term = el.closest('.flip').getAttribute('data-term'); if (S.known[term]) delete S.known[term]; else S.known[term] = 1; save(); var y = window.scrollY; render(); window.scrollTo(0, y); return; }
    if ((el = t.closest('.flip')) && !t.closest('a')) { el.classList.toggle('open'); return; }
    if ((el = t.closest('.opt'))) { var id = el.closest('[data-mc]').getAttribute('data-mc'), q = findMc(id), i = +el.getAttribute('data-i'); S.quiz[id] = { pick: i, ok: i === q.a }; save(); keep(); return; }
    if ((el = t.closest('[data-retry]'))) { delete S.quiz[el.getAttribute('data-retry')]; save(); keep(); return; }
    if ((el = t.closest('[data-self]'))) { S.prac[el.closest('[data-prac]').getAttribute('data-prac')] = el.getAttribute('data-self'); save(); Array.prototype.forEach.call(el.parentNode.children, function (c) { c.classList.toggle('on', c === el); }); return; }
    if ((el = t.closest('[data-next]'))) { var a = el.getAttribute('data-next').split('|'), n = +a[1]; var d = S.steps[a[0]] = S.steps[a[0]] || []; if (d.indexOf(n) < 0) d.push(n); save(); nav(n === STEPS.length ? '/done/' + a[0] : '/lp/' + a[0] + '/' + (n + 1)); return; }
    if ((el = t.closest('[data-tf]'))) { var p = el.getAttribute('data-tf').split('|'); tf[p[0]] = p[1]; keep(); return; }
    if ((el = t.closest('[data-conly]'))) { cf.only = el.getAttribute('data-conly') === '1'; keep(); return; }
  });
  function keep() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  app.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('flip')) { e.preventDefault(); e.target.classList.toggle('open'); } });
  app.addEventListener('input', function (e) {
    if (e.target.id === 'cq') { cf.q = e.target.value.trim(); var tmp = document.createElement('div'); tmp.innerHTML = V.concepts(); document.getElementById('clist').innerHTML = tmp.querySelector('#clist').innerHTML; }
    var k = e.target.getAttribute && e.target.getAttribute('data-ans'); if (k) { S.ans[k] = e.target.value; save(); }
  });

  render();
})();
