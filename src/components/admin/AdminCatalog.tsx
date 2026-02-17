import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Eye, Save, Check, ChevronsUpDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateSlug } from "@/utils/slugUtils";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  type: string;
  value: string;
  image_url?: string;
  isCustom?: boolean;
}

interface Product {
  id: string;
  name: string;
  image_url: string;
  description: string;
  category_id: string;
  variants: ProductVariant[];
  created_at: string;
  price: number;
  slug: string;
  store_id: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  photo: string;
  description: string;
  category_id: string;
  subcategory_id?: string;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
  price: number;
  slug: string;
  store_id: string;
  image_url?: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
  additionalCategories?: { id: string; name: string }[];
  additionalSubcategories?: { id: string; name: string }[];
}

interface Category {
  id: string;
  name: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  parent_id: string;
}

export const AdminCatalog = () => {
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created" | "category">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    photo: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    selectedCategories: [] as string[],
    selectedSubcategories: [] as string[],
    variants: [] as ProductVariant[]
  });

  // Pre-default variant options for beauty products
  const defaultVariantOptions = {
    length: ['8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'],
    color: [
      '1 - Jet Black',
      '1B - Off Black', 
      '2 - Darkest Brown',
      '4 - Dark Brown',
      '6 - Chestnut Brown',
      '8 - Light Brown',
      '10 - Medium Blonde',
      '12 - Light Blonde',
      '14 - Pale Blonde',
      '16 - Platinum Blonde',
      '27 - Honey Blonde',
      '30 - Auburn',
      '33 - Dark Auburn',
      '99J - Wine Red',
      '350 - Copper Red',
      'Ombre',
      'Balayage',
      'Highlighted'
    ],
    texture: [
      'Straight',
      'Body Wave',
      'Deep Wave',
      'Loose Wave',
      'Water Wave',
      'Jerry Curl',
      'Kinky Straight',
      'Kinky Curly',
      'Yaki Straight',
      'Deep Curly',
      'Loose Curly'
    ],
    curl: [
      'Type 1 (Straight)',
      'Type 2A (Loose Wave)',
      'Type 2B (Wavy)',
      'Type 2C (Defined Wave)',
      'Type 3A (Loose Curl)',
      'Type 3B (Bouncy Curl)',
      'Type 3C (Tight Curl)',
      'Type 4A (Coily)',
      'Type 4B (Kinky)',
      'Type 4C (Zig-Zag)'
    ],
    diameter: ['Small', 'Medium', 'Large', 'Extra Large'],
    shape: ['Round', 'Oval', 'Square', 'Rectangular', 'Custom'],
    size: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  };

  const variantTypes = [
    { value: 'color', label: 'Color' },
    { value: 'size', label: 'Size' },
    { value: 'length', label: 'Length' },
    { value: 'curl', label: 'Curl' },
    { value: 'diameter', label: 'Diameter' },
    { value: 'texture', label: 'Texture' },
    { value: 'shape', label: 'Shape' }
  ];

  useEffect(() => {
    fetchCatalogProducts();
    fetchCategories();
  }, []);

  const fetchCatalogProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories!products_category_id_fkey(id, name),
          subcategory:categories!products_subcategory_id_fkey(id, name),
          product_variants(*),
          product_categories(
            category_id,
            categories(id, name, parent_id)
          )
        `)
        .eq('store_id', '687318ed-ebda-478a-9616-e8bd88cb710b') // Catalog products from admin store
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match CatalogProduct interface
      const transformedData = (data || []).map((product: any) => {
        // Separate additional categories and subcategories
        const allProductCategories = product.product_categories || [];
        const additionalCategories: { id: string; name: string }[] = [];
        const additionalSubcategories: { id: string; name: string }[] = [];
        
        allProductCategories.forEach((pc: any) => {
          const cat = pc.categories;
          if (!cat) return;
          
          // If it's a parent category (no parent_id) and not the primary category
          if (!cat.parent_id && cat.id !== product.category_id) {
            additionalCategories.push({ id: cat.id, name: cat.name });
          }
          // If it's a subcategory (has parent_id) and not the primary subcategory
          else if (cat.parent_id && cat.id !== product.subcategory_id) {
            additionalSubcategories.push({ id: cat.id, name: cat.name });
          }
        });

        return {
          id: product.id,
          name: product.name,
          photo: product.images?.[0] || '',
          description: product.description || '',
          category_id: product.category_id,
          subcategory_id: product.subcategory_id,
          variants: product.product_variants?.map((v: any) => {
            // Parse title to extract type and value
            const titleParts = v.title?.split(':') || [];
            return {
              id: v.id,
              type: titleParts[0]?.trim() || 'Variant',
              value: titleParts[1]?.trim() || '',
              image_url: v.image_url
            };
          }) || [],
          created_at: product.created_at,
          updated_at: product.updated_at || product.created_at,
          price: product.price || 0,
          slug: product.slug || '',
          store_id: product.store_id || '',
          image_url: product.image_url,
          category: product.category,
          subcategory: product.subcategory,
          additionalCategories,
          additionalSubcategories
        };
      });
      
      setCatalogProducts(transformedData);
    } catch (error) {
      console.error('Error fetching catalog products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch catalog products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch main categories (parent_id is null)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch subcategories (parent_id is not null)
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('categories')
        .select('*')
        .not('parent_id', 'is', null)
        .order('name');

      if (subcategoriesError) throw subcategoriesError;

      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.photo || !formData.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting product save...');

      const productData = {
        name: formData.name,
        images: [formData.photo],
        description: formData.description,
        category_id: formData.category_id,
        ...(formData.subcategory_id && { subcategory_id: formData.subcategory_id }),
        price: 0,
        slug: generateSlug(formData.name),
        store_id: '687318ed-ebda-478a-9616-e8bd88cb710b' // Use known store ID
      };

      console.log('Product data:', productData);

      let productId = editingProduct?.id;

      if (editingProduct) {
        console.log('Updating product:', editingProduct.id);
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        console.log('Inserting new product...');
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        productId = newProduct.id;
      }

      // Save variants if any
      if (formData.variants.length > 0 && productId) {
        console.log('Saving variants:', formData.variants);
        
        // Delete existing variants for this product
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId);

        // Insert new variants - only those with values
        const variantsData = formData.variants
          .filter(variant => variant.value && variant.value.trim() !== '')
          .map(variant => ({
            product_id: productId,
            title: `${variant.type}: ${variant.value}`,
            price: 0,
            sku: `${generateSlug(formData.name)}-${generateSlug(variant.type)}-${generateSlug(variant.value)}`,
            image_url: variant.image_url || null
          }));

        console.log('Variants data to insert:', variantsData);

        if (variantsData.length > 0) {
          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsData);

          if (variantsError) {
            console.error('Variants save error:', variantsError);
            toast({
              title: "Warning",
              description: "Product saved but variants failed to save: " + variantsError.message,
              variant: "destructive",
            });
          } else {
            console.log('Variants saved successfully');
          }
        }
      }

      // Save additional categories if any
      if (formData.selectedCategories.length > 0 && productId) {
        // Delete existing product categories
        await supabase
          .from('product_categories')
          .delete()
          .eq('product_id', productId);

        // Insert new product categories
        const categoriesData = formData.selectedCategories.map(catId => ({
          product_id: productId,
          category_id: catId,
          is_primary: false
        }));

        const { error: catError } = await supabase
          .from('product_categories')
          .insert(categoriesData);

        if (catError) {
          console.error('Categories error:', catError);
        }
      }

      // Save additional subcategories if any
      if (formData.selectedSubcategories.length > 0 && productId) {
        // Add subcategories to product_categories
        const subcategoriesData = formData.selectedSubcategories.map(subId => ({
          product_id: productId,
          category_id: subId,
          is_primary: false
        }));

        const { error: subError } = await supabase
          .from('product_categories')
          .insert(subcategoriesData);

        if (subError) {
          console.error('Subcategories error:', subError);
        }
      }

      toast({
        title: "Success",
        description: editingProduct ? "Product updated successfully" : "Product added to catalog successfully",
      });

      setDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchCatalogProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from the catalog?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted from catalog",
      });

      fetchCatalogProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      photo: "",
      description: "",
      category_id: "",
      subcategory_id: "",
      selectedCategories: [],
      selectedSubcategories: [],
      variants: []
    });
  };

  const openEditDialog = async (product: CatalogProduct) => {
    setEditingProduct(product);
    
    // Fetch additional categories and subcategories for this product
    const { data: productCategories } = await supabase
      .from('product_categories')
      .select('category_id, is_primary')
      .eq('product_id', product.id)
      .eq('is_primary', false);

    const additionalCatIds = productCategories?.map(pc => pc.category_id) || [];
    
    // Separate categories and subcategories
    const additionalCategories = additionalCatIds.filter(id => 
      categories.some(cat => cat.id === id)
    );
    const additionalSubcategories = additionalCatIds.filter(id => 
      subcategories.some(sub => sub.id === id)
    );
    
    setFormData({
      name: product.name,
      photo: product.photo,
      description: product.description,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id || "",
      selectedCategories: additionalCategories,
      selectedSubcategories: additionalSubcategories,
      variants: product.variants || []
    });
    setDialogOpen(true);
  };

  const openPreviewDialog = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setPreviewDialogOpen(true);
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      type: 'color',
      value: '',
      image_url: '',
      isCustom: false
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const addCustomVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      type: '',
      value: '',
      image_url: '',
      isCustom: true
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const filteredProducts = catalogProducts
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subcategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "category":
          comparison = (a.category?.name || "").localeCompare(b.category?.name || "");
          break;
        case "created":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.parent_id === categoryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
          <p className="text-gray-600">Centralized encyclopedia of all products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product to Catalog'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo URL *</Label>
                  <Input
                    id="photo"
                    value={formData.photo}
                    onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                    placeholder="Enter photo URL"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Primary Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        category_id: value,
                        subcategory_id: "" // Reset subcategory when category changes
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Primary Subcategory</Label>
                    <Select
                      key={formData.category_id} // Force re-render when category changes
                      value={formData.subcategory_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}
                      disabled={!formData.category_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.category_id 
                            ? "Select category first" 
                            : getSubcategoriesForCategory(formData.category_id).length === 0
                            ? "No subcategories available"
                            : "Select subcategory"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubcategoriesForCategory(formData.category_id).map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Additional Categories (Multi-select)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {formData.selectedCategories.length === 0
                            ? "Select additional categories..."
                            : `${formData.selectedCategories.length} selected`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-popover" align="start">
                        <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cat-${category.id}`}
                                checked={formData.selectedCategories.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedCategories: checked
                                      ? [...prev.selectedCategories, category.id]
                                      : prev.selectedCategories.filter(id => id !== category.id)
                                  }));
                                }}
                              />
                              <Label 
                                htmlFor={`cat-${category.id}`} 
                                className="font-normal cursor-pointer flex-1"
                              >
                                {category.name}
                              </Label>
                              {formData.selectedCategories.includes(category.id) && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {formData.selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.selectedCategories.map((catId) => {
                          const category = categories.find(c => c.id === catId);
                          return category ? (
                            <Badge key={catId} variant="secondary" className="text-xs">
                              {category.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                   <div className="space-y-2">
                    <Label>Additional Subcategories (Multi-select)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          disabled={formData.selectedCategories.length === 0}
                        >
                          {formData.selectedSubcategories.length === 0
                            ? formData.selectedCategories.length === 0
                              ? "Select categories first..."
                              : "Select additional subcategories..."
                            : `${formData.selectedSubcategories.length} selected`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-popover" align="start">
                        <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                          {subcategories
                            .filter(sub => formData.selectedCategories.includes(sub.parent_id))
                            .map((subcategory) => (
                            <div key={subcategory.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`subcat-${subcategory.id}`}
                                checked={formData.selectedSubcategories.includes(subcategory.id)}
                                onCheckedChange={(checked) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedSubcategories: checked
                                      ? [...prev.selectedSubcategories, subcategory.id]
                                      : prev.selectedSubcategories.filter(id => id !== subcategory.id)
                                  }));
                                }}
                              />
                              <Label 
                                htmlFor={`subcat-${subcategory.id}`} 
                                className="font-normal cursor-pointer flex-1"
                              >
                                {subcategory.name}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({categories.find(c => c.id === subcategory.parent_id)?.name})
                                </span>
                              </Label>
                              {formData.selectedSubcategories.includes(subcategory.id) && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          ))}
                          {subcategories.filter(sub => formData.selectedCategories.includes(sub.parent_id)).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No subcategories available for selected categories
                            </p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {formData.selectedSubcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.selectedSubcategories.map((subId) => {
                          const subcategory = subcategories.find(s => s.id === subId);
                          return subcategory ? (
                            <Badge key={subId} variant="outline" className="text-xs">
                              {subcategory.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Product Variants</Label>
                  <div className="flex gap-2">
                    <Button type="button" onClick={addVariant} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variant
                    </Button>
                    <Button type="button" onClick={addCustomVariant} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Custom Variant
                    </Button>
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Add variants using pre-defined options or create custom ones
                  </AlertDescription>
                </Alert>

                {formData.variants.map((variant, index) => (
                  <div key={variant.id} className="border rounded-lg p-4 space-y-3 bg-card">
                    {variant.isCustom && (
                      <Badge variant="secondary" className="mb-2">Custom Variant</Badge>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label>Variant Type</Label>
                        {variant.isCustom ? (
                          <Input
                            value={variant.type}
                            onChange={(e) => updateVariant(index, 'type', e.target.value)}
                            placeholder="e.g., Material, Pattern"
                          />
                        ) : (
                          <Select
                            value={variant.type}
                            onValueChange={(value) => updateVariant(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              {variantTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>Value</Label>
                        {variant.isCustom ? (
                          <Input
                            value={variant.value}
                            onChange={(e) => updateVariant(index, 'value', e.target.value)}
                            placeholder="Enter custom value"
                          />
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={variant.value}
                              onChange={(e) => updateVariant(index, 'value', e.target.value)}
                              placeholder="Enter value or select from defaults"
                              className="flex-1"
                            />
                            {defaultVariantOptions[variant.type as keyof typeof defaultVariantOptions] && (
                              <Select
                                value={variant.value}
                                onValueChange={(value) => updateVariant(index, 'value', value)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Defaults" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover max-h-60">
                                  {defaultVariantOptions[variant.type as keyof typeof defaultVariantOptions].map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Photo URL (Optional)</Label>
                      <Input
                        value={variant.image_url || ''}
                        onChange={(e) => updateVariant(index, 'image_url', e.target.value)}
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {variant.image_url && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            Image added
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeVariant(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingProduct ? 'Update Product' : 'Add to Catalog'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</Label>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catalog Products ({filteredProducts.length})
          </CardTitle>
          <CardDescription>
            Manage your product catalog encyclopedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products in catalog yet</p>
              <p className="text-sm text-gray-400">Add your first product to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.photo ? (
                        <img
                          src={product.photo}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.category && (
                          <Badge variant="secondary">
                            {product.category.name}
                          </Badge>
                        )}
                        {product.additionalCategories && product.additionalCategories.length > 0 && (
                          <>
                            {product.additionalCategories.slice(0, 2).map((cat, index) => (
                              <Badge key={index} variant="secondary">
                                {cat.name}
                              </Badge>
                            ))}
                            {product.additionalCategories.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{product.additionalCategories.length - 2}
                              </Badge>
                            )}
                          </>
                        )}
                        {!product.category && (!product.additionalCategories || product.additionalCategories.length === 0) && (
                          <span className="text-gray-400">No Category</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.subcategory && (
                          <Badge variant="outline">
                            {product.subcategory.name}
                          </Badge>
                        )}
                        {product.additionalSubcategories && product.additionalSubcategories.length > 0 && (
                          <>
                            {product.additionalSubcategories.slice(0, 2).map((subcat, index) => (
                              <Badge key={index} variant="outline">
                                {subcat.name}
                              </Badge>
                            ))}
                            {product.additionalSubcategories.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.additionalSubcategories.length - 2}
                              </Badge>
                            )}
                          </>
                        )}
                        {!product.subcategory && (!product.additionalSubcategories || product.additionalSubcategories.length === 0) && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.variants && product.variants.length > 0 ? (
                          <>
                            {product.variants.slice(0, 2).map((variant, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {variant.type}: {variant.value}
                              </Badge>
                            ))}
                            {product.variants.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.variants.length - 2} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">No variants</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreviewDialog(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Preview</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-32 h-32 flex-shrink-0">
                  {selectedProduct.photo ? (
                    <img
                      src={selectedProduct.photo}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      {selectedProduct.category?.name || 'No Category'}
                    </Badge>
                    {selectedProduct.subcategory && (
                      <Badge variant="outline">
                        {selectedProduct.subcategory.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedProduct.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>
              )}
              
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Variants</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.variants.map((variant, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium capitalize">{variant.type}:</span>
                        <span>{variant.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};