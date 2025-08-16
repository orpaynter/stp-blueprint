"""
OrPaynter MCP Server Usage Examples

This file demonstrates how to use the OrPaynter MCP server for various
roofing lead generation and management scenarios.
"""

import asyncio
import json
from fastmcp import Client
import sys
from pathlib import Path

# Add the parent directory to sys.path to import server
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.orpaynter_mcp.server import mcp

async def example_complete_lead_workflow():
    """
    Demonstrates a complete lead workflow from initial contact to appointment scheduling
    """
    print("🏠 OrPaynter Lead Generation Workflow Example")
    print("=" * 50)
    
    async with Client(mcp) as client:
        # Step 1: Qualify a new lead
        print("\n📋 Step 1: Lead Qualification")
        lead_data = {
            "contact_name": "Sarah Johnson",
            "contact_email": "sarah.johnson@email.com",
            "contact_phone": "(555) 987-6543",
            "property_address": "456 Oak Avenue",
            "city": "Chicago",
            "state": "IL",
            "zip_code": "60614",
            "property_type": "residential",
            "damage_type": "hail damage",
            "damage_severity": "severe",
            "damage_description": "Significant hail damage from last week's storm. Multiple missing shingles and visible dents on gutters.",
            "urgency_level": 9,
            "has_insurance": True,
            "is_decision_maker": True,
            "roof_age": 8,
            "insurance_company": "Allstate",
            "claim_filed": True,
            "budget_range": "$15,000-$25,000",
            "timeline": "Within 2 weeks"
        }
        
        qualification_result = await client.call_tool("qualify_lead", lead_data)
        qualification_data = json.loads(qualification_result.content[0].text)
        
        lead_id = qualification_data["lead_id"]
        print(f"✅ Lead qualified: {lead_id}")
        print(f"   Score: {qualification_data['score']}/10")
        print(f"   Priority: {qualification_data['priority']}")
        print(f"   Qualified: {qualification_data['qualified']}")
        
        if not qualification_data["qualified"]:
            print("❌ Lead not qualified for immediate contractor referral")
            return
        
        # Step 2: Match contractors
        print("\n🔍 Step 2: Contractor Matching")
        contractor_result = await client.call_tool("match_contractors", {
            "lead_id": lead_id,
            "specialty_required": "hail damage",
            "max_contractors": 3
        })
        contractor_data = json.loads(contractor_result.content[0].text)
        
        print(f"✅ Found {len(contractor_data['matched_contractors'])} contractors:")
        for i, contractor in enumerate(contractor_data['matched_contractors'], 1):
            print(f"   {i}. {contractor['name']} (Rating: {contractor['rating']}/5)")
            print(f"      📧 {contractor['email']} | 📞 {contractor['phone']}")
        
        # Step 3: Schedule appointment with top contractor
        print("\n📅 Step 3: Appointment Scheduling")
        top_contractor = contractor_data['matched_contractors'][0]
        
        appointment_result = await client.call_tool("schedule_appointment", {
            "lead_id": lead_id,
            "contractor_id": top_contractor["id"],
            "appointment_date": "2025-07-12T14:00:00",
            "appointment_type": "inspection",
            "notes": "Hail damage assessment with insurance adjuster coordination"
        })
        appointment_data = json.loads(appointment_result.content[0].text)
        
        print(f"✅ Appointment scheduled: {appointment_data['appointment_id']}")
        print(f"   Date: {appointment_data['scheduled_date']}")
        print(f"   Contractor: {top_contractor['name']}")
        print(f"   Status: {appointment_data['status']}")
        
        # Step 4: Generate lead summary report
        print("\n📊 Step 4: Lead Summary Report")
        report_result = await client.call_tool("generate_reports", {
            "report_type": "lead_summary",
            "lead_id": lead_id
        })
        report_data = json.loads(report_result.content[0].text)
        
        print("✅ Lead Summary Generated:")
        lead_summary = report_data["lead_data"]
        print(f"   Contact: {lead_summary['contact']['name']}")
        print(f"   Property: {lead_summary['property']['property_type']}")
        print(f"   Damage: {lead_summary['damage']['damage_type']} ({lead_summary['damage']['damage_severity']})")
        print(f"   Insurance: {lead_summary['insurance']['insurance_company']}")
        print(f"   Appointments: {len(lead_summary['appointments'])}")

