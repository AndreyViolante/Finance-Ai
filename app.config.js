require('dotenv').config();

module.exports = {
  expo: {
    name: 'FinanceAI',
    slug: 'finance-ai',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    android: {
      package: 'com.financeai',
      adaptiveIcon: {
        backgroundColor: '#0f0f23',
      },
    },
    plugins: [
      './plugins/withNotificationListener',
    ],
    extra: {
      geminiApiKey: process.env.GEMINI_API_KEY ?? '',
      eas: {
        projectId: '46d8ba85-d748-4f2f-b390-f0ca5a52d677',
      },
    },
  },
};
