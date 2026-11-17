import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';
import 'app/routes/app_router.dart';
import 'core/firebase/firebase_messaging_service.dart';
import 'core/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize local notifications service
  await NotificationService.instance.initialize();

  // Initialize Firebase safely (gracefully handles if config file is pending)
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('[Firebase] Initialization skipped or config not found: $e');
  }

  final container = ProviderContainer();

  // Wire notification tap listener to deep link into conversation
  NotificationService.instance.initialize(
    onNotificationTap: (conversationId) {
      container.read(appRouterProvider).push('/chat/$conversationId');
    },
  );

  // Initialize Push Notification service with deep-linking
  container.read(firebaseMessagingServiceProvider).initialize(
    onNotificationTap: (conversationId) {
      container.read(appRouterProvider).push('/chat/$conversationId');
    },
  );

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const TechInPediaApp(),
    ),
  );
}

