// 문선농장 — 방: 그림 속 물건을 눌러 《천천히, 오늘》 기능을 여는 방
'use strict';
(() => {
  // 눌리는 물건 (그림 크기에 대한 비율: x1,y1,x2,y2). 물건보다 넉넉하게 잡음
  // 썬플로: 기록 물건은 누르지 않고, 달력과 탁자 위 게임기만 눌림
  const OBJ = {
    pad: [
      { id: 'game',     name: '게임기',  r: [.10, .26, .30, .42] },     // 동그란 탁자 위 게임기
      { id: 'calendar', name: '달력',    r: [.905, .31, 1.0, .46] },
    ],
    phone: [
      { id: 'game',     name: '게임기',  r: [.06, .42, .48, .53] },
      { id: 'calendar', name: '달력',    r: [.84, .325, 1.0, .40] },
    ],
  };
  const OBJ_NEW_PHONE = OBJ.phone;
  const soundRect = () => { const b = backupRect(); return [b[0] - b[2] - 16, b[1], b[2], b[3]]; };
  function openSound() {
    openPopup({
      title: '소리 · 진동',
      draw(r) {
        this.btns = []; const [x, y, w] = r, pd = G.mode === 'pad', bh = pd ? 90 : 130, fs = pd ? 38 : 44, o = G.S.opt || {};
        [['snd', '효과음'], ['vib', '진동'], ['bgm', '잔잔한 배경음악']].forEach(([k, nm], i) => {
          const rc = [x, y + 20 + i * (bh + 22), w, bh];
          button(rc, `${nm}  :  ${o[k] ? '켜짐' : '꺼짐'}`, { size: fs, active: !!o[k] });
          this.btns.push({ rect: rc, fn: () => SFX.toggle(k) });
        });
        const tr = [x, y + 20 + 3 * (bh + 22), w, bh];
        button(tr, '진동 시험해 보기', { size: fs });
        this.btns.push({ rect: tr, fn: () => { const wasOn = G.S.opt.vib; G.S.opt.vib = 1; SFX.vib('mixOk'); G.S.opt.vib = wasOn; this.info = (window.FarmBridge && FarmBridge.vibInfo ? FarmBridge.vibInfo() : '폰 앱이 아니라서 진동을 못 씁니다') + ' / 결과:' + (SFX.lastVib || '-'); } });
        const lr = [x, tr[1] + bh + 22, w, bh], lite = liteOn();          // 이 기기에만 저장(다른 기기·보관 파일엔 영향 없음)
        button(lr, `가벼운 화면(이 기기만)  :  ${lite ? '켜짐' : '꺼짐'}`, { size: fs, active: lite });
        this.btns.push({ rect: lr, fn: () => { try { localStorage.setItem('liteScreen', lite ? '0' : '1'); } catch (e) {} resize(); } });
        if (this.info) wrap(this.info, x, lr[1] + bh + 20, w, pd ? 28 : 32, '#6e4b28');
      },
    });
  }
  const roomStage = gardenStage;                          // 정원과 같은 시간표
  const newPhone = () => false;                         // 썬플로 방 그림은 낮·저녁·밤 구도가 같음
  const objs = () => newPhone() ? OBJ_NEW_PHONE : OBJ[G.mode];
  const SOON = { calendar: '달력' };
  const rects = () => objs().map(o => ({ ...o, rc: [o.r[0] * G.L.W, o.r[1] * G.L.H, (o.r[2] - o.r[0]) * G.L.W, (o.r[3] - o.r[1]) * G.L.H] }));
  const backupRect = () => { const [sx, sy, sw, sh] = G.L.save; return [sx + sw - 300, sy + sh + 10, 300, G.mode === 'pad' ? 70 : 84]; };
  function open(id) {
    if (id === 'voice') return openDiary();
    if (id === 'today') return openToday();
    if (id === 'calendar') return openCalendar();
    if (id === 'game') return openMini();
  }
  // 미니게임 「꽃밭 서바이벌」: 1분 버틸 때마다 다이아 1개, 하루 3개까지(그 뒤로도 게임은 계속 가능)
  const MINI_CAP = 3;
  function miniLeft() { const S = G.S, d = todayKey(); if (!S.mini || S.mini.day !== d) S.mini = { day: d, got: 0 }; return Math.max(0, MINI_CAP - S.mini.got); }
  function openMini() {
    if (document.getElementById('miniFrame')) return;
    const f = document.createElement('iframe'); f.id = 'miniFrame'; f.src = 'minigame.html?embed=1&left=' + miniLeft();
    f.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:50;background:#5d8a3a';
    document.body.appendChild(f);
    if (typeof SFX !== 'undefined' && SFX.bgmPause) SFX.bgmPause();
  }
  window.addEventListener('message', e => {
    const m = e.data || {};
    if (m.type === 'mini-end') {
      const give = Math.min(Math.max(0, m.give | 0), miniLeft());
      if (give > 0) { G.S.mini.got += give; G.S.gems += give; save(); toast(`미니게임 다이아 +${give}`); }
      G.dirty = true;
    }
    if (m.type === 'mini-exit') { const f = document.getElementById('miniFrame'); if (f) f.remove(); G.dirty = true; }
  });
  function sparkle(x, y, s, ph) {                       // 눌러 보라는 은은한 반짝임
    const a = .45 + .4 * Math.sin(Date.now() / 420 + ph), k = s * (.8 + .2 * Math.sin(Date.now() / 420 + ph));
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.fillStyle = '#fffbe0'; ctx.shadowColor = 'rgba(255,220,120,.9)'; ctx.shadowBlur = s * .6 * (G.scale || 1);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.moveTo(0, -k); ctx.quadraticCurveTo(k * .14, -k * .14, k, 0); ctx.quadraticCurveTo(k * .14, k * .14, 0, k); }
    ctx.fill(); ctx.restore();
  }
  // 달해(가분수 캐릭터): 러그 위에 서 있고, 누르면 잠깐 다른 동작을 함
  const CH = { pad: { x: .47, y: .80, h: .54 }, phone: { x: .5, y: .70, h: .27 } };
  const REACT = ['wave', 'jump', 'cheer', 'flower', 'yawn'];
  let pose = 'stand', poseUntil = 0;
  function charRect() {
    const c = newPhone() ? { x: .5, y: .86, h: .30 } : CH[G.mode], im = G.img['sd_' + pose] || G.img.sd_stand; if (!im) return null;
    const h = c.h * G.L.H, w = h * im.width / im.height, x = c.x * G.L.W, y = c.y * G.L.H;
    return { im, x: x - w / 2, y: y - h, w, h, feet: [x, y] };
  }
  function drawChar() {
    if (pose !== 'stand' && Date.now() > poseUntil) pose = 'stand';
    const r = charRect(); if (!r) return;
    const t = Date.now() / 900, bob = pose === 'stand' ? Math.sin(t) * r.h * .006 : 0;
    ctx.save(); ctx.globalAlpha = .22; ctx.fillStyle = '#6b4a2a';             // 발밑 그림자
    ctx.beginPath(); ctx.ellipse(r.feet[0], r.feet[1] - r.h * .01, r.w * .32, r.h * .045, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.drawImage(r.im, r.x, r.y + bob, r.w, r.h);
  }
  G.screens.room = {
    busy: () => true,                                    // 반짝임 때문에 계속 그림
    draw() {
      const ev = nextEvent();
      cachedLayer('room', [roomStage(), !!G.img[`bg_room_${G.mode}_${roomStage()}`], Math.floor(G.now / 60000), G.savedAt, G.S.coins, G.S.gems, ev ? ev.time + ev.title : '', decorKey()].join('|'), () => {
        const st_ = roomStage(), im = G.img[`bg_room_${G.mode}${st_ ? '_' + st_ : ''}`] || G.img[`bg_room_${G.mode}`];
        if (im) ctx.drawImage(im, 0, 0, G.L.W, G.L.H);
        else { ctx.fillStyle = '#f1dcc0'; ctx.fillRect(0, 0, G.L.W, G.L.H); }
        drawDecor('room');
        drawTopInfo();
      });
      drawChar();
      { const b = backupRect(); button(b, '☁ 저장 보관', { size: G.mode === 'pad' ? 30 : 34 }); const c = soundRect(); button(c, '♪ 소리·진동', { size: G.mode === 'pad' ? 30 : 34 }); }
      const s = G.mode === 'pad' ? 34 : 40;
      rects().forEach((o, i) => sparkle(o.rc[0] + o.rc[2] * .5, o.rc[1] + o.rc[3] * .18, s, i * 1.7));
    },
    up(p, tap) {
      if (!tap) return;
      const cr = charRect();
      if (cr && p.x > cr.x && p.x < cr.x + cr.w && p.y > cr.y && p.y < cr.y + cr.h) {
        pose = REACT[Math.floor(Math.random() * REACT.length)]; poseUntil = Date.now() + 2200; G.dirty = true; return;
      }
      if (inRect(p, backupRect())) { openBackup(); return; }
      if (inRect(p, soundRect())) { openSound(); return; }
      const hit = rects().find(o => inRect(p, o.rc));
      if (hit) open(hit.id);
    },
    buttonOpt(id) { if (id === 'shop') return {}; return {}; },
    onButton(id) { if (SOON[id]) open(id); },
  };
})();
