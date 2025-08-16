const {google} = require('googleapis');
const calendar = google.calendar('v3');

/**
 * Google Calendar Integration Service for OrPaynter
 * Provides calendar management for scheduling roofing projects and appointments
 */
class GoogleCalendarService {
  constructor() {
    this.auth = null;
    this.calendarId = process.env.GOOGLE_CALENDAR_ID;
    this.initialize();
  }

  /**
   * Initialize Google Calendar API client
   */
  async initialize() {
    try {
      this.auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/calendar']
      );
      
      await this.auth.authorize();
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      throw new Error(`Failed to initialize Google Calendar: ${error.message}`);
    }
  }

  /**
   * Create a new calendar event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  async createEvent(eventData) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      const event = {
        summary: eventData.title,
        location: eventData.location,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'America/New_York',
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'America/New_York',
        },
        attendees: eventData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            {method: 'email', minutes: 24 * 60},
            {method: 'popup', minutes: 60},
          ],
        },
        colorId: eventData.colorId || '1', // Default to blue
      };
      
      const response = await calendar.events.insert({
        auth: this.auth,
        calendarId: eventData.calendarId || this.calendarId,
        resource: event,
        sendUpdates: 'all',
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Update an existing calendar event
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(eventId, eventData) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      // Get existing event
      const existingEvent = await calendar.events.get({
        auth: this.auth,
        calendarId: eventData.calendarId || this.calendarId,
        eventId,
      });
      
      // Update event fields
      const event = existingEvent.data;
      
      if (eventData.title) event.summary = eventData.title;
      if (eventData.location) event.location = eventData.location;
      if (eventData.description) event.description = eventData.description;
      if (eventData.startTime) {
        event.start = {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || event.start.timeZone,
        };
      }
      if (eventData.endTime) {
        event.end = {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || event.end.timeZone,
        };
      }
      if (eventData.attendees) event.attendees = eventData.attendees;
      if (eventData.colorId) event.colorId = eventData.colorId;
      
      const response = await calendar.events.update({
        auth: this.auth,
        calendarId: eventData.calendarId || this.calendarId,
        eventId,
        resource: event,
        sendUpdates: 'all',
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  /**
   * Delete a calendar event
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (optional)
   * @returns {Promise<boolean>} Success status
   */
  async deleteEvent(eventId, calendarId = null) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      await calendar.events.delete({
        auth: this.auth,
        calendarId: calendarId || this.calendarId,
        eventId,
        sendUpdates: 'all',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  /**
   * Get a calendar event by ID
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (optional)
   * @returns {Promise<Object>} Event data
   */
  async getEvent(eventId, calendarId = null) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      const response = await calendar.events.get({
        auth: this.auth,
        calendarId: calendarId || this.calendarId,
        eventId,
      });
      
      return this._formatEvent(response.data);
    } catch (error) {
      console.error('Error getting calendar event:', error);
      throw new Error(`Failed to get calendar event: ${error.message}`);
    }
  }

  /**
   * List calendar events within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} calendarId - Calendar ID (optional)
   * @returns {Promise<Array>} List of events
   */
  async listEvents(startDate, endDate, calendarId = null) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      const response = await calendar.events.list({
        auth: this.auth,
        calendarId: calendarId || this.calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      return response.data.items.map(event => this._formatEvent(event));
    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw new Error(`Failed to list calendar events: ${error.message}`);
    }
  }

  /**
   * Check availability for a time slot
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} calendarId - Calendar ID (optional)
   * @returns {Promise<boolean>} Availability status
   */
  async checkAvailability(startDate, endDate, calendarId = null) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      const events = await this.listEvents(startDate, endDate, calendarId);
      
      // Check if there are any overlapping events
      return events.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  /**
   * Find available time slots within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} durationMinutes - Duration in minutes
   * @param {string} calendarId - Calendar ID (optional)
   * @returns {Promise<Array>} Available time slots
   */
  async findAvailableSlots(startDate, endDate, durationMinutes, calendarId = null) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      // Get all events in the date range
      const events = await this.listEvents(startDate, endDate, calendarId);
      
      // Define working hours (9 AM to 5 PM)
      const workingHourStart = 9;
      const workingHourEnd = 17;
      
      // Generate all possible time slots
      const availableSlots = [];
      const currentDate = new Date(startDate);
      const durationMs = durationMinutes * 60 * 1000;
      
      while (currentDate < endDate) {
        const currentHour = currentDate.getHours();
        
        // Only consider slots during working hours
        if (currentHour >= workingHourStart && currentHour < workingHourEnd) {
          const slotEnd = new Date(currentDate.getTime() + durationMs);
          
          // Check if slot is within working hours and end date
          if (slotEnd.getHours() <= workingHourEnd && slotEnd <= endDate) {
            // Check if slot overlaps with any existing events
            const isAvailable = !events.some(event => {
              const eventStart = new Date(event.start.dateTime);
              const eventEnd = new Date(event.end.dateTime);
              
              return (
                (currentDate >= eventStart && currentDate < eventEnd) ||
                (slotEnd > eventStart && slotEnd <= eventEnd) ||
                (currentDate <= eventStart && slotEnd >= eventEnd)
              );
            });
            
            if (isAvailable) {
              availableSlots.push({
                start: new Date(currentDate),
                end: slotEnd
              });
            }
          }
        }
        
        // Move to next 30-minute slot
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }
      
      return availableSlots;
    } catch (error) {
      console.error('Error finding available slots:', error);
      throw new Error(`Failed to find available slots: ${error.message}`);
    }
  }

  /**
   * Create a new calendar
   * @param {string} name - Calendar name
   * @returns {Promise<Object>} Created calendar
   */
  async createCalendar(name) {
    try {
      if (!this.auth) {
        await this.initialize();
      }
      
      const response = await calendar.calendars.insert({
        auth: this.auth,
        resource: {
          summary: name,
          timeZone: 'America/New_York'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw new Error(`Failed to create calendar: ${error.message}`);
    }
  }

  /**
   * Format event data
   * @param {Object} event - Raw event data
   * @returns {Object} Formatted event data
   * @private
   */
  _formatEvent(event) {
    return {
      id: event.id,
      title: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.dateTime,
        timeZone: event.start.timeZone
      },
      end: {
        dateTime: event.end.dateTime,
        timeZone: event.end.timeZone
      },
      attendees: event.attendees || [],
      organizer: event.organizer,
      created: event.created,
      updated: event.updated,
      status: event.status,
      htmlLink: event.htmlLink
    };
  }
}

module.exports = new GoogleCalendarService();
