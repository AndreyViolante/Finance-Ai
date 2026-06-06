const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

// ─── 1. AndroidManifest: adiciona <service> do NotificationListenerService ───

function withManifest(config) {
  return withAndroidManifest(config, cfg => {
    const app = cfg.modResults.manifest.application[0];
    if (!app.service) app.service = [];

    const already = app.service.some(
      s => s.$?.['android:name'] === '.notification.FinanceNotificationService',
    );

    if (!already) {
      app.service.push({
        $: {
          'android:name':       '.notification.FinanceNotificationService',
          'android:label':      'FinanceAI Notification Listener',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported':   'true',
        },
        'intent-filter': [
          {
            action: [
              {$: {'android:name': 'android.service.notification.NotificationListenerService'}},
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name':  'android.service.notification.default_filter_types',
              'android:value': 'conversations|alerting',
            },
          },
        ],
      });
    }

    return cfg;
  });
}

// ─── 2. Copia arquivos Java para android/app/src/main/java/com/financeai/notification ──

function withJavaFiles(config) {
  return withDangerousMod(config, [
    'android',
    cfg => {
      const projectRoot = path.join(__dirname, '..');
      const srcDir = path.join(projectRoot, 'android-src', 'notification');
      const dstDir = path.join(
        projectRoot,
        'android', 'app', 'src', 'main', 'java', 'com', 'financeai', 'notification',
      );

      fs.mkdirSync(dstDir, {recursive: true});

      for (const file of fs.readdirSync(srcDir)) {
        fs.copyFileSync(path.join(srcDir, file), path.join(dstDir, file));
      }

      return cfg;
    },
  ]);
}

// ─── 3. MainApplication.kt: registra NotificationPackage ─────────────────────

function withMainApp(config) {
  return withMainApplication(config, cfg => {
    let src = cfg.modResults.contents;

    const importLine = 'import com.financeai.notification.NotificationPackage';
    if (!src.includes(importLine)) {
      // Insere import logo após a declaração do package
      src = src.replace(
        /^(package com\.financeai\s*\n)/m,
        `$1\n${importLine}\n`,
      );
    }

    if (!src.includes('NotificationPackage()')) {
      // Expo SDK 51 generated line:
      // val packages = PackageList(this).packages
      src = src.replace(
        'val packages = PackageList(this).packages',
        'val packages = PackageList(this).packages\n          packages.add(NotificationPackage())',
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = function withNotificationListener(config) {
  config = withManifest(config);
  config = withJavaFiles(config);
  config = withMainApp(config);
  return config;
};
