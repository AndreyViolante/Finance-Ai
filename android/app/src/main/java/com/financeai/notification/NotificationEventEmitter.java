package com.financeai.notification;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Singleton bridge that forwards notification events to the React Native JS layer.
 * NotificationModule registers the ReactContext here on creation.
 */
public class NotificationEventEmitter {

    private static final String TAG = "NotifEventEmitter";
    public static final String EVENT_NAME = "onBankNotification";

    private static volatile ReactApplicationContext reactContext;

    public static void setReactContext(ReactApplicationContext ctx) {
        reactContext = ctx;
    }

    public static void emit(
        String packageName,
        String appName,
        String title,
        String text,
        long timestamp
    ) {
        ReactApplicationContext ctx = reactContext;
        if (ctx == null || !ctx.hasActiveCatalystInstance()) {
            Log.w(TAG, "ReactContext not ready, dropping event");
            return;
        }

        WritableMap payload = Arguments.createMap();
        payload.putString("packageName", packageName);
        payload.putString("appName",     appName);
        payload.putString("title",       title);
        payload.putString("text",        text);
        payload.putDouble("timestamp",   (double) timestamp);

        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
           .emit(EVENT_NAME, payload);
    }
}
