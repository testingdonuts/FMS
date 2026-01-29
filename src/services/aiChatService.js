import { faqs } from '../data/faqData';

const DEEPSEEK_CONFIG = {
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  baseUrl: "https://api.deepseek.com/chat/completions",
  model: "deepseek-chat",
};

// Keyword mappings for smarter FAQ matching
const FAQ_KEYWORDS = {
  1: ['book', 'booking', 'schedule', 'appointment', 'installation', 'install', 'reserve'],
  2: ['reschedule', 'change', 'cancel', 'modify', 'appointment', 'move'],
  3: ['payment', 'pay', 'due', 'charge', 'deposit', 'credit card', 'billing'],
  4: ['pinch', 'pinch test', 'harness', 'tight', 'loose', 'strap'],
  5: ['rear facing', 'rear-facing', 'forward facing', 'turn around', 'how long', 'age'],
  6: ['join', 'technician', 'team', 'organization', 'invitation', 'invite code']
};

export const aiChatService = {
  // Helper: Find best FAQ match using keywords
  findBestFaqMatch(query, userRole) {
    const lowercaseQuery = query.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const faq of faqs) {
      // Check role compatibility
      if (faq.role !== 'all' && faq.role !== userRole) continue;

      const keywords = FAQ_KEYWORDS[faq.id] || [];
      let score = 0;

      // Count keyword matches
      for (const keyword of keywords) {
        if (lowercaseQuery.includes(keyword)) {
          score += keyword.split(' ').length; // Multi-word keywords score higher
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }

    return highestScore >= 1 ? bestMatch : null;
  },

  async getResponse(query, userRole = 'parent') {
    const lowercaseQuery = query.toLowerCase();

    // --- PHASE 1: CUSTOM SEMANTIC INTENT LOGIC (High Priority) ---
    
    // 1. Pricing Intent
    if (lowercaseQuery.includes('price') || lowercaseQuery.includes('cost') || lowercaseQuery.includes('fee') || lowercaseQuery.includes('subscription') || lowercaseQuery.includes('how much')) {
      return {
        text: "FitMySeat is free for basic use. Pro plans for technicians start at $6/mo, and Team plans are $12/mo. Organizations can save 20% by choosing annual billing. Individual service fees (like installations) are set by the technicians themselves.",
        type: 'custom_logic'
      };
    }

    // 2. Safety Check Intent (specific question about their seat)
    if (lowercaseQuery.includes('my car seat') || lowercaseQuery.includes('is it safe') || lowercaseQuery.includes('installed correctly') || lowercaseQuery.includes('check my')) {
      return {
        text: "To check if your car seat is installed safely: 1) Perform the 'inch test' - grab the seat at the belt path and try to move it. It should not move more than 1 inch in any direction. 2) Do the 'pinch test' on the harness straps at your child's shoulder - you shouldn't be able to pinch any excess webbing. If you're unsure, I recommend booking a free car seat check with one of our certified technicians!",
        type: 'custom_logic'
      };
    }

    // 3. General Safety Intent
    if (lowercaseQuery.includes('safety') || lowercaseQuery.includes('safe')) {
      return {
        text: "Child safety is our top priority. Always ensure your car seat is installed with less than 1 inch of movement at the belt path and that the harness passes the 'pinch test'. Would you like tips on a specific safety topic, or would you like to book a safety check with a certified technician?",
        type: 'custom_logic'
      };
    }

    // 4. FAQ Match (using smart keyword matching)
    const matchedFaq = this.findBestFaqMatch(query, userRole);

    if (matchedFaq) {
      return {
        text: matchedFaq.answer,
        type: 'faq',
        id: matchedFaq.id
      };
    }

    // --- PHASE 2: DEEPSEEK LLM FALLBACK (DISABLED - Insufficient Balance) ---
    // To re-enable: remove the `false &&` and ensure VITE_DEEPSEEK_API_KEY has credit
    if (false && DEEPSEEK_CONFIG.apiKey && DEEPSEEK_CONFIG.apiKey !== 'sk-cccefde58ab24b39a1f725bf3b46f627_placeholder') {
      try {
        const response = await this.callDeepSeek(query, userRole);
        return { text: response, type: 'llm' };
      } catch (error) {
        console.error("DeepSeek API Error:", error);
        // Fall through to hardcoded fallback on error
      }
    }

    // --- PHASE 3: HARDCODED FALLBACK ---
    return {
      text: "I'm your FitMySeat safety assistant. I couldn't find a specific answer in our docs, but I recommend checking our full FAQ page or booking a consultation with one of our certified technicians for personalized help.",
      type: 'fallback'
    };
  },

  async callDeepSeek(query, userRole) {
    try {
      const response = await fetch(DEEPSEEK_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: DEEPSEEK_CONFIG.model,
          messages: [
            {
              role: "system",
              content: `You are the expert AI safety assistant for FitMySeat. FitMySeat connects parents with Child Passenger Safety Technicians (CPSTs). The user you are talking to is a ${userRole}. Guidelines: 1. Always prioritize child safety based on NHTSA standards. 2. Keep answers concise and professional. 3. If a question is about specific pricing, mention the $6/mo Pro and $12/mo Team rates. 4. If unsure, advise the user to book a certified technician through the 'Services' page. 5. Do not invent safety regulations; stick to standard CPST best practices.`
            },
            {
              role: "user",
              content: query
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'DeepSeek API Request Failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  }
};