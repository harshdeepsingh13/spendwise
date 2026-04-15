export function assertHistoryAccess(user, requestedStart) {
  if (user.tier === 'pro') return
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  if (requestedStart < threeMonthsAgo) {
    const err = new Error('History beyond 3 months requires a Pro subscription')
    err.status = 402
    throw err
  }
}

export function assertPro(user, featureName) {
  if (user.tier === 'pro') return
  const err = new Error(`${featureName} requires a Pro subscription`)
  err.status = 402
  throw err
}
