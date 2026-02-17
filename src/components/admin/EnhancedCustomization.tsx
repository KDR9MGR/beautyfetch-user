import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomization } from "@/contexts/CustomizationContext";
import {
  Palette,
  Type,
  Layout,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Settings2,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const EnhancedCustomization = () => {
  const { toast } = useToast();
  const { theme, typography, homepageLayout, refreshSettings, isLoading } = useCustomization();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  // Default values function
  const getDefaultTheme = () => ({
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

  const getDefaultTypography = () => ({
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

  const getDefaultLayout = () => ({
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

  // Local state for editing - use defaults if context values are null
  const [localTheme, setLocalTheme] = useState(theme || getDefaultTheme());
  const [localTypography, setLocalTypography] = useState(typography || getDefaultTypography());
  const [localHomepageLayout, setLocalHomepageLayout] = useState(homepageLayout || getDefaultLayout());

  // Check if migration is needed
  useEffect(() => {
    const checkMigration = async () => {
      const { data, error } = await supabase
        .from('site_customization')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist
        setMigrationNeeded(true);
      }
    };
    checkMigration();
  }, []);

  useEffect(() => {
    console.log('[EnhancedCustomization] Context values updated:', {
      hasTheme: !!theme,
      hasTypography: !!typography,
      hasLayout: !!homepageLayout,
      isLoading
    });
    // Only update local state if context has actual values (not null)
    if (theme) setLocalTheme(theme);
    if (typography) setLocalTypography(typography);
    if (homepageLayout) setLocalHomepageLayout(homepageLayout);
  }, [theme, typography, homepageLayout, isLoading]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save theme settings
      const { error: themeError } = await supabase
        .from('site_customization')
        .upsert([{
          setting_key: 'global_theme',
          setting_type: 'global',
          setting_value: localTheme as any,
        }], {
          onConflict: 'setting_key'
        });

      if (themeError) throw themeError;

      // Save typography settings
      const { error: typographyError } = await supabase
        .from('site_customization')
        .upsert([{
          setting_key: 'global_typography',
          setting_type: 'global',
          setting_value: localTypography as any,
        }], {
          onConflict: 'setting_key'
        });

      if (typographyError) throw typographyError;

      // Save homepage layout settings
      const { error: layoutError } = await supabase
        .from('site_customization')
        .upsert([{
          setting_key: 'homepage_layout',
          setting_type: 'page',
          setting_value: localHomepageLayout as any,
        }], {
          onConflict: 'setting_key'
        });

      if (layoutError) throw layoutError;

      // Refresh to apply changes immediately
      await refreshSettings();

      toast({
        title: "Customization saved",
        description: "Your customization settings have been saved and applied.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all customization to defaults? This cannot be undone.')) {
      setLocalTheme(theme);
      setLocalTypography(typography);
      setLocalHomepageLayout(homepageLayout);
      toast({
        title: "Reset to defaults",
        description: "Customization has been reset. Click Save to apply.",
      });
    }
  };

  const handleExportSettings = () => {
    const settings = {
      theme: localTheme,
      typography: localTypography,
      homepageLayout: localHomepageLayout,
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beautyfetch-customization-${Date.now()}.json`;
    link.click();

    toast({
      title: "Settings exported",
      description: "Your customization settings have been downloaded.",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.theme) setLocalTheme(imported.theme);
        if (imported.typography) setLocalTypography(imported.typography);
        if (imported.homepageLayout) setLocalHomepageLayout(imported.homepageLayout);

        toast({
          title: "Settings imported",
          description: "Customization settings have been imported. Click Save to apply.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const applyPresetTheme = (preset: 'light' | 'dark' | 'vibrant') => {
    if (!localTheme) return;

    const presets = {
      light: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#10b981',
        background: '#ffffff',
        foreground: '#111827',
        muted: '#f3f4f6',
        mutedForeground: '#6b7280',
      },
      dark: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#10b981',
        background: '#111827',
        foreground: '#f9fafb',
        muted: '#1f2937',
        mutedForeground: '#9ca3af',
      },
      vibrant: {
        primary: '#f59e0b',
        secondary: '#ec4899',
        accent: '#06b6d4',
        background: '#ffffff',
        foreground: '#111827',
        muted: '#fef3c7',
        mutedForeground: '#78350f',
      },
    };

    setLocalTheme({
      ...localTheme,
      colors: {
        ...localTheme.colors,
        ...presets[preset],
      },
    });

    toast({
      title: "Theme preset applied",
      description: `${preset.charAt(0).toUpperCase() + preset.slice(1)} theme has been applied. Click Save to persist.`,
    });
  };

  // Show loading only while context is loading
  if (isLoading) {
    console.log('[EnhancedCustomization] Still loading...');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading customization settings...</p>
        </div>
      </div>
    );
  }

  console.log('[EnhancedCustomization] Rendering main UI', {
    hasTheme: !!theme,
    hasLocalTheme: !!localTheme,
    hasTypography: !!typography,
    hasLocalTypography: !!localTypography,
    hasLayout: !!homepageLayout,
    hasLocalLayout: !!localHomepageLayout
  });

  // Safety check - ensure local state is initialized
  if (!localTheme || !localTypography || !localHomepageLayout) {
    console.error('[EnhancedCustomization] Local state not initialized!');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">Error: Unable to load customization settings</p>
          <Button onClick={refreshSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Migration Warning Banner */}
      {migrationNeeded && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Database Migration Required</AlertTitle>
          <AlertDescription>
            The customization database table needs to be created. Using default settings for now.
            <br />
            <strong>To enable persistence:</strong> Copy the SQL from{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              supabase/migrations/20250118000000_enhanced_customization.sql
            </code>{' '}
            and run it in your Supabase SQL Editor. See{' '}
            <a href="/SETUP_CUSTOMIZATION.md" target="_blank" className="underline">
              SETUP_CUSTOMIZATION.md
            </a>{' '}
            for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Customization</h2>
          <p className="text-muted-foreground">Complete control over your website's appearance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
            id="import-settings"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-settings')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSettings}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSettings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* Theme Preset Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Theme Presets
          </CardTitle>
          <CardDescription>Apply a pre-made theme instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => applyPresetTheme('light')}>
              Light Theme
            </Button>
            <Button variant="outline" onClick={() => applyPresetTheme('dark')}>
              Dark Theme
            </Button>
            <Button variant="outline" onClick={() => applyPresetTheme('vibrant')}>
              Vibrant Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Customization Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="theme" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="theme">
                <Palette className="h-4 w-4 mr-2" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="h-4 w-4 mr-2" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="layout">
                <Layout className="h-4 w-4 mr-2" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="components">
                <Settings2 className="h-4 w-4 mr-2" />
                Components
              </TabsTrigger>
            </TabsList>

            {/* Theme Tab */}
            <TabsContent value="theme" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <Accordion type="single" collapsible className="w-full">
                  {/* Colors Section */}
                  <AccordionItem value="colors">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Colors
                        <Badge variant="secondary">{Object.keys(localTheme.colors).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        {Object.entries(localTheme.colors).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={`color-${key}`} className="capitalize text-sm">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative">
                                <Input
                                  id={`color-${key}`}
                                  type="color"
                                  value={value}
                                  onChange={(e) => setLocalTheme({
                                    ...localTheme,
                                    colors: { ...localTheme.colors, [key]: e.target.value }
                                  })}
                                  className="w-14 h-10 cursor-pointer"
                                />
                              </div>
                              <Input
                                type="text"
                                value={value}
                                onChange={(e) => setLocalTheme({
                                  ...localTheme,
                                  colors: { ...localTheme.colors, [key]: e.target.value }
                                })}
                                className="flex-1 font-mono text-sm"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Spacing Section */}
                  <AccordionItem value="spacing">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        Spacing & Layout
                        <Badge variant="secondary">{Object.keys(localTheme.spacing).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-4 p-4">
                        {Object.entries(localTheme.spacing).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`spacing-${key}`} className="capitalize text-sm">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <span className="text-sm text-muted-foreground font-mono">{value}</span>
                            </div>
                            <Input
                              id={`spacing-${key}`}
                              type="text"
                              value={value}
                              onChange={(e) => setLocalTheme({
                                ...localTheme,
                                spacing: { ...localTheme.spacing, [key]: e.target.value }
                              })}
                              className="font-mono text-sm"
                              placeholder="1rem"
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Border Radius Section */}
                  <AccordionItem value="borders">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        Border Radius
                        <Badge variant="secondary">{Object.keys(localTheme.borderRadius).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        {Object.entries(localTheme.borderRadius).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`radius-${key}`} className="capitalize text-sm">
                                {key}
                              </Label>
                              <span className="text-sm text-muted-foreground font-mono">{value}</span>
                            </div>
                            <Input
                              id={`radius-${key}`}
                              type="text"
                              value={value}
                              onChange={(e) => setLocalTheme({
                                ...localTheme,
                                borderRadius: { ...localTheme.borderRadius, [key]: e.target.value }
                              })}
                              className="font-mono text-sm"
                              placeholder="0.5rem"
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Shadows Section */}
                  <AccordionItem value="shadows">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        Box Shadows
                        <Badge variant="secondary">{Object.keys(localTheme.shadows).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-4 p-4">
                        {Object.entries(localTheme.shadows).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={`shadow-${key}`} className="capitalize text-sm">
                              {key}
                            </Label>
                            <Input
                              id={`shadow-${key}`}
                              type="text"
                              value={value}
                              onChange={(e) => setLocalTheme({
                                ...localTheme,
                                shadows: { ...localTheme.shadows, [key]: e.target.value }
                              })}
                              className="font-mono text-xs"
                              placeholder="0 4px 6px -1px rgb(0 0 0 / 0.1)"
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <Accordion type="single" collapsible className="w-full">
                  {/* Font Families */}
                  <AccordionItem value="fonts">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Font Families
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-4">
                        <div className="space-y-2">
                          <Label>Heading Font</Label>
                          <Select
                            value={localTypography.fontFamily.heading}
                            onValueChange={(value) => setLocalTypography({
                              ...localTypography,
                              fontFamily: { ...localTypography.fontFamily, heading: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                              <SelectItem value="Montserrat">Montserrat</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Lato">Lato</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Body Font</Label>
                          <Select
                            value={localTypography.fontFamily.body}
                            onValueChange={(value) => setLocalTypography({
                              ...localTypography,
                              fontFamily: { ...localTypography.fontFamily, body: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Lato">Lato</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                              <SelectItem value="Nunito">Nunito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Font Sizes */}
                  <AccordionItem value="font-sizes">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        Font Sizes
                        <Badge variant="secondary">{Object.keys(localTypography.fontSize).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        {Object.entries(localTypography.fontSize).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`font-size-${key}`} className="capitalize text-sm">
                                {key}
                              </Label>
                              <span className="text-sm text-muted-foreground font-mono">{value}</span>
                            </div>
                            <Input
                              id={`font-size-${key}`}
                              type="text"
                              value={value}
                              onChange={(e) => setLocalTypography({
                                ...localTypography,
                                fontSize: { ...localTypography.fontSize, [key]: e.target.value }
                              })}
                              className="font-mono text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Font Weights */}
                  <AccordionItem value="font-weights">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        Font Weights
                        <Badge variant="secondary">{Object.keys(localTypography.fontWeight).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        {Object.entries(localTypography.fontWeight).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={`font-weight-${key}`} className="capitalize text-sm">
                              {key}
                            </Label>
                            <Select
                              value={value}
                              onValueChange={(val) => setLocalTypography({
                                ...localTypography,
                                fontWeight: { ...localTypography.fontWeight, [key]: val }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="300">Light (300)</SelectItem>
                                <SelectItem value="400">Normal (400)</SelectItem>
                                <SelectItem value="500">Medium (500)</SelectItem>
                                <SelectItem value="600">Semibold (600)</SelectItem>
                                <SelectItem value="700">Bold (700)</SelectItem>
                                <SelectItem value="800">Extrabold (800)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Line Heights */}
                  <AccordionItem value="line-heights">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        Line Heights
                        <Badge variant="secondary">{Object.keys(localTypography.lineHeight).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        {Object.entries(localTypography.lineHeight).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`line-height-${key}`} className="capitalize text-sm">
                                {key}
                              </Label>
                              <span className="text-sm text-muted-foreground font-mono">{value}</span>
                            </div>
                            <Input
                              id={`line-height-${key}`}
                              type="text"
                              value={value}
                              onChange={(e) => setLocalTypography({
                                ...localTypography,
                                lineHeight: { ...localTypography.lineHeight, [key]: e.target.value }
                              })}
                              className="font-mono text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Homepage Sections</CardTitle>
                  <CardDescription>
                    Control which sections appear on your homepage and their order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(localHomepageLayout.sections).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground">#{config.order}</span>
                        </div>
                        <div className="flex-1">
                          <Label className="capitalize text-base">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Display this section on the homepage
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Order:</Label>
                          <Input
                            type="number"
                            value={config.order}
                            onChange={(e) => setLocalHomepageLayout({
                              ...localHomepageLayout,
                              sections: {
                                ...localHomepageLayout.sections,
                                [key]: { ...config, order: parseInt(e.target.value) || 1 }
                              }
                            })}
                            className="w-16"
                            min="1"
                          />
                        </div>
                        <Switch
                          checked={config.visible}
                          onCheckedChange={(checked) => setLocalHomepageLayout({
                            ...localHomepageLayout,
                            sections: {
                              ...localHomepageLayout.sections,
                              [key]: { ...config, visible: checked }
                            }
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Components Tab */}
            <TabsContent value="components" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Component Customization</CardTitle>
                  <CardDescription>
                    Customize individual components (Coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Component-level customization will be available in the next update.
                    You'll be able to customize buttons, cards, headers, footers, and more.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Color Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Colors</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(localTheme.colors).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div
                            className="h-12 rounded-md border"
                            style={{ backgroundColor: value }}
                            title={key}
                          />
                          <p className="text-[10px] text-center truncate">{key}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Typography Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Typography</Label>
                    <div className="space-y-2">
                      <div
                        style={{
                          fontFamily: localTypography.fontFamily.heading,
                          fontSize: localTypography.fontSize.xl,
                          fontWeight: localTypography.fontWeight.bold,
                          color: localTheme.colors.foreground
                        }}
                      >
                        Heading Sample
                      </div>
                      <div
                        style={{
                          fontFamily: localTypography.fontFamily.body,
                          fontSize: localTypography.fontSize.base,
                          fontWeight: localTypography.fontWeight.normal,
                          lineHeight: localTypography.lineHeight.normal,
                          color: localTheme.colors.foreground
                        }}
                      >
                        This is body text sample showing how your content will look with the selected typography settings.
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Button Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Buttons</Label>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded text-sm font-medium transition-all"
                        style={{
                          backgroundColor: localTheme.colors.primary,
                          color: '#ffffff',
                          borderRadius: localTheme.borderRadius.md,
                          boxShadow: localTheme.shadows.sm,
                        }}
                      >
                        Primary
                      </button>
                      <button
                        className="px-4 py-2 rounded text-sm font-medium transition-all"
                        style={{
                          backgroundColor: localTheme.colors.secondary,
                          color: '#ffffff',
                          borderRadius: localTheme.borderRadius.md,
                          boxShadow: localTheme.shadows.sm,
                        }}
                      >
                        Secondary
                      </button>
                    </div>
                  </div>

                  <Separator />

                  {/* Card Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Cards</Label>
                    <div
                      className="p-4"
                      style={{
                        backgroundColor: localTheme.colors.card,
                        borderRadius: localTheme.borderRadius.lg,
                        boxShadow: localTheme.shadows.md,
                        border: `1px solid ${localTheme.colors.border}`,
                      }}
                    >
                      <h4
                        className="font-semibold mb-2"
                        style={{
                          color: localTheme.colors.cardForeground,
                          fontFamily: localTypography.fontFamily.heading
                        }}
                      >
                        Card Title
                      </h4>
                      <p
                        className="text-sm"
                        style={{
                          color: localTheme.colors.mutedForeground,
                          fontFamily: localTypography.fontFamily.body
                        }}
                      >
                        Card content goes here
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
