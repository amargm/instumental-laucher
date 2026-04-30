package com.instrument.launcher

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream

class InstalledAppsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var packageReceiver: BroadcastReceiver? = null

    override fun getName(): String = "InstalledApps"

    override fun initialize() {
        super.initialize()
        registerPackageReceiver()
    }

    override fun invalidate() {
        super.invalidate()
        unregisterPackageReceiver()
    }

    private fun registerPackageReceiver() {
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_PACKAGE_ADDED)
            addAction(Intent.ACTION_PACKAGE_REMOVED)
            addAction(Intent.ACTION_PACKAGE_REPLACED)
            addDataScheme("package")
        }
        packageReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                emitEvent("onAppsChanged")
            }
        }
        reactApplicationContext.registerReceiver(packageReceiver, filter)
    }

    private fun unregisterPackageReceiver() {
        packageReceiver?.let {
            try {
                reactApplicationContext.unregisterReceiver(it)
            } catch (e: Exception) {}
        }
        packageReceiver = null
    }

    private fun emitEvent(eventName: String) {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, null)
        } catch (e: Exception) {}
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    @ReactMethod
    fun getApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val intent = Intent(Intent.ACTION_MAIN, null)
            intent.addCategory(Intent.CATEGORY_LAUNCHER)

            val apps: List<ResolveInfo> = pm.queryIntentActivities(intent, 0)
            val result = Arguments.createArray()

            for (app in apps) {
                val appInfo = Arguments.createMap()
                val packageName = app.activityInfo.packageName
                val label = app.loadLabel(pm).toString()

                appInfo.putString("name", label)
                appInfo.putString("packageName", packageName)
                // No icon here — fetched lazily via getAppIcon()
                appInfo.putString("icon", "")

                result.pushMap(appInfo)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getAppIcon(packageName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            val icon = pm.getApplicationIcon(appInfo)
            val bitmap = drawableToBitmap(icon)
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 48, 48, true)
            val stream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.PNG, 70, stream)
            val base64Icon = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
            scaledBitmap.recycle()
            promise.resolve(base64Icon)
        } catch (e: Exception) {
            promise.resolve("")
        }
    }

    @ReactMethod
    fun launchApp(packageName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val launchIntent = pm.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(launchIntent)
                promise.resolve(true)
            } else {
                promise.reject("NOT_FOUND", "App not found: $packageName")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAppSettings(packageName: String, promise: Promise) {
        try {
            val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = android.net.Uri.parse("package:$packageName")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun uninstallApp(packageName: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_DELETE)
            intent.data = android.net.Uri.parse("package:$packageName")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openSystemSettings(promise: Promise) {
        try {
            val intent = Intent(android.provider.Settings.ACTION_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun expandNotificationPanel(promise: Promise) {
        // Removed: reflection-based StatusBarManager hack violates Play Store policy.
        // Use DeviceInfo.openNotificationListenerSettings() instead.
        promise.reject("DEPRECATED", "Use DeviceInfo module for notification access")
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable) {
            return drawable.bitmap
        }
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 64
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 64
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }
}
