package com.instrument.launcher

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactApplication

/**
 * NotificationListenerService — reads real device notifications.
 * The user must grant "Notification Access" in system settings.
 */
class NotificationService : NotificationListenerService() {

    companion object {
        var instance: NotificationService? = null
            private set

        fun getActiveNotifs(): WritableArray {
            val result = Arguments.createArray()
            val svc = instance ?: return result
            try {
                val notifications = svc.activeNotifications ?: return result
                for (sbn in notifications) {
                    val map = sbnToMap(sbn)
                    if (map != null) {
                        result.pushMap(map)
                    }
                }
            } catch (e: Exception) {
                // Service might not be connected
            }
            return result
        }

        fun getNotificationCount(): Int {
            return try {
                instance?.activeNotifications?.size ?: 0
            } catch (e: Exception) {
                0
            }
        }

        fun dismissNotification(key: String) {
            try {
                instance?.cancelNotification(key)
            } catch (e: Exception) {
                // ignore
            }
        }

        fun dismissAll() {
            try {
                instance?.cancelAllNotifications()
            } catch (e: Exception) {
                // ignore
            }
        }

        private fun sbnToMap(sbn: StatusBarNotification): WritableMap? {
            val notification = sbn.notification ?: return null
            val extras = notification.extras ?: return null

            val map = Arguments.createMap()
            map.putString("key", sbn.key)
            map.putString("packageName", sbn.packageName)
            map.putDouble("postTime", sbn.postTime.toDouble())

            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""

            map.putString("title", title)
            map.putString("text", text)
            map.putString("subText", subText)
            map.putBoolean("isOngoing", sbn.isOngoing)
            map.putBoolean("isClearable", sbn.isClearable)

            return map
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        instance = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        emitEvent("onNotificationPosted")
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
        emitEvent("onNotificationRemoved")
    }

    private fun emitEvent(eventName: String) {
        try {
            val app = application as? ReactApplication ?: return
            val reactContext = app.reactNativeHost.reactInstanceManager
                .currentReactContext ?: return
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, null)
        } catch (e: Exception) {
            // React context might not be ready
        }
    }
}
