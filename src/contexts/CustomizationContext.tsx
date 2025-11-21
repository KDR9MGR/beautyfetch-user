import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Type definitions for customization settings
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
}

export interface ThemeSpacing {
  containerMaxWidth: string;
  sectionPaddingY: string;
  sectionPaddingX: string;
  cardPadding: string;
  buttonPaddingX: string;
  buttonPaddingY: string;
}

export interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeSettings {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
}

export interface TypographySettings {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
    display: string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
    loose: string;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface SectionVisibility {
  visible: boolean;
  order: number;
}

export interface HomepageLayout {
  sections: {
    heroBanner: SectionVisibility;
    categorySection: SectionVisibility;
    featuredProducts: SectionVisibility;
    collections: SectionVisibility;
    nearbyStores: SectionVisibility;
    featuredStores: SectionVisibility;
    testimonials: SectionVisibility;
    blog: SectionVisibility;
  };
}

export interface ComponentSettings {
  [key: string]: any;
}

interface CustomizationContextType {
  theme: ThemeSettings | null;
  typography: TypographySettings | null;
  homepageLayout: HomepageLayout | null;
  componentSettings: Record<string, ComponentSettings>;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  getComponentSettings: (componentName: string) => ComponentSettings | null;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

interface CustomizationProviderProps {
  children: ReactNode;
}

export const CustomizationProvider: React.FC<CustomizationProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [typography, setTypography] = useState<TypographySettings | null>(null);
  const [homepageLayout, setHomepageLayout] = useState<HomepageLayout | null>(null);
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getDefaultTheme = (): ThemeSettings => ({
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#10b981',
      background: '#ffffff',
      foreground: '#111827',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      card: '#ffffff',
      cardForeground: '#111827',
      popover: '#ffffff',
      popoverForeground: '#111827',
      border: '#e5e7eb',
      input: '#e5e7eb',
      ring: '#ec4899',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff'
    },
    spacing: {
      containerMaxWidth: '1280px',
      sectionPaddingY: '4rem',
      sectionPaddingX: '1rem',
      cardPadding: '1.5rem',
      buttonPaddingX: '1.5rem',
      buttonPaddingY: '0.5rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    }
  });

  const getDefaultTypography = (): TypographySettings => ({
    fontFamily: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
      xxxl: '1.875rem',
      display: '2.25rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2'
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em'
    }
  });

  const getDefaultHomepageLayout = (): HomepageLayout => ({
    sections: {
      heroBanner: { visible: true, order: 1 },
      categorySection: { visible: true, order: 2 },
      featuredProducts: { visible: true, order: 3 },
      collections: { visible: true, order: 4 },
      nearbyStores: { visible: true, order: 5 },
      featuredStores: { visible: true, order: 6 },
      testimonials: { visible: false, order: 7 },
      blog: { visible: true, order: 8 }
    }
  });

