import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/admin/presentation/screens/attendance_roster_screen.dart';
import '../../features/admin/presentation/screens/employee_directory_screen.dart';
import '../../features/admin/presentation/screens/invoices_screen.dart';
import '../../features/admin/presentation/screens/leave_approvals_screen.dart';
import '../../features/admin/presentation/screens/tickets_screen.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/whatsapp/presentation/screens/chat_screen.dart';
import 'main_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authNotifierProvider.notifier);
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: GoRouterRefreshStream(authNotifier.stream),
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      final isAuthenticated = authState.isAuthenticated;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';

      if (isLoading && !isSplash) {
        return '/splash';
      }

      if (!isAuthenticated) {
        return isLogin ? null : '/login';
      }

      if (isSplash || isLogin) {
        return '/inbox';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/inbox',
        builder: (context, state) => const MainShell(),
      ),
      GoRoute(
        path: '/chat/:id',
        builder: (context, state) {
          final conversationId = state.pathParameters['id'] ?? '';
          return ChatScreen(conversationId: conversationId);
        },
      ),
      GoRoute(
        path: '/admin/leaves',
        builder: (context, state) => const LeaveApprovalsScreen(),
      ),
      GoRoute(
        path: '/admin/employees',
        builder: (context, state) => const EmployeeDirectoryScreen(),
      ),
      GoRoute(
        path: '/admin/invoices',
        builder: (context, state) => const InvoicesScreen(),
      ),
      GoRoute(
        path: '/admin/tickets',
        builder: (context, state) => const TicketsScreen(),
      ),
      GoRoute(
        path: '/admin/attendance-roster',
        builder: (context, state) => const AttendanceRosterScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final dynamic _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
