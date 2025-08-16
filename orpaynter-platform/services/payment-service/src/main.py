"""
OrPaynter Payment Service - Stripe Integration for Beta Revenue
Revenue-focused payment processing with subscription and per-use billing
"""

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
import stripe
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="OrPaynter Payment Service",
    description="Revenue-generating payment processing for AI roofing services",
    version="1.0.0"
)

# Stripe configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")

# Beta pricing configuration
BETA_PRICING = {
    "ai_report": {
        "name": "AI Damage Report",
        "price": 4999,  # $49.99
        "currency": "usd",
        "description": "Instant AI-powered roof damage assessment"
    },
    "claims_automation": {
        "name": "Automated Claims Package",
        "price": 9999,  # $99.99
        "currency": "usd", 
        "description": "Complete automated insurance claim processing"
    },
    "contractor_leads": {
        "name": "Qualified Contractor Leads",
        "price": 2999,  # $29.99 per lead
        "currency": "usd",
        "description": "Pre-qualified leads with damage assessment"
    },
    "beta_monthly": {
        "name": "OrPaynter Beta Monthly",
        "price": 19999,  # $199.99/month
        "currency": "usd",
        "description": "Unlimited AI reports + claims automation"
    }
}

# Pydantic models
class PaymentRequest(BaseModel):
    product_type: str  # ai_report, claims_automation, contractor_leads, beta_monthly
    customer_email: str
    customer_name: str
    project_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class SubscriptionRequest(BaseModel):
    customer_email: str
    customer_name: str
    plan_type: str = "beta_monthly"
    trial_days: int = 7

class WebhookData(BaseModel):
    type: str
    data: Dict[str, Any]

@app.post("/payments/create-checkout")
async def create_checkout_session(payment_request: PaymentRequest):
    """Create Stripe checkout session for immediate payment"""
    try:
        if payment_request.product_type not in BETA_PRICING:
            raise HTTPException(status_code=400, detail="Invalid product type")
        
        product = BETA_PRICING[payment_request.product_type]
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': product['currency'],
                    'product_data': {
                        'name': product['name'],
                        'description': product['description'],
                    },
                    'unit_amount': product['price'],
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"https://jzdnyh4o9k.space.minimax.io/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url="https://jzdnyh4o9k.space.minimax.io/pricing",
            customer_email=payment_request.customer_email,
            metadata={
                "customer_name": payment_request.customer_name,
                "product_type": payment_request.product_type,
                "project_id": payment_request.project_id or "",
                **payment_request.metadata
            }
        )
        
        logger.info(f"Created checkout session for {payment_request.customer_email}: {checkout_session.id}")
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "amount": product['price'],
            "currency": product['currency']
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Payment creation error: {e}")
        raise HTTPException(status_code=500, detail="Payment creation failed")

@app.post("/payments/create-subscription")
async def create_subscription(sub_request: SubscriptionRequest):
    """Create recurring subscription for beta users"""
    try:
        if sub_request.plan_type not in BETA_PRICING:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        product = BETA_PRICING[sub_request.plan_type]
        
        # Create or retrieve customer
        customers = stripe.Customer.list(email=sub_request.customer_email, limit=1)
        if customers.data:
            customer = customers.data[0]
        else:
            customer = stripe.Customer.create(
                email=sub_request.customer_email,
                name=sub_request.customer_name,
                metadata={"plan_type": sub_request.plan_type}
            )
        
        # Create price for subscription
        price = stripe.Price.create(
            unit_amount=product['price'],
            currency=product['currency'],
            recurring={'interval': 'month'},
            product_data={
                'name': product['name'],
                'description': product['description'],
            },
        )
        
        # Create subscription with trial
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{'price': price.id}],
            trial_period_days=sub_request.trial_days,
            metadata={
                "plan_type": sub_request.plan_type,
                "customer_name": sub_request.customer_name
            }
        )
        
        logger.info(f"Created subscription for {sub_request.customer_email}: {subscription.id}")
        
        return {
            "subscription_id": subscription.id,
            "customer_id": customer.id,
            "trial_ends": subscription.trial_end,
            "status": subscription.status,
            "amount": product['price'],
            "currency": product['currency']
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe subscription error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Subscription creation error: {e}")
        raise HTTPException(status_code=500, detail="Subscription creation failed")

@app.get("/payments/session/{session_id}")
async def get_session_details(session_id: str):
    """Get checkout session details"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return {
            "session_id": session.id,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency,
            "customer_email": session.customer_email,
            "metadata": session.metadata
        }
    except stripe.error.StripeError as e:
        logger.error(f"Session retrieval error: {e}")
        raise HTTPException(status_code=404, detail="Session not found")

@app.post("/payments/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Stripe webhooks for payment events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle successful payment
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            background_tasks.add_task(handle_successful_payment, session)
        
        # Handle successful subscription
        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            background_tasks.add_task(handle_subscription_created, subscription)
        
        # Handle failed payment
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            background_tasks.add_task(handle_failed_payment, payment_intent)
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

async def handle_successful_payment(session):
    """Process successful payment and trigger AI service"""
    try:
        customer_email = session.get('customer_email')
        product_type = session.get('metadata', {}).get('product_type')
        project_id = session.get('metadata', {}).get('project_id')
        
        logger.info(f"Processing successful payment: {customer_email} - {product_type}")
        
        # TODO: Trigger AI processing based on product type
        if product_type == "ai_report":
            # Trigger AI damage analysis
            pass
        elif product_type == "claims_automation":
            # Trigger automated claims processing
            pass
        elif product_type == "contractor_leads":
            # Generate contractor leads
            pass
        
        # TODO: Send confirmation email
        # TODO: Update user credits/permissions
        
    except Exception as e:
        logger.error(f"Error handling successful payment: {e}")

async def handle_subscription_created(subscription):
    """Process new subscription"""
    try:
        customer_id = subscription.get('customer')
        plan_type = subscription.get('metadata', {}).get('plan_type')
        
        logger.info(f"Processing new subscription: {customer_id} - {plan_type}")
        
        # TODO: Grant subscription access
        # TODO: Send welcome email
        
    except Exception as e:
        logger.error(f"Error handling subscription: {e}")

async def handle_failed_payment(payment_intent):
    """Handle failed payment"""
    try:
        customer_email = payment_intent.get('receipt_email')
        
        logger.warning(f"Payment failed for: {customer_email}")
        
        # TODO: Send payment failure notification
        # TODO: Retry logic for subscriptions
        
    except Exception as e:
        logger.error(f"Error handling failed payment: {e}")

@app.get("/payments/pricing")
async def get_pricing():
    """Get current beta pricing"""
    return {
        "beta_pricing": BETA_PRICING,
        "features": {
            "ai_report": [
                "Instant AI damage detection",
                "Professional PDF report",
                "Cost estimation",
                "Insurance claim ready"
            ],
            "claims_automation": [
                "Everything in AI Report",
                "Automated claim submission",
                "Document generation",
                "Adjuster communication"
            ],
            "contractor_leads": [
                "Pre-qualified homeowners",
                "Damage assessment included",
                "Contact information",
                "Lead scoring"
            ],
            "beta_monthly": [
                "Unlimited AI reports",
                "Claims automation",
                "Priority support",
                "Early access to new features"
            ]
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "payment-service",
        "stripe_connected": bool(stripe.api_key)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
