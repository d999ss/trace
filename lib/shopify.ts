import Client from 'shopify-buy';

const shopifyConfig = {
  domain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!,
  storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
  apiVersion: '2024-10',
};

const client = Client.buildClient(shopifyConfig);

export { client };

export async function getProduct(productId: string) {
  try {
    const product = await client.product.fetch(productId);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function createCheckout(variantId: string, quantity: number = 1) {
  try {
    const checkout = await client.checkout.create();
    
    const lineItemsToAdd = [{
      variantId,
      quantity
    }];
    
    const updatedCheckout = await client.checkout.addLineItems(checkout.id, lineItemsToAdd);
    return updatedCheckout;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
}

export async function updateCheckoutAttributes(checkoutId: string, customAttributes: Array<{key: string, value: string}>) {
  try {
    const checkout = await client.checkout.updateAttributes(checkoutId, {
      customAttributes
    });
    return checkout;
  } catch (error) {
    console.error('Error updating checkout attributes:', error);
    throw error;
  }
}