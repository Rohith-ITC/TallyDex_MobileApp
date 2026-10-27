package com.itcatalyst.tallydex

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

/**
 * Exposes android/app/build.gradle defaultConfig.versionName / versionCode to
 * JavaScript (src/config/appVersion.ts), so the version shown in the app is
 * always the one the APK was built with.
 */
class AppVersionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  override fun getConstants(): Map<String, Any> =
      mapOf(
          "versionName" to BuildConfig.VERSION_NAME,
          "versionCode" to BuildConfig.VERSION_CODE,
      )

  companion object {
    const val NAME = "AppVersionModule"
  }
}
