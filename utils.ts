import Constants from 'expo-constants';

export const generateAPIUrl = (relativePath: string) => {
  // Ensure path starts with /
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  if (process.env.NODE_ENV === 'development') {
    // 1. Try experienceUrl (Expo Go)
    if (Constants.experienceUrl) {
      const origin = Constants.experienceUrl.replace('exp://', 'http://');
      return origin.concat(path);
    }

    // 2. Try hostUri (Dev Client / builds) - includes port
    if (Constants.expoConfig?.hostUri) {
      return `http://${Constants.expoConfig.hostUri}${path}`;
    }

    // 3. Fallback to localhost
    return `http://localhost:8081${path}`;
  }

  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL environment variable is not defined',
    );
  }

  return process.env.EXPO_PUBLIC_API_BASE_URL.concat(path);
};
