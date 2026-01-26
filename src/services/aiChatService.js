import { faqs } from '../data/faqData';

const DEEPSEEK_CONFIG = {
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  baseUrl: "https://api.deepseek.com/chat/completions",
  model: "deepseek-chat",
};

export const aiChatService = {
  async getResponse(query, userRole = 'parent') {
    const lowercaseQuery = query.toLowerCase();

    // --- PHASE 1: CUSTOM SEMANTIC INTENT LOGIC (High Priority) ---
    
    // 1. Pricing Intent
    if (lowercaseQuery.includes('price') || lowercaseQuery.includes('cost') || lowercaseQuery.includes('fee') || lowercaseQuery.includes('subscription')) {
      return {
        text: "FitMySeat is free for basic use. Pro plans for technicians start at $6/mo, and Team plans are $12/mo. Organizations can save 20% by choosing annual billing. Individual service fees (like installations) are set by the technicians themselves.",
        type: 'custom_logic'
      };
    }

    // 2. Safety Intent (Core Mission)
    if (lowercaseQuery.includes('safety') || lowercaseQuery.includes('safe') || lowercaseQuery.includes('install') || lowercaseQuery.includes('rear facing')) {
      const safetyBaseline = "Child safety is our top priority. Always ensure your car seat is installed with less than 1 inch of movement at the belt path and that the harness passes the 'pinch test'.";
      if (!DEEPSEEK_CONFIG.apiKey) {
        return { text: safetyBaseline, type: 'custom_logic' };
      }
    }

    // 3. FAQ Match
    const matchedFaq = faqs.find(f => 
      (f.role === 'all' || f.role === userRole) && 
      (lowercaseQuery.includes(f.question.toLowerCase()))
    );

    if (matchedFaq) {
      return {
        text: matchedFaq.answer,
        type: 'faq',
        id: matchedFaq.id
      };
    }

    // --- PHASE 2: DEEPSEEK LLM FALLBACK ---
    if (DEEPSEEK_CONFIG.apiKey && DEEPSEEK_CONFIG.apiKey !== 'sk-cccefde58ab24b39a1f725bf3b46f627_placeholder') {
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