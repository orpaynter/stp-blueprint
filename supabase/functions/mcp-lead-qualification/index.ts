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
        const { sessionId, leadData } = await req.json();

        if (!sessionId || !leadData) {
            throw new Error('Session ID and lead data are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Calculate lead qualification score
        let score = 5; // Base score
        
        // Damage severity scoring
        if (leadData.damageSeverity >= 8) score += 3;
        else if (leadData.damageSeverity >= 6) score += 2;
        else if (leadData.damageSeverity >= 4) score += 1;

        // Insurance scoring
        if (leadData.hasInsurance) score += 2;

        // Decision maker scoring
        if (leadData.isDecisionMaker) score += 2;

        // Photo evidence scoring
        if (leadData.hasPhotos) score += 1;

        // Contact completeness
        if (leadData.contactName && leadData.contactEmail && leadData.contactPhone) score += 1;

        // Property address completeness
        if (leadData.propertyAddress) score += 1;

        const qualificationScore = Math.min(10, Math.max(1, score));
        const qualified = qualificationScore >= 6;
        const priority = qualificationScore >= 8 ? 'high' : qualificationScore >= 6 ? 'medium' : 'low';

        // Parse property address for location data
        const addressParts = leadData.propertyAddress?.split(',') || [];
        const city = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : '';
        const stateZip = addressParts.length > 0 ? addressParts[addressParts.length - 1]?.trim() : '';
        const zipMatch = stateZip.match(/\d{5}/);
        const zipCode = zipMatch ? zipMatch[0] : '';
        const state = stateZip.replace(zipCode, '').trim();

        // Create qualified lead record
        const leadResponse = await fetch(`${supabaseUrl}/rest/v1/qualified_leads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                conversation_id: sessionId,
                contact_name: leadData.contactName || '',
                contact_email: leadData.contactEmail || '',
                contact_phone: leadData.contactPhone || '',
                property_address: leadData.propertyAddress || '',
                city: city,
                state: state,
                zip_code: zipCode,
                property_type: 'residential',
                damage_type: leadData.damageType || 'general',
                damage_severity: leadData.damageSeverity >= 8 ? 'severe' : leadData.damageSeverity >= 6 ? 'moderate' : 'minor',
                damage_description: leadData.damageDescription || '',
                urgency_level: leadData.damageSeverity || 5,
                has_insurance: leadData.hasInsurance || false,
                insurance_company: leadData.insuranceResponse?.includes('Allstate') ? 'Allstate' : 
                                leadData.insuranceResponse?.includes('State Farm') ? 'State Farm' :
                                leadData.insuranceResponse?.includes('Farmers') ? 'Farmers' : null,
                is_decision_maker: leadData.isDecisionMaker || false,
                qualification_score: qualificationScore,
                priority_level: priority,
                status: qualified ? 'qualified' : 'unqualified'
            })
        });

        if (!leadResponse.ok) {
            const errorText = await leadResponse.text();
            throw new Error(`Failed to create lead: ${errorText}`);
        }

        const leadResult = await leadResponse.json();
        const leadId = leadResult[0]?.id;

        // If qualified, generate contractor matches
        let contractorMatches = [];
        if (qualified && zipCode) {
            // Sample contractor data (in real implementation, this would call MCP server)
            const sampleContractors = [
                {
                    id: 'CONT_001',
                    name: 'Elite Roofing Solutions',
                    rating: 4.8,
                    specialties: ['storm damage', 'residential', 'insurance claims'],
                    response_time: '2 hours average',
                    phone: '(555) 123-4567',
                    reviews: 127,
                    years_experience: 15
                },
                {
                    id: 'CONT_002',
                    name: 'ProRoof Masters',
                    rating: 4.6,
                    specialties: ['emergency repair', 'residential', 'commercial'],
                    response_time: '4 hours average',
                    phone: '(555) 234-5678',
                    reviews: 89,
                    years_experience: 12
                },
                {
                    id: 'CONT_003',
                    name: 'Reliable Roofing Co',
                    rating: 4.5,
                    specialties: ['residential', 'insurance work', 'repairs'],
                    response_time: '6 hours average',
                    phone: '(555) 345-6789',
                    reviews: 156,
                    years_experience: 20
                }
            ];

            // Create contractor matches
            for (const contractor of sampleContractors) {
                await fetch(`${supabaseUrl}/rest/v1/contractor_matches`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        lead_id: leadId,
                        contractor_data: contractor,
                        match_score: Math.floor(Math.random() * 3) + 8, // 8-10 score
                        status: 'pending'
                    })
                });
            }

            contractorMatches = sampleContractors;
        }

        // Update conversation status
        await fetch(`${supabaseUrl}/rest/v1/chat_conversations?id=eq.${sessionId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                qualification_score: qualificationScore,
                status: 'completed',
                completed_at: new Date().toISOString(),
                lead_data: leadData
            })
        });

        return new Response(JSON.stringify({
            data: {
                leadId: leadId,
                qualified: qualified,
                qualificationScore: qualificationScore,
                priority: priority,
                contractorMatches: contractorMatches,
                nextSteps: qualified ? 
                    'Contractors will contact you within 2-4 hours' : 
                    'We\'ll follow up with you when qualified contractors become available',
                estimatedResponse: qualified ? '2-4 hours' : '24-48 hours'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Lead qualification error:', error);

        const errorResponse = {
            error: {
                code: 'QUALIFICATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});