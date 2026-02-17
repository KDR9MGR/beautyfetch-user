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

  const hexToHsl = (hex: string) => {
    const normalized = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
    const r = parseInt(normalized.substring(0, 2), 16) / 255;
    const g = parseInt(normalized.substring(2, 4), 16) / 255;
    const b = parseInt(normalized.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / delta) % 6;
          break;
        case g:
          h = (b - r) / delta + 2;
          break;
        default:
          h = (r - g) / delta + 4;
          break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const setHslVar = (name: string, hex: string) => {
    const hsl = hexToHsl(hex);
    if (!hsl) return;
    document.documentElement.style.setProperty(`--${name}`, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  };

  const applyThemeVariables = (theme: ThemeSettings, typography: TypographySettings) => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });
    Object.entries(theme.spacing).forEach(([key, value]) => {
      const cssVarName = `--spacing-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      const cssVarName = `--radius-${key}`;
      root.style.setProperty(cssVarName, value);
    });
    Object.entries(theme.shadows).forEach(([key, value]) => {
      const cssVarName = `--shadow-${key}`;
      root.style.setProperty(cssVarName, value);
    });
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

    setHslVar('background', theme.colors.background);
    setHslVar('foreground', theme.colors.foreground);
    setHslVar('card', theme.colors.card);
    setHslVar('card-foreground', theme.colors.cardForeground);
    setHslVar('popover', theme.colors.popover);
    setHslVar('popover-foreground', theme.colors.popoverForeground);
    setHslVar('primary', theme.colors.primary);
    setHslVar('primary-foreground', theme.colors.background);
    setHslVar('secondary', theme.colors.secondary);
    setHslVar('secondary-foreground', theme.colors.foreground);
    setHslVar('muted', theme.colors.muted);
    setHslVar('muted-foreground', theme.colors.mutedForeground);
    setHslVar('accent', theme.colors.accent);
    setHslVar('accent-foreground', theme.colors.foreground);
    setHslVar('destructive', theme.colors.destructive);
    setHslVar('destructive-foreground', theme.colors.destructiveForeground);
    setHslVar('border', theme.colors.border);
    setHslVar('input', theme.colors.input);
    setHslVar('ring', theme.colors.ring);
    root.style.setProperty('--radius', theme.borderRadius.md);
  };

  const normalizeLegacyTheme = (
    colors: any | null,
    fonts: any | null,
    sections: any | null
  ) => {
    const theme = getDefaultTheme();
    const typography = getDefaultTypography();
    const layout = getDefaultHomepageLayout();

    if (colors) {
      theme.colors.background = colors.background ?? theme.colors.background;
      theme.colors.primary = colors.primary ?? theme.colors.primary;
      theme.colors.secondary = colors.secondary ?? theme.colors.secondary;
      theme.colors.accent = colors.accent ?? theme.colors.accent;
      theme.colors.foreground = colors.text ?? theme.colors.foreground;
      theme.colors.card = colors.header ?? theme.colors.card;
      theme.colors.muted = colors.footer ?? theme.colors.muted;
      theme.colors.cardForeground = theme.colors.foreground;
      theme.colors.popover = theme.colors.card;
      theme.colors.popoverForeground = theme.colors.cardForeground;
      theme.colors.border = theme.colors.secondary;
      theme.colors.input = theme.colors.secondary;
      theme.colors.ring = theme.colors.primary;
    }

    if (fonts) {
      typography.fontFamily.heading = fonts.headingFont ?? typography.fontFamily.heading;
      typography.fontFamily.body = fonts.bodyFont ?? typography.fontFamily.body;
      const baseSize = Number(fonts.fontSize);
      if (!Number.isNaN(baseSize) && baseSize > 0) {
        const baseRem = baseSize / 16;
        typography.fontSize.base = `${baseRem}rem`;
        typography.fontSize.sm = `${baseRem * 0.875}rem`;
        typography.fontSize.lg = `${baseRem * 1.125}rem`;
        typography.fontSize.xl = `${baseRem * 1.25}rem`;
        typography.fontSize.xxl = `${baseRem * 1.5}rem`;
        typography.fontSize.xxxl = `${baseRem * 1.875}rem`;
        typography.fontSize.display = `${baseRem * 2.25}rem`;
      }
      if (fonts.lineSpacing) {
        typography.lineHeight.normal = String(fonts.lineSpacing);
      }
    }

    if (sections) {
      const mapSection = (key: keyof HomepageLayout['sections']) => ({
        visible: sections[key] ?? layout.sections[key].visible,
        order: layout.sections[key].order,
      });
      layout.sections = {
        heroBanner: mapSection('heroBanner'),
        categorySection: mapSection('categorySection'),
        featuredProducts: mapSection('featuredProducts'),
        collections: mapSection('collections'),
        nearbyStores: mapSection('nearbyStores'),
        featuredStores: mapSection('featuredStores'),
        testimonials: mapSection('testimonials'),
        blog: mapSection('blog'),
      };
    }

    return { theme, typography, layout };
  };

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
        const defaultTheme = getDefaultTheme();
        const defaultTypography = getDefaultTypography();
        const defaultLayout = getDefaultHomepageLayout();

        console.log('[CustomizationContext] Setting default theme:', defaultTheme);
        console.log('[CustomizationContext] Setting default typography:', defaultTypography);
        console.log('[CustomizationContext] Setting default layout:', defaultLayout);

        setTheme(defaultTheme);
        setTypography(defaultTypography);
        setHomepageLayout(defaultLayout);

        applyThemeVariables(defaultTheme, defaultTypography);

        console.log('[CustomizationContext] Defaults loaded and applied to DOM');
        return;
      }

      if (data && data.length > 0) {
        let resolvedTheme: ThemeSettings | null = null;
        let resolvedTypography: TypographySettings | null = null;
        let resolvedLayout: HomepageLayout | null = null;
        let legacyColors: any | null = null;
        let legacyFonts: any | null = null;
        let legacySections: any | null = null;

        data.forEach((setting) => {
          switch (setting.setting_key) {
            case 'global_theme':
              resolvedTheme = setting.setting_value as unknown as ThemeSettings;
              break;
            case 'global_typography':
              resolvedTypography = setting.setting_value as unknown as TypographySettings;
              break;
            case 'homepage_layout':
              resolvedLayout = setting.setting_value as unknown as HomepageLayout;
              break;
            case 'colors':
              legacyColors = setting.setting_value;
              break;
            case 'fonts':
              legacyFonts = setting.setting_value;
              break;
            case 'homepage_sections':
              legacySections = setting.setting_value;
              break;
            default:
              if (setting.setting_type === 'component' && setting.scope) {
                setComponentSettings((prev) => ({
                  ...prev,
                  [setting.scope]: setting.setting_value,
                }));
              }
              break;
          }
        });

        if (!resolvedTheme || !resolvedTypography || !resolvedLayout) {
          const legacy = normalizeLegacyTheme(legacyColors, legacyFonts, legacySections);
          resolvedTheme = resolvedTheme ?? legacy.theme;
          resolvedTypography = resolvedTypography ?? legacy.typography;
          resolvedLayout = resolvedLayout ?? legacy.layout;
        }

        setTheme(resolvedTheme);
        setTypography(resolvedTypography);
        setHomepageLayout(resolvedLayout);
        applyThemeVariables(resolvedTheme, resolvedTypography);
      } else {
        console.log('[CustomizationContext] Customization table is empty, using defaults');
        const defaultTheme = getDefaultTheme();
        const defaultTypography = getDefaultTypography();
        const defaultLayout = getDefaultHomepageLayout();
        setTheme(defaultTheme);
        setTypography(defaultTypography);
        setHomepageLayout(defaultLayout);
        applyThemeVariables(defaultTheme, defaultTypography);
      }
    } catch (error) {
      console.error('[CustomizationContext] Error loading customization settings:', error);
      const defaultTheme = getDefaultTheme();
      const defaultTypography = getDefaultTypography();
      const defaultLayout = getDefaultHomepageLayout();
      setTheme(defaultTheme);
      setTypography(defaultTypography);
      setHomepageLayout(defaultLayout);
      applyThemeVariables(defaultTheme, defaultTypography);
    } finally {
      console.log('[CustomizationContext] Finished loading, setting isLoading to false');
      setIsLoading(false);
    }
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
