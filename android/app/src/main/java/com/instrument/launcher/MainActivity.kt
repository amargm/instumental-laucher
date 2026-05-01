package com.instrument.launcher

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "InstrumentLauncher"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * When the app is already running and the user presses the Home button,
   * Android sends a new intent with ACTION_MAIN + CATEGORY_HOME.
   * For a launcher, we should just bring the existing task to front
   * (which singleTask already does) and NOT recreate the activity.
   * We also emit a "home_pressed" event to React Native so the JS side
   * can navigate back to the Home screen.
   */
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)

    // Notify React Native when the user presses Home while we're the default launcher
    if (intent?.hasCategory(Intent.CATEGORY_HOME) == true) {
      try {
        val reactContext = reactInstanceManager?.currentReactContext
        reactContext?.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit("onHomePressed", null)
      } catch (e: Exception) {
        // React context might not be ready yet — safe to ignore
      }
    }
  }

  /**
   * Prevent the launcher from being finished when the user presses back
   * from the root. A launcher should never close — it IS the home screen.
   */
  override fun onBackPressed() {
    // Only move to back if there are no fragments or React screens to pop
    moveTaskToBack(true)
  }
}
