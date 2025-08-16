import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  DollarSign, 
  Clock, 
  Shield, 
  CheckCircle, 
  Users, 
  FileText,
  Phone,
  Mail,
  MapPin,
  Star,
  Zap,
  ArrowRight
} from 'lucide-react';

interface PaymentRequestData {
  customer_email: string;
  customer_name: string;
  product_type: string;
  property_address?: string;
  phone_number?: string;
}

const BetaLanding: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const betaOffers = [
    {
      id: 'ai_report',
      title: 'AI Damage Report',
      price: '$49.99',
      originalPrice: '$199',
      badge: 'BETA PRICE',
      description: 'Get professional roof damage assessment in minutes',
      features: [
        'Instant AI damage detection',
        'Professional PDF report',
        'Accurate cost estimation',
        'Insurance claim ready',
        'Email delivery in 5-10 min'
      ],
      cta: 'Get My Report Now',
      popular: true,
      timeToValue: '5-10 minutes',
      icon: Camera
    },
    {
      id: 'claims_automation',
      title: 'Automated Claims Package',
      price: '$99.99',
      originalPrice: '$599',
      badge: 'BEST VALUE',
      description: 'Complete insurance claim processing automation',
      features: [
        'Everything in AI Report',
        'Automated claim submission',
        'Insurance documentation',
        'Adjuster communication',
        'Claim tracking & updates'
      ],
      cta: 'Automate My Claim',
      timeToValue: '30-60 minutes',
      icon: Shield
    },
    {
      id: 'contractor_leads',
      title: 'Qualified Leads',
      price: '$29.99',
      originalPrice: '$149',
      badge: 'PER LEAD',
      description: 'Pre-qualified homeowner leads with damage assessment',
      features: [
        'Pre-qualified customers',
        'Damage assessment included',
        'Direct contact info',
        'Project value estimate',
        'Lead scoring & priority'
      ],
      cta: 'Get Quality Leads',
      timeToValue: 'Immediate',
      icon: Users,
      forContractors: true
    }
  ];

  const handleGetStarted = async (productType: string) => {
    if (!customerData.name || !customerData.email) {
      alert('Please fill in your name and email to continue');
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(productType);

    try {
      // Call payment service to create checkout session
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_type: productType,
          customer_email: customerData.email,
          customer_name: customerData.name,
          metadata: {
            phone_number: customerData.phone,
            property_address: customerData.address
          }
        }),
      });

      if (response.ok) {
        const { checkout_url } = await response.json();
        // Redirect to Stripe checkout
        window.location.href = checkout_url;
      } else {
        throw new Error('Payment setup failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment setup failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const testimonials = [
    {
      name: "Mike Rodriguez",
      role: "Homeowner",
      text: "Got my roof damage report in 8 minutes. Insurance approved the claim the same day!",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Contractor",
      text: "These leads are gold. 3 out of 5 converted to $25K+ projects.",
      rating: 5
    },
    {
      name: "David Johnson",
      role: "Insurance Agent",
      text: "Claims process is 10x faster. Clients love the automated documentation.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 text-[#0D1117] bg-[#58A5FF]">
              🚀 BETA LAUNCH - LIMITED TIME PRICING
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-[#C9D1D9] mb-6">
              AI-Powered Roof Analysis
              <span className="block text-[#58A5FF]">In Minutes, Not Days</span>
            </h1>
            <p className="text-xl text-[#C9D1D9] mb-8 max-w-2xl mx-auto">
              Get professional damage assessment, cost estimates, and insurance documentation 
              faster than any human inspector. Pay only for results.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#58A5FF]">5 min</div>
                <div className="text-sm text-[#C9D1D9]">Average Report Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1FF6EB]">94%</div>
                <div className="text-sm text-[#C9D1D9]">Insurance Approval Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FFF66A]">$8.5K</div>
                <div className="text-sm text-[#C9D1D9]">Average Project Value</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Form */}
      <div className="container mx-auto px-4 mb-16">
        <Card className="max-w-2xl mx-auto bg-[#161B22] border-[#58A5FF]/20">
          <CardHeader className="text-center">
            <CardTitle className="text-[#C9D1D9]">Get Started - Enter Your Info</CardTitle>
            <CardDescription className="text-[#C9D1D9]/70">
              Required for service delivery and payment processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-[#C9D1D9]">Full Name *</Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                  className="bg-[#0D1117] border-[#58A5FF]/30 text-[#C9D1D9] placeholder:text-[#C9D1D9]/50"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-[#C9D1D9]">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@email.com"
                  className="bg-[#0D1117] border-[#58A5FF]/30 text-[#C9D1D9] placeholder:text-[#C9D1D9]/50"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-[#C9D1D9]">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="bg-[#0D1117] border-[#58A5FF]/30 text-[#C9D1D9] placeholder:text-[#C9D1D9]/50"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-[#C9D1D9]">Property Address</Label>
                <Input
                  id="address"
                  value={customerData.address}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State"
                  className="bg-[#0D1117] border-[#58A5FF]/30 text-[#C9D1D9] placeholder:text-[#C9D1D9]/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beta Pricing */}
      <div className="container mx-auto px-4 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#C9D1D9] mb-4">
            Beta Launch Pricing 🔥
          </h2>
          <p className="text-xl text-[#C9D1D9]/70">
            Limited time - Get enterprise AI tools at startup prices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {betaOffers.map((offer) => {
            const IconComponent = offer.icon;
            return (
              <Card 
                key={offer.id}
                className={`relative bg-[#161B22] border-[#58A5FF]/20 ${offer.popular ? 'ring-2 ring-[#58A5FF] scale-105' : ''}`}
              >
                {offer.badge && (
                  <Badge 
                    className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${
                      offer.popular ? 'bg-[#58A5FF]' : 'bg-[#1FF6EB]'
                    } text-[#0D1117] font-bold`}
                  >
                    {offer.badge}
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-[#58A5FF]/20 rounded-full w-fit">
                    <IconComponent className="h-8 w-8 text-[#58A5FF]" />
                  </div>
                  <CardTitle className="text-xl text-[#C9D1D9]">{offer.title}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-3xl font-bold text-[#58A5FF]">{offer.price}</span>
                      <span className="text-lg text-[#C9D1D9]/50 line-through">{offer.originalPrice}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1 text-sm text-[#1FF6EB]">
                      <Clock className="h-4 w-4" />
                      <span>{offer.timeToValue}</span>
                    </div>
                  </div>
                  <CardDescription className="text-center text-[#C9D1D9]/70">
                    {offer.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {offer.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-[#1FF6EB] flex-shrink-0" />
                        <span className="text-sm text-[#C9D1D9]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full bg-[#58A5FF] hover:bg-[#58A5FF]/80 text-[#0D1117] font-bold"
                    onClick={() => handleGetStarted(offer.id)}
                    disabled={isProcessing || !customerData.name || !customerData.email}
                  >
                    {isProcessing && selectedPlan === offer.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>{offer.cta}</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                  
                  {offer.forContractors && (
                    <p className="text-xs text-center text-[#C9D1D9]/50 mt-2">
                      For contractors and roofing professionals
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-[#C9D1D9]/70">
            💳 Secure payment by Stripe • 📧 Instant email delivery • 📞 Support included
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-[#161B22] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#C9D1D9] mb-12">
            How It Works (3 Simple Steps)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-[#58A5FF]/20 rounded-full w-fit">
                <Camera className="h-8 w-8 text-[#58A5FF]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#C9D1D9]">1. Upload Photos</h3>
              <p className="text-[#C9D1D9]/70">
                Take photos of your roof damage with any camera or phone
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-[#1FF6EB]/20 rounded-full w-fit">
                <Zap className="h-8 w-8 text-[#1FF6EB]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#C9D1D9]">2. AI Analysis</h3>
              <p className="text-[#C9D1D9]/70">
                Our AI analyzes damage and generates professional reports
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-[#FFF66A]/20 rounded-full w-fit">
                <FileText className="h-8 w-8 text-[#FFF66A]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#C9D1D9]">3. Get Results</h3>
              <p className="text-[#C9D1D9]/70">
                Receive professional report via email within minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#C9D1D9] mb-12">
          What Beta Users Are Saying
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-[#161B22] border-[#58A5FF]/20">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-[#FFF66A] fill-current" />
                  ))}
                </div>
                <p className="text-[#C9D1D9]/70 mb-4">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-[#C9D1D9]">{testimonial.name}</div>
                  <div className="text-sm text-[#C9D1D9]/50">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#58A5FF] text-[#0D1117] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Your AI Damage Report?
          </h2>
          <p className="text-xl mb-8">
            Join hundreds of homeowners and contractors saving time and money with AI
          </p>
          <div className="space-y-4">
            <p className="text-lg font-semibold">
              ✅ 5-minute reports • ✅ Insurance approved • ✅ Money-back guarantee
            </p>
            <p className="text-sm text-[#0D1117]/70">
              Beta pricing ends soon - secure your spot today
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#161B22] text-[#C9D1D9] py-8 border-t border-[#58A5FF]/20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#58A5FF]">OrPaynter AI</h3>
            <p className="text-[#C9D1D9]/70">AI-Powered Roofing Solutions</p>
          </div>
          <div className="text-sm text-[#C9D1D9]/50">
            <p>© 2024 OrPaynter AI. All rights reserved.</p>
            <p>Questions? Email: support@orpaynter.ai | Call: (555) 123-4567</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BetaLanding;
