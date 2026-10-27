package com.itcatalyst.tallydex

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers [AppVersionModule]. It is a plain (legacy) module; with
 * isTurboModule = false the New Architecture's interop layer serves it as is.
 */
class AppVersionPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == AppVersionModule.NAME) AppVersionModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        AppVersionModule.NAME to
            ReactModuleInfo(
                AppVersionModule.NAME,
                AppVersionModule::class.java.name,
                false, // canOverrideExistingModule
                false, // needsEagerInit
                false, // isCxxModule
                false, // isTurboModule
            ),
    )
  }
}
