import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // TechInPedia Brand Colors
  static const Color primary = Color(0xFF4F46E5); // Indigo 600
  static const Color primaryDark = Color(0xFF4338CA); // Indigo 700
  static const Color primaryLight = Color(0xFF818CF8); // Indigo 400
  static const Color indigo = primary;

  // WhatsApp Emerald Green
  static const Color whatsappGreen = Color(0xFF10B981); // Emerald 500
  static const Color whatsappDark = Color(0xFF059669); // Emerald 600
  static const Color whatsappLight = Color(0xFFD1FAE5); // Emerald 100
  static const Color emerald = whatsappGreen;

  // Neutral Backgrounds & Surfaces (Light)
  static const Color backgroundLight = Color(0xFFF8FAFC); // Slate 50
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFE2E8F0); // Slate 200

  // Neutral Backgrounds & Surfaces (Dark)
  static const Color backgroundDark = Color(0xFF0F172A); // Slate 900
  static const Color surfaceDark = Color(0xFF1E293B); // Slate 800
  static const Color cardDark = Color(0xFF1E293B);
  static const Color borderDark = Color(0xFF334155); // Slate 700

  // Text Colors
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color textMutedLight = Color(0xFF94A3B8);

  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color textMutedDark = Color(0xFF64748B);

  // Status Colors
  static const Color statusOpen = Color(0xFF10B981); // Green
  static const Color statusClosed = Color(0xFF64748B); // Slate
  static const Color priorityLow = Color(0xFF3B82F6); // Blue
  static const Color priorityMedium = Color(0xFFF59E0B); // Amber
  static const Color priorityHigh = Color(0xFFEF4444); // Red

  // Chat Bubbles
  static const Color bubbleInboundLight = Color(0xFFF1F5F9); // Slate 100
  static const Color bubbleInboundDark = Color(0xFF334155); // Slate 700
  static const Color bubbleOutboundLight = Color(0xFFE0E7FF); // Indigo 100
  static const Color bubbleOutboundDark = Color(0xFF4338CA); // Indigo 700
  static const Color bubbleSystemLight = Color(0xFFFEF3C7); // Amber 100
  static const Color bubbleSystemDark = Color(0xFF78350F); // Amber 900
}
