import 'dart:convert';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/models/user_model.dart';

abstract class AuthRepository {
  Future<UserModel> login({required String email, required String password});
  Future<UserModel?> getCurrentUser();
  Future<void> logout();
  Future<UserModel?> getStoredUser();
  Future<bool> hasValidSession();
}

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storageService;

  AuthRepositoryImpl({
    required ApiClient apiClient,
    required SecureStorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService;

  @override
  Future<UserModel> login({required String email, required String password}) async {
    final response = await _apiClient.post(
      ApiEndpoints.login,
      data: {
        'email': email.trim(),
        'password': password,
      },
    );

    final data = response.data;
    if (data == null || data['success'] != true) {
      throw const AuthException('Login failed. Please check your credentials.');
    }

    final token = data['token'] as String?;
    if (token != null && token.isNotEmpty) {
      await _storageService.saveAuthToken(token);
    } else {
      throw const AuthException('Server did not return an authentication token.');
    }

    // Immediately resolve full profile, RBAC roles, and module entitlements
    final user = await getCurrentUser();
    if (user == null) {
      throw const AuthException('Failed to load user profile after login.');
    }

    return user;
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.currentUser);
      final data = response.data;

      if (data != null && data['authenticated'] == true) {
        final user = UserModel.fromJson(data);
        await _storageService.saveUserData(jsonEncode(user.toJson()));
        return user;
      }
      return null;
    } on AuthException {
      await _storageService.clearAll();
      return null;
    } catch (e) {
      // Fallback to locally stored cached profile if offline
      return await getStoredUser();
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {
      // Continue local cleanup even if network request fails
    } finally {
      await _storageService.clearAll();
    }
  }

  @override
  Future<UserModel?> getStoredUser() async {
    final jsonStr = await _storageService.getUserData();
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      return UserModel.fromJson(jsonDecode(jsonStr));
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> hasValidSession() async {
    final token = await _storageService.getAuthToken();
    return token != null && token.isNotEmpty;
  }
}
