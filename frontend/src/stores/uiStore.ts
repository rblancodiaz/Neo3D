import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Toast, Modal } from '../types/ui';

interface UIStore {
  // Toasts
  toasts: Toast[];
  
  // Modals
  modals: Modal[];
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Sidebar/panel states
  isSidebarOpen: boolean;
  isPropertiesPanelOpen: boolean;
  isToolbarVisible: boolean;
  
  // Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Actions - Toasts
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Actions - Modals
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  toggleToolbar: () => void;
  setToolbarVisible: (visible: boolean) => void;
  
  // Actions - Settings
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  
  // Utility
  reset: () => void;
}

let toastIdCounter = 0;
let modalIdCounter = 0;

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      toasts: [],
      modals: [],
      globalLoading: false,
      loadingMessage: null,
      isSidebarOpen: true,
      isPropertiesPanelOpen: true,
      isToolbarVisible: true,
      theme: 'light',
      language: 'en',

      // Toast actions
      showToast: (toast) => {
        const id = `toast-${++toastIdCounter}`;
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration || 5000,
        };
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));
        
        // Auto remove after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),

      // Modal actions
      openModal: (modal) => {
        const id = `modal-${++modalIdCounter}`;
        const newModal: Modal = {
          ...modal,
          id,
        };
        
        set((state) => ({
          modals: [...state.modals, newModal],
        }));
      },

      closeModal: (id) =>
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id),
        })),

      closeAllModals: () => set({ modals: [] }),

      // Loading actions
      setGlobalLoading: (loading, message) =>
        set({
          globalLoading: loading,
          loadingMessage: message || null,
        }),

      // UI actions
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      
      togglePropertiesPanel: () =>
        set((state) => ({
          isPropertiesPanelOpen: !state.isPropertiesPanelOpen,
        })),
      
      setPropertiesPanelOpen: (open) =>
        set({ isPropertiesPanelOpen: open }),
      
      toggleToolbar: () =>
        set((state) => ({ isToolbarVisible: !state.isToolbarVisible })),
      
      setToolbarVisible: (visible) => set({ isToolbarVisible: visible }),

      // Settings actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      setLanguage: (language) => set({ language }),

      // Reset
      reset: () =>
        set({
          toasts: [],
          modals: [],
          globalLoading: false,
          loadingMessage: null,
          isSidebarOpen: true,
          isPropertiesPanelOpen: true,
          isToolbarVisible: true,
          theme: 'light',
          language: 'en',
        }),
    }),
    {
      name: 'ui-store',
    },
  ),
);