import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/admin/presentation/screens/admin_dashboard_screen.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/crm/presentation/screens/leads_screen.dart';
import '../../features/hardware/presentation/screens/hardware_screen.dart';
import '../../features/hrm/presentation/screens/hrm_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/whatsapp/presentation/controllers/inbox_controller.dart';
import '../../features/whatsapp/presentation/screens/inbox_screen.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authNotifierProvider).user;
    final isAdmin = user?.isAdmin ?? false;
    final inboxState = ref.watch(inboxControllerProvider);
    final unreadCount = inboxState.metrics.unread;

    final screens = isAdmin
        ? const [
            AdminDashboardScreen(),
            InboxScreen(),
            LeadsScreen(),
            HardwareScreen(),
            HrmScreen(),
          ]
        : const [
            InboxScreen(),
            LeadsScreen(),
            HardwareScreen(),
            HrmScreen(),
            ProfileScreen(),
          ];

    final destinations = isAdmin
        ? [
            const NavigationDestination(
              icon: Icon(Icons.space_dashboard_outlined),
              selectedIcon: Icon(Icons.space_dashboard_rounded),
              label: 'Admin Hub',
            ),
            NavigationDestination(
              icon: Badge(
                isLabelVisible: unreadCount > 0,
                label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                child: const Icon(Icons.chat_bubble_outline_rounded),
              ),
              selectedIcon: Badge(
                isLabelVisible: unreadCount > 0,
                label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                child: const Icon(Icons.chat_bubble_rounded),
              ),
              label: 'Inbox',
            ),
            const NavigationDestination(
              icon: Icon(Icons.groups_outlined),
              selectedIcon: Icon(Icons.groups_rounded),
              label: 'Leads',
            ),
            const NavigationDestination(
              icon: Icon(Icons.laptop_chromebook_outlined),
              selectedIcon: Icon(Icons.laptop_chromebook_rounded),
              label: 'Hardware',
            ),
            const NavigationDestination(
              icon: Icon(Icons.badge_outlined),
              selectedIcon: Icon(Icons.badge_rounded),
              label: 'Workforce',
            ),
          ]
        : [
            NavigationDestination(
              icon: Badge(
                isLabelVisible: unreadCount > 0,
                label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                child: const Icon(Icons.chat_bubble_outline_rounded),
              ),
              selectedIcon: Badge(
                isLabelVisible: unreadCount > 0,
                label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                child: const Icon(Icons.chat_bubble_rounded),
              ),
              label: 'Inbox',
            ),
            const NavigationDestination(
              icon: Icon(Icons.groups_outlined),
              selectedIcon: Icon(Icons.groups_rounded),
              label: 'Leads',
            ),
            const NavigationDestination(
              icon: Icon(Icons.laptop_chromebook_outlined),
              selectedIcon: Icon(Icons.laptop_chromebook_rounded),
              label: 'Hardware',
            ),
            const NavigationDestination(
              icon: Icon(Icons.badge_outlined),
              selectedIcon: Icon(Icons.badge_rounded),
              label: 'Workforce',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ];

    final effectiveIndex = _currentIndex >= screens.length ? 0 : _currentIndex;

    return Scaffold(
      body: IndexedStack(
        index: effectiveIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: effectiveIndex,
        onDestinationSelected: (idx) {
          setState(() {
            _currentIndex = idx;
          });
        },
        destinations: destinations,
      ),
    );
  }
}
