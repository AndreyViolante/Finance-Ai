package com.financeai.notification;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Exposes two methods to JS:
 *   - isNotificationListenerEnabled(): Promise<boolean>
 *   - openNotificationListenerSettings(): void
 */
public class NotificationModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "FinanceNotification";

    public NotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        // Register context so the service can emit events back to JS
        NotificationEventEmitter.setReactContext(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void isNotificationListenerEnabled(Promise promise) {
        try {
            String flat = Settings.Secure.getString(
                getReactApplicationContext().getContentResolver(),
                "enabled_notification_listeners"
            );
            boolean enabled = !TextUtils.isEmpty(flat)
                && flat.contains(getReactApplicationContext().getPackageName());
            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("CHECK_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void openNotificationListenerSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("OPEN_FAILED", e.getMessage());
        }
    }

    // Required for RN 0.65+ to avoid warnings about listeners
    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(Integer count) {}
}
