import { useState, useCallback } from 'react'
import { chatbotAPI } from '../lib/supabase'

export interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  options?: string[]
}

export interface ChatState {
  sessionId: string | null
  messages: ChatMessage[]
  currentStep: string
  conversationData: any
  isLoading: boolean
  progress: number
  showPhotoUpload: boolean
  leadQualified: boolean
}

export function useChatbot() {
  const [state, setState] = useState<ChatState>({
    sessionId: null,
    messages: [],
    currentStep: 'greeting',
    conversationData: {},
    isLoading: false,
    progress: 0,
    showPhotoUpload: false,
    leadQualified: false
  })

  const initializeChat = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      const sessionId = await chatbotAPI.createSession()
      
      // Send initial greeting
      const response = await chatbotAPI.sendMessage(
        sessionId,
        '',
        'greeting',
        {}
      )

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: response.data.response,
        timestamp: new Date(),
        options: response.data.options
      }

      setState(prev => ({
        ...prev,
        sessionId,
        messages: [botMessage],
        currentStep: response.data.nextStep,
        conversationData: response.data.conversationData,
        progress: response.data.progress,
        isLoading: false
      }))
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!state.sessionId || state.isLoading) return

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true
    }))

    try {
      const response = await chatbotAPI.sendMessage(
        state.sessionId,
        userMessage,
        state.currentStep,
        state.conversationData
      )

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: response.data.response,
        timestamp: new Date(),
        options: response.data.options
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        currentStep: response.data.nextStep,
        conversationData: response.data.conversationData,
        progress: response.data.progress,
        showPhotoUpload: response.data.showPhotoUpload,
        leadQualified: response.data.leadQualified,
        isLoading: false
      }))

      // If lead is qualified, trigger qualification process
      if (response.data.leadQualified && state.sessionId) {
        await qualifyLead()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.sessionId, state.currentStep, state.conversationData, state.isLoading])

  const qualifyLead = useCallback(async () => {
    if (!state.sessionId) return

    try {
      const qualificationResult = await chatbotAPI.qualifyLead(
        state.sessionId,
        state.conversationData
      )

      const resultMessage: ChatMessage = {
        id: `bot_qualification_${Date.now()}`,
        type: 'bot',
        content: qualificationResult.data.qualified 
          ? `🎉 Excellent news! Based on your responses, I've matched you with ${qualificationResult.data.contractorMatches?.length || 3} top-rated contractors in your area. They'll contact you within ${qualificationResult.data.estimatedResponse}. Our 90% appointment guarantee means you're very likely to have an inspection scheduled soon!`
          : `Thank you for the information. While we don't have immediately available contractors for your specific situation, we'll follow up with you when qualified contractors become available in your area.`,
        timestamp: new Date()
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, resultMessage],
        progress: 100
      }))
    } catch (error) {
      console.error('Failed to qualify lead:', error)
    }
  }, [state.sessionId, state.conversationData])

  const uploadPhoto = useCallback(async (file: File) => {
    if (!state.sessionId) return

    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const imageData = reader.result as string
          await chatbotAPI.uploadPhoto(state.sessionId!, imageData, file.name)
          
          // Update conversation data to include photo
          const updatedData = {
            ...state.conversationData,
            hasPhotos: true,
            photoUploaded: true
          }

          const confirmMessage: ChatMessage = {
            id: `bot_photo_${Date.now()}`,
            type: 'bot',
            content: '📸 Perfect! Your photo has been uploaded successfully. This will help contractors provide you with more accurate estimates.',
            timestamp: new Date()
          }

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, confirmMessage],
            conversationData: updatedData,
            isLoading: false,
            showPhotoUpload: false
          }))

          // Continue to qualification
          await qualifyLead()
        } catch (error) {
          console.error('Photo upload failed:', error)
          setState(prev => ({ ...prev, isLoading: false }))
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to read file:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.sessionId, state.conversationData, qualifyLead])

  const selectOption = useCallback((option: string) => {
    sendMessage(option)
  }, [sendMessage])

  return {
    ...state,
    initializeChat,
    sendMessage,
    uploadPhoto,
    selectOption
  }
}