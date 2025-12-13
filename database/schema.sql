-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 22, 2025 at 06:55 AM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u998585094_demoqueue`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` ENUM('super_admin', 'admin') DEFAULT 'admin',
  `license_key` varchar(255) DEFAULT NULL,
  `license_expiry_date` date DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `email`, `password`, `role`, `status`) VALUES
(1, 'superadmin', 'superadmin@qmanagement.com', '$2a$10$samplehashedpassword', 'super_admin', 'active'),
(2, 'admin', 'admin@gmail.com', 'admin', 'admin', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `admin_sessions`
--

CREATE TABLE `admin_sessions` (
  `session_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`session_id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_token` (`token`(255)),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `licenses`
--

CREATE TABLE `licenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `license_key` varchar(255) UNIQUE NOT NULL,
  `admin_id` int(11) NOT NULL,
  `admin_name` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `phone` varchar(50),
  `email` varchar(255) NOT NULL,
  `address` TEXT,
  `city` varchar(100),
  `country` varchar(100),
  `license_type` ENUM('trial', 'basic', 'premium', 'enterprise') DEFAULT 'basic',
  `start_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `max_users` int(11) DEFAULT 10,
  `max_counters` int(11) DEFAULT 5,
  `max_services` int(11) DEFAULT 10,
  `max_receptionists` int(11) DEFAULT 5 COMMENT 'Maximum number of reception role users allowed',
  `max_ticket_info_users` int(11) DEFAULT 3 COMMENT 'Maximum number of ticket_info screen users allowed',
  `max_sessions_per_receptionist` int(11) DEFAULT 1 COMMENT 'Maximum concurrent sessions allowed per receptionist (1-5)',
  `max_sessions_per_ticket_info` int(11) DEFAULT 1 COMMENT 'Maximum concurrent sessions allowed per ticket_info user (1-5)',
  `features` JSON DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended', 'expired') DEFAULT 'active',
  `admin_sections` JSON DEFAULT NULL COMMENT 'Admin accessible sections configuration',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_license_key` (`license_key`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_expiry_date` (`expiry_date`),
  KEY `idx_status` (`status`),
  KEY `idx_license_type` (`license_type`),
  FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voice_settings`
--

CREATE TABLE `voice_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) DEFAULT NULL,
  `voice_type` varchar(50) DEFAULT 'default',
  `language` varchar(10) DEFAULT 'en',
  `languages` text DEFAULT NULL COMMENT 'JSON array of selected languages (max 2)',
  `speech_rate` decimal(3,2) DEFAULT 0.9,
  `speech_pitch` decimal(3,2) DEFAULT 1.0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_voice_settings_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_btn_settings`
--

CREATE TABLE `admin_btn_settings` (
  `id` int(11) NOT NULL,
  `setting_name` varchar(255) NOT NULL,
  `setting_value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_btn_settings`
--

INSERT INTO `admin_btn_settings` (`id`, `setting_name`, `setting_value`) VALUES
(1, 'show_next_button', '1'),
(2, 'show_transfer_button', '1');

-- --------------------------------------------------------

--
-- Table structure for table `all_counters`
--

CREATE TABLE `all_counters` (
  `id` int(11) NOT NULL,
  `counter_no` int(30) NOT NULL,
  `username` varchar(250) NOT NULL,
  `ticket_id` varchar(250) NOT NULL,
  `time` time NOT NULL,
  `date` date NOT NULL,
  `service_name` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `all_counters`
--

INSERT INTO `all_counters` (`id`, `counter_no`, `username`, `ticket_id`, `time`, `date`, `service_name`) VALUES
(340, 20, 'user19', '', '17:19:49', '2025-11-04', ''),
(341, 1, 'user18', '', '17:23:06', '2025-11-04', '');

-- --------------------------------------------------------

--
-- Table structure for table `Counters`
--

CREATE TABLE `Counters` (
  `id` int(11) NOT NULL,
  `counter_name` varchar(255) DEFAULT NULL,
  `current_ticket_id` varchar(200) NOT NULL,
  `status` varchar(200) NOT NULL,
  `counter_no` varchar(250) NOT NULL,
  `user_status` varchar(250) NOT NULL,
  `calling_time` int(100) NOT NULL,
  `voice` varchar(250) NOT NULL,
  `language` varchar(250) NOT NULL,
  `news_ticker` text NOT NULL,
  `ad_vedio` text NOT NULL,
  `is_called` tinyint(1) DEFAULT 0,
  `ticket_time` int(11) DEFAULT NULL,
  `called_time` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `counter_display`
--

CREATE TABLE `counter_display` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `ad_video` longtext NOT NULL,
  `ticker` longtext NOT NULL,
  KEY `idx_counter_display_admin_id` (`admin_id`),
  CONSTRAINT `fk_counter_display_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `counter_display`
--

INSERT INTO `counter_display` (`id`, `ad_video`, `ticker`) VALUES
(1, 'advedio.mp4', 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C');

-- --------------------------------------------------------

--
-- Table structure for table `display_sessions`
--

CREATE TABLE `display_sessions` (
  `session_id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT current_timestamp(),
  `device` varchar(50) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `token` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `parent_id` varchar(250) DEFAULT NULL,
  `initial_ticket` varchar(100) NOT NULL,
  `color` varchar(7) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_user_id` int(11) DEFAULT NULL,
  `assigned_counter_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `service_name_arabic` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `show_sub_service_popup` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `service_name`, `parent_id`, `initial_ticket`, `color`, `description`, `assigned_user_id`, `assigned_counter_id`, `created_at`, `updated_at`, `service_name_arabic`, `logo_url`, `show_sub_service_popup`) VALUES
(10, 'General Services', '', 'G', '#872121', NULL, NULL, NULL, '2024-08-28 06:32:34', '2025-08-08 12:17:30', 'الخدمات العامة', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(11, 'Payment Services', '', 'P', '#cb5515', NULL, NULL, NULL, '2024-08-28 06:32:34', '2025-08-08 12:17:44', 'خدمات الدفع', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(12, 'Establishment Services', '', 'E', '#da07b7', NULL, NULL, NULL, '2024-08-28 06:32:34', '2025-08-08 12:17:52', 'خدمات التأسيس', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(13, 'Special Needs', '', 'S', '#4e9513', NULL, NULL, NULL, '2024-08-28 06:32:34', '2025-08-08 12:18:03', 'ذوي الاحتياجات الخاصة', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(14, 'Labor Services', '', 'L', '#cb5515', NULL, NULL, NULL, '2024-08-28 06:32:34', '2025-08-08 12:18:13', 'خدمات العمالة', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(15, 'Emirates ID New', NULL, 'N', '#0808FF', NULL, NULL, NULL, '2024-09-25 12:26:38', '2025-08-08 12:18:19', 'خدمة جديدة', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(16, 'Emirates ID Renewal', NULL, 'R', '#0808FF', NULL, NULL, NULL, '2024-09-25 12:26:38', '2025-08-08 12:18:24', 'خدمة تجديد', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(17, 'Emirates ID Replacement', NULL, 'P', '#0808FF', NULL, NULL, NULL, '2024-09-25 12:26:38', '2025-08-08 12:18:30', 'خدمة استبدال', 'https://demoqueue.techatooz.com/assets/img/logo/12.webp', 0),
(25, 'child', '10', 'c', '#000000', NULL, NULL, NULL, '2025-10-15 11:13:04', '2025-10-15 11:13:29', 'child', '0', 1);

-- --------------------------------------------------------

--
-- Table structure for table `services_display`
--

CREATE TABLE `services_display` (
  `id` int(11) NOT NULL,
  `username` varchar(200) NOT NULL,
  `password` varchar(200) NOT NULL,
  `device` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services_display`
--

INSERT INTO `services_display` (`id`, `username`, `password`, `device`) VALUES
(1, 'admin', 'admin', ''),
(3, 'test', 'test@11222', '');

-- --------------------------------------------------------

--
-- Table structure for table `services_time_restrictions`
--

CREATE TABLE `services_time_restrictions` (
  `id` int(11) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `ticket_id` varchar(255) DEFAULT NULL,
  `counter_no` varchar(250) DEFAULT NULL,
  `service_name` varchar(255) DEFAULT NULL,
  `time` time NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(200) DEFAULT NULL,
  `status_time` timestamp NOT NULL,
  `called_at` datetime DEFAULT NULL,
  `called_by_user_id` int(11) DEFAULT NULL,
  `name` varchar(30) NOT NULL,
  `email` varchar(30) NOT NULL,
  `number` varchar(30) NOT NULL,
  `representative` varchar(200) DEFAULT NULL,
  `caller` varchar(200) DEFAULT NULL,
  `calling_time` int(100) NOT NULL,
  `calling_user_time` timestamp NOT NULL,
  `reason` text NOT NULL,
  `service_time` time NOT NULL,
  `representative_id` varchar(200) DEFAULT NULL,
  `transfered` varchar(100) DEFAULT NULL,
  `transfered_time` timestamp NOT NULL,
  `solved_by_counter` varchar(200) DEFAULT NULL,
  `transfer_by` varchar(200) DEFAULT NULL,
  `locked_by` int(11) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  KEY `idx_called_by_user_id` (`called_by_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `ticket_id`, `counter_no`, `service_name`, `time`, `date`, `created_at`, `status`, `status_time`, `name`, `email`, `number`, `representative`, `caller`, `calling_time`, `calling_user_time`, `reason`, `service_time`, `representative_id`, `transfered`, `transfered_time`, `solved_by_counter`, `transfer_by`, `locked_by`, `last_updated`) VALUES
(12, 'G-105', '18', 'General Services', '15:44:19', '2025-10-15', '2025-10-15 10:44:18', 'Solved', '2025-10-15 10:45:32', '', '', '', 'user18', '9', 2, '2025-10-15 10:45:17', '', '00:00:15', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 10:45:32'),
(13, 'E-303', '18', 'Establishment Services', '15:47:23', '2025-10-15', '2025-10-15 10:47:22', 'Solved', '2025-10-15 10:53:03', '', '', '', 'user18', '9', 1, '2025-10-15 10:53:02', '', '00:00:01', NULL, '9', '2025-10-15 10:52:49', NULL, '25', NULL, '2025-10-15 10:53:03'),
(14, 'L-503', '19', 'Labor Services', '15:47:44', '2025-10-15', '2025-10-15 10:47:43', 'Unattendant', '0000-00-00 00:00:00', '', '', '', 'user19', NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 10:50:08'),
(15, 'E-304', '19', 'Emirates ID New', '15:47:47', '2025-10-15', '2025-10-15 10:47:46', 'Not Solved', '2025-10-15 11:08:18', '', '', '', 'user19', '25', 4, '2025-10-15 11:07:55', 'bamizi ki hn', '00:00:22', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 11:08:18'),
(16, 'S-401', '19', 'Special Needs', '15:47:50', '2025-10-15', '2025-10-15 10:47:49', 'Solved', '2025-10-15 11:11:56', '', '', '', 'user19', '25', 1, '2025-10-15 11:08:58', '', '00:02:58', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 11:11:56'),
(17, 'S-402', '18', 'Special Needs', '15:47:53', '2025-10-15', '2025-10-15 10:47:52', 'Solved', '2025-10-15 18:16:31', '', '', '', 'user19', '25', 18, '2025-10-15 18:16:28', '', '00:00:02', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 18:16:31'),
(18, 'P-204', '18', 'Payment Services', '15:47:56', '2025-10-15', '2025-10-15 10:47:55', 'Unattendant', '2025-10-15 18:17:42', '', '', '', 'user19', '25', 4, '2025-10-15 18:17:42', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 18:17:42'),
(19, 'E-305', 'E', 'Emirates ID Replacement', '15:48:01', '2025-10-15', '2025-10-15 10:48:00', 'Pending', '2025-10-15 10:53:51', '', '', '', NULL, '9', 1, '2025-10-15 10:53:51', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 10:53:51'),
(20, 'E-306', '19', 'Emirates ID Renewal', '15:48:06', '2025-10-15', '2025-10-15 10:48:05', 'Unattendant', '2025-10-21 10:42:02', '', '', '', 'user19', '25', 28, '2025-10-21 10:42:02', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-21 10:42:09'),
(21, 'E-307', 'E', 'Emirates ID Renewal', '15:48:09', '2025-10-15', '2025-10-15 10:48:09', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 10:48:09'),
(22, 'G-106', 'G', 'General Services', '16:13:17', '2025-10-15', '2025-10-15 11:13:17', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 11:13:17'),
(23, 'G-107', 'G', 'General Services', '16:13:42', '2025-10-15', '2025-10-15 11:13:42', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 11:13:42'),
(24, 'G-108', 'G', 'General Services', '16:14:14', '2025-10-15', '2025-10-15 11:14:13', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 11:14:13'),
(25, 'L-504', 'L', 'Labor Services', '16:25:05', '2025-10-15', '2025-10-15 11:25:04', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 11:25:04'),
(26, 'L-505', 'L', 'Labor Services', '17:02:01', '2025-10-15', '2025-10-15 12:02:01', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 12:02:01'),
(27, 'L-506', 'L', 'Labor Services', '17:02:41', '2025-10-15', '2025-10-15 12:02:40', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 12:02:40'),
(28, 'E-308', 'E', 'Emirates ID Renewal', '17:57:13', '2025-10-15', '2025-10-15 12:57:12', 'Pending', '0000-00-00 00:00:00', 'salman', 'mw951390@gmail.com', '98324798325', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 12:57:12'),
(29, 'E-309', 'E', 'Emirates ID New', '17:57:40', '2025-10-15', '2025-10-15 12:57:40', 'Pending', '0000-00-00 00:00:00', 'salman', 'mw951390@gmail.com', '98324798325', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-15 12:57:40'),
(30, 'P-201', 'P', 'Payment Services', '13:44:11', '2025-10-16', '2025-10-16 08:44:12', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-16 08:44:12'),
(31, 'G-101', 'G', 'General Services', '15:10:07', '2025-10-21', '2025-10-21 10:10:08', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-21 10:10:08'),
(32, 'P-201', 'P', 'Payment Services', '15:10:11', '2025-10-21', '2025-10-21 10:10:11', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-21 10:10:11'),
(33, 'P-202', 'P', 'Payment Services', '15:10:49', '2025-10-21', '2025-10-21 10:10:50', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-21 10:10:50'),
(34, 'P-203', 'P', 'Payment Services', '15:11:05', '2025-10-21', '2025-10-21 10:11:06', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-21 10:11:06'),
(35, 'G-102', 'G', 'General Services', '15:11:24', '2025-10-21', '2025-10-21 10:11:25', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-21 10:11:25'),
(36, 'L-501', 'L', 'Labor Services', '16:09:31', '2025-10-21', '2025-10-21 11:09:31', 'Pending', '0000-00-00 00:00:00', '', '', '', NULL, NULL, 0, '0000-00-00 00:00:00', '', '00:00:00', NULL, NULL, '0000-00-00 00:00:00', NULL, NULL, NULL, '2025-10-21 11:09:31');

-- --------------------------------------------------------

--
-- Table structure for table `tickets_display`
--

CREATE TABLE `tickets_display` (
  `id` int(11) NOT NULL,
  `username` varchar(200) NOT NULL,
  `password` varchar(200) NOT NULL,
  `device` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tickets_display`
--

INSERT INTO `tickets_display` (`id`, `username`, `password`, `device`) VALUES
(1, 'Admin', '@Qpasstech#121121', ''),
(2, 'admin1', 'admin', '');

-- --------------------------------------------------------

--
-- Table structure for table `tickets_sessions`
--

CREATE TABLE `tickets_sessions` (
  `session_id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT current_timestamp(),
  `device` varchar(50) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tickets_sessions`
--

INSERT INTO `tickets_sessions` (`session_id`, `username`, `login_time`, `device`, `active`, `token`) VALUES
(87, 'admin', '2025-11-03 11:01:32', 'web', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ticket_counters`
--

CREATE TABLE `ticket_counters` (
  `prefix` varchar(1) NOT NULL,
  `last_ticket_number` int(11) DEFAULT NULL,
  `last_reset_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ticket_counters`
--

INSERT INTO `ticket_counters` (`prefix`, `last_ticket_number`, `last_reset_date`) VALUES
('E', 300, '2025-10-21'),
('G', 102, '2025-10-21'),
('L', 501, '2025-10-21'),
('P', 203, '2025-10-21'),
('S', 400, '2025-10-21');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(250) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `role` ENUM('user', 'receptionist', 'ticket_info') DEFAULT 'user',
  `isLoggedIn` tinyint(1) DEFAULT 0,
  `lastLogin` timestamp NULL DEFAULT NULL,
  `sessionExpiry` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `users_ibfk_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`) VALUES
(9, 'user18', 'users@gmail.com', 'user18'),
(25, 'user19', 'user19@gmail.com', 'user19');

-- --------------------------------------------------------

--
-- Table structure for table `user_services`
--

CREATE TABLE `user_services` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_services`
--

INSERT INTO `user_services` (`id`, `user_id`, `service_id`) VALUES
(47, 25, 11),
(48, 9, 11),
(49, 9, 12),
(50, 9, 14),
(51, 9, 15);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `last_activity` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_username` (`username`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD KEY `idx_license_key` (`license_key`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `admin_btn_settings`
--
ALTER TABLE `admin_btn_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `all_counters`
--
ALTER TABLE `all_counters`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Counters`
--
ALTER TABLE `Counters`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `counter_display`
--
ALTER TABLE `counter_display`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `display_sessions`
--
ALTER TABLE `display_sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services_display`
--
ALTER TABLE `services_display`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services_time_restrictions`
--
ALTER TABLE `services_time_restrictions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tickets_display`
--
ALTER TABLE `tickets_display`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tickets_sessions`
--
ALTER TABLE `tickets_sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `ticket_counters`
--
ALTER TABLE `ticket_counters`
  ADD PRIMARY KEY (`prefix`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_services`
--
ALTER TABLE `user_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `admin_btn_settings`
--
ALTER TABLE `admin_btn_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `all_counters`
--
ALTER TABLE `all_counters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=342;

--
-- AUTO_INCREMENT for table `Counters`
--
ALTER TABLE `Counters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `counter_display`
--
ALTER TABLE `counter_display`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `display_sessions`
--
ALTER TABLE `display_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `services_display`
--
ALTER TABLE `services_display`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `services_time_restrictions`
--
ALTER TABLE `services_time_restrictions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `tickets_display`
--
ALTER TABLE `tickets_display`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tickets_sessions`
--
ALTER TABLE `tickets_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `user_services`
--
ALTER TABLE `user_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `user_services`
--
ALTER TABLE `user_services`
  ADD CONSTRAINT `user_services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
