import { RideObject, ProductMetadata } from '@/lib/types/ride';
import Client from 'shopify-buy';

interface ShopifyConfig {
  domain: string;
  storefrontAccessToken: string;
  apiVersion: string;
}

interface ProductBundle {
  poster: ProductVariant;
  digitalDownload?: ProductVariant;
  frame?: ProductVariant;
  additionalProducts?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  title: string;
  price: number;
  sku: string;
  image?: string;
  options: Record<string, any>;
}

export class ShopifyIntegration {
  private client: any;
  private config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.client = Client.buildClient({
      domain: config.domain,
      storefrontAccessToken: config.storefrontAccessToken,
      apiVersion: config.apiVersion || '2024-01'
    });
  }

  /**
   * Create a complete product listing from a ride object
   */
  async createProductFromRide(ride: RideObject): Promise<string> {
    const productData = this.buildProductData(ride);
    
    try {
      // Create product in Shopify
      const product = await this.createProduct(productData);
      
      // Add variants for different sizes and finishes
      const variants = await this.createProductVariants(product.id, ride);
      
      // Set up inventory tracking
      await this.setupInventory(product.id, variants);
      
      // Configure fulfillment settings
      await this.configureFulfillment(product.id, ride.fulfillment);
      
      // Add to collections
      await this.addToCollections(product.id, ride);
      
      return product.id;
    } catch (error) {
      console.error('Failed to create Shopify product:', error);
      throw error;
    }
  }

  /**
   * Build product data from ride object
   */
  private buildProductData(ride: RideObject): any {
    const { product, marketing, customizations } = ride;
    
    return {
      title: product.title || `${customizations.title} - Premium Poster`,
      description: this.generateProductDescription(ride),
      vendor: 'PrintMyRide',
      productType: 'Poster',
      tags: [
        'cycling-poster',
        'custom-map',
        ride.context.type,
        ...marketing.hashtags
      ],
      images: [
        // These would be generated from the poster renders
        ride.renders?.preview,
        ride.renders?.socialShare
      ].filter(Boolean),
      options: [
        { name: 'Size', values: product.sizes.map(s => s.label) },
        { name: 'Finish', values: product.finishes.map(f => f.label) },
        { name: 'Frame', values: ['No Frame', ...product.frames.map(f => f.label)] }
      ],
      metafields: [
        {
          namespace: 'printmyride',
          key: 'ride_id',
          value: ride.id,
          valueType: 'STRING'
        },
        {
          namespace: 'printmyride',
          key: 'ride_metrics',
          value: JSON.stringify(ride.metrics),
          valueType: 'JSON_STRING'
        },
        {
          namespace: 'printmyride',
          key: 'print_specs',
          value: JSON.stringify(ride.fulfillment.printSpecs),
          valueType: 'JSON_STRING'
        }
      ],
      seo: {
        title: `${customizations.title} Cycling Route Poster | PrintMyRide`,
        description: marketing.headline || product.description,
        keywords: marketing.hashtags.join(', ')
      }
    };
  }

  /**
   * Generate rich product description
   */
  private generateProductDescription(ride: RideObject): string {
    const { metrics, marketing, context, customizations } = ride;
    
    let description = `<div class="product-description">`;
    
    // Hero statement
    description += `<h2>${marketing.headline}</h2>`;
    
    // Story section
    description += `<div class="ride-story">`;
    description += `<p>${marketing.story}</p>`;
    description += `</div>`;
    
    // Metrics showcase
    description += `<div class="ride-metrics">`;
    description += `<h3>Route Details</h3>`;
    description += `<ul>`;
    description += `<li>Distance: ${metrics.distance.toFixed(1)} ${metrics.distanceUnit}</li>`;
    description += `<li>Elevation Gain: ${metrics.elevationGain.toLocaleString()} ${metrics.elevationUnit}</li>`;
    description += `<li>Duration: ${this.formatDuration(metrics.duration)}</li>`;
    
    if (metrics.averageSpeed) {
      description += `<li>Average Speed: ${metrics.averageSpeed.toFixed(1)} ${metrics.distanceUnit}/h</li>`;
    }
    
    description += `</ul>`;
    description += `</div>`;
    
    // Print quality
    description += `<div class="print-quality">`;
    description += `<h3>Museum-Quality Print</h3>`;
    description += `<ul>`;
    description += `<li>Professional 300 DPI printing</li>`;
    description += `<li>Archival quality paper</li>`;
    description += `<li>Fade-resistant inks</li>`;
    description += `<li>Ready to frame</li>`;
    description += `</ul>`;
    description += `</div>`;
    
    // Milestones if any
    if (marketing.milestones.length > 0) {
      description += `<div class="ride-milestones">`;
      description += `<h3>Notable Points</h3>`;
      description += `<ul>`;
      marketing.milestones.forEach(milestone => {
        description += `<li>${milestone.label}</li>`;
      });
      description += `</ul>`;
      description += `</div>`;
    }
    
    description += `</div>`;
    
    return description;
  }

  /**
   * Create product variants for sizes and finishes
   */
  private async createProductVariants(productId: string, ride: RideObject): Promise<any[]> {
    const { product } = ride;
    const variants: any[] = [];
    
    for (const size of product.sizes) {
      for (const finish of product.finishes) {
        // Base variant (no frame)
        const baseVariant = {
          productId,
          title: `${size.label} - ${finish.label}`,
          sku: `${product.sku}-${size.id}-${finish.id}`,
          price: size.price.amount * finish.priceMultiplier,
          inventoryQuantity: -1, // Unlimited for print-on-demand
          options: [
            { name: 'Size', value: size.label },
            { name: 'Finish', value: finish.label },
            { name: 'Frame', value: 'No Frame' }
          ],
          weight: this.calculateWeight(size, null),
          weightUnit: 'KILOGRAMS',
          requiresShipping: true,
          fulfillmentService: 'manual'
        };
        
        variants.push(baseVariant);
        
        // Framed variants
        for (const frame of product.frames) {
          const framedVariant = {
            ...baseVariant,
            title: `${size.label} - ${finish.label} - ${frame.label} Frame`,
            sku: `${product.sku}-${size.id}-${finish.id}-${frame.id}`,
            price: baseVariant.price + frame.price.amount,
            options: [
              { name: 'Size', value: size.label },
              { name: 'Finish', value: finish.label },
              { name: 'Frame', value: frame.label }
            ],
            weight: this.calculateWeight(size, frame)
          };
          
          variants.push(framedVariant);
        }
      }
    }
    
    // Create variants in Shopify
    const createdVariants = await Promise.all(
      variants.map(v => this.createVariant(v))
    );
    
    return createdVariants;
  }

  /**
   * Setup inventory tracking
   */
  private async setupInventory(productId: string, variants: any[]): Promise<void> {
    // For print-on-demand, we typically don't track inventory
    // But we can set up tracking for limited editions or special runs
    
    for (const variant of variants) {
      await this.updateInventory(variant.id, {
        tracked: false, // Print on demand
        policy: 'CONTINUE', // Allow overselling
        fulfillmentService: 'manual',
        requiresShipping: true
      });
    }
  }

  /**
   * Configure fulfillment settings
   */
  private async configureFulfillment(productId: string, fulfillment: RideObject['fulfillment']): Promise<void> {
    // Set up fulfillment provider integration
    const fulfillmentConfig = {
      provider: fulfillment.printProvider,
      productionTime: fulfillment.productionTime,
      shippingOptions: fulfillment.shippingOptions,
      printSpecs: fulfillment.printSpecs
    };
    
    // This would integrate with Printful/Printify API
    await this.setupPrintProvider(productId, fulfillmentConfig);
  }

  /**
   * Add product to relevant collections
   */
  private async addToCollections(productId: string, ride: RideObject): Promise<void> {
    const collections = [];
    
    // Add to ride type collection
    collections.push(`${ride.context.type}-rides`);
    
    // Add to location-based collection if available
    if (ride.context.location.city) {
      collections.push(`rides-${ride.context.location.city.toLowerCase().replace(/\s+/g, '-')}`);
    }
    
    // Add to featured if it's a notable ride
    if (ride.metrics.distance > 100 || ride.metrics.elevationGain > 2000) {
      collections.push('featured-rides');
    }
    
    // Add to seasonal collections
    const month = new Date(ride.context.time.startTime).getMonth();
    if (month >= 2 && month <= 4) collections.push('spring-rides');
    else if (month >= 5 && month <= 7) collections.push('summer-rides');
    else if (month >= 8 && month <= 10) collections.push('fall-rides');
    else collections.push('winter-rides');
    
    for (const collectionHandle of collections) {
      await this.addToCollection(productId, collectionHandle);
    }
  }

  /**
   * Create product bundles
   */
  async createBundle(ride: RideObject): Promise<ProductBundle> {
    const bundle: ProductBundle = {
      poster: await this.createPosterVariant(ride),
      digitalDownload: await this.createDigitalVariant(ride),
      frame: await this.createFrameOption(ride)
    };
    
    // Add complementary products
    bundle.additionalProducts = [
      await this.createMugVariant(ride),
      await this.createStickersVariant(ride),
      await this.createDigitalWallpaperVariant(ride)
    ].filter(Boolean);
    
    return bundle;
  }

  /**
   * Handle one-click reorders
   */
  async createReorder(originalOrderId: string, rideId: string): Promise<string> {
    // Fetch original order details
    const originalOrder = await this.getOrder(originalOrderId);
    
    // Create new order with same specifications
    const reorder = await this.createOrder({
      lineItems: originalOrder.lineItems.map((item: any) => ({
        variantId: item.variant.id,
        quantity: item.quantity,
        customAttributes: [
          { key: 'reorder', value: 'true' },
          { key: 'original_order', value: originalOrderId },
          { key: 'ride_id', value: rideId }
        ]
      })),
      shippingAddress: originalOrder.shippingAddress,
      email: originalOrder.email,
      note: `Reorder of ${originalOrderId}`
    });
    
    return reorder.id;
  }

  /**
   * Create referral program
   */
  async createReferralCode(customerId: string, rideId: string): Promise<string> {
    const code = this.generateReferralCode(customerId, rideId);
    
    await this.createDiscountCode({
      code,
      value: 15, // 15% discount
      valueType: 'PERCENTAGE',
      usageLimit: 10,
      customerSelection: 'ALL',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      metafields: [
        { key: 'referrer_id', value: customerId },
        { key: 'ride_id', value: rideId }
      ]
    });
    
    return code;
  }

  /**
   * Helper methods
   */
  
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  }

  private calculateWeight(size: any, frame: any): number {
    let weight = 0.1; // Base poster weight in kg
    
    // Add weight based on size
    if (size.dimensions.width > 40 || size.dimensions.height > 50) {
      weight += 0.05;
    }
    
    // Add frame weight
    if (frame) {
      weight += 0.5; // Frame adds 500g
    }
    
    return weight;
  }

  private generateReferralCode(customerId: string, rideId: string): string {
    const prefix = 'RIDE';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  }

  // Shopify API wrapper methods
  private async createProduct(data: any): Promise<any> {
    // Implementation would call Shopify Admin API
    return { id: 'product_' + Date.now() };
  }

  private async createVariant(data: any): Promise<any> {
    // Implementation would call Shopify Admin API
    return { id: 'variant_' + Date.now(), ...data };
  }

  private async updateInventory(variantId: string, settings: any): Promise<void> {
    // Implementation would call Shopify Admin API
  }

  private async setupPrintProvider(productId: string, config: any): Promise<void> {
    // Implementation would integrate with Printful/Printify
  }

  private async addToCollection(productId: string, collectionHandle: string): Promise<void> {
    // Implementation would call Shopify Admin API
  }

  private async createPosterVariant(ride: RideObject): Promise<ProductVariant> {
    return {
      id: 'poster_variant_' + Date.now(),
      title: ride.customizations.title + ' Poster',
      price: ride.product.price.amount,
      sku: ride.product.sku,
      options: {}
    };
  }

  private async createDigitalVariant(ride: RideObject): Promise<ProductVariant> {
    return {
      id: 'digital_variant_' + Date.now(),
      title: ride.customizations.title + ' Digital Download',
      price: 9.99,
      sku: ride.product.sku + '-DIGITAL',
      options: {}
    };
  }

  private async createFrameOption(ride: RideObject): Promise<ProductVariant | undefined> {
    if (ride.product.frames.length > 0) {
      return {
        id: 'frame_variant_' + Date.now(),
        title: 'Premium Frame',
        price: ride.product.frames[0].price.amount,
        sku: ride.product.sku + '-FRAME',
        options: {}
      };
    }
    return undefined;
  }

  private async createMugVariant(ride: RideObject): Promise<ProductVariant> {
    return {
      id: 'mug_variant_' + Date.now(),
      title: ride.customizations.title + ' Mug',
      price: 24.99,
      sku: ride.product.sku + '-MUG',
      options: {}
    };
  }

  private async createStickersVariant(ride: RideObject): Promise<ProductVariant> {
    return {
      id: 'stickers_variant_' + Date.now(),
      title: ride.customizations.title + ' Sticker Pack',
      price: 12.99,
      sku: ride.product.sku + '-STICKERS',
      options: {}
    };
  }

  private async createDigitalWallpaperVariant(ride: RideObject): Promise<ProductVariant> {
    return {
      id: 'wallpaper_variant_' + Date.now(),
      title: ride.customizations.title + ' Wallpaper Pack',
      price: 4.99,
      sku: ride.product.sku + '-WALLPAPER',
      options: {}
    };
  }

  private async getOrder(orderId: string): Promise<any> {
    // Implementation would call Shopify Admin API
    return { id: orderId, lineItems: [], shippingAddress: {}, email: '' };
  }

  private async createOrder(orderData: any): Promise<any> {
    // Implementation would call Shopify Admin API
    return { id: 'order_' + Date.now() };
  }

  private async createDiscountCode(discountData: any): Promise<void> {
    // Implementation would call Shopify Admin API
  }
}

export default ShopifyIntegration;