# Student.social native Android app

This folder contains the native Kotlin and Jetpack Compose Android client. It is not a WebView, Custom Tab, or Trusted Web Activity. The app renders its own Android interface and uses `https://studentssocial.vercel.app` only for authenticated JSON APIs and signed release downloads.

## Release checklist

1. Back up `android.keystore` and its passwords securely. Every update must use the same package ID and signing key.
2. Increase `versionCode` and `versionName` in `app/build.gradle`.
3. Update `public/mobile/app-release.json` with the same version and the stable APK URL.
4. Build `assembleRelease`, zip-align the output, and sign it with `apksigner`.
5. Verify the signature and APK manifest, then publish the signed APK at `/downloads/student-social-latest.apk`.

The native client checks the release descriptor after sign-in. A higher version code displays an update card and uses Android's package installer to apply the signed update.

The launcher app link is verified for `studentssocial.vercel.app`, so call and Student.social links open the native activity when Android has verified the domain association.
