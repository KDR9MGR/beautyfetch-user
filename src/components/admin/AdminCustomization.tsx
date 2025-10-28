import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Type, 
  Image, 
  Square, 
  Sparkles, 
  Layout, 
  FileText, 
  Newspaper,
  Tag,
  Monitor,
  Tablet,
  Smartphone,
  Upload,
  Save,
  Eye,
  EyeOff
} from "lucide-react";

export const AdminCustomization = () => {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);

  // Color palette state
  const [colors, setColors] = useState({
    background: "#ffffff",
    primaryButton: "#ec4899",
    secondaryButton: "#f3f4f6",
    text: "#111827",
    header: "#ffffff",
    footer: "#1f2937",
    accent: "#ec4899",
    link: "#3b82f6",
  });

  // Font settings state
  const [fonts, setFonts] = useState({
    headingFont: "Inter",
    bodyFont: "Inter",
    fontSize: "16",
    lineSpacing: "1.5",
  });

  // Button settings state
  const [buttonSettings, setButtonSettings] = useState({
    shape: "rounded",
    size: "medium",
    hoverEffect: "darken",
  });

  // Border & shadow settings
  const [styleSettings, setStyleSettings] = useState({
    showBorders: true,
    showShadows: true,
    borderRadius: "8",
  });

  // Homepage section visibility
  const [homepageSections, setHomepageSections] = useState({
    heroBanner: true,
    featuredProducts: true,
    collections: true,
    stores: true,
    testimonials: false,
    blog: true,
  });

  // Mobile visibility overrides
  const [mobileVisibility, setMobileVisibility] = useState({
    heroBanner: true,
    featuredProducts: true,
    collections: true,
    stores: true,
    testimonials: false,
    blog: false,
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Your customization settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Website Customization</h2>
          <p className="text-muted-foreground">Customize your website appearance and content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview Changes
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* Device Preview Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Preview Mode
          </CardTitle>
          <CardDescription>View how your changes will look on different devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={previewMode === "desktop" ? "default" : "outline"}
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={previewMode === "tablet" ? "default" : "outline"}
              onClick={() => setPreviewMode("tablet")}
            >
              <Tablet className="h-4 w-4 mr-2" />
              Tablet
            </Button>
            <Button
              variant={previewMode === "mobile" ? "default" : "outline"}
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="promotions">Promos</TabsTrigger>
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

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo & Branding
              </CardTitle>
              <CardDescription>Upload and manage your brand assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Website Logo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  <Input type="file" className="mt-4" accept="image/*" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload favicon (32x32 or 64x64)
                  </p>
                  <Input type="file" className="mt-4" accept="image/x-icon,image/png" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Hero Banner Image</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload hero banner (recommended: 1920x600)
                  </p>
                  <Input type="file" className="mt-4" accept="image/*" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Icons</CardTitle>
              <CardDescription>Upload custom icons for cart, user, search, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Cart Icon", "User Icon", "Search Icon"].map((iconName) => (
                  <div key={iconName} className="space-y-2">
                    <Label>{iconName}</Label>
                    <div className="border rounded-lg p-4 text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <Input type="file" className="text-xs" accept="image/svg+xml,image/png" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buttons Tab */}
        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="h-5 w-5" />
                Button Styling
              </CardTitle>
              <CardDescription>Customize button appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Shape</Label>
                  <Select value={buttonSettings.shape} onValueChange={(value) => setButtonSettings({ ...buttonSettings, shape: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="pill">Pill (fully rounded)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Button Size</Label>
                  <Select value={buttonSettings.size} onValueChange={(value) => setButtonSettings({ ...buttonSettings, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hover Effect</Label>
                  <Select value={buttonSettings.hoverEffect} onValueChange={(value) => setButtonSettings({ ...buttonSettings, hoverEffect: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="darken">Darken</SelectItem>
                      <SelectItem value="lighten">Lighten</SelectItem>
                      <SelectItem value="scale">Scale Up</SelectItem>
                      <SelectItem value="shadow">Add Shadow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Button Preview</Label>
                <div className="flex gap-4 flex-wrap">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Borders & Shadows
              </CardTitle>
              <CardDescription>Control visual styling elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Borders on Cards</Label>
                  <p className="text-sm text-muted-foreground">Add borders around sections and cards</p>
                </div>
                <Switch
                  checked={styleSettings.showBorders}
                  onCheckedChange={(checked) => setStyleSettings({ ...styleSettings, showBorders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Shadows</Label>
                  <p className="text-sm text-muted-foreground">Add drop shadows to elements</p>
                </div>
                <Switch
                  checked={styleSettings.showShadows}
                  onCheckedChange={(checked) => setStyleSettings({ ...styleSettings, showShadows: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Border Radius (px)</Label>
                <Input
                  type="number"
                  value={styleSettings.borderRadius}
                  onChange={(e) => setStyleSettings({ ...styleSettings, borderRadius: e.target.value })}
                  min="0"
                  max="24"
                />
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
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Show/hide on homepage
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Visibility
              </CardTitle>
              <CardDescription>Override section visibility for mobile devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(mobileVisibility).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {value ? <Eye className="inline h-3 w-3" /> : <EyeOff className="inline h-3 w-3" />}
                      {value ? " Visible on mobile" : " Hidden on mobile"}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setMobileVisibility({ ...mobileVisibility, [key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Text Content
              </CardTitle>
              <CardDescription>Edit headlines, paragraphs, and CTAs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hero Headline</Label>
                <Input placeholder="e.g., Discover Your Perfect Beauty Products" />
              </div>

              <div className="space-y-2">
                <Label>Hero Subheadline</Label>
                <Textarea placeholder="e.g., Shop from local stores and get same-day delivery" rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Primary CTA Button Text</Label>
                <Input placeholder="e.g., Shop Now" />
              </div>

              <div className="space-y-2">
                <Label>Secondary CTA Button Text</Label>
                <Input placeholder="e.g., Browse Stores" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Featured Products Section Title</Label>
                <Input placeholder="e.g., Featured Products" />
              </div>

              <div className="space-y-2">
                <Label>Featured Products Description</Label>
                <Textarea placeholder="e.g., Check out our handpicked selection" rows={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blog Tab */}
        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Blog & News
              </CardTitle>
              <CardDescription>Manage blog posts and news articles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Blog Section</Label>
                  <p className="text-sm text-muted-foreground">Show blog on your website</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Blog Section Title</Label>
                <Input placeholder="e.g., Latest Beauty Tips" />
              </div>

              <div className="space-y-2">
                <Label>Number of Posts to Display</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 posts</SelectItem>
                    <SelectItem value="6">6 posts</SelectItem>
                    <SelectItem value="9">9 posts</SelectItem>
                    <SelectItem value="12">12 posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" variant="outline">
                Manage Blog Posts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Discounts & Coupons
              </CardTitle>
              <CardDescription>Manage promotional offers and discount codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Promo Banner</Label>
                  <p className="text-sm text-muted-foreground">Display promotional banner at top</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Promo Banner Text</Label>
                <Input placeholder="e.g., Free shipping on orders over $50!" />
              </div>

              <div className="space-y-2">
                <Label>Promo Banner Background Color</Label>
                <div className="flex gap-2">
                  <Input type="color" defaultValue="#ec4899" className="w-20 h-10" />
                  <Input type="text" defaultValue="#ec4899" className="flex-1" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Active Discount Codes</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">WELCOME10</p>
                      <p className="text-sm text-muted-foreground">10% off first order</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">FREESHIP</p>
                      <p className="text-sm text-muted-foreground">Free shipping</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <Tag className="h-4 w-4 mr-2" />
                Create New Coupon
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};