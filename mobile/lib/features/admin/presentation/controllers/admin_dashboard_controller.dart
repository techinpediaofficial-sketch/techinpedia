import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/admin_repository.dart';
import '../../domain/models/executive_dashboard_model.dart';

class AdminDashboardState {
  final bool isLoading;
  final String? error;
  final ExecutiveDashboardModel data;

  const AdminDashboardState({
    required this.isLoading,
    this.error,
    required this.data,
  });

  AdminDashboardState copyWith({
    bool? isLoading,
    String? error,
    ExecutiveDashboardModel? data,
  }) {
    return AdminDashboardState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      data: data ?? this.data,
    );
  }
}

final adminDashboardControllerProvider =
    StateNotifierProvider<AdminDashboardController, AdminDashboardState>((ref) {
  final repo = ref.watch(adminRepositoryProvider);
  return AdminDashboardController(repo);
});

class AdminDashboardController extends StateNotifier<AdminDashboardState> {
  final AdminRepository _repo;

  AdminDashboardController(this._repo)
      : super(AdminDashboardState(
          isLoading: true,
          data: ExecutiveDashboardModel.empty(),
        )) {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repo.getExecutiveDashboard();
      state = state.copyWith(isLoading: false, data: data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}
