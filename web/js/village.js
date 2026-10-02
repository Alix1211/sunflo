// 플라워빌리지(마을) — 지도에서 가게를 누르면 가게 안(배경 + 사장님 + 메뉴창)으로 들어감
'use strict';
(() => {
  // 가게 자리 (그림 크기에 대한 비율 x1,y1,x2,y2)
  const SHOPS = [
    { id: 'seed',      name: '씨앗 가게', pad: [.09, .28, .22, .53], phone: [.02, .52, .41, .68] },
    { id: 'flower',    name: '꽃 도매상', pad: [.30, .27, .45, .52], phone: [.61, .44, .96, .59] },
    { id: 'general',   name: '잡화점',    pad: [.58, .28, .71, .52], phone: [.04, .25, .37, .39] },
    { id: 'furniture', name: '가구공방',  pad: [.77, .24, .96, .52], phone: [.61, .23, .96, .39] },
    { id: 'lock1', lock: true, pad: [.24, .05, .36, .25], phone: [.065, .10, .37, .22] },
    { id: 'lock2', lock: true, pad: [.44, .05, .57, .25], phone: [.39, .04, .65, .15] },
    { id: 'lock3', lock: true, pad: [.65, .05, .78, .25], phone: [.65, .10, .94, .22] },
  ];
  const SIDE = { seed: .72, flower: .72, general: .72, furniture: .26 };   // 가게 안 사장님 가로 위치
  const st = { from: 'garden', shop: null, line: '', face: 'n', btns: [], tw: 0 };
  const rectOf = s => { const r = s[G.mode]; return [r[0] * G.L.W, r[1] * G.L.H, (r[2] - r[0]) * G.L.W, (r[3] - r[1]) * G.L.H]; };
  function cover(im) {
    if (!im) { ctx.fillStyle = '#8fbf6a'; ctx.fillRect(0, 0, G.L.W, G.L.H); return; }
    const k = Math.max(G.L.W / im.width, G.L.H / im.height), w = im.width * k, h = im.height * k;
    ctx.drawImage(im, (G.L.W - w) / 2, (G.L.H - h) / 2, w, h);
  }
  const pd = () => G.mode === 'pad';
  function exitBtn(label, fn) {
    const r = pd() ? [G.L.W - 330, G.L.H - 150, 290, 110] : [G.L.W - 470, G.L.H - 200, 430, 150];
    button(r, label, { size: pd() ? 36 : 44 }); st.btns.push({ rect: r, fn });
  }
  function enterShop(s) {
    if (s.lock) { toast('아직 불이 꺼져 있어요. 언젠가 문을 열 거예요.'); return; }
    st.shop = s; st.face = 's'; st.line = '어서 오세요.'; st.tw = Date.now() + 1200; G.dirty = true;
  }
  function drawMap() {
    cover(G.img[pd() ? 'vil_map_pad' : 'vil_map_phone']);
    const fs = pd() ? 34 : 44;
    for (const s of SHOPS) {
      if (s.lock) continue;
      const [x, y, w, h] = rectOf(s), cx = x + w / 2, ty = y + h + (pd() ? 6 : 10);
      ctx.font = font(fs, 800); const tw = ctx.measureText(s.name).width + 36;
      rrect(cx - tw / 2, ty, tw, fs + 22, (fs + 22) / 2); ctx.fillStyle = 'rgba(255,248,232,.92)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#9b7148'; ctx.stroke();
      text(s.name, cx, ty + (fs + 22) / 2 + 2, fs, '#6e4b28', 'center');
    }
    exitBtn('돌아가기', () => go(st.from));
  }
  function drawShop() {
    const s = st.shop;
    cover(G.img['vil_st_' + s.id]);
    const im = G.img[`vil_kp_${s.id}_${Date.now() < st.tw ? 't' : st.face}`] || G.img[`vil_kp_${s.id}_n`];
    const panelY = pd() ? G.L.H * .70 : G.L.H * .62;
    if (im) {
      const h = pd() ? G.L.H * .62 : G.L.H * .32, w = h * im.width / im.height, cx = G.L.W * (pd() ? SIDE[s.id] : .5);
      ctx.drawImage(im, cx - w / 2, panelY - h, w, h);
    }
    const px = pd() ? 40 : 30, pw = G.L.W - px * 2, ph = G.L.H - panelY - (pd() ? 30 : 30);
    rrect(px, panelY, pw, ph, 34); ctx.fillStyle = 'rgba(255,248,232,.95)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#9b7148'; ctx.stroke();
    const fs = pd() ? 34 : 44;
    text(s.name, px + 40, panelY + 50, fs + 4, '#6e4b28', 'left');
    wrap(st.line, px + 40, panelY + 50 + fs + 20, pw - 80, fs, '#5c3d1e');
    st.btns = [];
    if (s.id === 'general') {
      const r = pd() ? [px + 40, G.L.H - 150, 360, 110] : [px + 40, G.L.H - 200, 520, 150];
      button(r, '물건 사기', { size: pd() ? 36 : 44 }); st.btns.push({ rect: r, fn: () => go('shop') });
    } else {
      text('가게 준비 중이에요. 곧 문을 열어요.', px + 40, pd() ? G.L.H - 95 : G.L.H - 125, fs - 4, '#9b7a55', 'left');
    }
    exitBtn('마을로', () => { st.shop = null; G.dirty = true; });
  }
  G.screens.village = {
    onEnter(prev) { if (prev && prev !== 'shop') { st.from = prev; st.shop = null; } },
    busy: () => !!st.shop && Date.now() < st.tw + 50,
    draw() { st.btns = []; if (st.shop) drawShop(); else drawMap(); },
    up(p, tap) {
      if (!tap) return;
      for (let i = st.btns.length - 1; i >= 0; i--) if (inRect(p, st.btns[i].rect)) { st.btns[i].fn(); G.dirty = true; return; }
      if (st.shop) { st.face = 'n'; st.line = '천천히 둘러보세요.'; st.tw = Date.now() + 1000; G.dirty = true; return; }
      const s = SHOPS.find(o => inRect(p, rectOf(o))); if (s) enterShop(s);
    },
  };
  BUTTONS.village = [];
})();
