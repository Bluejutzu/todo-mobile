export type PermissionType = 'notifications' | 'calendar' | 'photos' | 'contacts';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export interface PermissionStatus {
  notifications: PermissionState;
  calendar: PermissionState;
  photos: PermissionState;
  contacts: PermissionState;
}

export interface Permission {
  type: PermissionType;
  label: string;
  description: string;
  icon: string;
  required: boolean;
}
