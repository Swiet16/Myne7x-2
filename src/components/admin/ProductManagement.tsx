import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Package, Search, Edit, Trash2, Eye, EyeOff, Save, X, Sparkles, Users } from 'lucide-react';
import DualCurrencyBadge from '@/components/ui/dual-currency-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ANIMATION_OPTIONS } from '@/components/ProductAnimations';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  file_url: string;
  category: string;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  product_animation?: string;
  created_at: string;
  creator?: string;
  developer?: string;
  graphics_designer?: string;
  team_type?: 'owner' | 'team' | 'custom';
}

interface ProductManagementProps {
  onProductsChange?: () => void;
  onUpdate?: () => void;
}

const ProductManagement = ({ onProductsChange, onUpdate }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    is_active: true,
    is_featured: false,
    product_animation: 'none',
    team_type: 'team' as 'owner' | 'team' | 'custom',
    creator: '',
    developer: '',
    graphics_designer: '',
  });

  useEffect(() => {
    fetchProducts();
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData && roleData.role === 'super_admin') {
        setIsSuperAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    fetchProducts();
    if (onProductsChange) onProductsChange();
    if (onUpdate) onUpdate();
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: currentStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      refreshProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product status",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admins can delete products",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      refreshProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category || '',
      is_active: product.is_active,
      is_featured: product.is_featured || false,
      product_animation: product.product_animation || 'none',
      team_type: product.team_type || 'team',
      creator: product.creator || '',
      developer: product.developer || '',
      graphics_designer: product.graphics_designer || '',
    });
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: editForm.title,
          description: editForm.description,
          price: editForm.price,
          category: editForm.category,
          is_active: editForm.is_active,
          is_featured: editForm.is_featured,
          product_animation: editForm.product_animation,
          team_type: editForm.team_type,
          creator: editForm.creator,
          developer: editForm.developer,
          graphics_designer: editForm.graphics_designer,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      setEditingProduct(null);
      refreshProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const toggleFeaturedStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${!currentStatus ? 'featured' : 'unfeatured'} successfully`,
      });

      refreshProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update featured status",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-white border-gray-300">
        <CardHeader className="bg-white border-b border-gray-300">
          <CardTitle className="flex items-center gap-2 text-gray-900 font-bold">
            <Package className="h-5 w-5" />
            Product Management
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="text-center py-8 text-gray-700">Loading products...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-gray-300 shadow-lg">
        <CardHeader className="bg-white border-b border-gray-300">
          <CardTitle className="flex items-center gap-2 text-gray-900 font-bold">
            <Package className="h-5 w-5" />
            Product Management
          </CardTitle>
          <CardDescription className="text-gray-700">
            Manage your products and inventory
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <div className="rounded-md border border-gray-300">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-300">
                  <TableHead className="text-gray-900 font-bold">Product</TableHead>
                  <TableHead className="text-gray-900 font-bold">Category</TableHead>
                  <TableHead className="text-gray-900 font-bold">Price</TableHead>
                  <TableHead className="text-gray-900 font-bold">Status</TableHead>
                  <TableHead className="text-gray-900 font-bold">Featured</TableHead>
                  <TableHead className="text-gray-900 font-bold">Created</TableHead>
                  <TableHead className="text-gray-900 font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="bg-white hover:bg-gray-50 transition-colors border-b border-gray-300">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-lg shadow-md"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-700 line-clamp-1">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline" className="bg-white border-gray-300 text-gray-800">
                          {product.category}
                        </Badge>
                      ) : (
                        <span className="text-gray-700">No category</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DualCurrencyBadge 
                        usdPrice={product.price} 
                        size="small" 
                        showIcons={false}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.is_active ? 'default' : 'secondary'}
                        className={product.is_active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={product.is_featured ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFeaturedStatus(product.id, product.is_featured);
                        }}
                        className={product.is_featured ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'border-gray-300 text-gray-700'}
                        title={product.is_featured ? "Remove from Featured" : "Add to Featured"}
                      >
                        {product.is_featured ? '⭐ Featured' : '☆ Feature'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                          title="Edit Product Details"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleProductStatus(product.id, !product.is_active)}
                          className={product.is_active 
                            ? "border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400" 
                            : "border-gray-300 text-gray-500 hover:bg-gray-50"
                          }
                          title={product.is_active ? "Deactivate Product" : "Activate Product"}
                        >
                          {product.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteProduct(product.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            title="Delete Product (Super Admin Only)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-700">
              No products found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-white border-b border-gray-300 pb-4">
            <DialogTitle className="flex items-center gap-2 text-gray-900 font-bold">
              <Edit className="h-5 w-5" />
              Edit Product Details
            </DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title" className="text-gray-900 font-bold">Product Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter product title"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-gray-900 font-bold">Category</Label>
                  <Input
                    id="edit-category"
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description" className="text-gray-900 font-bold">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-price" className="text-gray-900 font-bold">Price (USD)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              {/* Team/Owner Configuration */}
              <div className="border-t border-gray-300 pt-4">
                <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Team/Owner Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-team-type" className="text-gray-900 font-bold">Team Type</Label>
                    <Select
                      value={editForm.team_type}
                      onValueChange={(value: 'owner' | 'team' | 'custom') => 
                        setEditForm(prev => ({ ...prev, team_type: value }))
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-2">
                        <SelectValue placeholder="Select team type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="owner">
                          <div className="flex flex-col py-1">
                            <span className="font-semibold text-gray-900">Owner</span>
                            <span className="text-xs text-gray-600">Single owner product</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="team">
                          <div className="flex flex-col py-1">
                            <span className="font-semibold text-gray-900">Team Myne7x</span>
                            <span className="text-xs text-gray-600">Created by Team Myne7x</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex flex-col py-1">
                            <span className="font-semibold text-gray-900">Custom</span>
                            <span className="text-xs text-gray-600">Specify custom team members</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editForm.team_type === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <Label htmlFor="edit-creator" className="text-gray-900 font-bold text-sm">Creator</Label>
                        <Input
                          id="edit-creator"
                          value={editForm.creator}
                          onChange={(e) => setEditForm(prev => ({ ...prev, creator: e.target.value }))}
                          placeholder="Creator name"
                          className="bg-white border-gray-300 text-gray-900 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-developer" className="text-gray-900 font-bold text-sm">Developer</Label>
                        <Input
                          id="edit-developer"
                          value={editForm.developer}
                          onChange={(e) => setEditForm(prev => ({ ...prev, developer: e.target.value }))}
                          placeholder="Developer name"
                          className="bg-white border-gray-300 text-gray-900 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-graphics" className="text-gray-900 font-bold text-sm">Graphics Designer</Label>
                        <Input
                          id="edit-graphics"
                          value={editForm.graphics_designer}
                          onChange={(e) => setEditForm(prev => ({ ...prev, graphics_designer: e.target.value }))}
                          placeholder="Designer name"
                          className="bg-white border-gray-300 text-gray-900 mt-1"
                        />
                      </div>
                    </div>
                  )}
                  
                  {editForm.team_type === 'owner' && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div>
                        <Label htmlFor="edit-owner-name" className="text-gray-900 font-bold">Owner Name</Label>
                        <Input
                          id="edit-owner-name"
                          value={editForm.creator}
                          onChange={(e) => setEditForm(prev => ({ ...prev, creator: e.target.value }))}
                          placeholder="Enter owner name"
                          className="bg-white border-gray-300 text-gray-900 mt-2"
                        />
                      </div>
                    </div>
                  )}
                  
                  {editForm.team_type === 'team' && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        This product will be displayed as created by <span className="font-bold">Team Myne7x</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Animation Settings */}
              <div className="border-t border-gray-300 pt-4">
                <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Product Animation
                </h3>
                <div>
                  <Label htmlFor="edit-animation" className="text-gray-900 font-bold">Select Animation Style</Label>
                  <Select
                    value={editForm.product_animation}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, product_animation: value }))}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-2">
                      <SelectValue placeholder="Choose animation..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[300px]">
                      {ANIMATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col py-1">
                            <span className="font-semibold text-gray-900">{option.label}</span>
                            <span className="text-xs text-gray-600">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-2">
                    This animation will display on the product card (same as upload form)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-active" className="text-gray-800">Product is active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  checked={editForm.is_featured}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-featured" className="text-gray-800">Featured product (shown on home screen)</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={updateProduct} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingProduct(null)}
                  className="flex items-center gap-2 border-gray-300 text-gray-700"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductManagement;