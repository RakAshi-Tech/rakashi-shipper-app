importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCOJ6J5VguFaKjFie07ZddDNPP9lENm1EM",
  authDomain: "rakashi-notifications.firebaseapp.com",
  projectId: "rakashi-notifications",
  storageBucket: "rakashi-notifications.firebasestorage.app",
  messagingSenderId: "334549345938",
  appId: "1:334549345938:web:3db734ed9175a710c7e84b",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Background message (shipper):', payload)

  self.registration.showNotification(
    payload.notification?.title ?? 'ドライバーが応答しました',
    {
      body: payload.notification?.body ?? '配送依頼が更新されました',
      icon: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: payload.data,
    }
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  clients.openWindow('/home')
})
