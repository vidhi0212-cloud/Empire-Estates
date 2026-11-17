import { firebaseConfig } from './firebase-config.js';
const B = 'https://www.gstatic.com/firebasejs/10.12.2/';
const g = id => document.getElementById(id);
const setS = t => { g('sync').textContent = t; };
const cfgOk = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('YOUR_');
if (!cfgOk) setS('Saved on this device only. Add your Firebase settings to turn on sync.');
else { try { await run(); } catch (e) { console.error(e); setS('Saved on this device only'); } }

async function run() {
  setS('Connecting\u2026');
  const [A, Au, F] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')]);
  const app = A.initializeApp(firebaseConfig), auth = Au.getAuth(app);
  const db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  let unsub = null, wt = null, skipped = false;
  try { skipped = localStorage.getItem('ee-skip') === '1'; } catch (e) {}
  const show = v => { g('auth').hidden = !v; };
  const blank = () => ({ routine: [], rd: {}, goals: [], todos: {}, money: {}, dumps: {}, week: {} });
  const msg = e => ({
    'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email.', 'auth/email-already-in-use': 'That email already has an account. Try signing in.',
    'auth/weak-password': 'Use at least 6 characters.', 'auth/invalid-email': 'That email does not look right.',
    'auth/network-request-failed': 'No connection. Try again online.', 'auth/operation-not-allowed': 'Email sign-in is not switched on in Firebase yet.',
    'auth/unauthorized-domain': 'Add this site to Authorized domains in Firebase.'
  }[e.code] || 'Something went wrong. Try again.');

  function start(user) {
    const ref = F.doc(db, 'users', user.uid, 'data', 'state');
    let linked = false, done = false;
    try { linked = localStorage.getItem('ee-uid') === user.uid; } catch (e) {}
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
    const push = () => {
      clearTimeout(wt); setS('Saving\u2026');
      wt = setTimeout(async () => {
        try { S._u = S._u || Date.now(); await F.setDoc(ref, { json: JSON.stringify(S), u: S._u }); setS('Synced across your devices'); }
        catch (e) { setS('Sync paused. Saved on this device.'); }
      }, 600);
    };
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
  function stop() { if (unsub) unsub(); unsub = null; syncPush = () => {}; }

  Au.onAuthStateChanged(auth, user => {
    stop();
    g('signout').hidden = !user; g('signin').hidden = !!user;
    if (user) { show(false); setS('Connecting\u2026'); start(user); }
    else { setS('Saved on this device only'); show(!skipped); }
  });
  g('af').addEventListener('submit', async e => {
    e.preventDefault(); e.stopPropagation(); g('aerr').textContent = '';
    try { await Au.signInWithEmailAndPassword(auth, g('em').value.trim(), g('pw').value); } catch (x) { g('aerr').textContent = msg(x); }
  });
  g('acreate').addEventListener('click', async () => {
    g('aerr').textContent = '';
    if (!g('em').value || !g('pw').value) { g('aerr').textContent = 'Enter an email and password.'; return; }
    try { await Au.createUserWithEmailAndPassword(auth, g('em').value.trim(), g('pw').value); } catch (x) { g('aerr').textContent = msg(x); }
  });
  g('askip').addEventListener('click', () => { skipped = true; try { localStorage.setItem('ee-skip', '1'); } catch (e) {} show(false); });
  g('signin').addEventListener('click', () => show(true));
  g('signout').addEventListener('click', async () => { skipped = false; try { localStorage.removeItem('ee-skip'); } catch (e) {} await Au.signOut(auth); });
}
