const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Integration Service for OrPaynter
 * Handles payment processing, subscription management, and invoicing
 */
class StripeService {
  /**
   * Create a new customer in Stripe
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(customerData) {
    try {
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: {
          userId: customerData.userId,
          userType: customerData.userType
        }
      });
      
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  /**
   * Create a payment method and attach to customer
   * @param {string} customerId - Stripe customer ID
   * @param {Object} paymentMethodData - Payment method information
   * @returns {Promise<Object>} Attached payment method
   */
  async createPaymentMethod(customerId, paymentMethodData) {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentMethodData.cardNumber,
          exp_month: paymentMethodData.expMonth,
          exp_year: paymentMethodData.expYear,
          cvc: paymentMethodData.cvc
        },
        billing_details: {
          name: paymentMethodData.name,
          email: paymentMethodData.email,
          address: paymentMethodData.address
        }
      });

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id
        }
      });

      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw new Error(`Failed to create payment method: ${error.message}`);
    }
  }

  /**
   * Create a subscription for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} priceId - Stripe price ID
   * @returns {Promise<Object>} Subscription object
   */
  async createSubscription(customerId, priceId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent']
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Create a one-time payment (invoice)
   * @param {string} customerId - Stripe customer ID
   * @param {number} amount - Amount in cents
   * @param {string} description - Payment description
   * @returns {Promise<Object>} Payment intent object
   */
  async createPayment(customerId, amount, description) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        description,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Create an invoice for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {Array} items - Invoice line items
   * @returns {Promise<Object>} Invoice object
   */
  async createInvoice(customerId, items) {
    try {
      // Create invoice items
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: item.amount,
          currency: 'usd',
          description: item.description
        });
      }

      // Create and finalize the invoice
      const invoice = await stripe.invoices.create({
        customer: customerId,
        auto_advance: true
      });

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      
      return finalizedInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>} Response object
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSuccess(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailure(event.data.object);
        
        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaymentSuccess(event.data.object);
        
        case 'invoice.payment_failed':
          return await this.handleInvoicePaymentFailure(event.data.object);
        
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object);
        
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object);
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionCanceled(event.data.object);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return { status: 'ignored', event: event.type };
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw new Error(`Failed to handle webhook event: ${error.message}`);
    }
  }

  /**
   * Handle successful payment
   * @param {Object} paymentIntent - Payment intent object
   * @returns {Promise<Object>} Response object
   */
  async handlePaymentSuccess(paymentIntent) {
    // Update order status in database
    // Send confirmation email to customer
    // Update project status if applicable
    return { status: 'success', paymentIntentId: paymentIntent.id };
  }

  /**
   * Handle failed payment
   * @param {Object} paymentIntent - Payment intent object
   * @returns {Promise<Object>} Response object
   */
  async handlePaymentFailure(paymentIntent) {
    // Update order status in database
    // Send notification to customer
    // Alert admin if needed
    return { status: 'failed', paymentIntentId: paymentIntent.id };
  }

  /**
   * Handle successful invoice payment
   * @param {Object} invoice - Invoice object
   * @returns {Promise<Object>} Response object
   */
  async handleInvoicePaymentSuccess(invoice) {
    // Update subscription status in database
    // Send confirmation email to customer
    return { status: 'success', invoiceId: invoice.id };
  }

  /**
   * Handle failed invoice payment
   * @param {Object} invoice - Invoice object
   * @returns {Promise<Object>} Response object
   */
  async handleInvoicePaymentFailure(invoice) {
    // Update subscription status in database
    // Send notification to customer
    // Retry payment if applicable
    return { status: 'failed', invoiceId: invoice.id };
  }

  /**
   * Handle subscription creation
   * @param {Object} subscription - Subscription object
   * @returns {Promise<Object>} Response object
   */
  async handleSubscriptionCreated(subscription) {
    // Update subscription status in database
    // Send welcome email to customer
    return { status: 'created', subscriptionId: subscription.id };
  }

  /**
   * Handle subscription update
   * @param {Object} subscription - Subscription object
   * @returns {Promise<Object>} Response object
   */
  async handleSubscriptionUpdated(subscription) {
    // Update subscription status in database
    // Send notification to customer if needed
    return { status: 'updated', subscriptionId: subscription.id };
  }

  /**
   * Handle subscription cancellation
   * @param {Object} subscription - Subscription object
   * @returns {Promise<Object>} Response object
   */
  async handleSubscriptionCanceled(subscription) {
    // Update subscription status in database
    // Send cancellation confirmation to customer
    return { status: 'canceled', subscriptionId: subscription.id };
  }
}

module.exports = new StripeService();
