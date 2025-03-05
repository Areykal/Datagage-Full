declare module "@/utils/notifications" {
  export interface NotificationOptions {
    title?: string;
    timeout?: number;
    position?: string;
  }

  export interface NotifyInterface {
    success(message: string, options?: NotificationOptions): number;
    error(message: string, options?: NotificationOptions): number;
    warning(message: string, options?: NotificationOptions): number;
    info(message: string, options?: NotificationOptions): number;
    show(
      message: string,
      type?: string,
      timeout?: number,
      position?: string,
      title?: string
    ): number;
    dismiss(id: number): void;
    clearAll(): void;
  }

  export const notify: NotifyInterface;
  export const notificationPlugin: {
    install(app: any): void;
  };
}

declare module "@/utils/auth" {
  export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  }

  export interface LoginResult {
    success: boolean;
    user?: User;
    error?: string;
  }

  export interface AuthInterface {
    isAuthenticated(): boolean;
    login(
      email: string,
      password: string,
      rememberMe?: boolean
    ): Promise<LoginResult>;
    demoLogin(email?: string, rememberMe?: boolean): Promise<LoginResult>;
    logout(): void;
    getUser(): User | null;
  }

  export const auth: AuthInterface;
}

// Extend Vue with global properties
declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $notify: import("@/utils/notifications").NotifyInterface;
  }
}
