Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { sessionId, userMessage, currentStep, conversationData } = await req.json();

        if (!sessionId) {
            throw new Error('Session ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Conversation flow logic
        const conversationSteps = {
            'greeting': {
                response: "Hi! I'm here to help you get your roof inspected quickly. What type of roof damage are you experiencing?",
                options: ["Storm damage", "Leak issues", "Aging/wear", "Other damage"],
                next: 'damage_type'
            },
            'damage_type': {
                response: "I understand you're dealing with {damage_type}. How severe would you rate the damage on a scale of 1-10?",
                next: 'damage_severity'
            },
            'damage_severity': {
                response: "Thanks for that info. Can you describe the damage in more detail? This helps us match you with the right contractor.",
                next: 'damage_description'
            },
            'damage_description': {
                response: "Perfect! Now, do you have homeowner's insurance that might cover this damage?",
                options: ["Yes, I have insurance", "No insurance", "Not sure"],
                next: 'insurance_status'
            },
            'insurance_status': {
                response: "Great! Let me get your contact information so we can connect you with qualified contractors in your area. What's your full name?",
                next: 'contact_name'
            },
            'contact_name': {
                response: "Nice to meet you, {contact_name}! What's the best email address to reach you?",
                next: 'contact_email'
            },
            'contact_email': {
                response: "And what's your phone number? Our contractors prefer to call to schedule inspections.",
                next: 'contact_phone'
            },
            'contact_phone': {
                response: "Perfect! What's the address of the property that needs the roof inspection?",
                next: 'property_address'
            },
            'property_address': {
                response: "Excellent! Are you the homeowner or decision-maker for this property?",
                options: ["Yes, I'm the homeowner", "Yes, I can make decisions", "No, I need to check with someone"],
                next: 'decision_maker'
            },
            'decision_maker': {
                response: "Perfect! Would you like to upload any photos of the damage? This helps contractors provide better estimates.",
                options: ["Yes, I'll upload photos", "No photos right now"],
                next: 'photo_upload'
            },
            'photo_upload': {
                response: "Excellent! I'm now processing your information and matching you with qualified contractors in your area. This will just take a moment...",
                next: 'lead_qualification'
            },
            'lead_qualification': {
                response: "🎉 Great news! I've found {contractor_count} highly-rated contractors in your area. You should expect to hear from them within 2-4 hours. We guarantee a 90% appointment setup rate!",
                next: 'completion'
            }
        };

        // Get current conversation data
        let updatedData = conversationData || {};
        let nextStep = currentStep || 'greeting';
        let botResponse = '';
        let options = [];
        let showPhotoUpload = false;
        let leadQualified = false;

        // Process user message based on current step
        if (userMessage && currentStep !== 'greeting') {
            switch (currentStep) {
                case 'damage_type':
                    updatedData.damageType = userMessage;
                    break;
                case 'damage_severity':
                    updatedData.damageSeverity = parseInt(userMessage) || 5;
                    break;
                case 'damage_description':
                    updatedData.damageDescription = userMessage;
                    break;
                case 'insurance_status':
                    updatedData.hasInsurance = userMessage.toLowerCase().includes('yes');
                    updatedData.insuranceResponse = userMessage;
                    break;
                case 'contact_name':
                    updatedData.contactName = userMessage;
                    break;
                case 'contact_email':
                    updatedData.contactEmail = userMessage;
                    break;
                case 'contact_phone':
                    updatedData.contactPhone = userMessage;
                    break;
                case 'property_address':
                    updatedData.propertyAddress = userMessage;
                    break;
                case 'decision_maker':
                    updatedData.isDecisionMaker = userMessage.toLowerCase().includes('yes');
                    break;
                case 'photo_upload':
                    updatedData.wantsPhotoUpload = userMessage.toLowerCase().includes('yes');
                    showPhotoUpload = userMessage.toLowerCase().includes('yes');
                    break;
            }
        }

        // Get next step info
        const stepInfo = conversationSteps[nextStep];
        if (stepInfo) {
            // Template the response with user data
            botResponse = stepInfo.response
                .replace('{damage_type}', updatedData.damageType || 'damage')
                .replace('{contact_name}', updatedData.contactName || '')
                .replace('{contractor_count}', '3');
            
            options = stepInfo.options || [];
            nextStep = stepInfo.next;

            // Special handling for lead qualification
            if (currentStep === 'photo_upload') {
                leadQualified = true;
            }
        }

        // Save message to database
        if (userMessage) {
            await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: sessionId,
                    message_type: 'user',
                    message_content: userMessage,
                    sender: 'user'
                })
            });
        }

        // Save bot response
        await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation_id: sessionId,
                message_type: 'bot',
                message_content: botResponse,
                sender: 'assistant'
            })
        });

        // Update conversation
        await fetch(`${supabaseUrl}/rest/v1/chat_conversations?id=eq.${sessionId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_step: nextStep,
                conversation_data: updatedData,
                last_activity: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                response: botResponse,
                options: options,
                nextStep: nextStep,
                conversationData: updatedData,
                showPhotoUpload: showPhotoUpload,
                leadQualified: leadQualified,
                progress: Math.round((Object.keys(updatedData).length / 10) * 100)
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chatbot conversation error:', error);

        const errorResponse = {
            error: {
                code: 'CHATBOT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});