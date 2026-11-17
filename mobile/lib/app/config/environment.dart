enum EnvironmentType { development, staging, production }

class AppEnvironment {
  final EnvironmentType type;
  final String apiBaseUrl;
  final String appName;
  final Duration connectTimeout;
  final Duration receiveTimeout;

  const AppEnvironment({
    required this.type,
    required this.apiBaseUrl,
    required this.appName,
    this.connectTimeout = const Duration(seconds: 15),
    this.receiveTimeout = const Duration(seconds: 20),
  });

  static AppEnvironment _current = production;
  static AppEnvironment get current => _current;

  static void setEnvironment(AppEnvironment env) {
    _current = env;
  }

  static const AppEnvironment development = AppEnvironment(
    type: EnvironmentType.development,
    apiBaseUrl: 'https://admin.techinpedia.com',
    appName: 'TechInPedia Staff (Dev)',
  );

  static const AppEnvironment staging = AppEnvironment(
    type: EnvironmentType.staging,
    apiBaseUrl: 'https://admin.techinpedia.com',
    appName: 'TechInPedia Staff (Staging)',
  );

  static const AppEnvironment production = AppEnvironment(
    type: EnvironmentType.production,
    apiBaseUrl: 'https://admin.techinpedia.com',
    appName: 'TechInPedia Staff',
  );
}
