import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tiqxywrspyphugdqunur.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcXh5d3JzcHlwaHVnZHF1bnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzA4MzgsImV4cCI6MjA2NTQwNjgzOH0.egDC4M3IRgt6u6bHeMf0caYWoC2OusQihgUVIGy8i3A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Chatbot API functions
export const chatbotAPI = {
  async sendMessage(sessionId: string, userMessage: string, currentStep: string, conversationData: any) {
    const { data, error } = await supabase.functions.invoke('chatbot-conversation', {
      body: {
        sessionId,
        userMessage,
        currentStep,
        conversationData
      }
    })
    
    if (error) throw error
    return data
  },

  async qualifyLead(sessionId: string, leadData: any) {
    const { data, error } = await supabase.functions.invoke('mcp-lead-qualification', {
      body: {
        sessionId,
        leadData
      }
    })
    
    if (error) throw error
    return data
  },

  async uploadPhoto(sessionId: string, imageData: string, fileName: string) {
    const { data, error } = await supabase.functions.invoke('photo-upload', {
      body: {
        sessionId,
        imageData,
        fileName
      }
    })
    
    if (error) throw error
    return data
  },

  async createSession() {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create conversation record
    const { error } = await supabase
      .from('chat_conversations')
      .insert({
        session_id: sessionId,
        current_step: 'greeting',
        conversation_data: {},
        status: 'active'
      })
    
    if (error) throw error
    return sessionId
  }
}

// Database types
export interface ChatConversation {
  id: string
  session_id: string
  visitor_id?: string
  current_step: string
  conversation_data: any
  lead_data: any
  qualification_score: number
  status: string
  started_at: string
  completed_at?: string
  last_activity: string
}

export interface QualifiedLead {
  id: string
  conversation_id?: string
  mcp_lead_id?: string
  contact_name: string
  contact_email: string
  contact_phone: string
  property_address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  damage_type: string
  damage_severity: string
  damage_description?: string
  urgency_level: number
  has_insurance: boolean
  insurance_company?: string
  claim_filed: boolean
  is_decision_maker: boolean
  qualification_score: number
  priority_level: string
  status: string
  created_at: string
  updated_at: string
}

export interface ContractorMatch {
  id: string
  lead_id: string
  contractor_data: any
  match_score: number
  status: string
  notified_at?: string
  responded_at?: string
  created_at: string
}