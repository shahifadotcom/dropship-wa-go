import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/AdminLayout';

export default function Theme() {
  const [colors, setColors] = useState({
    primary: '#0066FF',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    destructive: '#EF4444'
  });

  const [typography, setTypography] = useState({
    fontFamily: 'Inter',
    headingSize: '2.5rem',
    bodySize: '1rem'
  });

  const [layout, setLayout] = useState({
    borderRadius: '0.75rem',
    spacing: '1rem',
    maxWidth: '1200px'
  });

  const [darkMode, setDarkMode] = useState(false);

  const handleColorChange = (colorKey: string, value: string) => {
    setColors(prev => ({ ...prev, [colorKey]: value }));
  };

  const handleTypographyChange = (key: string, value: string) => {
    setTypography(prev => ({ ...prev, [key]: value }));
  };

  const handleLayoutChange = (key: string, value: string) => {
    setLayout(prev => ({ ...prev, [key]: value }));
  };

  const applyTheme = () => {
    // Convert hex to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const root = document.documentElement;
    
    // Apply colors
    root.style.setProperty('--primary', hexToHsl(colors.primary));
    root.style.setProperty('--secondary', hexToHsl(colors.secondary));
    root.style.setProperty('--success', hexToHsl(colors.success));
    root.style.setProperty('--warning', hexToHsl(colors.warning));
    root.style.setProperty('--destructive', hexToHsl(colors.destructive));

    // Apply layout
    root.style.setProperty('--radius', layout.borderRadius);

    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    toast.success('Theme applied successfully!');
  };

  const resetToDefault = () => {
    setColors({
      primary: '#0066FF',
      secondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      destructive: '#EF4444'
    });
    setTypography({
      fontFamily: 'Inter',
      headingSize: '2.5rem',
      bodySize: '1rem'
    });
    setLayout({
      borderRadius: '0.75rem',
      spacing: '1rem',
      maxWidth: '1200px'
    });
    setDarkMode(false);
    
    // Reset CSS variables
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--success');
    root.style.removeProperty('--warning');
    root.style.removeProperty('--destructive');
    root.style.removeProperty('--radius');
    document.documentElement.classList.remove('dark');
    
    toast.success('Theme reset to default!');
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Theme Customization</h1>
          <p className="text-muted-foreground">Customize your store's appearance</p>
        </div>

        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>Customize your brand colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-16 h-10 p-1 border"
                        />
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                    <Label htmlFor="dark-mode">Enable Dark Mode</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Customize fonts and text sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <select
                      value={typography.fontFamily}
                      onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Heading Size</Label>
                    <Input
                      value={typography.headingSize}
                      onChange={(e) => handleTypographyChange('headingSize', e.target.value)}
                      placeholder="2.5rem"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Body Text Size</Label>
                    <Input
                      value={typography.bodySize}
                      onChange={(e) => handleTypographyChange('bodySize', e.target.value)}
                      placeholder="1rem"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout Settings</CardTitle>
                <CardDescription>Customize spacing and layout properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <Input
                      value={layout.borderRadius}
                      onChange={(e) => handleLayoutChange('borderRadius', e.target.value)}
                      placeholder="0.75rem"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Base Spacing</Label>
                    <Input
                      value={layout.spacing}
                      onChange={(e) => handleLayoutChange('spacing', e.target.value)}
                      placeholder="1rem"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Container Width</Label>
                    <Input
                      value={layout.maxWidth}
                      onChange={(e) => handleLayoutChange('maxWidth', e.target.value)}
                      placeholder="1200px"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preview</CardTitle>
                <CardDescription>See how your theme looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 border border-border rounded-lg space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">Sample Heading</h2>
                  <p className="text-muted-foreground">This is sample body text to show how your typography settings look.</p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button style={{ backgroundColor: colors.primary }}>Primary Button</Button>
                    <Button variant="secondary" style={{ backgroundColor: colors.secondary }}>Secondary</Button>
                    <Button variant="destructive" style={{ backgroundColor: colors.destructive }}>Destructive</Button>
                  </div>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg">Sample Card</h3>
                    <p className="text-sm text-muted-foreground">This card shows your current border radius and spacing settings.</p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Button onClick={applyTheme} className="flex-1">
            Apply Theme
          </Button>
          <Button onClick={resetToDefault} variant="outline">
            Reset to Default
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}