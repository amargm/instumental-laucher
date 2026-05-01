package com.instrument.launcher

import android.content.Intent
import android.os.BatteryManager
import android.media.AudioManager
import android.net.wifi.WifiManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.content.Context
import android.content.IntentFilter
import android.provider.Settings
import com.facebook.react.bridge.*

/**
 * Native module exposing real device info (battery, connectivity)
 * and proper system intent launches (no reflection hacks).
 */
class DeviceInfoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "InstrumentDeviceInfo"

    @ReactMethod
    fun getBatteryInfo(promise: Promise) {
        try {
            val bm = reactApplicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            val isCharging = bm.isCharging

            val iFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus = reactApplicationContext.registerReceiver(null, iFilter)
            val temperature = (batteryStatus?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0) / 10

            val result = Arguments.createMap()
            result.putInt("level", level)
            result.putBoolean("isCharging", isCharging)
            result.putInt("temperature", temperature)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getConnectivityInfo(promise: Promise) {
        try {
            val cm = reactApplicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = cm.activeNetwork
            val caps = cm.getNetworkCapabilities(network)

            val result = Arguments.createMap()
            result.putBoolean("isConnected", network != null && caps != null)
            result.putBoolean("isWifi", caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true)
            result.putBoolean("isCellular", caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true)

            // WiFi name (SSID) — requires location permission on Android 8.1+
            if (caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true) {
                try {
                    val wm = reactApplicationContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                    val info = wm.connectionInfo
                    result.putString("wifiName", info.ssid?.replace("\"", "") ?: "")
                } catch (e: Exception) {
                    result.putString("wifiName", "")
                }
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getNotificationCount(promise: Promise) {
        val count = NotificationService.getNotificationCount()
        promise.resolve(count)
    }

    @ReactMethod
    fun getNotifications(promise: Promise) {
        val notifications = NotificationService.getActiveNotifs()
        promise.resolve(notifications)
    }

    @ReactMethod
    fun dismissNotification(key: String, promise: Promise) {
        NotificationService.dismissNotification(key)
        promise.resolve(true)
    }

    @ReactMethod
    fun dismissAllNotifications(promise: Promise) {
        NotificationService.dismissAll()
        promise.resolve(true)
    }

    @ReactMethod
    fun isNotificationAccessGranted(promise: Promise) {
        val enabled = Settings.Secure.getString(
            reactApplicationContext.contentResolver,
            "enabled_notification_listeners"
        )
        val granted = enabled?.contains(reactApplicationContext.packageName) == true
        promise.resolve(granted)
    }

    // ─── System Intent Launchers (policy-compliant, no reflection) ───

    @ReactMethod
    fun openNotificationListenerSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openWifiSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_WIFI_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openBluetoothSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openLocationSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openNfcSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NFC_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openDisplaySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_DISPLAY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openDoNotDisturbSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ZEN_MODE_PRIORITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openCastSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_CAST_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // Required for NativeEventEmitter on Android
    @ReactMethod
    fun addListener(eventName: String) {
        // No-op: Required for RN NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // No-op: Required for RN NativeEventEmitter
    }

    @ReactMethod
    fun isHeadphonesConnected(promise: Promise) {
        try {
            val am = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val devices = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
            val hasHeadphones = devices.any { device ->
                device.type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                device.type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                device.type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                device.type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                device.type == android.media.AudioDeviceInfo.TYPE_USB_HEADSET
            }
            promise.resolve(hasHeadphones)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getConnectedAudioDevice(promise: Promise) {
        try {
            val am = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val devices = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
            val headphoneTypes = setOf(
                android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET,
                android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
                android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
                android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
                android.media.AudioDeviceInfo.TYPE_USB_HEADSET
            )
            val device = devices.firstOrNull { it.type in headphoneTypes }
            if (device != null) {
                val result = Arguments.createMap()
                result.putBoolean("connected", true)
                val name = device.productName?.toString() ?: ""
                result.putString("name", name)
                val type = when (device.type) {
                    android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
                    android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "bluetooth"
                    android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET,
                    android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "wired"
                    android.media.AudioDeviceInfo.TYPE_USB_HEADSET -> "usb"
                    else -> "unknown"
                }
                result.putString("type", type)
                promise.resolve(result)
            } else {
                val result = Arguments.createMap()
                result.putBoolean("connected", false)
                result.putString("name", "")
                result.putString("type", "none")
                promise.resolve(result)
            }
        } catch (e: Exception) {
            val result = Arguments.createMap()
            result.putBoolean("connected", false)
            result.putString("name", "")
            result.putString("type", "none")
            promise.resolve(result)
        }
    }
}
