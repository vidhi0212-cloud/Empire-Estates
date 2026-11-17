import { firebaseConfig } from './firebase-config.js';
const B = 'https://www.gstatic.com/firebasejs/10.12.2/';
const g = id => document.getElementById(id);
let who = '';
const setS = t => { g('sync').textContent = (who ? who + ' \u00b7 ' : '') + t; };
const cfgOk = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('YOUR_');
if (!cfgOk) setS('Saved on this device only. Add your Firebase settings to turn on sync.');
else { try { await run(); } catch (e) { console.error(e); setS('Saved on this device only'); } }

async function run() {
  setS('Connecting\u2026');
  const [A, Au, F] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')]);
  const app = A.initializeApp(firebaseConfig), auth = Au.getAuth(app);
  const db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  let unsub = null, wt = null, flush = async () => {}, skipped = false;
  try { skipped = localStorage.getItem('ee-skip') === '1'; } catch (e) {}
  const show = v => { g('auth').hidden = !v; };
  const say = (t, ok) => { const e = g('aerr'); e.style.color = ok ? 'var(--acc)' : 'var(--bad)'; e.textContent = t; };
  const blank = () => ({ routine: [], rd: {}, goals: [], todos: {}, money: {}, dumps: {}, week: {} });
  const msg = e => ({
    'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email.', 'auth/email-already-in-use': 'That email already has an account. Try signing in.',
    'auth/weak-password': 'Use at least 6 characters.', 'auth/invalid-email': 'That email does not look right.',
    'auth/network-request-failed': 'No connection. Try again online.', 'auth/operation-not-allowed': 'Email sign-in is not switched on in Firebase yet.',
    'auth/too-many-requests': 'Too many tries. Wait a bit and try again.', 'auth/unauthorized-domain': 'Add this site to Authorized domains in Firebase.'
  }[e.code] || 'Something went wrong. Try again.');

  function start(user) {
    const ref = F.doc(db, 'users', user.uid, 'data', 'state');
    let last = null, done = false;
    try { last = localStorage.getItem('ee-uid'); } catch (e) {}
    // A different person signed in on this device: never show or upload the previous person's data.
    if (last && last !== user.uid) { S = blank(); ed = null; try { localStorage.removeItem(K); } catch (e) {} render(); }
    const linked = last === user.uid;
    const apply = (snap, force) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (!d || !d.json || (!force && !(d.u > (S._u || 0)))) return;
      try {
        const R = JSON.parse(d.json);
        ed = null; S = Object.assign(blank(), R); S._u = d.u;
        try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {}
        render();
      } catch (e) {}
    };
    const write = async () => {
      try { S._u = S._u || Date.now(); await F.setDoc(ref, { json: JSON.stringify(S), u: S._u }); setS('Synced across your devices'); }
      catch (e) { setS('Sync paused. Saved on this device.'); }
    };
    const push = () => { clearTimeout(wt); setS('Saving\u2026'); wt = setTimeout(() => { wt = null; write(); }, 600); };
    flush = async () => { if (wt) { clearTimeout(wt); wt = null; await write(); } };
    syncPush = push;
    unsub = F.onSnapshot(ref, snap => {
      if (!done && !snap.metadata.fromCache) {
        done = true;
        const remote = snap.exists() ? (snap.data().u || 0) : -1;
        if (snap.exists() && !linked) apply(snap, true);
        else { apply(snap, false); if (remote < 0 || remote < (S._u || 0)) { S._u = S._u || Date.now(); push(); } }
        try { localStorage.setItem('ee-uid', user.uid); } catch (e) {}
      } else apply(snap, false);
      setS(snap.metadata.fromCache && !navigator.onLine ? 'Offline. Will sync when back online.' : 'Synced across your devices');
    }, () => setS('Sync paused. Saved on this device.'));
  }
  function stop() { clearTimeout(wt); wt = null; if (unsub) unsub(); unsub = null; syncPush = () => {}; flush = async () => {}; }

  Au.onAuthStateChanged(auth, user => {
    stop();
    who = user ? (user.email || '') : '';
    g('signout').hidden = !user; g('signin').hidden = !!user;
    if (user) { show(false); setS('Connecting\u2026'); start(user); }
    else { setS('Saved on this device only'); show(!skipped); }
  });
  g('af').addEventListener('submit', async e => {
    e.preventDefault(); e.stopPropagation(); say('');
    try { await Au.signInWithEmailAndPassword(auth, g('em').value.trim(), g('pw').value); } catch (x) { say(msg(x)); }
  });
  g('acreate').addEventListener('click', async () => {
    say('');
    if (!g('em').value || !g('pw').value) { say('Enter an email and password.'); return; }
    try { await Au.createUserWithEmailAndPassword(auth, g('em').value.trim(), g('pw').value); } catch (x) { say(msg(x)); }
  });
  g('aforgot').addEventListener('click', async () => {
    const m = g('em').value.trim();
    if (!m) { say('Type your email above first.'); return; }
    try { await Au.sendPasswordResetEmail(auth, m); say('Reset link sent. Check your inbox.', true); } catch (x) { say(msg(x)); }
  });
  g('askip').addEventListener('click', () => { skipped = true; try { localStorage.setItem('ee-skip', '1'); } catch (e) {} show(false); });
  g('signin').addEventListener('click', () => show(true));
  g('signout').addEventListener('click', async () => {
    await Promise.race([flush(), new Promise(r => setTimeout(r, 2500))]);
    skipped = false;
    try { localStorage.removeItem('ee-skip'); localStorage.removeItem('ee-uid'); localStorage.removeItem(K); } catch (e) {}
    S = blank(); ed = null; render();
    await Au.signOut(auth);
  });
}