async def example_document_processing():
    """
    Demonstrates document processing and photo upload functionality
    """
    print("\n📷 Document Processing Example")
    print("=" * 40)
    
    async with Client(mcp) as client:
        # First create a simple lead
        lead_result = await client.call_tool("qualify_lead", {
            "contact_name": "Mike Wilson",
            "contact_email": "mike@example.com",
            "contact_phone": "(555) 456-7890",
            "property_address": "789 Pine Street",
            "city": "Milwaukee",
            "state": "WI",
            "zip_code": "53202",
            "property_type": "residential",
            "damage_type": "wind damage",
            "damage_severity": "moderate",
            "damage_description": "Loose shingles from windstorm",
            "urgency_level": 6,
            "has_insurance": True,
            "is_decision_maker": True
        })
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        # Create a sample image (simple PNG in base64)
        sample_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        # Process damage photo
        doc_result = await client.call_tool("process_documents", {
            "lead_id": lead_id,
            "file_data": sample_image_b64,
            "file_name": "roof_damage_photo.png",
            "document_type": "photo",
            "description": "Wind damage to shingles on south side of roof"
        })
        doc_data = json.loads(doc_result.content[0].text)
        
        print(f"✅ Document processed: {doc_data['document_id']}")
        print(f"   File: {doc_data['file_name']}")
        print(f"   Type: {doc_data['document_type']}")
        print(f"   Size: {doc_data['file_size']} bytes")
        if doc_data.get('analysis_results'):
            print(f"   Analysis: {doc_data['analysis_results']}")

async def example_analytics_tracking():
    """
    Demonstrates analytics tracking and reporting functionality
    """
    print("\n📈 Analytics Tracking Example")
    print("=" * 35)
    
    async with Client(mcp) as client:
        # Track conversion rate metric
        analytics_result = await client.call_tool("track_analytics", {
            "metric_name": "weekly_conversion_rate",
            "metric_value": 87.5,
            "period_start": "2025-07-01T00:00:00",
            "period_end": "2025-07-07T23:59:59",
            "metadata": {
                "campaign": "storm_season_2025",
                "region": "midwest",
                "lead_source": "google_ads"
            }
        })
        analytics_data = json.loads(analytics_result.content[0].text)
        
        print(f"✅ Analytics tracked: {analytics_data['analytics_id']}")
        print(f"   Metric: {analytics_data['metric_name']}")
        print(f"   Value: {analytics_data['metric_value']}%")
        print(f"   Trend: {analytics_data['trend']}")
        
        # Generate weekly analytics report
        report_result = await client.call_tool("generate_reports", {
            "report_type": "weekly_analytics"
        })
        report_data = json.loads(report_result.content[0].text)
        
        print("\n📊 Weekly Analytics Report:")
        analytics = report_data["analytics"]
        print(f"   New Leads: {analytics['new_leads']}")
        print(f"   Qualified Leads: {analytics['qualified_leads']}")
        print(f"   Qualification Rate: {analytics['qualification_rate']:.1f}%")
        print(f"   Appointments Scheduled: {analytics['appointments_scheduled']}")
        print(f"   Conversion Rate: {analytics['conversion_rate']:.1f}%")
        print(f"   Average Lead Score: {analytics['average_lead_score']}")

async def example_contractor_management():
    """
    Demonstrates contractor matching and performance tracking
    """
    print("\n👷 Contractor Management Example")
    print("=" * 38)
    
    async with Client(mcp) as client:
        # Check available contractors
        contractors_resource = await client.read_resource("orpaynter://contractors/available")
        contractors = json.loads(contractors_resource.content)
        
        print(f"📋 Available Contractors: {len(contractors)}")
        for contractor in contractors:
            print(f"   • {contractor['name']} (Rating: {contractor['rating']}/5)")
            print(f"     Specialties: {', '.join(contractor['specialties'])}")
        
        if contractors:
            # Generate performance report for first contractor
            contractor_id = contractors[0]['id']
            performance_result = await client.call_tool("generate_reports", {
                "report_type": "contractor_performance",
                "contractor_id": contractor_id
            })
            performance_data = json.loads(performance_result.content[0].text)
            
            print(f"\n📊 Performance Report for {contractors[0]['name']}:")
            performance = performance_data["contractor_performance"]
            print(f"   Total Appointments: {performance['total_appointments']}")
            print(f"   Completion Rate: {performance['completion_rate']:.1f}%")
            print(f"   Average Response Time: {performance['avg_response_time']} hours")

