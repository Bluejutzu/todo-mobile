export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Name: undefined;
  Preferences: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Todos: undefined;
  Settings: undefined;
  AccountManagement: undefined;
};

export type TodoStackParamList = {
  TodoList: undefined;
  TodoDetail: {
    todoId: string;
  };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  AISettings: undefined;
  PermissionsSettings: undefined;
  StorageInfo: undefined;
};
