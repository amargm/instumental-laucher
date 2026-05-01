package com.instrument.launcher

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.OnBackPressedCallback
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  private val handler = Handler(Looper.getMainLooper())
  private var pendingHomePress = false

  override fun getMainComponentName(): String = "InstrumentLauncher"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Safety-net back handler (lowest priority — added first, evaluated last).
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        moveTaskToBack(true)
      }
    })
  }

  /**
   * When the app is already running and the user presses the Home button,
   * Android sends a new intent with ACTION_MAIN + CATEGORY_HOME.
   * We emit "onHomePressed" to React Native. If the bridge isn't ready,
   * we retry a few times with short delays.
   */
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)

    if (intent?.hasCategory(Intent.CATEGORY_HOME) == true) {
      emitHomePressedWithRetry(0)
    }
  }

  private fun emitHomePressedWithRetry(attempt: Int) {
    try {
      val reactContext = reactInstanceManager?.currentReactContext
      if (reactContext != null) {
        reactContext.getJSModule(
          com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
        )?.emit("onHomePressed", null)
        pendingHomePress = false
      } else if (attempt < 5) {
        // Bridge not ready — retry after increasing delay (100, 200, 400, 800, 1600ms)
        pendingHomePress = true
        handler.postDelayed({ emitHomePressedWithRetry(attempt + 1) }, 100L * (1 shl attempt))
      } else {
        pendingHomePress = false
      }
    } catch (e: Exception) {
      if (attempt < 3) {
        handler.postDelayed({ emitHomePressedWithRetry(attempt + 1) }, 200)
      }
    }
  }
}
