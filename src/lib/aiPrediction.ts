/**
 * AI Wait Time Prediction Service
 * 
 * Predicts waiting time based on:
 * - Doctor consultation speed
 * - Number of patients ahead
 * - Historical data
 * - Time of day patterns
 * - Day of week patterns
 */

interface PredictionFactors {
  patientsAhead: number;
  doctorAvgConsultationTime: number;
  historicalWaitTimes: number[];
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  currentQueueSpeed: number; // tokens per hour
  isPeakHour: boolean;
}

interface PredictionResult {
  estimatedWaitTime: number; // in minutes
  confidence: number; // 0-1
  minWaitTime: number;
  maxWaitTime: number;
  factors: {
    baseWait: number;
    peakHourAdjustment: number;
    dayOfWeekAdjustment: number;
    queueSpeedAdjustment: number;
  };
}

/**
 * Calculate AI-powered wait time prediction
 */
export function predictWaitTime(factors: PredictionFactors): PredictionResult {
  const {
    patientsAhead,
    doctorAvgConsultationTime,
    historicalWaitTimes,
    timeOfDay,
    dayOfWeek,
    currentQueueSpeed,
    isPeakHour,
  } = factors;

  // Base wait time calculation
  const baseWait = patientsAhead * doctorAvgConsultationTime;

  // Peak hour adjustment (increase wait time during busy hours)
  // Peak hours: 9-11 AM and 5-7 PM
  const peakHourAdjustment = isPeakHour ? 1.3 : 1.0;

  // Day of week adjustment
  // Monday and Tuesday tend to be busier
  const dayOfWeekFactors: Record<number, number> = {
    0: 1.2, // Sunday - lighter
    1: 1.3, // Monday - busy
    2: 1.2, // Tuesday - busy
    3: 1.1, // Wednesday
    4: 1.1, // Thursday
    5: 1.0, // Friday
    6: 0.9, // Saturday - lighter
  };
  const dayOfWeekAdjustment = dayOfWeekFactors[dayOfWeek] || 1.0;

  // Queue speed adjustment
  // If queue is moving slower than expected, increase estimate
  const expectedSpeed = 60 / doctorAvgConsultationTime; // tokens per hour
  const queueSpeedAdjustment = currentQueueSpeed > 0 
    ? expectedSpeed / currentQueueSpeed 
    : 1.0;

  // Historical data adjustment
  let historicalAdjustment = 1.0;
  if (historicalWaitTimes.length > 0) {
    const avgHistoricalWait = historicalWaitTimes.reduce((a, b) => a + b, 0) / historicalWaitTimes.length;
    const historicalRatio = avgHistoricalWait / (baseWait || 1);
    // Clamp the adjustment between 0.8 and 1.5
    historicalAdjustment = Math.max(0.8, Math.min(1.5, historicalRatio));
  }

  // Calculate final estimate
  const estimatedWaitTime = Math.round(
    baseWait * peakHourAdjustment * dayOfWeekAdjustment * queueSpeedAdjustment * historicalAdjustment
  );

  // Calculate confidence based on data availability
  let confidence = 0.5; // Base confidence
  if (historicalWaitTimes.length > 10) confidence += 0.2;
  if (currentQueueSpeed > 0) confidence += 0.15;
  if (patientsAhead > 0) confidence += 0.1;
  confidence = Math.min(0.95, confidence);

  // Calculate min and max range
  const variance = estimatedWaitTime * 0.2; // 20% variance
  const minWaitTime = Math.max(0, Math.round(estimatedWaitTime - variance));
  const maxWaitTime = Math.round(estimatedWaitTime + variance);

  return {
    estimatedWaitTime,
    confidence,
    minWaitTime,
    maxWaitTime,
    factors: {
      baseWait: Math.round(baseWait),
      peakHourAdjustment: Math.round((peakHourAdjustment - 1) * 100),
      dayOfWeekAdjustment: Math.round((dayOfWeekAdjustment - 1) * 100),
      queueSpeedAdjustment: Math.round((queueSpeedAdjustment - 1) * 100),
    },
  };
}

/**
 * Simple prediction for when limited data is available
 */
export function quickPredictWaitTime(
  patientsAhead: number,
  avgConsultationTime: number = 15
): number {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Check if peak hour
  const isPeakHour = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 19);

  return predictWaitTime({
    patientsAhead,
    doctorAvgConsultationTime: avgConsultationTime,
    historicalWaitTimes: [],
    timeOfDay: hour,
    dayOfWeek: day,
    currentQueueSpeed: 0,
    isPeakHour,
  }).estimatedWaitTime;
}

/**
 * Update wait time prediction based on real-time queue data
 */
export function updatePredictionWithRealTimeData(
  previousPrediction: PredictionResult,
  actualWaitTimes: number[],
  currentQueueSpeed: number
): PredictionResult {
  // If we have actual wait times, use them to refine prediction
  if (actualWaitTimes.length > 0) {
    const avgActualWait = actualWaitTimes.reduce((a, b) => a + b, 0) / actualWaitTimes.length;
    
    // Adjust based on actual vs predicted
    const adjustmentFactor = avgActualWait / previousPrediction.estimatedWaitTime;
    
    return {
      ...previousPrediction,
      estimatedWaitTime: Math.round(previousPrediction.estimatedWaitTime * adjustmentFactor),
      confidence: Math.min(0.95, previousPrediction.confidence + 0.1),
    };
  }

  return previousPrediction;
}

/**
 * Get peak hours for a given day
 */
export function getPeakHoursForDay(dayOfWeek: number): { start: number; end: number }[] {
  // Weekend has different peak hours
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [{ start: 10, end: 13 }];
  }
  
  // Weekday peak hours
  return [
    { start: 9, end: 11 },
    { start: 17, end: 19 },
  ];
}

/**
 * Calculate optimal arrival time
 */
export function calculateOptimalArrivalTime(
  estimatedWaitTime: number,
  bufferMinutes: number = 15
): Date {
  const now = new Date();
  const optimalArrival = new Date(now.getTime() + (estimatedWaitTime - bufferMinutes) * 60000);
  return optimalArrival;
}

export default {
  predictWaitTime,
  quickPredictWaitTime,
  updatePredictionWithRealTimeData,
  getPeakHoursForDay,
  calculateOptimalArrivalTime,
};
