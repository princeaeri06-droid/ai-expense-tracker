# Expense Categorization Improvements

## Overview

Implemented a hybrid categorization system that combines:
1. **ML Model** - Uses Naive Bayes classifier for prediction
2. **Rule-based Fallback** - Keyword matching for common patterns (e.g., "Uber" → Travel)
3. **User Feedback Loop** - Stores corrections and retrains the model

## Schema Changes

### Expense Model Updates
- `predictedCategory` - Stores the AI-predicted category
- `predictedConfidence` - Confidence score (0-1)
- `categoryMethod` - How category was determined (`ml`, `rule`, `hybrid`, `manual`)
- `isCorrected` - Whether user corrected the category

### New CategoryCorrection Model
Tracks all user corrections for retraining:
- Links to expense and user
- Stores original prediction vs corrected category
- Tracks correction source and method
- Timestamped for retraining purposes

## Backend Implementation

### 1. Hybrid Categorization Service (`server/src/services/categorizationService.js`)

**Rule-based Engine:**
- Keyword matching for 8+ categories (Travel, Food, Bills, Shopping, Entertainment, Health, Transportation, Education)
- Regex pattern matching for stronger matches
- Confidence scoring based on match strength

**Hybrid Logic:**
1. Try rule-based first (fast, reliable for known patterns)
2. Try ML model if rules don't match well
3. Combine results if both methods agree (higher confidence)
4. Prefer higher confidence if they disagree
5. Fallback to "general" if neither works

### 2. Updated Controllers

**AI Controller** (`server/src/controllers/aiController.js`):
- `categorizeExpense` - Now uses hybrid approach

**Expense Controller** (`server/src/controllers/expenseController.js`):
- `addExpense` - Auto-categorizes if category not provided
- `updateExpense` - Automatically stores corrections when category is changed

**Category Controller** (`server/src/controllers/categoryController.js`):
- `storeCorrection` - Explicitly store corrections
- `getTrainingData` - Retrieve user's correction data
- `retrainModel` - Trigger model retraining
- `getCategories` - List available categories
- `bulkCategorize` - Categorize multiple expenses at once

### 3. New API Endpoints

```
POST   /api/categories/correction        - Store category correction
GET    /api/categories/training-data     - Get training data
POST   /api/categories/retrain           - Retrain ML model
GET    /api/categories/categories        - Get available categories
POST   /api/categories/bulk-categorize   - Bulk categorize expenses
```

### 4. Python AI Service Updates

**Retrain Endpoint** (`ai/unified_service.py`):
- `/retrain` - Accepts new training data and rebuilds the model
- Combines new corrections with existing training samples
- Returns retraining status and statistics

## Frontend Implementation

### API Functions (`client/src/utils/api.js`)
Added `categoryAPI` with methods:
- `storeCorrection(expenseId, correctedCategory)`
- `getTrainingData(limit)`
- `retrainModel(force)`
- `getCategories()`
- `bulkCategorize(expenses)`

### Auto-categorization
When adding expenses:
- If no category provided, system auto-categorizes using hybrid approach
- Category suggestion shows confidence and method
- User can accept or modify

### Correction Tracking
When updating expense category:
- Automatically detects if category changed from prediction
- Stores correction in background
- Marks expense as corrected

## Usage Examples

### 1. Automatic Categorization

When adding an expense without a category:
```javascript
// Frontend automatically calls:
POST /api/add-expense
{
  title: "Uber ride to airport",
  amount: 25.50,
  // No category specified
}

// Backend auto-categorizes using hybrid approach
// Response includes:
{
  category: "Travel",  // From rule-based (keyword "Uber")
  predictedCategory: "Travel",
  predictedConfidence: 0.92,
  categoryMethod: "rule"
}
```

### 2. Manual Correction

User changes category in expense editor:
```javascript
// Frontend automatically detects change and stores correction
POST /api/categories/correction
{
  expenseId: "123",
  correctedCategory: "Transportation"  // Changed from "Travel"
}

// Correction stored for future retraining
```

### 3. Retraining Model

After collecting corrections:
```javascript
// Trigger retraining
POST /api/categories/retrain

// Response:
{
  message: "Model retrained successfully",
  trainingSamples: 45,
  result: {
    status: "success",
    new_samples: 15
  }
}
```

## Rule-based Categories

### Travel
Keywords: uber, lyft, taxi, flight, airline, hotel, airbnb, train, bus, gas, fuel, parking, etc.

### Food
Keywords: restaurant, cafe, coffee, starbucks, grocery, supermarket, lunch, dinner, delivery, etc.

### Bills
Keywords: electricity, water, utility, internet, phone, cable, subscription, insurance, rent, etc.

### Shopping
Keywords: amazon, walmart, target, shop, store, clothing, shoes, electronics, purchase, etc.

### Entertainment
Keywords: movie, cinema, concert, game, streaming, netflix, sports, ticket, etc.

### Health
Keywords: pharmacy, medicine, doctor, hospital, clinic, medical, gym, fitness, vitamin, etc.

### Transportation
Keywords: car, vehicle, maintenance, repair, oil change, tire, auto, mechanic, etc.

### Education
Keywords: school, university, college, tuition, book, course, class, education, etc.

## Benefits

1. **Immediate Accuracy** - Rule-based matching catches common patterns instantly
2. **Learning System** - Model improves with user feedback
3. **Fault Tolerance** - Falls back gracefully if ML service unavailable
4. **User Control** - Transparent method tracking and easy corrections
5. **Personalization** - Retrains on user-specific corrections

## Future Enhancements

- [ ] Per-user model training (isolated models per user)
- [ ] Category confidence thresholds (auto-correct low confidence)
- [ ] Batch retraining scheduler
- [ ] Category statistics and accuracy metrics
- [ ] Export training data for external analysis
- [ ] Category suggestions based on similar users

## Testing

1. **Test Auto-categorization:**
   - Add expense with title "Uber ride" → Should categorize as "Travel" (rule-based)
   - Add expense with title "Dinner at restaurant" → Should categorize as "Food" (rule-based)
   - Add expense with unusual title → Should use ML prediction

2. **Test Corrections:**
   - Update expense category → Check CategoryCorrection collection
   - Verify expense.isCorrected flag is set

3. **Test Retraining:**
   - Store multiple corrections
   - Call retrain endpoint
   - Verify model uses new training data









