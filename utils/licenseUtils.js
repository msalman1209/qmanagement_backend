import crypto from "crypto"
import pool from "../config/database.js"

/**
 * Generate a unique license key
 * Format: XXXX-XXXX-XXXX-XXXX
 */
export const generateLicenseKey = () => {
  const segments = []
  for (let i = 0; i < 4; i++) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase()
    segments.push(segment)
  }
  return segments.join('-')
}

/**
 * Validate license key format
 */
export const isValidLicenseKeyFormat = (licenseKey) => {
  const pattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/
  return pattern.test(licenseKey)
}

/**
 * Check if license is expired
 */
export const isLicenseExpired = (expiryDate) => {
  if (!expiryDate) return true
  const today = new Date()
  const expiry = new Date(expiryDate)
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  return expiry < today
}

/**
 * Calculate days remaining until expiry
 */
export const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return 0
  const today = new Date()
  const expiry = new Date(expiryDate)
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  const diffTime = expiry - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

/**
 * Get license status based on expiry date
 */
export const getLicenseStatus = (expiryDate, currentStatus) => {
  if (currentStatus === 'suspended' || currentStatus === 'inactive') {
    return currentStatus
  }
  
  if (isLicenseExpired(expiryDate)) {
    return 'expired'
  }
  
  const daysRemaining = getDaysRemaining(expiryDate)
  if (daysRemaining <= 7) {
    return 'expiring_soon'
  }
  
  return 'active'
}

/**
 * Verify license exists and is valid
 */
export const verifyLicense = async (licenseKey) => {
  try {
    const [licenses] = await pool.query(
      `SELECT l.*, a.username, a.email as admin_email, a.status as admin_status
       FROM licenses l
       LEFT JOIN admin a ON l.admin_id = a.id
       WHERE l.license_key = ?`,
      [licenseKey]
    )

    if (licenses.length === 0) {
      return {
        valid: false,
        message: "License key not found"
      }
    }

    const license = licenses[0]

    // Check if license is expired
    if (isLicenseExpired(license.expiry_date)) {
      return {
        valid: false,
        message: "License has expired",
        license: license
      }
    }

    // Check if license is suspended or inactive
    if (license.status !== 'active') {
      return {
        valid: false,
        message: `License is ${license.status}`,
        license: license
      }
    }

    // Check if associated admin is active
    if (license.admin_status !== 'active') {
      return {
        valid: false,
        message: "Associated admin account is not active",
        license: license
      }
    }

    return {
      valid: true,
      message: "License is valid",
      license: license,
      daysRemaining: getDaysRemaining(license.expiry_date)
    }
  } catch (error) {
    console.error("License verification error:", error)
    return {
      valid: false,
      message: "Error verifying license"
    }
  }
}

/**
 * Verify admin license by admin ID
 */
export const verifyAdminLicense = async (adminId) => {
  try {
    const [licenses] = await pool.query(
      `SELECT l.*, a.username, a.email as admin_email, a.status as admin_status
       FROM licenses l
       LEFT JOIN admin a ON l.admin_id = a.id
       WHERE l.admin_id = ? AND l.status = 'active'
       ORDER BY l.expiry_date DESC
       LIMIT 1`,
      [adminId]
    )

    if (licenses.length === 0) {
      return {
        valid: false,
        message: "No active license found for this admin"
      }
    }

    const license = licenses[0]

    // Check if license is expired
    if (isLicenseExpired(license.expiry_date)) {
      // Update license status to expired
      await pool.query(
        "UPDATE licenses SET status = 'expired' WHERE id = ?",
        [license.id]
      )
      
      return {
        valid: false,
        message: "License has expired",
        license: license
      }
    }

    return {
      valid: true,
      message: "License is valid",
      license: license,
      daysRemaining: getDaysRemaining(license.expiry_date)
    }
  } catch (error) {
    console.error("Admin license verification error:", error)
    return {
      valid: false,
      message: "Error verifying admin license"
    }
  }
}

/**
 * Check if admin can create more users
 */
export const canCreateUser = async (adminId) => {
  try {
    const verification = await verifyAdminLicense(adminId)
    
    if (!verification.valid) {
      return {
        allowed: false,
        message: verification.message
      }
    }

    const license = verification.license

    // Count current users for this admin
    const [userCount] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE admin_id = ?",
      [adminId]
    )

    const currentUsers = userCount[0].count

    if (currentUsers >= license.max_users) {
      return {
        allowed: false,
        message: `Maximum user limit (${license.max_users}) reached for your license`,
        currentUsers,
        maxUsers: license.max_users
      }
    }

    return {
      allowed: true,
      currentUsers,
      maxUsers: license.max_users,
      remainingSlots: license.max_users - currentUsers
    }
  } catch (error) {
    console.error("User creation check error:", error)
    return {
      allowed: false,
      message: "Error checking user creation permissions"
    }
  }
}

/**
 * Check if admin can create more services
 */
export const canCreateService = async (adminId) => {
  try {
    const verification = await verifyAdminLicense(adminId)
    
    if (!verification.valid) {
      return {
        allowed: false,
        message: verification.message
      }
    }

    const license = verification.license

    // Count current services for this admin
    const [serviceCount] = await pool.query(
      "SELECT COUNT(*) as count FROM services WHERE admin_id = ?",
      [adminId]
    )

    const currentServices = serviceCount[0].count

    if (currentServices >= license.max_services) {
      return {
        allowed: false,
        message: `Maximum service limit (${license.max_services}) reached for your license`,
        currentServices,
        maxServices: license.max_services
      }
    }

    return {
      allowed: true,
      currentServices,
      maxServices: license.max_services,
      remainingSlots: license.max_services - currentServices
    }
  } catch (error) {
    console.error("Service creation check error:", error)
    return {
      allowed: false,
      message: "Error checking service creation permissions"
    }
  }
}

/**
 * Get license type features
 */
export const getLicenseTypeFeatures = (licenseType) => {
  const features = {
    trial: {
      max_users: 5,
      max_counters: 2,
      max_services: 5,
      duration_days: 30,
      features: ['basic_reporting', 'email_support']
    },
    basic: {
      max_users: 10,
      max_counters: 5,
      max_services: 10,
      duration_days: 365,
      features: ['basic_reporting', 'email_support', 'ticket_management']
    },
    premium: {
      max_users: 50,
      max_counters: 20,
      max_services: 50,
      duration_days: 365,
      features: [
        'advanced_reporting',
        'priority_support',
        'ticket_management',
        'custom_branding',
        'api_access'
      ]
    },
    enterprise: {
      max_users: 999,
      max_counters: 999,
      max_services: 999,
      duration_days: 365,
      features: [
        'advanced_reporting',
        'dedicated_support',
        'ticket_management',
        'custom_branding',
        'api_access',
        'multi_location',
        'white_label',
        'custom_integrations'
      ]
    }
  }

  return features[licenseType] || features.basic
}

/**
 * Calculate expiry date based on license type
 */
export const calculateExpiryDate = (startDate, licenseType) => {
  const features = getLicenseTypeFeatures(licenseType)
  const start = new Date(startDate)
  const expiry = new Date(start)
  expiry.setDate(expiry.getDate() + features.duration_days)
  return expiry.toISOString().split('T')[0]
}

export default {
  generateLicenseKey,
  isValidLicenseKeyFormat,
  isLicenseExpired,
  getDaysRemaining,
  getLicenseStatus,
  verifyLicense,
  verifyAdminLicense,
  canCreateUser,
  canCreateService,
  getLicenseTypeFeatures,
  calculateExpiryDate
}
