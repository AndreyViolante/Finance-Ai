package com.financeai.notification;

import android.app.Notification;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Listens to all system notifications and forwards bank-related ones to the RN layer
 * via NotificationEventEmitter. No polling — purely event-driven.
 */
public class FinanceNotificationService extends NotificationListenerService {

    private static final String TAG = "FinanceNotifService";

    // Package names of supported banks
    private static final Set<String> BANK_PACKAGES = new HashSet<>(Arrays.asList(
        "com.nu.production",          // Nubank
        "br.com.itau",                // Itaú
        "br.com.bradesco",            // Bradesco
        "br.com.bb.android",          // Banco do Brasil
        "br.com.santander.benfico",   // Santander
        "br.com.inter",               // Inter
        "com.c6bank.app",             // C6 Bank
        "com.picpay",                 // PicPay
        "br.com.original.bank",       // Banco Original
        "com.stone.banking",          // Stone
        "com.pagbank"                 // PagBank
    ));

    // Keywords that indicate a purchase/debit transaction
    private static final String[] PURCHASE_KEYWORDS = {
        "compra aprovada", "compra realizada", "compra no", "compra em",
        "débito", "debitado", "gasto de", "gasto no", "pagamento realizado",
        "transação aprovada", "purchase", "r$", "reais"
    };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();

        if (!isRelevantNotification(sbn, packageName)) return;

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        if (extras == null) return;

        String title = extras.getString(Notification.EXTRA_TITLE, "");
        String text  = extras.getString(Notification.EXTRA_TEXT, "");
        String bigText = extras.getString(Notification.EXTRA_BIG_TEXT, "");

        // Prefer bigText when available (contains more detail)
        String fullText = bigText != null && !bigText.isEmpty() ? bigText : text;

        if (!containsPurchaseKeyword(title + " " + fullText)) return;

        String appName = getAppName(packageName);
        long timestamp = sbn.getPostTime();

        Log.d(TAG, "Bank notification captured: [" + appName + "] " + title + " | " + fullText);

        NotificationEventEmitter.emit(packageName, appName, title, fullText, timestamp);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed — we capture on post
    }

    // -------------------------------------------------------------------------

    private boolean isRelevantNotification(StatusBarNotification sbn, String pkg) {
        if (BANK_PACKAGES.contains(pkg)) return true;

        // Fallback: check notification category
        Notification n = sbn.getNotification();
        if (n == null) return false;
        String category = n.category;
        return Notification.CATEGORY_TRANSPORT.equals(category)
            || Notification.CATEGORY_MESSAGE.equals(category);
    }

    private boolean containsPurchaseKeyword(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        for (String kw : PURCHASE_KEYWORDS) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }

    private String getAppName(String packageName) {
        PackageManager pm = getPackageManager();
        try {
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            return (String) pm.getApplicationLabel(info);
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }
}