async def example_notification_system():
    """
    Demonstrates the notification system for emails and SMS
    """
    print("\n📧 Notification System Example")
    print("=" * 35)
    
    async with Client(mcp) as client:
        # Send email notifications
        email_result = await client.call_tool("send_notifications", {
            "notification_type": "email",
            "recipients": ["contractor@example.com", "customer@example.com"],
            "subject": "New Roofing Lead Available",
            "message": """
            <h2>New High-Priority Lead</h2>
            <p>A new qualified lead has been assigned to you:</p>
            <ul>
                <li><strong>Location:</strong> Chicago, IL</li>
                <li><strong>Damage Type:</strong> Hail damage</li>
                <li><strong>Urgency:</strong> High (9/10)</li>
                <li><strong>Insurance:</strong> Yes (claim filed)</li>
            </ul>
            <p>Please respond within 2 hours to maintain your response time rating.</p>
            """
        })
        email_data = json.loads(email_result.content[0].text)
        
        print(f"✅ Email notifications sent: {email_data['total_sent']}/{email_data['total_recipients']}")
        
        # Send SMS notification (note: requires Twilio setup)
        sms_result = await client.call_tool("send_notifications", {
            "notification_type": "sms",
            "recipients": ["+15551234567"],
            "subject": "Lead Alert",
            "message": "New high-priority roofing lead in your area. Check your email for details."
        })
        sms_data = json.loads(sms_result.content[0].text)
        
        print(f"📱 SMS notifications sent: {sms_data['total_sent']}/{sms_data['total_recipients']}")

async def example_lead_qualification_conversation():
    """
    Demonstrates the conversational lead qualification process
    """
    print("\n💬 Lead Qualification Conversation Example")
    print("=" * 48)
    
    async with Client(mcp) as client:
        # Simulate a conversation flow
        customer_inputs = [
            "My roof is leaking after last night's storm",
            "The leak is pretty bad, water is dripping into my living room",
            "I have insurance with State Farm",
            "I'm the homeowner and can make decisions"
        ]
        
        for i, customer_input in enumerate(customer_inputs, 1):
            print(f"\n💭 Customer says: \"{customer_input}\"")
            
            # Get conversation prompt
            prompt_result = await client.get_prompt("lead_qualification_prompt", {
                "customer_input": customer_input
            })
            
            print(f"🤖 AI Response/Question:")
            print(f"   {prompt_result.content[:200]}...")

async def example_resource_monitoring():
    """
    Demonstrates resource monitoring for leads and contractors
    """
    print("\n🔍 Resource Monitoring Example")
    print("=" * 35)
    
    async with Client(mcp) as client:
        # First create a lead to monitor
        lead_result = await client.call_tool("qualify_lead", {
            "contact_name": "Test User",
            "contact_email": "test@example.com",
            "contact_phone": "(555) 000-0000",
            "property_address": "123 Test St",
            "city": "Test City",
            "state": "TS",
            "zip_code": "12345",
            "property_type": "residential",
            "damage_type": "test damage",
            "damage_severity": "moderate",
            "damage_description": "Test description",
            "urgency_level": 5,
            "has_insurance": False,
            "is_decision_maker": True
        })
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        # Monitor lead status
        lead_resource = await client.read_resource(f"orpaynter://leads/{lead_id}")
        lead_status = json.loads(lead_resource.content)
        
        print(f"📊 Lead Status Monitoring:")
        print(f"   Lead ID: {lead_status['id']}")
        print(f"   Status: {lead_status['status']}")
        print(f"   Score: {lead_status['score']}")
        print(f"   Created: {lead_status['created_at']}")
        print(f"   Contact: {lead_status['contact']['name']}")

# Main execution function
async def main():
    """Run all examples"""
    print("🚀 OrPaynter MCP Server Usage Examples")
    print("=" * 60)
    
    try:
        await example_complete_lead_workflow()
        await example_document_processing()
        await example_analytics_tracking()
        await example_contractor_management()
        await example_notification_system()
        await example_lead_qualification_conversation()
        await example_resource_monitoring()
        
        print("\n✅ All examples completed successfully!")
        print("\nNext steps:")
        print("1. Set up SendGrid API key for email notifications")
        print("2. Configure Twilio for SMS notifications")
        print("3. Customize contractor database with real contractors")
        print("4. Integrate with your existing CRM system")
        print("5. Deploy to production environment")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {str(e)}")
        print("Make sure the MCP server is properly configured and running.")

if __name__ == "__main__":
    asyncio.run(main())
