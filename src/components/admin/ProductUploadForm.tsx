import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Plus, DollarSign, IndianRupee, Sparkles, RefreshCw, Users, User as UserIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ProductAnimations, ANIMATION_OPTIONS } from '@/components/ProductAnimations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductUploadFormProps {
  onProductUploaded: () => void;
}

const ProductUploadForm = ({ onProductUploaded }: ProductUploadFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceUsd: '',
    pricePkr: '',
    category: '',
    tags: [] as string[],
    isFree: false,
    isFeatured: false,
    productAnimation: 'none',
    creator: '',
    developer: '',
    graphicsDesigner: '',
    teamType: 'custom' as 'owner' | 'team' | 'custom',
  });
  const [newTag, setNewTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [productFile, setProductFile] = useState<File | null>(null);
  const [featureImages, setFeatureImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(281);
  const [autoConvert, setAutoConvert] = useState<boolean>(true);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl('');
    }
  }, [imageFile]);

  const handleTeamTypeChange = (type: 'owner' | 'team' | 'custom') => {
    setFormData(prev => {
      if (type === 'team') {
        return {
          ...prev,
          teamType: 'team',
          creator: 'Team Myne7x',
          developer: 'Team Myne7x',
          graphicsDesigner: 'Team Myne7x',
        };
      } else if (type === 'owner') {
        return {
          ...prev,
          teamType: 'owner',
          creator: 'Owner',
          developer: 'Owner',
          graphicsDesigner: 'Owner',
        };
      } else {
        return {
          ...prev,
          teamType: 'custom',
          creator: '',
          developer: '',
          graphicsDesigner: '',
        };
      }
    });
  };

  const handlePriceChange = (value: string, currency: 'usd' | 'pkr') => {
    if (!autoConvert) {
      if (currency === 'usd') {
        setFormData(prev => ({ ...prev, priceUsd: value }));
      } else {
        setFormData(prev => ({ ...prev, pricePkr: value }));
      }
      return;
    }

    if (currency === 'usd') {
      const usd = parseFloat(value);
      if (!isNaN(usd)) {
        setFormData(prev => ({
          ...prev,
          priceUsd: value,
          pricePkr: (usd * exchangeRate).toFixed(2),
        }));
      } else {
        setFormData(prev => ({ ...prev, priceUsd: value, pricePkr: '' }));
      }
    } else {
      const pkr = parseFloat(value);
      if (!isNaN(pkr)) {
        setFormData(prev => ({
          ...prev,
          pricePkr: value,
          priceUsd: (pkr / exchangeRate).toFixed(2),
        }));
      } else {
        setFormData(prev => ({ ...prev, pricePkr: value, priceUsd: '' }));
      }
    }
  };

  const handleExchangeRateChange = (value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate) && rate > 0) {
      setExchangeRate(rate);
      if (autoConvert && formData.priceUsd) {
        const usd = parseFloat(formData.priceUsd);
        if (!isNaN(usd)) {
          setFormData(prev => ({
            ...prev,
            pricePkr: (usd * rate).toFixed(2),
          }));
        }
      }
    } else if (value === '') {
      setExchangeRate(0);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const uploadFile = async (file: File, bucket: string, customName?: string) => {
    const originalFileName = file.name;
    const lastDotIndex = originalFileName.lastIndexOf('.');
    const fileExt = lastDotIndex !== -1 ? originalFileName.substring(lastDotIndex) : '';
    
    let fileName;
    if (customName) {
      let sanitizedName = customName
        .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
        .replace(/\s+/g, '_')
        .trim();
      
      const productNameDotIndex = sanitizedName.lastIndexOf('.');
      if (productNameDotIndex !== -1) {
        sanitizedName = sanitizedName.substring(0, productNameDotIndex);
      }
      
      fileName = `${sanitizedName}${fileExt}`;
    } else {
      fileName = `${Math.random()}${fileExt}`;
    }
    
    const filePath = fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || (!formData.isFree && (!formData.priceUsd || !formData.pricePkr))) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = '';
      let fileUrl = '';

      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'product-images');
      }

      if (productFile) {
        fileUrl = await uploadFile(productFile, 'product-files', formData.title);
      }

      let featureImageUrls: string[] = [];
      if (featureImages.length > 0) {
        featureImageUrls = await Promise.all(
          featureImages.map(file => uploadFile(file, 'product-images'))
        );
      }

      const { error } = await supabase
        .from('products')
        .insert({
          title: formData.title,
          description: formData.description,
          price: formData.isFree ? 0 : parseFloat(formData.priceUsd),
          price_pkr: formData.isFree ? 0 : parseFloat(formData.pricePkr),
          category: formData.category || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          image_url: imageUrl || null,
          file_url: fileUrl || null,
          feature_images: featureImageUrls.length > 0 ? featureImageUrls : null,
          is_active: true,
          is_featured: formData.isFeatured,
          product_animation: formData.productAnimation || 'none',
          creator: formData.creator || null,
          developer: formData.developer || null,
          graphics_designer: formData.graphicsDesigner || null,
          team_type: formData.teamType || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product uploaded successfully!",
      });

      setFormData({
        title: '',
        description: '',
        priceUsd: '',
        pricePkr: '',
        category: '',
        tags: [],
        isFree: false,
        isFeatured: false,
        productAnimation: 'none',
        creator: '',
        developer: '',
        graphicsDesigner: '',
        teamType: 'custom',
      });
      setNewTag('');
      setImageFile(null);
      setImagePreviewUrl('');
      setProductFile(null);
      setFeatureImages([]);
      onProductUploaded();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload product",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="h-5 w-5" />
          Upload New Product
        </CardTitle>
        <CardDescription className="text-purple-100">
          Add a new digital product to your store
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="title" className="text-gray-900 font-semibold text-sm sm:text-base">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter product title"
                required
                className="mt-2 border-2 border-gray-300 focus:border-blue-500 text-gray-900 font-medium bg-white"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-gray-900 font-semibold text-sm sm:text-base">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Software, Ebooks, Templates"
                className="mt-2 border-2 border-gray-300 focus:border-blue-500 text-gray-900 font-medium bg-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-900 font-semibold text-sm sm:text-base">Description (Unlimited Text)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your product in detail... You can write as much as you need!"
              rows={6}
              className="mt-2 border-2 border-gray-300 focus:border-blue-500 text-gray-900 font-medium bg-white resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">No character limit - write detailed descriptions!</p>
          </div>

          {/* Team/Owner Selection Section */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-indigo-600" />
                Team/Owner Configuration
              </h3>
              <p className="text-sm text-gray-600 mb-4">Select who created this product</p>
            </div>

            {/* Team Type Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                onClick={() => handleTeamTypeChange('owner')}
                className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  formData.teamType === 'owner'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                }`}
              >
                <UserIcon className="h-6 w-6" />
                <span className="font-bold text-xs sm:text-sm">Owner</span>
              </Button>
              
              <Button
                type="button"
                onClick={() => handleTeamTypeChange('team')}
                className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  formData.teamType === 'team'
                    ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'
                }`}
              >
                <Users className="h-6 w-6" />
                <span className="font-bold text-xs sm:text-sm leading-tight">Team<br className="sm:hidden" />Myne7x</span>
              </Button>
              
              <Button
                type="button"
                onClick={() => handleTeamTypeChange('custom')}
                className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  formData.teamType === 'custom'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                }`}
              >
                <Sparkles className="h-6 w-6" />
                <span className="font-bold text-xs sm:text-sm">Custom</span>
              </Button>
            </div>

            {/* Team Member Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="creator" className="text-gray-900 font-semibold text-sm">Creator</Label>
                <Input
                  id="creator"
                  value={formData.creator}
                  onChange={(e) => {
                    if (formData.teamType === 'custom') {
                      setFormData(prev => ({ ...prev, creator: e.target.value }));
                    }
                  }}
                  placeholder="Creator name"
                  disabled={formData.teamType !== 'custom'}
                  className="mt-2 border-2 border-gray-300 focus:border-indigo-500 text-gray-900 font-medium bg-white disabled:bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="developer" className="text-gray-900 font-semibold text-sm">Developer</Label>
                <Input
                  id="developer"
                  value={formData.developer}
                  onChange={(e) => {
                    if (formData.teamType === 'custom') {
                      setFormData(prev => ({ ...prev, developer: e.target.value }));
                    }
                  }}
                  placeholder="Developer name"
                  disabled={formData.teamType !== 'custom'}
                  className="mt-2 border-2 border-gray-300 focus:border-indigo-500 text-gray-900 font-medium bg-white disabled:bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="graphicsDesigner" className="text-gray-900 font-semibold text-sm">Graphics Designer</Label>
                <Input
                  id="graphicsDesigner"
                  value={formData.graphicsDesigner}
                  onChange={(e) => {
                    if (formData.teamType === 'custom') {
                      setFormData(prev => ({ ...prev, graphicsDesigner: e.target.value }));
                    }
                  }}
                  placeholder="Designer name"
                  disabled={formData.teamType !== 'custom'}
                  className="mt-2 border-2 border-gray-300 focus:border-indigo-500 text-gray-900 font-medium bg-white disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-lg">
              <p className="text-xs text-gray-700">
                <strong>💡 Tip:</strong> {
                  formData.teamType === 'owner' 
                    ? 'All fields are set to "Owner" for single creator products.' 
                    : formData.teamType === 'team'
                    ? 'All fields are set to "Team Myne7x" for team-created products.'
                    : 'You can customize each role individually for this product.'
                }
              </p>
            </div>
          </div>

          {/* Currency Configuration Section */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Currency Settings
                </h3>
                <p className="text-sm text-gray-600">Configure pricing and exchange rate</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="free-toggle"
                  checked={formData.isFree}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      isFree: checked,
                      priceUsd: checked ? '0' : prev.priceUsd,
                      pricePkr: checked ? '0' : prev.pricePkr,
                    }));
                  }}
                />
                <Label htmlFor="free-toggle" className="text-gray-700 text-sm font-semibold">Free Product</Label>
              </div>
            </div>

            {!formData.isFree && (
              <>
                <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <Label htmlFor="exchangeRate" className="text-gray-900 font-bold text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-yellow-600" />
                    Exchange Rate (1 USD = ? Rs)
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="exchangeRate"
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => handleExchangeRateChange(e.target.value)}
                      placeholder="281"
                      className="border-2 border-yellow-400 focus:border-yellow-600 text-gray-900 font-bold bg-white"
                    />
                    <div className="flex items-center gap-2 bg-white px-3 rounded-lg border-2 border-yellow-400">
                      <span className="text-sm font-bold text-gray-900">Rs</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Current: 1 USD = {exchangeRate} Rs (Customize this rate anytime)
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div>
                    <Label className="text-gray-900 font-bold text-sm">Auto-Convert Prices</Label>
                    <p className="text-xs text-gray-600">Enable to automatically calculate Rs from USD</p>
                  </div>
                  <Switch
                    checked={autoConvert}
                    onCheckedChange={setAutoConvert}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceUsd" className="text-gray-900 font-semibold text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      Price (USD) *
                    </Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-lg">$</span>
                      <Input
                        id="priceUsd"
                        type="number"
                        step="0.01"
                        value={formData.priceUsd}
                        onChange={(e) => handlePriceChange(e.target.value, 'usd')}
                        placeholder="0.00"
                        required
                        className="pl-8 border-2 border-blue-300 focus:border-blue-500 text-gray-900 font-bold bg-white text-lg"
                      />
                    </div>
                    {autoConvert && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        ✓ Rs will auto-calculate
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pricePkr" className="text-gray-900 font-semibold text-sm flex items-center gap-2">
                      <span className="text-green-600 font-bold">₨</span>
                      Price (Rs) {autoConvert ? '' : '*'}
                    </Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg">Rs</span>
                      <Input
                        id="pricePkr"
                        type="number"
                        step="0.01"
                        value={formData.pricePkr}
                        onChange={(e) => handlePriceChange(e.target.value, 'pkr')}
                        placeholder="0.00"
                        required={!autoConvert}
                        disabled={autoConvert}
                        className="pl-12 border-2 border-green-300 focus:border-green-500 text-gray-900 font-bold bg-white text-lg disabled:bg-gray-100"
                      />
                    </div>
                    {!autoConvert && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Independent editing enabled
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
                  <p className="text-xs text-gray-700">
                    <strong>💡 Tip:</strong> {autoConvert 
                      ? 'With auto-convert ON, changing USD will update Rs automatically based on your exchange rate.' 
                      : 'With auto-convert OFF, you can set both USD and Rs prices independently without auto-calculation.'}
                  </p>
                </div>
              </>
            )}

            {formData.isFree && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                <p className="text-green-700 font-bold">
                  ✓ This product will be available for free download
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="image" className="text-gray-900 font-semibold text-sm sm:text-base">Main Product Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="mt-2 border-2 border-gray-300 focus:border-blue-500 text-gray-900 font-medium bg-white"
              />
              {imagePreviewUrl && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Image uploaded - Preview shown above
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="file" className="text-gray-900 font-semibold text-sm sm:text-base">Product File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                className="mt-2 border-2 border-gray-300 focus:border-blue-500 text-gray-900 font-medium bg-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="feature-images" className="text-gray-900 font-semibold text-sm sm:text-base">Feature Images</Label>
            <Input
              id="feature-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setFeatureImages(files);
              }}
              className="mt-2 border-2 border-gray-300 focus:border-blue-500 text-gray-900 font-medium bg-white"
            />
            {featureImages.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-700 font-medium">
                  {featureImages.length} image(s) selected
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {featureImages.map((file, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-gray-200 text-gray-800">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Switch
              id="featured-toggle"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
            />
            <Label htmlFor="featured-toggle" className="text-gray-900 font-semibold text-sm sm:text-base">Mark as Featured Post</Label>
            <p className="text-xs text-gray-600 ml-auto">Featured products appear prominently on the homepage.</p>
          </div>

          {/* Animation Selection with Live Preview */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="animation" className="text-gray-900 font-semibold text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Select Animation Style
              </Label>
              <Select
                value={formData.productAnimation}
                onValueChange={(value) => setFormData(prev => ({ ...prev, productAnimation: value }))}
              >
                <SelectTrigger className="mt-2 border-2 border-gray-300 focus:border-purple-500 text-gray-900 font-medium bg-white">
                  <SelectValue placeholder="Choose animation..." />
                </SelectTrigger>
                <SelectContent>
                  {ANIMATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Live Preview - Full Product Card */}
            {formData.productAnimation !== 'none' && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <Label className="text-gray-900 font-semibold text-sm mb-3 block">Live Animation Preview</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Light Background Preview */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Light Background</p>
                    <div className="relative bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 z-20 pointer-events-none">
                          <ProductAnimations 
                            animationType={formData.productAnimation}
                            isDarkBackground={false}
                          />
                        </div>
                        
                        {imagePreviewUrl ? (
                          <div className="h-48 overflow-hidden relative z-10">
                            <img
                              src={imagePreviewUrl}
                              alt={formData.title || 'Product preview'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative z-10">
                            <p className="text-gray-400 text-sm">No image uploaded</p>
                          </div>
                        )}
                        
                        <div className="p-4 bg-white relative z-10">
                          <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2">
                            {formData.title || 'Product Title'}
                          </h3>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {formData.description || 'Sample Product Card'}
                          </p>
                          <div className="flex items-center justify-between">
                            {formData.isFree ? (
                              <Badge className="bg-green-500 text-white">FREE</Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 font-bold">{formData.priceUsd || '0.00'} $</span>
                                {formData.pricePkr && (
                                  <>
                                    <span className="text-gray-400">/</span>
                                    <span className="px-2 py-0.5 bg-green-500 border-2 border-green-600 rounded text-black font-bold text-sm">
                                      {Math.round(parseFloat(formData.pricePkr)).toLocaleString('en-US')} Rs
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dark Background Preview */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Dark Background</p>
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 z-20 pointer-events-none">
                          <ProductAnimations 
                            animationType={formData.productAnimation}
                            isDarkBackground={true}
                          />
                        </div>
                        
                        {imagePreviewUrl ? (
                          <div className="h-48 overflow-hidden relative z-10">
                            <img
                              src={imagePreviewUrl}
                              alt={formData.title || 'Product preview'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative z-10">
                            <p className="text-gray-500 text-sm">No image uploaded</p>
                          </div>
                        )}
                        
                        <div className="p-4 bg-gray-900 relative z-10">
                          <h3 className="font-bold text-white text-base mb-2 line-clamp-2">
                            {formData.title || 'Product Title'}
                          </h3>
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                            {formData.description || 'Sample Product Card'}
                          </p>
                          <div className="flex items-center justify-between">
                            {formData.isFree ? (
                              <Badge className="bg-green-500 text-white">FREE</Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400 font-bold">{formData.priceUsd || '0.00'} $</span>
                                {formData.pricePkr && (
                                  <>
                                    <span className="text-gray-600">/</span>
                                    <span className="px-2 py-0.5 bg-green-500 border-2 border-green-600 rounded text-black font-bold text-sm">
                                      {Math.round(parseFloat(formData.pricePkr)).toLocaleString('en-US')} Rs
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3 italic">
                  ✨ Preview shows how the animation will look on both light and dark card backgrounds
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label className="text-gray-900 font-semibold text-sm sm:text-base">Tags</Label>
              <div className="flex gap-2 mb-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="border-2 border-gray-300 focus:border-blue-500 text-gray-900 font-medium bg-white"
                />
                <Button type="button" onClick={addTag} size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-gray-200 text-gray-800">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer text-gray-600 hover:text-red-500 transition-colors" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium h-10 sm:h-12 text-sm sm:text-base">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Product
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductUploadForm;