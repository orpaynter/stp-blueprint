const User = require('../models/User');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, phone, role, company, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    company,
    address
  });

  // Generate verification token
  const verificationToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await sendVerificationEmail(user, verificationToken);
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (err) {
    // If email sending fails, revert user creation
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('There was an error sending the verification email. Please try again.', 500));
  }
});

/**
 * Verify user email
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  
  // Find user by verification token
  const user = await User.findByVerificationToken(token);
  
  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }
  
  // Update user verification status
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully. You can now log in.'
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  
  // Find user by email
  const user = await User.findOne({ email }).select('+password +mfaEnabled +mfaSecret');
  
  // Check if user exists and password is correct
  if (!user || !(await user.comparePassword(password))) {
    // Increment login attempts if user exists
    if (user) {
      await user.incrementLoginAttempts();
    }
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // Check if account is locked
  if (user.isLocked()) {
    return next(new AppError('Account locked due to too many failed login attempts. Please try again later.', 401));
  }
  
  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  
  // Update last login timestamp
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });
  
  // Check if user is verified
  if (!user.isVerified) {
    return next(new AppError('Please verify your email address before logging in.', 401));
  }
  
  // Check if MFA is enabled
  if (user.mfaEnabled) {
    // Generate temporary token for MFA verification
    const tempToken = jwt.sign(
      { id: user._id, mfaRequired: true },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    
    return res.status(200).json({
      status: 'success',
      message: 'MFA verification required',
      mfaRequired: true,
      tempToken
    });
  }
  
  // Generate JWT token
  const token = user.generateAuthToken();
  
  // Generate refresh token
  const refreshToken = user.generateRefreshToken(
    req.headers['user-agent'],
    req.ip
  );
  
  await user.save({ validateBeforeSave: false });
  
  // Remove password from output
  user.password = undefined;
  user.mfaSecret = undefined;
  
  // Set cookie for web clients
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  res.status(200).json({
    status: 'success',
    token,
    refreshToken: refreshToken.token,
    refreshTokenExpires: refreshToken.expires,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled
      }
    }
  });
});

/**
 * Verify MFA token
 * @route POST /api/auth/verify-mfa
 * @access Public
 */
exports.verifyMFA = catchAsync(async (req, res, next) => {
  const { tempToken, mfaToken } = req.body;
  
  if (!tempToken || !mfaToken) {
    return next(new AppError('Please provide temporary token and MFA token', 400));
  }
  
  // Verify temporary token
  const decoded = await promisify(jwt.verify)(tempToken, process.env.JWT_SECRET);
  
  if (!decoded.mfaRequired) {
    return next(new AppError('Invalid temporary token', 401));
  }
  
  // Find user
  const user = await User.findById(decoded.id).select('+mfaSecret');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Verify MFA token
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: mfaToken,
    window: 1
  });
  
  if (!verified) {
    return next(new AppError('Invalid MFA token', 401));
  }
  
  // Generate JWT token
  const token = user.generateAuthToken();
  
  // Generate refresh token
  const refreshToken = user.generateRefreshToken(
    req.headers['user-agent'],
    req.ip
  );
  
  await user.save({ validateBeforeSave: false });
  
  // Set cookie for web clients
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  res.status(200).json({
    status: 'success',
    token,
    refreshToken: refreshToken.token,
    refreshTokenExpires: refreshToken.expires,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled
      }
    }
  });
});

/**
 * Setup MFA for user
 * @route POST /api/auth/setup-mfa
 * @access Private
 */
exports.setupMFA = catchAsync(async (req, res, next) => {
  // Get user from database with MFA secret
  const user = await User.findById(req.user.id).select('+mfaSecret');
  
  // Generate new secret if not exists
  if (!user.mfaSecret) {
    const secret = speakeasy.generateSecret({
      name: `OrPaynter:${user.email}`
    });
    
    user.mfaSecret = secret.base32;
    await user.save({ validateBeforeSave: false });
  }
  
  // Generate QR code
  const otpauth_url = speakeasy.otpauthURL({
    secret: user.mfaSecret,
    label: `OrPaynter:${user.email}`,
    issuer: 'OrPaynter',
    encoding: 'base32'
  });
  
  const qrCodeDataUrl = await qrcode.toDataURL(otpauth_url);
  
  res.status(200).json({
    status: 'success',
    data: {
      qrCode: qrCodeDataUrl,
      secret: user.mfaSecret
    }
  });
});

