# Student.social Android release

This folder contains the reproducible Trusted Web Activity wrapper for the Student.social PWA.

## Release checklist

1. Back up `android.keystore` and its passwords securely. Every update must be signed with this same key.
2. Increase `appVersionCode` and `appVersionName` in `twa-manifest.json`.
3. Update `versionCode`, `versionName`, release notes, and `apkUrl` in `public/mobile/app-release.json`.
4. Regenerate the Android project with Bubblewrap, then build the signed APK.
5. Publish the APK at the stable URL in `app-release.json` and deploy the web update together.

The website checks the release descriptor without caching. Android wrapper sessions store their installed version code, so a newer descriptor produces an in-app **Download update** banner. Android will install the signed APK over the existing app when the package ID and signing key remain unchanged.

The Digital Asset Links file is served from `public/.well-known/assetlinks.json`. It must be deployed on `https://studentsocial.vercel.app` before the wrapper can run without the browser fallback UI.
