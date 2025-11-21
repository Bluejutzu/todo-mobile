export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  NameInput: undefined;
  ThemeSelection: undefined;
  AISetup: undefined;
  Permissions: undefined;
  Ready: undefined;
};

export type MainTabParamList = {
  Todos: undefined;
  Settings: undefined;
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