/**
 * Enable MFA for user
 * @route POST /api/auth/enable-mfa
 * @access Private
 */
exports.enableMFA = catchAsync(async (req, res, next) => {
  const { mfaToken } = req.body;
  
  if (!mfaToken) {
    return next(new AppError('Please provide MFA token', 400));
  }
  
  // Get user from database with MFA secret
  const user = await User.findById(req.user.id).select('+mfaSecret');
  
  if (!user.mfaSecret) {
    return next(new AppError('MFA not set up. Please set up MFA first.', 400));
  }
  
  // Verify MFA token
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: mfaToken,
    window: 1
  });
  
  if (!verified) {
    return next(new AppError('Invalid MFA token', 401));
  }
  
  // Enable MFA
  user.mfaEnabled = true;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    status: 'success',
    message: 'MFA enabled successfully'
  });
});

/**
 * Disable MFA for user
 * @route POST /api/auth/disable-mfa
 * @access Private
 */
exports.disableMFA = catchAsync(async (req, res, next) => {
  const { mfaToken, password } = req.body;
  
  if (!mfaToken || !password) {
    return next(new AppError('Please provide MFA token and password', 400));
  }
  
  // Get user from database with MFA secret and password
  const user = await User.findById(req.user.id).select('+mfaSecret +password');
  
  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(new AppError('Incorrect password', 401));
  }
  
  // Verify MFA token
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: mfaToken,
    window: 1
  });
  
  if (!verified) {
    return next(new AppError('Invalid MFA token', 401));
  }
  
  // Disable MFA
  user.mfaEnabled = false;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    status: 'success',
    message: 'MFA disabled successfully'
  });
});

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  // Find user by refresh token (middleware already verified token)
  const user = req.user;
  
  // Remove used refresh token
  user.refreshTokens = user.refreshTokens.filter(
    token => token.token !== refreshToken
  );
  
  // Generate new JWT token
  const token = user.generateAuthToken();
  
  // Generate new refresh token
  const newRefreshToken = user.generateRefreshToken(
    req.headers['user-agent'],
    req.ip
  );
  
  await user.save({ validateBeforeSave: false });
  
  // Set cookie for web clients
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  res.status(200).json({
    status: 'success',
    token,
    refreshToken: newRefreshToken.token,
    refreshTokenExpires: newRefreshToken.expires
  });
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  // If refresh token provided, remove it
  if (refreshToken) {
    req.user.refreshTokens = req.user.refreshTokens.filter(
      token => token.token !== refreshToken
    );
    
    await req.user.save({ validateBeforeSave: false });
  }
  
  // Clear cookie for web clients
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  
  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  // Send password reset email
  try {
    await sendPasswordResetEmail(user, resetToken);
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email'
    });
  } catch (err) {
    // If email sending fails, revert token generation
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('There was an error sending the password reset email. Please try again.', 500));
  }
});

/**
 * Reset password
 * @route PATCH /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  
  // Find user by reset token
  const user = await User.findByResetToken(token);
  
  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }
  
  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  
  // Send password changed email
  try {
    await sendPasswordChangedEmail(user);
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (err) {
    return next(new AppError('Password reset successful but there was an error sending the confirmation email.', 500));
  }
});

/**
 * Update password
 * @route PATCH /api/auth/update-password
 * @access Private
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user.id).select('+password');
  
  // Check if current password is correct
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Generate new JWT token
  const token = user.generateAuthToken();
  
  // Generate new refresh token
  const refreshToken = user.generateRefreshToken(
    req.headers['user-agent'],
    req.ip
  );
  
  // Invalidate all other refresh tokens
  user.refreshTokens = [refreshToken];
  
  await user.save({ validateBeforeSave: false });
  
  // Send password changed email
  try {
    await sendPasswordChangedEmail(user);
  } catch (err) {
    // Continue even if email fails
    console.error('Error sending password changed email:', err);
  }
  
  // Set cookie for web clients
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully',
    token,
    refreshToken: refreshToken.token,
    refreshTokenExpires: refreshToken.expires
  });
});

/**
 * Get Google OAuth URL
 * @route GET /api/auth/google
 * @access Public
 */
exports.getGoogleAuthURL = catchAsync(async (req, res, next) => {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  // Generate random state parameter
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state in session to verify later
  req.session.oauthState = state;
  
  // Generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.go
(Content truncated due to size limit. Use line ranges to read in chunks)