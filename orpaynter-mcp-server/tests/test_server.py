"""
Test suite for OrPaynter MCP Server
"""

import pytest
import asyncio
import json
import tempfile
import os
from pathlib import Path
from datetime import datetime
from fastmcp import Client
import sys

# Add the parent directory to sys.path to import server
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.orpaynter_mcp.server import mcp, init_database

class TestOrPaynterMCP:
    """Test class for OrPaynter MCP Server functionality"""
    
    @pytest.fixture
    async def client(self):
        """Create a test client for the MCP server"""
        # Set up test environment variables
        os.environ["ORPAYNTER_DB_PATH"] = "/tmp/test_orpaynter.db"
        os.environ["ORPAYNTER_UPLOADS_DIR"] = "/tmp/test_orpaynter_uploads"
        
        # Initialize test database
        await init_database()
        
        # Create MCP client
        async with Client(mcp) as client:
            yield client
    
    @pytest.fixture
    def sample_lead_data(self):
        """Sample lead data for testing"""
        return {
            "contact_name": "John Smith",
            "contact_email": "john.smith@example.com",
            "contact_phone": "(555) 123-4567",
            "property_address": "123 Main Street",
            "city": "Springfield",
            "state": "IL",
            "zip_code": "62701",
            "property_type": "residential",
            "damage_type": "storm damage",
            "damage_severity": "severe",
            "damage_description": "Missing shingles after thunderstorm, visible water damage in attic",
            "urgency_level": 8,
            "has_insurance": True,
            "is_decision_maker": True,
            "roof_age": 15,
            "insurance_company": "State Farm",
            "claim_filed": False,
            "budget_range": "$10,000-$20,000",
            "timeline": "ASAP"
        }
    
    async def test_list_tools(self, client):
        """Test that all expected tools are available"""
        tools = await client.list_tools()
        tool_names = [tool.name for tool in tools]
        
        expected_tools = [
            "qualify_lead",
            "match_contractors", 
            "schedule_appointment",
            "store_lead_data",
            "send_notifications",
            "process_documents",
            "generate_reports",
            "track_analytics"
        ]
        
        for tool in expected_tools:
            assert tool in tool_names, f"Tool {tool} not found in available tools"
    
    async def test_list_resources(self, client):
        """Test that resources are available"""
        resources = await client.list_resources()
        resource_uris = [resource.uri for resource in resources]
        
        expected_resources = [
            "orpaynter://leads/{lead_id}",
            "orpaynter://contractors/available"
        ]
        
        for resource in expected_resources:
            assert resource in resource_uris, f"Resource {resource} not found"
    
    async def test_list_prompts(self, client):
        """Test that prompts are available"""
        prompts = await client.list_prompts()
        prompt_names = [prompt.name for prompt in prompts]
        
        assert "lead_qualification_prompt" in prompt_names
    
    async def test_qualify_lead_tool(self, client, sample_lead_data):
        """Test lead qualification functionality"""
        result = await client.call_tool("qualify_lead", sample_lead_data)
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        # Check required fields
        assert "lead_id" in response_data
        assert "qualified" in response_data
        assert "score" in response_data
        assert "priority" in response_data
        
        # Check that the lead was qualified (should be high score)
        assert response_data["qualified"] is True
        assert response_data["score"] >= 6
        assert response_data["priority"] in ["high", "medium", "low"]
        
        return response_data["lead_id"]
    
    async def test_match_contractors_tool(self, client, sample_lead_data):
        """Test contractor matching functionality"""
        # First qualify a lead
        lead_result = await client.call_tool("qualify_lead", sample_lead_data)
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        # Then match contractors
        result = await client.call_tool("match_contractors", {
            "lead_id": lead_id,
            "specialty_required": "storm damage",
            "max_contractors": 3
        })
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        # Check required fields
        assert "lead_id" in response_data
        assert "matched_contractors" in response_data
        assert "match_criteria" in response_data
        
        # Should have found contractors
        assert len(response_data["matched_contractors"]) > 0
        
        # Check contractor data structure
        contractor = response_data["matched_contractors"][0]
        assert "id" in contractor
        assert "name" in contractor
        assert "email" in contractor
        assert "phone" in contractor
        assert "rating" in contractor
        
        return lead_id, contractor["id"]
    
    async def test_schedule_appointment_tool(self, client, sample_lead_data):
        """Test appointment scheduling functionality"""
        # First qualify a lead and match contractors
        lead_result = await client.call_tool("qualify_lead", sample_lead_data)
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        contractor_result = await client.call_tool("match_contractors", {
            "lead_id": lead_id,
            "max_contractors": 1
        })
        contractor_data = json.loads(contractor_result.content[0].text)
        contractor_id = contractor_data["matched_contractors"][0]["id"]
        
        # Schedule appointment
        appointment_date = "2025-07-15T10:00:00"
        result = await client.call_tool("schedule_appointment", {
            "lead_id": lead_id,
            "contractor_id": contractor_id,
            "appointment_date": appointment_date,
            "appointment_type": "inspection",
            "notes": "Storm damage assessment required"
        })
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        # Check required fields
        assert "appointment_id" in response_data
        assert "lead_id" in response_data
        assert "contractor_id" in response_data
        assert "scheduled_date" in response_data
        assert "appointment_type" in response_data
        assert "status" in response_data
        
        assert response_data["status"] == "scheduled"
        assert response_data["appointment_type"] == "inspection"
    
    async def test_store_lead_data_tool(self, client, sample_lead_data):
        """Test lead data storage functionality"""
        # First qualify a lead
        lead_result = await client.call_tool("qualify_lead", sample_lead_data)
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        # Store additional notes
        result = await client.call_tool("store_lead_data", {
            "lead_id": lead_id,
            "data_type": "notes",
            "data": {"additional_notes": "Customer called back with more details"}
        })
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        assert "lead_id" in response_data
        assert "data_type" in response_data
        assert "stored" in response_data
        assert response_data["stored"] is True
    
    async def test_send_notifications_tool(self, client):
        """Test notification sending functionality"""
        result = await client.call_tool("send_notifications", {
            "notification_type": "email",
            "recipients": ["test@example.com"],
            "subject": "Test Notification",
            "message": "This is a test notification"
        })
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        assert "notification_type" in response_data
        assert "total_recipients" in response_data
        assert "results" in response_data
        assert response_data["notification_type"] == "email"
    
    async def test_process_documents_tool(self, client, sample_lead_data):
        """Test document processing functionality"""
        # First qualify a lead
        lead_result = await client.call_tool("qualify_lead", sample_lead_data)
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        result = await client.call_tool("process_documents", {
            "lead_id": lead_id,
            "file_data": test_image_b64,
            "file_name": "damage_photo.png",
            "document_type": "photo",
            "description": "Roof damage from storm"
        })
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        assert "document_id" in response_data
        assert "lead_id" in response_data
        assert "document_type" in response_data
        assert "file_name" in response_data
        assert "stored_path" in response_data
        assert response_data["document_type"] == "photo"
    
    async def test_generate_reports_tool(self, client, sample_lead_data):
        """Test report generation functionality"""
        # First qualify a lead
        lead_result = await client.call_tool("qualify_lead", sample_lead_data)
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        # Generate lead summary report
        result = await client.call_tool("generate_reports", {
            "report_type": "lead_summary",
            "lead_id": lead_id
        })
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        assert "report_type" in response_data
        assert "lead_data" in response_data
        assert "generated_at" in response_data
        assert response_data["report_type"] == "lead_summary"
        
        # Test weekly analytics report
        analytics_result = await client.call_tool("generate_reports", {
            "report_type": "weekly_analytics"
        })
        
        assert analytics_result.content[0].text is not None
        analytics_data = json.loads(analytics_result.content[0].text)
        
        assert "analytics" in analytics_data
        assert "new_leads" in analytics_data["analytics"]
        assert "qualified_leads" in analytics_data["analytics"]
    
    async def test_track_analytics_tool(self, client):
        """Test analytics tracking functionality"""
        result = await client.call_tool("track_analytics", {
            "metric_name": "lead_conversion_rate",
            "metric_value": 85.5,
            "period_start": "2025-07-01T00:00:00",
            "period_end": "2025-07-07T23:59:59",
            "metadata": {"campaign": "storm_season_2025"}
        })
        
        assert result.content[0].text is not None
        response_data = json.loads(result.content[0].text)
        
        assert "analytics_id" in response_data
        assert "metric_name" in response_data
        assert "metric_value" in response_data
        assert "trend" in response_data
        assert response_data["metric_name"] == "lead_conversion_rate"
        assert response_data["metric_value"] == 85.5
    
    async def test_lead_resource(self, client, sample_lead_data):
        """Test lead resource functionality"""
        # First qualify a lead
        lead_result = await client.call_tool("qualify_lead", sample_lead_data)
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        # Get lead resource
        resource_uri = f"orpaynter://leads/{lead_id}"
        result = await client.read_resource(resource_uri)
        
        assert result.content is not None
        lead_status = json.loads(result.content)
        
        assert "id" in lead_status
        assert "status" in lead_status
        assert "score" in lead_status
        assert lead_status["id"] == lead_id
    
    async def test_contractors_resource(self, client):
        """Test contractors resource functionality"""
        resource_uri = "orpaynter://contractors/available"
        result = await client.read_resource(resource_uri)
        
        assert result.content is not None
        contractors = json.loads(result.content)
        
        # Should be a list (even if empty initially)
        assert isinstance(contractors, list)
    
    async def test_lead_qualification_prompt(self, client):
        """Test lead qualification prompt functionality"""
        result = await client.get_prompt("lead_qualification_prompt", {
            "customer_input": "My roof is leaking after the storm last night"
        })
        
        assert result.content is not None
        assert len(result.content) > 0
        assert "storm" in result.content.lower() or "leak" in result.content.lower()
    
    async def test_complete_workflow(self, client, sample_lead_data):
        """Test complete lead workflow from qualification to appointment"""
        # Step 1: Qualify lead
        lead_result = await client.call_tool("qualify_lead", sample_lead_data)
        lead_data = json.loads(lead_result.content[0].text)
        lead_id = lead_data["lead_id"]
        
        assert lead_data["qualified"] is True
        
        # Step 2: Match contractors
        contractor_result = await client.call_tool("match_contractors", {
            "lead_id": lead_id,
            "max_contractors": 1
        })
        contractor_data = json.loads(contractor_result.content[0].text)
        contractor_id = contractor_data["matched_contractors"][0]["id"]
        
        # Step 3: Schedule appointment
        appointment_result = await client.call_tool("schedule_appointment", {
            "lead_id": lead_id,
            "contractor_id": contractor_id,
            "appointment_date": "2025-07-15T10:00:00",
            "appointment_type": "inspection"
        })
        appointment_data = json.loads(appointment_result.content[0].text)
        
        assert appointment_data["status"] == "scheduled"
        
        # Step 4: Generate report
        report_result = await client.call_tool("generate_reports", {
            "report_type": "lead_summary",
            "lead_id": lead_id
        })
        report_data = json.loads(report_result.content[0].text)
        
        assert report_data["lead_data"]["lead_id"] == lead_id
        assert len(report_data["lead_data"]["appointments"]) > 0
        
        # Step 5: Track analytics
        analytics_result = await client.call_tool("track_analytics", {
            "metric_name": "test_workflow_completion",
            "metric_value": 1.0,
            "period_start": datetime.now().isoformat(),
            "period_end": datetime.now().isoformat()
        })
        analytics_data = json.loads(analytics_result.content[0].text)
        
        assert analytics_data["metric_name"] == "test_workflow_completion"

# Run the tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