  const loadSettings = async () => {
    try {
      console.log('[CustomizationContext] Starting to load settings...');
      setIsLoading(true);

      // Fetch all customization settings
      const { data, error } = await supabase
        .from('site_customization')
        .select('*');

      if (error) {
        console.warn('[CustomizationContext] Customization table not found, using defaults:', error);
        // Table doesn't exist yet - use defaults
        const defaultTheme = getDefaultTheme();
        const defaultTypography = getDefaultTypography();
        const defaultLayout = getDefaultHomepageLayout();

        console.log('[CustomizationContext] Setting default theme:', defaultTheme);
        console.log('[CustomizationContext] Setting default typography:', defaultTypography);
        console.log('[CustomizationContext] Setting default layout:', defaultLayout);

        setTheme(defaultTheme);
        setTypography(defaultTypography);
        setHomepageLayout(defaultLayout);

        // Apply default theme to DOM
        applyDefaultThemeToDOM(defaultTheme, defaultTypography);

        console.log('[CustomizationContext] Defaults loaded and applied to DOM');
        return;
      }

      if (data && data.length > 0) {
        // Process settings by type
        data.forEach((setting) => {
          switch (setting.setting_key) {
            case 'global_theme':
              setTheme(setting.setting_value as unknown as ThemeSettings);
              break;
            case 'global_typography':
              setTypography(setting.setting_value as unknown as TypographySettings);
              break;
            case 'homepage_layout':
              setHomepageLayout(setting.setting_value as unknown as HomepageLayout);
              break;
            default:
              // Handle component-specific settings
              if (setting.setting_type === 'component' && setting.scope) {
                setComponentSettings((prev) => ({
                  ...prev,
                  [setting.scope]: setting.setting_value,
                }));
              }
              break;
          }
        });

        // Apply theme to CSS variables
        applyThemeToDOM(data);
      } else {
        // Table exists but is empty - use defaults
        console.log('[CustomizationContext] Customization table is empty, using defaults');
        setTheme(getDefaultTheme());
        setTypography(getDefaultTypography());
        setHomepageLayout(getDefaultHomepageLayout());
      }
    } catch (error) {
      console.error('[CustomizationContext] Error loading customization settings:', error);
      // Use defaults on any error
      setTheme(getDefaultTheme());
      setTypography(getDefaultTypography());
      setHomepageLayout(getDefaultHomepageLayout());
    } finally {
      console.log('[CustomizationContext] Finished loading, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const applyDefaultThemeToDOM = (theme: ThemeSettings, typography: TypographySettings) => {
    const root = document.documentElement;

    // Apply color CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply spacing CSS variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      const cssVarName = `--spacing-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply border radius CSS variables
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      const cssVarName = `--radius-${key}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply shadow CSS variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      const cssVarName = `--shadow-${key}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply typography CSS variables
    Object.entries(typography.fontFamily).forEach(([key, value]) => {
      const cssVarName = `--font-${key}`;
      root.style.setProperty(cssVarName, value);
    });

    Object.entries(typography.fontSize).forEach(([key, value]) => {
      const cssVarName = `--font-size-${key}`;
      root.style.setProperty(cssVarName, value);
    });

    Object.entries(typography.fontWeight).forEach(([key, value]) => {
      const cssVarName = `--font-weight-${key}`;
      root.style.setProperty(cssVarName, value);
    });

    Object.entries(typography.lineHeight).forEach(([key, value]) => {
      const cssVarName = `--line-height-${key}`;
      root.style.setProperty(cssVarName, value);
    });

    Object.entries(typography.letterSpacing).forEach(([key, value]) => {
      const cssVarName = `--letter-spacing-${key}`;
      root.style.setProperty(cssVarName, value);
    });

    console.log('[CustomizationContext] CSS variables applied to DOM');
  };

  const applyThemeToDOM = (settings: any[]) => {
    const root = document.documentElement;

    settings.forEach((setting) => {
      if (setting.setting_key === 'global_theme') {
        const theme = setting.setting_value as ThemeSettings;

        // Apply color CSS variables
        Object.entries(theme.colors).forEach(([key, value]) => {
          const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssVarName, value);
        });

        // Apply spacing CSS variables
        Object.entries(theme.spacing).forEach(([key, value]) => {
          const cssVarName = `--spacing-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssVarName, value);
        });

        // Apply border radius CSS variables
        Object.entries(theme.borderRadius).forEach(([key, value]) => {
          const cssVarName = `--radius-${key}`;
          root.style.setProperty(cssVarName, value);
        });

        // Apply shadow CSS variables
        Object.entries(theme.shadows).forEach(([key, value]) => {
          const cssVarName = `--shadow-${key}`;
          root.style.setProperty(cssVarName, value);
        });
      }

      if (setting.setting_key === 'global_typography') {
        const typography = setting.setting_value as TypographySettings;

        // Apply font family CSS variables
        Object.entries(typography.fontFamily).forEach(([key, value]) => {
          const cssVarName = `--font-${key}`;
          root.style.setProperty(cssVarName, value);
        });

        // Apply font size CSS variables
        Object.entries(typography.fontSize).forEach(([key, value]) => {
          const cssVarName = `--font-size-${key}`;
          root.style.setProperty(cssVarName, value);
        });

        // Apply font weight CSS variables
        Object.entries(typography.fontWeight).forEach(([key, value]) => {
          const cssVarName = `--font-weight-${key}`;
          root.style.setProperty(cssVarName, value);
        });

        // Apply line height CSS variables
        Object.entries(typography.lineHeight).forEach(([key, value]) => {
          const cssVarName = `--line-height-${key}`;
          root.style.setProperty(cssVarName, value);
        });

        // Apply letter spacing CSS variables
        Object.entries(typography.letterSpacing).forEach(([key, value]) => {
          const cssVarName = `--letter-spacing-${key}`;
          root.style.setProperty(cssVarName, value);
        });
      }
    });
  };

  const getComponentSettings = (componentName: string): ComponentSettings | null => {
    return componentSettings[componentName] || null;
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();

    // Set up real-time subscription for customization changes
    const subscription = supabase
      .channel('customization-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_customization',
        },
        () => {
          console.log('Customization settings changed, reloading...');
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: CustomizationContextType = {
    theme,
    typography,
    homepageLayout,
    componentSettings,
    isLoading,
    refreshSettings,
    getComponentSettings,
  };

  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = (): CustomizationContextType => {
  const context = useContext(CustomizationContext);
  if (context === undefined) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};
