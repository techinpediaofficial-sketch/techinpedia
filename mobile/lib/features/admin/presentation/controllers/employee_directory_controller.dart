import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/admin_repository.dart';
import '../../domain/models/admin_employee_model.dart';

class EmployeeDirectoryState {
  final bool isLoading;
  final String? error;
  final String searchQuery;
  final String? departmentFilter;
  final List<AdminEmployeeModel> employees;

  const EmployeeDirectoryState({
    required this.isLoading,
    this.error,
    this.searchQuery = '',
    this.departmentFilter,
    this.employees = const [],
  });

  EmployeeDirectoryState copyWith({
    bool? isLoading,
    String? error,
    String? searchQuery,
    String? departmentFilter,
    List<AdminEmployeeModel>? employees,
  }) {
    return EmployeeDirectoryState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
      departmentFilter: departmentFilter ?? this.departmentFilter,
      employees: employees ?? this.employees,
    );
  }
}

final employeeDirectoryControllerProvider =
    StateNotifierProvider<EmployeeDirectoryController, EmployeeDirectoryState>((ref) {
  final repo = ref.watch(adminRepositoryProvider);
  return EmployeeDirectoryController(repo);
});

class EmployeeDirectoryController extends StateNotifier<EmployeeDirectoryState> {
  final AdminRepository _repo;

  EmployeeDirectoryController(this._repo)
      : super(const EmployeeDirectoryState(isLoading: true)) {
    loadEmployees();
  }

  Future<void> loadEmployees() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _repo.getEmployees(
        search: state.searchQuery,
        departmentId: state.departmentFilter,
      );
      state = state.copyWith(isLoading: false, employees: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void search(String query) {
    state = state.copyWith(searchQuery: query);
    loadEmployees();
  }

  void setDepartment(String? deptId) {
    state = state.copyWith(departmentFilter: deptId);
    loadEmployees();
  }
}
