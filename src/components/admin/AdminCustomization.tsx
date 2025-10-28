import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Palette, 
  Type, 
  Layout, 
  Save,
  RefreshCw
} from "lucide-react";

interface ColorSettings {
  background: string;
  primary: string;
  secondary: string;
  text: string;
  header: string;
  footer: string;
  accent: string;
}

interface FontSettings {
  headingFont: string;
  bodyFont: string;
  fontSize: string;
  lineSpacing: string;
}

interface SectionVisibility {
  heroBanner: boolean;
  featuredProducts: boolean;
  collections: boolean;
  stores: boolean;
  testimonials: boolean;
  blog: boolean;
}

export const AdminCustomization = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Color palette state
  const [colors, setColors] = useState<ColorSettings>({
    background: "#ffffff",
    primary: "#ec4899",
    secondary: "#f3f4f6",
    text: "#111827",
    header: "#ffffff",
    footer: "#1f2937",
    accent: "#ec4899",
  });

  // Font settings state
  const [fonts, setFonts] = useState<FontSettings>({
    headingFont: "Inter",
    bodyFont: "Inter",
    fontSize: "16",
    lineSpacing: "1.5",
  });

  // Homepage section visibility
  const [homepageSections, setHomepageSections] = useState<SectionVisibility>({
    heroBanner: true,
    featuredProducts: true,
    collections: true,
    stores: true,
    testimonials: false,
    blog: true,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('site_customization')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        data.forEach(setting => {
          switch (setting.setting_key) {
            case 'colors':
              setColors(setting.setting_value as unknown as ColorSettings);
              break;
            case 'fonts':
              setFonts(setting.setting_value as unknown as FontSettings);
              break;
            case 'homepage_sections':
              setHomepageSections(setting.setting_value as unknown as SectionVisibility);
              break;
          }
        });
        
        toast({
          title: "Settings loaded",
          description: "Your customization settings have been loaded.",
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Using default settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save colors
      const { error: colorsError } = await supabase
        .from('site_customization')
        .upsert([{
          setting_key: 'colors',
          setting_value: colors as any,
        }], {
          onConflict: 'setting_key'
        });
      
      if (colorsError) throw colorsError;

      // Save fonts
      const { error: fontsError } = await supabase
        .from('site_customization')
        .upsert([{
          setting_key: 'fonts',
          setting_value: fonts as any,
        }], {
          onConflict: 'setting_key'
        });
      
      if (fontsError) throw fontsError;

      // Save homepage sections
      const { error: sectionsError } = await supabase
        .from('site_customization')
        .upsert([{
          setting_key: 'homepage_sections',
          setting_value: homepageSections as any,
        }], {
          onConflict: 'setting_key'
        });
      
      if (sectionsError) throw sectionsError;
      
      toast({
        title: "Settings saved",
        description: "Your customization settings have been saved successfully.",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Website Customization</h2>
          <p className="text-muted-foreground">Customize your website appearance and content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="fonts">Typography</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </CardTitle>
              <CardDescription>Customize your website's color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        type="color"
                        value={value}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fonts Tab */}
        <TabsContent value="fonts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography Settings
              </CardTitle>
              <CardDescription>Customize fonts and text appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headingFont">Heading Font</Label>
                  <Select value={fonts.headingFont} onValueChange={(value) => setFonts({ ...fonts, headingFont: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyFont">Body Font</Label>
                  <Select value={fonts.bodyFont} onValueChange={(value) => setFonts({ ...fonts, bodyFont: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Base Font Size (px)</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={fonts.fontSize}
                    onChange={(e) => setFonts({ ...fonts, fontSize: e.target.value })}
                    min="12"
                    max="24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineSpacing">Line Spacing</Label>
                  <Input
                    id="lineSpacing"
                    type="number"
                    step="0.1"
                    value={fonts.lineSpacing}
                    onChange={(e) => setFonts({ ...fonts, lineSpacing: e.target.value })}
                    min="1"
                    max="2.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Homepage Sections
              </CardTitle>
              <CardDescription>Control which sections appear on your homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(homepageSections).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <p className="text-sm text-muted-foreground">
                      Display this section on the homepage
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setHomepageSections({ ...homepageSections, [key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
