// USD to INR conversion rate (approximate current rate)
// You can update this or fetch from an API for real-time rates
export const USD_TO_INR_RATE = 83.0

/**
 * Converts USD amount to Indian Rupees
 * @param {number} usdAmount - Amount in USD
 * @returns {number} Amount in INR
 */
export const usdToInr = (usdAmount) => {
  return usdAmount * USD_TO_INR_RATE
}

/**
 * Formats amount as Indian Rupees with proper formatting
 * @param {number} amount - Amount in INR
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted currency string
 */
export const formatInr = (amount, showDecimals = true) => {
  if (showDecimals) {
    return `₹${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/**
 * Converts USD to INR and formats it
 * @param {number} usdAmount - Amount in USD
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted INR currency string
 */
export const convertAndFormat = (usdAmount, showDecimals = true) => {
  const inrAmount = usdToInr(usdAmount)
  return formatInr(inrAmount, showDecimals)
}

