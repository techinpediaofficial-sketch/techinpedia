import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/api_endpoints.dart';
import '../network/api_client.dart';
import '../services/notification_service.dart';
import '../storage/secure_storage_service.dart';

final firebaseMessagingServiceProvider = Provider<FirebaseMessagingService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageServiceProvider);
  return FirebaseMessagingService(apiClient, storage);
});

class FirebaseMessagingService {
  final ApiClient _apiClient;
  final SecureStorageService _storage;
  bool _isInitialized = false;

  FirebaseMessagingService(this._apiClient, this._storage);

  Future<void> initialize({Function(String conversationId)? onNotificationTap}) async {
    if (_isInitialized) return;

    try {
      // Check if Firebase is initialized in main
      if (Firebase.apps.isEmpty) {
        debugPrint('[FCM] Firebase app not initialized. Skipping FCM setup in current environment.');
        return;
      }

      final messaging = FirebaseMessaging.instance;

      // 1. Request permissions (especially iOS & Android 13+)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('[FCM] Notification authorization status: ${settings.authorizationStatus}');

      // 2. Obtain FCM Token
      final fcmToken = await messaging.getToken();
      if (fcmToken != null) {
        await _registerDeviceToken(fcmToken);
      }

      // 3. Listen to token refresh
      messaging.onTokenRefresh.listen((newToken) {
        _registerDeviceToken(newToken);
      });

      // 4. Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM] Foreground message received: ${message.notification?.title}');
        final title = message.notification?.title ?? message.data['title'] ?? 'WhatsApp Message';
        final body = message.notification?.body ?? message.data['body'] ?? message.data['text'] ?? '';
        final conversationId = (message.data['conversationId'] ?? '') as String;
        final senderPhone = message.data['senderPhone'] as String?;

        NotificationService.instance.showWhatsAppNotification(
          title: title,
          body: body,
          conversationId: conversationId,
          senderPhone: senderPhone,
        );
      });


      // 5. App opened from background notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        final conversationId = message.data['conversationId'] as String?;
        if (conversationId != null && onNotificationTap != null) {
          onNotificationTap(conversationId);
        }
      });

      // 6. Check if app was launched from terminated state via notification
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        final conversationId = initialMessage.data['conversationId'] as String?;
        if (conversationId != null && onNotificationTap != null) {
          onNotificationTap(conversationId);
        }
      }

      _isInitialized = true;
    } catch (e) {
      debugPrint('[FCM] Notice during initialization: $e');
    }
  }

  Future<void> _registerDeviceToken(String token) async {
    try {
      final authToken = await _storage.getAccessToken();
      if (authToken == null) {
        // User not logged in yet; will register upon login
        return;
      }

      final platform = Platform.isAndroid ? 'ANDROID' : (Platform.isIOS ? 'IOS' : 'OTHER');

      await _apiClient.post(
        ApiEndpoints.registerDevice,
        data: {
          'token': token,
          'fcmToken': token,
          'deviceType': platform,
          'platform': platform,
        },
      );

      debugPrint('[FCM] Device token registered successfully with TechInPedia backend.');
    } catch (e) {
      debugPrint('[FCM] Error registering device token: $e');
    }
  }

  Future<void> unregisterDevice() async {
    try {
      if (Firebase.apps.isEmpty) return;
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _apiClient.delete(
          ApiEndpoints.registerDevice,
          data: {'token': token},
        );
        debugPrint('[FCM] Device token deregistered successfully on logout.');
      }
    } catch (e) {
      debugPrint('[FCM] Error deregistering device token: $e');
    }
  }
}
