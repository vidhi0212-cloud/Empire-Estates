# Empire Estates: turn on sync (about 10 minutes, free)

Menu names in the Firebase console can shift slightly, but the steps stay the same.

1. Go to console.firebase.google.com, choose Add project, name it (for example "empire-estates"). You can switch Google Analytics off.
2. Build > Authentication > Get started > Sign-in method > turn on **Email/Password**.
3. Build > Firestore Database > Create database. Pick a region close to you (for India, asia-south1 Mumbai) and start in production mode.
4. In Firestore, open the **Rules** tab, replace everything with the rules below, then Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/data/state {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['json', 'u'])
        && request.resource.data.json is string
        && request.resource.data.json.size() < 500000;
    }
  }
}
```

5. Project settings (gear icon) > Your apps > add a **Web app** (the </> icon). Copy the config values (apiKey, authDomain, projectId, appId) into `firebase-config.js`. These values are not secret; the rules above are what protect your data.
6. Upload this whole folder to an HTTPS host (Netlify Drop, GitHub Pages or Vercel).
7. Open the hosted link on your laptop and phone, create an account once, then sign in with the same email and password on the other device.

If sign-in shows an unauthorized-domain error, add your site's domain under Authentication > Settings > Authorized domains.
When you upload a new version, change `v2` to `v3` in `sw.js` so phones refresh.

Every person who opens your site can create their own account. Each account only ever reads and writes its own data, and signing out clears the saved copy from that device.
