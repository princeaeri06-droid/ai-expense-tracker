// Hybrid categorization service with ML + rule-based fallback

// Rule-based keyword mapping for common expense patterns
const categoryRules = {
  Travel: {
    keywords: [
      'uber', 'lyft', 'taxi', 'flight', 'airline', 'hotel', 'airbnb', 'train', 'bus',
      'gas', 'fuel', 'parking', 'metro', 'subway', 'rental car', 'rental', 'ticket',
      'travel', 'trip', 'airport', 'luggage', 'baggage'
    ],
    patterns: [/uber/i, /lyft/i, /taxi/i, /flight/i, /airline/i, /hotel/i, /airbnb/i]
  },
  Food: {
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'kfc', 'pizza',
      'grocery', 'supermarket', 'walmart', 'target', 'food', 'lunch', 'dinner',
      'breakfast', 'snack', 'delivery', 'doordash', 'ubereats', 'grubhub',
      'takeout', 'bakery', 'bar', 'pub', 'alcohol', 'beer', 'wine', 'liquor'
    ],
    patterns: [/restaurant/i, /cafe/i, /coffee/i, /pizza/i, /food/i, /grocery/i]
  },
  Bills: {
    keywords: [
      'electricity', 'electric', 'water', 'gas bill', 'utility', 'internet',
      'phone', 'mobile', 'cable', 'tv', 'subscription', 'netflix', 'spotify',
      'insurance', 'rent', 'mortgage', 'loan', 'credit card', 'bank fee',
      'electric bill', 'water bill', 'gas bill', 'utility bill'
    ],
    patterns: [/electric/i, /utility/i, /internet/i, /phone/i, /subscription/i, /insurance/i]
  },
  Shopping: {
    keywords: [
      'amazon', 'walmart', 'target', 'shop', 'store', 'mall', 'clothing',
      'shoes', 'electronics', 'online', 'purchase', 'buy', 'order',
      'fashion', 'apparel', 'accessories', 'gift', 'present'
    ],
    patterns: [/amazon/i, /shop/i, /store/i, /purchase/i, /buy/i]
  },
  Entertainment: {
    keywords: [
      'movie', 'cinema', 'theater', 'concert', 'music', 'game', 'video game',
      'streaming', 'netflix', 'disney', 'hulu', 'sports', 'event', 'ticket',
      'club', 'entertainment', 'fun'
    ],
    patterns: [/movie/i, /cinema/i, /concert/i, /game/i, /ticket/i]
  },
  Health: {
    keywords: [
      'pharmacy', 'drugstore', 'medicine', 'doctor', 'hospital', 'clinic',
      'medical', 'health', 'gym', 'fitness', 'yoga', 'vitamin', 'supplement'
    ],
    patterns: [/pharmacy/i, /doctor/i, /hospital/i, /medical/i, /gym/i, /fitness/i]
  },
  Transportation: {
    keywords: [
      'car', 'vehicle', 'maintenance', 'repair', 'oil change', 'tire', 'auto',
      'mechanic', 'dmv', 'registration', 'license', 'car wash', 'detailing'
    ],
    patterns: [/car/i, /vehicle/i, /auto/i, /mechanic/i, /repair/i]
  },
  Education: {
    keywords: [
      'school', 'university', 'college', 'tuition', 'book', 'course', 'class',
      'education', 'learning', 'seminar', 'workshop', 'training'
    ],
    patterns: [/school/i, /university/i, /college/i, /tuition/i, /course/i]
  },
}

/**
 * Rule-based categorization using keyword matching
 */
export function categorizeByRules(title, description = '') {
  const text = `${title} ${description}`.toLowerCase()
  const scores = {}

  // Score each category based on keyword matches
  for (const [category, { keywords, patterns }] of Object.entries(categoryRules)) {
    let score = 0
    
    // Check keywords
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 2 // Keywords are worth more
      }
    }
    
    // Check regex patterns
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        score += 3 // Patterns are most reliable
      }
    }
    
    if (score > 0) {
      scores[category] = score
    }
  }

  // Return category with highest score
  const sortedCategories = Object.entries(scores).sort((a, b) => b[1] - a[1])
  
  if (sortedCategories.length > 0 && sortedCategories[0][1] >= 2) {
    return {
      category: sortedCategories[0][0],
      confidence: Math.min(sortedCategories[0][1] / 10, 0.95), // Normalize to 0-0.95
      method: 'rule',
    }
  }

  return null
}

/**
 * Hybrid categorization: Try ML first, fallback to rules, then default
 */
export async function hybridCategorize(title, description = '', mlService) {
  let result = null
  let method = 'manual'
  
  // Step 1: Try rule-based first (fast and reliable for known patterns)
  const ruleResult = categorizeByRules(title, description)
  
  if (ruleResult && ruleResult.confidence >= 0.7) {
    // High confidence rule match - use it
    return {
      ...ruleResult,
      method: 'rule',
    }
  }

  // Step 2: Try ML model
  try {
    if (mlService) {
      const mlResult = await mlService.categorize(title, description)
      if (mlResult && mlResult.confidence) {
        result = {
          category: mlResult.category,
          confidence: mlResult.confidence,
          method: 'ml',
        }
      }
    }
  } catch (error) {
    console.error('ML categorization error:', error)
  }

  // Step 3: Combine ML and rule-based results
  if (result && ruleResult) {
    // Both methods agree
    if (result.category === ruleResult.category) {
      return {
        category: result.category,
        confidence: Math.min((result.confidence + ruleResult.confidence) / 2 + 0.1, 0.99),
        method: 'hybrid',
      }
    }
    // Disagreement - prefer higher confidence
    if (result.confidence > ruleResult.confidence) {
      return result
    }
    return ruleResult
  }

  // Step 4: Use whichever result we have
  if (result) {
    return result
  }
  
  if (ruleResult) {
    return ruleResult
  }

  // Step 5: Default fallback
  return {
    category: 'general',
    confidence: 0.3,
    method: 'manual',
  }
}

/**
 * Get all available categories
 */
export function getAvailableCategories() {
  return Object.keys(categoryRules).concat(['general', 'other'])
}









