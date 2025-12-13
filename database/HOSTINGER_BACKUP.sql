-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 13, 2025 at 05:59 AM
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
-- Database: `u998585094_qmanagementest`
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
  `role` enum('admin','super_admin') DEFAULT 'admin',
  `license_key` varchar(255) DEFAULT NULL,
  `license_expiry_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `total_counters` int(11) DEFAULT 5,
  `license_start_date` date DEFAULT NULL,
  `license_end_date` date DEFAULT NULL,
  `max_users` int(11) DEFAULT 10,
  `max_counters` int(11) DEFAULT 10,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `email`, `password`, `role`, `license_key`, `license_expiry_date`, `status`, `total_counters`, `license_start_date`, `license_end_date`, `max_users`, `max_counters`, `created_at`, `updated_at`) VALUES
(1, 'superadmin', 'superadmin@example.com', '$2a$10$5TJlRTTFQwWNn735CWW7ZOIrZCkel3u7/Jzd84H9WVdqxYLn9.aqm', 'super_admin', NULL, NULL, 'active', 5, NULL, NULL, 10, 10, '2025-11-25 06:20:44', '2025-12-01 08:29:08'),
(8, 'salman', 'mw951390@gmail.com', '$2a$10$xznYZ3XFxI/nLthinOZa4.4dot6YemmSD7eOshTl30yFp11UQiJUa', 'admin', 'F4F7-3104-DD46-E262', '2026-01-09', 'active', 5, NULL, NULL, 10, 10, '2025-12-01 08:41:12', '2025-12-01 08:41:12'),
(9, 'admin', 'admin@gmail.com', '$2a$10$qAO86D7rIbb/Luzf3iiNVOIVc3.QoSxAtzDj/X6KVm1UwD5PEZiVa', 'admin', '77A4-88EE-472E-D538', '2026-01-10', 'active', 5, NULL, NULL, 10, 10, '2025-12-01 11:03:53', '2025-12-01 11:03:53'),
(10, 'adminnnn', 'aaaddd@gmail.com', '$2a$10$9J.T5f.3B2NXCDTq1sMjKOlYbB3dXKrABvnHIbxzaXDltJ6SQGpz2', 'admin', 'E602-45E5-F6D1-AE88', '2025-12-09', 'active', 5, NULL, NULL, 10, 10, '2025-12-08 06:26:10', '2025-12-08 06:26:10');

-- --------------------------------------------------------

--
-- Table structure for table `admin_btn_settings`
--

CREATE TABLE `admin_btn_settings` (
  `id` int(11) NOT NULL,
  `setting_name` varchar(255) NOT NULL,
  `setting_value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_sessions`
--

CREATE TABLE `admin_sessions` (
  `session_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `token` varchar(500) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_sessions`
--

INSERT INTO `admin_sessions` (`session_id`, `admin_id`, `username`, `role`, `token`, `device_info`, `ip_address`, `login_time`, `last_activity`, `expires_at`, `active`) VALUES
(87, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyMDAyODcsImV4cCI6MTc2NTgwNTA4N30.VpXv-PiGLgiblTYj2acEJ98HtAit3vhNa5mCjIfIuu0', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-08 13:24:47', '2025-12-08 13:25:53', '2025-12-15 17:24:47', 1),
(88, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyMDA2MTIsImV4cCI6MTc2NTgwNTQxMn0.jpEZ8HcMYtTLwPSuBUkEmr363D4Z2C3W_JsRv2cSqoo', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-08 13:30:12', '2025-12-08 13:34:55', '2025-12-15 17:30:12', 1),
(89, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyMDA5MTEsImV4cCI6MTc2NTgwNTcxMX0.CzC2QksLL7V33UzINrtX9y_nE9ROv8cPZMe-L2UXqKs', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-08 13:35:11', '2025-12-08 13:37:31', '2025-12-15 17:35:11', 1),
(90, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyMDEwNzksImV4cCI6MTc2NTgwNTg3OX0.dY2vLePt52Ei7uToq4Gg7s1d73ZZ9cgl5VIeRyhjvdQ', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-08 13:37:59', '2025-12-08 13:39:20', '2025-12-15 17:37:59', 1),
(91, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyMDEyMjQsImV4cCI6MTc2NTgwNjAyNH0.23Zcl5eSrmP3GCHO5CfiI2Re7hbkWv5cZ5arA1T11Xw', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-08 13:40:25', '2025-12-09 06:14:56', '2025-12-15 17:40:24', 1),
(92, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyMDM0MDEsImV4cCI6MTc2NTgwODIwMX0.zrAOXVCiMTDYIO99liWkytuDdjY_5pTH6XgNbKys-RE', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::ffff:127.0.0.1', '2025-12-08 14:16:41', '2025-12-10 08:58:53', '2025-12-15 18:16:41', 1),
(94, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyNjA0MDUsImV4cCI6MTc2NTg2NTIwNX0.L7rOAnvTm-dpPCoIggjZ_-CkaWOaQWGvZYXh_hwcYWY', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '::1', '2025-12-09 06:06:45', '2025-12-09 06:13:24', '2025-12-16 10:06:45', 1),
(98, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyNjkyMjEsImV4cCI6MTc2NTg3NDAyMX0.GdpGEMN8qIGoAoV1jjpNey-VI4tzhfN3wvBd_Rw0Gx4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '::1', '2025-12-09 08:33:41', '2025-12-09 08:44:48', '2025-12-16 12:33:41', 1),
(99, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyNjkyNDQsImV4cCI6MTc2NTg3NDA0NH0.hPlHzECtwkfrRig-rVtDwMx7oeFD0pKyE8yUzXCWNTo', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-09 08:34:04', '2025-12-09 08:36:39', '2025-12-16 12:34:04', 1),
(100, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyNjk1MjAsImV4cCI6MTc2NTg3NDMyMH0.5uiKxA3r7uCNMF4xvJ9Hn-ajjjccXKtPQp-1c2cyfoE', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-09 08:38:39', '2025-12-09 10:18:40', '2025-12-16 12:38:40', 1),
(101, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyNjk5MDcsImV4cCI6MTc2NTg3NDcwN30.OHPyVv_Zx4E-qfvWyJn8ZvsqneFihP9ellB9zj3_w-g', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '::1', '2025-12-09 08:45:07', '2025-12-09 08:53:24', '2025-12-16 12:45:07', 1),
(103, 8, 'salman', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcm5hbWUiOiJzYWxtYW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjUyNzUxOTMsImV4cCI6MTc2NTg3OTk5M30.vOYNcnMPN9HCOGT85jtfCi8XUW8RQiQiCUJH9quS464', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '::1', '2025-12-09 10:13:13', '2025-12-09 10:50:47', '2025-12-16 14:13:13', 1),
(104, 1, 'superadmin', 'super_admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdXBlcmFkbWluIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY1Mjg2MjUwLCJleHAiOjE3NjU4OTEwNTB9.u8ivxOoxEccQgO2CGU4gNabqCAloNxra3URo0vHSMIg', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '::1', '2025-12-09 13:17:30', '2025-12-13 05:48:12', '2025-12-16 17:17:30', 1);

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

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `template` text NOT NULL,
  `voice_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Counters`
--

CREATE TABLE `Counters` (
  `id` int(11) NOT NULL,
  `counter_name` varchar(255) DEFAULT NULL,
  `current_ticket_id` varchar(200) NOT NULL DEFAULT '',
  `status` varchar(200) NOT NULL DEFAULT '',
  `counter_no` varchar(250) NOT NULL DEFAULT '',
  `user_status` varchar(250) NOT NULL DEFAULT '',
  `calling_time` int(100) NOT NULL DEFAULT 0,
  `voice` varchar(250) NOT NULL DEFAULT '',
  `language` varchar(250) NOT NULL DEFAULT '',
  `news_ticker` text NOT NULL,
  `ad_vedio` text NOT NULL,
  `is_called` tinyint(1) DEFAULT 0,
  `ticket_time` int(11) DEFAULT NULL,
  `called_time` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `admin_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `counter_display_config`
--

CREATE TABLE `counter_display_config` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `left_logo_url` varchar(255) DEFAULT NULL,
  `right_logo_url` varchar(255) DEFAULT NULL,
  `screen_type` varchar(50) DEFAULT 'horizontal',
  `content_type` varchar(50) DEFAULT 'video',
  `video_url` varchar(255) DEFAULT NULL,
  `slider_timer` int(11) DEFAULT 5,
  `ticker_content` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `counter_display_config`
--

INSERT INTO `counter_display_config` (`id`, `admin_id`, `left_logo_url`, `right_logo_url`, `screen_type`, `content_type`, `video_url`, `slider_timer`, `ticker_content`, `created_at`, `updated_at`) VALUES
(1, 8, '/uploads/1764940688547-847659974.avif', '/uploads/1764940691586-766390275.jpg', 'horizontal', 'images', '/uploads/1764941572867-207669296.mp4', 2, 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C', '2025-12-05 13:16:13', '2025-12-06 12:24:45'),
(7, 9, '', '', 'horizontal', 'video', '/uploads/1765022731985-56038764.mp4', 5, 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C', '2025-12-06 12:05:34', '2025-12-06 12:05:37');

-- --------------------------------------------------------

--
-- Table structure for table `licenses`
--

CREATE TABLE `licenses` (
  `id` int(11) NOT NULL,
  `license_key` varchar(255) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `admin_name` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_logo` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `license_type` enum('trial','basic','premium','enterprise') DEFAULT 'basic',
  `start_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `max_users` int(11) DEFAULT 10,
  `max_counters` int(11) DEFAULT 5,
  `max_services` int(11) DEFAULT 10,
  `max_sessions` int(11) DEFAULT 1,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `status` enum('active','inactive','suspended','expired') DEFAULT 'active',
  `admin_sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`admin_sections`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `max_ticket_info_users` int(11) DEFAULT 3 COMMENT 'Maximum number of ticket_info screen users allowed',
  `max_sessions_per_receptionist` int(11) DEFAULT 1 COMMENT 'Maximum concurrent sessions allowed per receptionist (1-5)',
  `max_sessions_per_ticket_info` int(11) DEFAULT 1 COMMENT 'Maximum concurrent sessions allowed per ticket_info user (1-5)',
  `max_receptionists` int(11) DEFAULT 5 COMMENT 'Maximum number of reception role users allowed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `licenses`
--

INSERT INTO `licenses` (`id`, `license_key`, `admin_id`, `admin_name`, `company_name`, `company_logo`, `phone`, `email`, `address`, `city`, `country`, `license_type`, `start_date`, `expiry_date`, `max_users`, `max_counters`, `max_services`, `max_sessions`, `features`, `status`, `admin_sections`, `created_at`, `updated_at`, `max_ticket_info_users`, `max_sessions_per_receptionist`, `max_sessions_per_ticket_info`, `max_receptionists`) VALUES
(1, 'F4F7-3104-DD46-E262', 8, 'salman', 'Web Developer', '/uploads/licenses/license-1764586749155-370925509.jpg', '03236637158', 'mw951390@gmail.com', 'street 7', 'Faisalabad Sulemanea coloni', 'Pakistan', 'basic', '2025-11-17', '2025-12-26', 8, 9, 10, 1, '[\"basic_reporting\",\"email_support\",\"ticket_management\"]', 'active', NULL, '2025-12-01 08:41:12', '2025-12-12 10:56:31', 2, 1, 1, 2),
(2, '77A4-88EE-472E-D538', 9, 'admin', 'Web Developer fhkjdaf hkfs', '/uploads/licenses/license-1764587032786-448477363.jpg', '03236637158', 'admin@gmail.com', 'street 7', 'Faisalabad Sulemanea coloni', 'Pakistan', 'basic', '2025-11-30', '2026-01-09', 3, 11, 10, 1, '[\"basic_reporting\",\"email_support\",\"ticket_management\"]', 'active', NULL, '2025-12-01 11:03:53', '2025-12-09 13:58:54', 3, 1, 1, 5),
(3, 'E602-45E5-F6D1-AE88', 10, 'adminnnn', 'Web Developer', '/uploads/licenses/license-1765175169811-875608118.png', '03236637158', 'aaaddd@gmail.com', 'street 7', 'Faisalabad Sulemanea coloni', 'Pakistan', 'basic', '2025-12-08', '2025-12-09', 1, 1, 10, 1, '[\"basic_reporting\",\"email_support\",\"ticket_management\"]', 'active', NULL, '2025-12-08 06:26:10', '2025-12-08 06:26:10', 1, 1, 1, 1);

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
  `admin_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `service_name_arabic` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `show_sub_service_popup` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `service_name`, `parent_id`, `initial_ticket`, `color`, `description`, `assigned_user_id`, `assigned_counter_id`, `admin_id`, `created_at`, `updated_at`, `service_name_arabic`, `logo_url`, `show_sub_service_popup`) VALUES
(1, 'payment', NULL, 'p', '#000000', NULL, NULL, NULL, 8, '2025-12-01 10:20:49', '2025-12-01 10:20:49', 'payment', '/uploads/services/service-1764584450265-717444113.webp', 0),
(2, 'Genreal', NULL, 'G', '#000000', NULL, NULL, NULL, 8, '2025-12-06 08:05:45', '2025-12-06 08:06:32', 'عام', '/uploads/services/service-1765008392807-312968104.png', 0),
(4, 'super testing', NULL, 'S', '#000000', NULL, NULL, NULL, 8, '2025-12-06 10:06:13', '2025-12-06 10:15:07', 'super testing', NULL, 0),
(5, 'hfkj', NULL, 'S', '#000000', NULL, NULL, NULL, 8, '2025-12-06 10:11:02', '2025-12-06 10:15:11', 'lkjdk', NULL, 0),
(6, 'kjhkj', NULL, 'D', '#000000', NULL, NULL, NULL, 8, '2025-12-06 10:15:29', '2025-12-06 10:15:29', 'jkd', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `slider_images`
--

CREATE TABLE `slider_images` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `image_name` varchar(255) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_selected` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `slider_images`
--

INSERT INTO `slider_images` (`id`, `admin_id`, `image_url`, `image_name`, `display_order`, `is_selected`, `created_at`) VALUES
(1, NULL, '/uploads/1764942109711-91942342.jpg', 'championfootballnewlogo.jpg', 2147483647, 0, '2025-12-05 13:41:48'),
(2, NULL, '/uploads/1764942112161-673664907.avif', 'image-P3D7hlNPgS52CByMDq6OOKQdYTrkx6.avif', 2147483647, 0, '2025-12-05 13:41:51'),
(3, NULL, '/uploads/1764942114397-104856447.png', 'Snapchat for Web 2025-11-28 at 6_16_34 PM.png', 2147483647, 0, '2025-12-05 13:41:53'),
(4, 1, '/uploads/1765021197619-389446289.jpg', 'championfootballnewlogo.jpg', 2147483647, 0, '2025-12-06 11:39:58'),
(5, 8, '/uploads/1765023881709-456774295.avif', 'image-P3D7hlNPgS52CByMDq6OOKQdYTrkx6.avif', 2147483647, 1, '2025-12-06 12:24:42');

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `ticket_id` varchar(255) DEFAULT NULL,
  `counter_no` varchar(250) DEFAULT NULL,
  `called_at` datetime DEFAULT NULL,
  `service_name` varchar(255) DEFAULT NULL,
  `time` time NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(200) DEFAULT NULL,
  `status_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `name` varchar(30) NOT NULL DEFAULT '',
  `email` varchar(30) NOT NULL DEFAULT '',
  `number` varchar(30) NOT NULL DEFAULT '',
  `representative` varchar(200) DEFAULT NULL,
  `caller` varchar(200) DEFAULT NULL,
  `called_by_user_id` int(11) DEFAULT NULL,
  `calling_time` int(100) NOT NULL DEFAULT 0,
  `calling_user_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `reason` text NOT NULL,
  `service_time` time NOT NULL DEFAULT '00:00:00',
  `representative_id` varchar(200) DEFAULT NULL,
  `transfered` varchar(100) DEFAULT NULL,
  `transfered_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `solved_by_counter` varchar(200) DEFAULT NULL,
  `transfer_by` varchar(200) DEFAULT NULL,
  `locked_by` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `ticket_id`, `counter_no`, `called_at`, `service_name`, `time`, `date`, `created_at`, `status`, `status_time`, `name`, `email`, `number`, `representative`, `caller`, `called_by_user_id`, `calling_time`, `calling_user_time`, `reason`, `service_time`, `representative_id`, `transfered`, `transfered_time`, `solved_by_counter`, `transfer_by`, `locked_by`, `user_id`, `admin_id`, `last_updated`) VALUES
(94, 'p-14', '2', NULL, 'payment', '11:03:50', '2025-12-03', '2025-12-03 11:03:50', 'Unattended', '2025-12-03 11:04:53', '', '', '', 'user13', 'user13', NULL, 0, '2025-12-03 11:04:33', '', '00:00:00', '5', NULL, '2025-12-03 11:03:50', NULL, NULL, NULL, 2, 8, '2025-12-03 11:04:53'),
(95, 'p-15', '4', NULL, 'payment', '11:03:59', '2025-12-03', '2025-12-03 11:03:59', 'Unattended', '2025-12-03 11:05:23', '', '', '', 'user12', 'user12', NULL, 0, '2025-12-03 11:05:13', '', '00:00:00', '1', NULL, '2025-12-03 11:03:59', NULL, NULL, NULL, 2, 8, '2025-12-03 11:05:23'),
(96, 'p-16', 'p', NULL, 'payment', '11:15:38', '2025-12-03', '2025-12-03 11:15:38', 'Solved', '2025-12-03 11:15:48', '', '', '', 'user12', 'user12', NULL, 0, '2025-12-03 11:15:38', '', '00:00:00', '1', NULL, '2025-12-03 11:15:38', NULL, NULL, NULL, 2, 8, '2025-12-03 12:14:09'),
(97, 'p-17', '4', NULL, 'payment', '11:23:00', '2025-12-03', '2025-12-03 11:23:00', 'Unattended', '2025-12-03 11:23:29', '', '', '', 'user12', 'user12', NULL, 0, '2025-12-03 11:23:24', '', '00:00:00', '1', NULL, '2025-12-03 11:23:00', NULL, NULL, NULL, 2, 8, '2025-12-03 11:23:29'),
(98, 'p-18', '4', NULL, 'payment', '11:23:07', '2025-12-03', '2025-12-03 11:23:07', 'Not Solved', '2025-12-03 11:26:19', '', '', '', 'user12', 'user12', NULL, 0, '2025-12-03 11:26:07', 'jfel', '00:00:00', '1', NULL, '2025-12-03 11:23:07', NULL, NULL, NULL, 2, 8, '2025-12-03 11:26:19'),
(99, 'p-19', '2', NULL, 'payment', '11:26:50', '2025-12-03', '2025-12-03 11:26:50', 'Solved', '2025-12-03 11:43:08', '', '', '', 'user13', 'user13', NULL, 0, '2025-12-03 11:42:55', 'Transferred to user13', '00:00:00', '5', 'user13', '2025-12-03 11:27:15', NULL, 'user12', NULL, 2, 8, '2025-12-03 11:43:08'),
(100, 'p-20', '2', NULL, 'payment', '11:26:56', '2025-12-03', '2025-12-03 11:26:56', 'Solved', '2025-12-03 11:54:45', '', '', '', 'user13', 'user13', NULL, 2, '2025-12-03 11:54:22', 'Transferred to user13', '00:00:17', '5', 'user13', '2025-12-03 11:40:17', NULL, 'user12', NULL, 2, 8, '2025-12-03 11:54:45'),
(101, 'p-21', '3', NULL, 'payment', '11:27:01', '2025-12-03', '2025-12-03 11:27:01', 'Solved', '2025-12-03 11:50:54', '', '', '', 'user13', 'user13', NULL, 0, '2025-12-03 11:42:20', 'Transferred to user13', '00:00:04', '5', 'user13', '2025-12-03 11:50:29', NULL, 'user12', NULL, 2, 8, '2025-12-03 12:19:03'),
(102, 'p-22', '2', NULL, 'payment', '11:27:08', '2025-12-03', '2025-12-03 11:27:08', 'Solved', '2025-12-03 11:51:43', '', '', '', 'user13', 'user13', NULL, 1, '2025-12-03 11:51:18', '', '00:00:05', '5', NULL, '2025-12-03 11:27:08', NULL, NULL, NULL, 2, 8, '2025-12-03 11:51:43'),
(103, 'p-23', '4', NULL, 'payment', '11:40:07', '2025-12-03', '2025-12-03 11:40:07', 'Solved', '2025-12-03 12:05:22', '', '', '', 'user13', 'user13', NULL, 1, '2025-12-03 11:55:55', '', '00:00:01', '5', NULL, '2025-12-03 11:40:07', NULL, NULL, NULL, 2, 8, '2025-12-03 12:16:11'),
(104, 'p-24', '3', '2025-12-05 06:46:32', 'payment', '12:03:09', '2025-12-03', '2025-12-03 12:03:09', 'Unattended', '2025-12-05 07:17:16', '', '', '', 'user13', 'user13', NULL, 15, '2025-12-05 06:47:38', '', '00:00:00', '5', NULL, '2025-12-03 12:03:09', NULL, NULL, NULL, 2, 8, '2025-12-05 07:17:16'),
(105, 'p-25', '2', NULL, 'payment', '12:03:15', '2025-12-03', '2025-12-03 12:03:15', 'Solved', '2025-12-03 12:07:19', '', '', '', 'user13', 'user13', NULL, 2, '2025-12-03 12:07:09', 'Transferred to user13', '00:00:03', '5', 'user13', '2025-12-03 12:06:42', NULL, 'user12', NULL, 2, 8, '2025-12-03 12:07:19'),
(106, 'p-26', '2', NULL, 'payment', '12:03:21', '2025-12-03', '2025-12-03 12:03:21', 'Unattended', '2025-12-04 11:32:43', '', '', '', 'user12', 'user12', NULL, 6, '2025-12-04 11:32:22', '', '00:00:00', '1', NULL, '2025-12-03 12:03:21', NULL, NULL, NULL, 2, 8, '2025-12-04 11:32:43'),
(107, 'p-27', '2', NULL, 'payment', '12:03:27', '2025-12-03', '2025-12-03 12:03:27', 'Not Solved', '2025-12-03 12:05:43', '', '', '', 'user13', 'user13', NULL, 1, '2025-12-03 12:05:33', 'fdgfdg', '00:00:04', '5', NULL, '2025-12-03 12:03:27', NULL, NULL, NULL, 2, 8, '2025-12-03 12:05:43'),
(108, 'p-28', '2', NULL, 'payment', '12:03:33', '2025-12-03', '2025-12-03 12:03:33', 'Unattended', '2025-12-05 07:13:26', '', '', '', 'user12', 'user12', NULL, 29, '2025-12-04 12:49:20', '', '00:00:00', '1', NULL, '2025-12-03 12:03:33', NULL, NULL, NULL, 2, 8, '2025-12-05 07:13:26'),
(109, 'p-29', NULL, '2025-12-08 13:43:44', 'payment', '12:03:38', '2025-12-03', '2025-12-03 12:03:38', 'Unattended', '2025-12-08 13:43:49', '', '', '', 'user12', 'user12', NULL, 17, '2025-12-08 13:43:44', '', '00:00:00', '1', NULL, '2025-12-03 12:03:38', NULL, NULL, NULL, 2, 8, '2025-12-08 13:43:49'),
(110, 'p-1', '5', '2025-12-05 13:45:32', 'payment', '08:35:31', '2025-12-04', '2025-12-04 08:35:31', 'called', '2025-12-05 13:45:32', '', '', '', 'user13', 'user13', NULL, 17, '2025-12-05 13:45:32', '', '00:00:00', '5', NULL, '2025-12-04 08:35:31', NULL, NULL, NULL, 2, 8, '2025-12-05 13:45:32'),
(111, 'G-1', '4', '2025-12-09 06:03:14', 'Genreal', '18:05:00', '2025-12-08', '2025-12-08 13:05:00', 'Unattended', '2025-12-09 06:04:04', '', '', '', 'user12', 'user12', NULL, 15, '2025-12-09 06:03:14', '', '00:00:00', '1', NULL, '2025-12-08 13:05:00', NULL, NULL, NULL, 2, 8, '2025-12-09 06:04:04'),
(112, 'G-2', '5', '2025-12-09 06:45:20', 'Genreal', '18:05:04', '2025-12-08', '2025-12-08 13:05:04', 'Solved', '2025-12-09 06:45:30', '', '', '', 'user12', 'user12', NULL, 2, '2025-12-09 06:45:20', '', '00:00:01', '1', NULL, '2025-12-08 13:05:04', NULL, NULL, NULL, 2, 8, '2025-12-09 06:45:30'),
(113, 'G-3', '1', '2025-12-09 08:45:39', 'Genreal', '18:05:08', '2025-12-08', '2025-12-08 13:05:09', 'Unattended', '2025-12-09 08:45:50', '', '', '', 'user12', 'user12', NULL, 1, '2025-12-09 08:45:39', '', '00:00:00', '1', NULL, '2025-12-08 13:05:09', NULL, NULL, NULL, 2, 8, '2025-12-09 08:45:50'),
(114, 'G-4', '4', '2025-12-09 12:22:56', 'Genreal', '18:42:43', '2025-12-08', '2025-12-08 13:42:43', 'called', '2025-12-09 12:22:56', '', '', '', 'user12', 'user12', NULL, 3, '2025-12-09 12:22:56', '', '00:00:00', '1', NULL, '2025-12-08 13:42:43', NULL, NULL, NULL, 2, 8, '2025-12-09 12:22:56');

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
('G', 4, '2025-12-08'),
('p', 1, '2025-12-04');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(250) NOT NULL,
  `role` enum('user','receptionist','ticket_info','admin','super_admin') DEFAULT 'user',
  `admin_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `admin_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'user12', 'user12@gmail.com', '$2a$10$Dcbxsnyoukbf.CXDcYyIdeGvc6e3nTgS1HJpivQLT4FhuN0.NXaT2', 'user', 8, 'active', '2025-12-01 08:42:29', '2025-12-04 07:48:51'),
(2, 'recepnilist', 'recepnilist@gmail.com', '$2a$10$VYPIsEfX1swL0xTDegy2yOlfl8ujjJWXogyXNo8vk5L8Qx7wd4BIa', 'receptionist', 8, 'active', '2025-12-01 08:57:21', '2025-12-06 06:15:01'),
(5, 'user13', 'user13@gmail.com', '$2a$10$ZzXALyu8DRQJrIzK5E2g4e2BqONYN85uj/XfEf7Fq7fYPilgoNxEW', 'user', 8, 'active', '2025-12-01 12:42:02', '2025-12-01 12:42:02'),
(6, 'recee', 'recee@gmail.com', '$2a$10$Uam.2daje1Lj9xp889iWdeXS3YC73Rdr11QLcvgATyrnYkDwuEGn.', 'receptionist', 8, 'active', '2025-12-01 13:51:44', '2025-12-01 13:52:09'),
(7, 'receptonnn', 'receptonnn@gmail.com', '$2a$10$XiyjN/KIXohEGqzjt40eFeV5R2PZoO.fgYeMFrLrWO.nFlvWmAqPG', 'ticket_info', 8, 'active', '2025-12-08 07:36:20', '2025-12-08 11:57:56'),
(9, 'ssssss', 'ssssss@gmail.com', '$2a$10$lzfSK.6lyNgh7qRSY1v.q.bt1eAhCOaAFXi/PuNCjPihsGFGYBuRO', 'ticket_info', 8, 'active', '2025-12-08 08:46:26', '2025-12-08 11:57:56'),
(13, 'user133', 'user133@gmail.com', '$2a$10$F00cfDSuKXhW1Ctog7j5ee4STEiMStmoom3il92x2DwF9XGZ2v4ae', 'user', 8, 'active', '2025-12-09 13:59:11', '2025-12-09 13:59:11'),
(14, 'user1333', 'user1333@gmail.com', '$2a$10$ykBiRcRTvMLvClUF5ldw7ONYzTZTPbtMGnX8ib0nfwtOjQ00un/6W', 'user', 8, 'active', '2025-12-09 13:59:29', '2025-12-09 13:59:29'),
(15, 'user13333', 'user13333@gmail.com', '$2a$10$1.tNU0NZhQQCnVyixFsrFe9/PYU9Izoc3JUa5ffZ6PsVzV/QDlMKO', 'user', 8, 'active', '2025-12-09 13:59:52', '2025-12-09 13:59:52'),
(16, 'user133333', 'user133333@gmail.com', '$2a$10$uOJLvWMN/w7JSW1R3j7Nv.18OoPDf7e.PqlIZ/bD71vRomVOMM9lG', 'user', 8, 'active', '2025-12-09 14:00:55', '2025-12-09 14:00:55'),
(17, 'user1333333', 'user1333333@gmail.com', '$2a$10$FG5O3MNOh9K3uYHjCADaYusiZY5hYnxREs8MO13UFTeRsjK4IYkzy', 'user', 8, 'active', '2025-12-09 14:01:22', '2025-12-09 14:01:22'),
(18, 'user122', 'user122@gmail.com', '$2a$10$k4bJ4hYWb777zt.xLHFo3OhdrGJDqgnIuZzd3oETdzuR69N078ER6', 'user', 8, 'active', '2025-12-09 14:04:47', '2025-12-09 14:04:47'),
(19, 'user1222', 'user1222@gmail.com', '$2a$10$R9jv9Jq12zg1xvg9Qu.nU.Vta9tDdHXtAq7F.btYBV0.fL1e25/SK', 'user', 8, 'active', '2025-12-09 14:09:59', '2025-12-09 14:09:59');

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
(14, 6, 1),
(15, 5, 2),
(16, 1, 6),
(17, 1, 5),
(18, 1, 4),
(19, 1, 2),
(20, 1, 1),
(21, 2, 6),
(22, 2, 5),
(23, 2, 4),
(24, 2, 2),
(25, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `counter_no` varchar(250) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `token` varchar(500) NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`session_id`, `user_id`, `username`, `email`, `counter_no`, `admin_id`, `token`, `device_id`, `device_info`, `ip_address`, `login_time`, `last_activity`, `created_at`, `expires_at`, `active`, `is_active`) VALUES
(203, 9, 'ssssss', 'ssssss@gmail.com', NULL, 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwidXNlcm5hbWUiOiJzc3Nzc3MiLCJyb2xlIjoidGlja2V0X2luZm8iLCJhZG1pbl9pZCI6OCwiaWF0IjoxNzY1Mjg2Njk5LCJleHAiOjE3NjU4OTE0OTl9.34VCFYh0lTtLXi8MY3rN0LF37qtYrz7LwNpEqk0Tx6Q', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '::1', '2025-12-09 13:24:59', '2025-12-12 11:20:00', '2025-12-09 13:24:59', '2025-12-16 17:24:59', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `voices`
--

CREATE TABLE `voices` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `voice_name` varchar(255) DEFAULT NULL,
  `rate` decimal(3,2) DEFAULT 0.90,
  `pitch` decimal(3,2) DEFAULT 1.00,
  `language` varchar(50) DEFAULT 'en-US',
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `duration` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `voice_type` varchar(50) DEFAULT 'Custom'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `voices`
--

INSERT INTO `voices` (`id`, `name`, `description`, `voice_name`, `rate`, `pitch`, `language`, `file_path`, `file_name`, `duration`, `is_active`, `created_at`, `updated_at`, `voice_type`) VALUES
(1, 'salman', 'fj', NULL, 0.90, 1.00, 'en-US', '/uploads/voices/voice-1764838308558-610509109.mp3', 'voice-1764838308558-610509109.mp3', NULL, 1, '2025-12-04 08:51:48', '2025-12-04 08:51:48', 'Custom'),
(3, 'ds', 'fldsk;f', NULL, 0.90, 1.00, 'English', '/uploads/voices/voice-1764842890890-162869446.mp3', '', NULL, 1, '2025-12-04 10:08:10', '2025-12-04 10:08:10', 'Male');

-- --------------------------------------------------------

--
-- Table structure for table `voice_settings`
--

CREATE TABLE `voice_settings` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `voice_type` varchar(50) DEFAULT 'default',
  `language` varchar(10) DEFAULT 'en',
  `languages` text DEFAULT NULL COMMENT 'JSON array of selected languages (max 2)',
  `second_language` varchar(10) DEFAULT 'ur',
  `custom_text_lang1` text DEFAULT NULL,
  `custom_text_lang2` text DEFAULT NULL,
  `speech_rate` decimal(3,2) DEFAULT 0.90,
  `speech_pitch` decimal(3,2) DEFAULT 1.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `voice_settings`
--

INSERT INTO `voice_settings` (`id`, `admin_id`, `voice_type`, `language`, `languages`, `second_language`, `custom_text_lang1`, `custom_text_lang2`, `speech_rate`, `speech_pitch`, `is_active`, `created_at`, `updated_at`) VALUES
(7, 9, 'default', 'en', '[\"en\",\"ar-ae\"]', 'ur', NULL, NULL, 0.90, 1.00, 1, '2025-12-06 12:22:59', '2025-12-06 12:22:59'),
(8, 8, 'male', 'en', '[\"en\",\"ar-ae\"]', 'ur', NULL, NULL, 0.90, 1.00, 1, '2025-12-06 12:24:01', '2025-12-06 12:24:01');

-- --------------------------------------------------------

--
-- Table structure for table `voice_settings_old_backup`
--

CREATE TABLE `voice_settings_old_backup` (
  `id` int(11) NOT NULL,
  `setting_name` varchar(100) NOT NULL,
  `voice_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `voice_settings_old_backup`
--

INSERT INTO `voice_settings_old_backup` (`id`, `setting_name`, `voice_id`, `created_at`, `updated_at`) VALUES
(1, 'default_ticket_announcement', 1, '2025-12-04 08:51:30', '2025-12-04 08:54:32');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin_btn_settings`
--
ALTER TABLE `admin_btn_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `token` (`token`(255)),
  ADD KEY `active` (`active`);

--
-- Indexes for table `all_counters`
--
ALTER TABLE `all_counters`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voice_id` (`voice_id`);

--
-- Indexes for table `Counters`
--
ALTER TABLE `Counters`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `counter_display_config`
--
ALTER TABLE `counter_display_config`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_counter_display_admin_id` (`admin_id`);

--
-- Indexes for table `licenses`
--
ALTER TABLE `licenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_license_key` (`license_key`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_expiry_date` (`expiry_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_license_type` (`license_type`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_id` (`admin_id`);

--
-- Indexes for table `slider_images`
--
ALTER TABLE `slider_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_slider_images_admin_id` (`admin_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_admin_id` (`admin_id`);

--
-- Indexes for table `ticket_counters`
--
ALTER TABLE `ticket_counters`
  ADD PRIMARY KEY (`prefix`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD UNIQUE KEY `unique_username` (`username`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_role` (`role`);

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
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_token` (`token`(255)),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `voices`
--
ALTER TABLE `voices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_voices_active` (`is_active`);

--
-- Indexes for table `voice_settings`
--
ALTER TABLE `voice_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `voice_settings_old_backup`
--
ALTER TABLE `voice_settings_old_backup`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_name` (`setting_name`),
  ADD KEY `voice_id` (`voice_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `admin_btn_settings`
--
ALTER TABLE `admin_btn_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT for table `all_counters`
--
ALTER TABLE `all_counters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Counters`
--
ALTER TABLE `Counters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `counter_display_config`
--
ALTER TABLE `counter_display_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `licenses`
--
ALTER TABLE `licenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `slider_images`
--
ALTER TABLE `slider_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user_services`
--
ALTER TABLE `user_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=204;

--
-- AUTO_INCREMENT for table `voices`
--
ALTER TABLE `voices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `voice_settings`
--
ALTER TABLE `voice_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `voice_settings_old_backup`
--
ALTER TABLE `voice_settings_old_backup`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`voice_id`) REFERENCES `voices` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `counter_display_config`
--
ALTER TABLE `counter_display_config`
  ADD CONSTRAINT `fk_counter_display_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `licenses`
--
ALTER TABLE `licenses`
  ADD CONSTRAINT `licenses_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `slider_images`
--
ALTER TABLE `slider_images`
  ADD CONSTRAINT `fk_slider_images_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `voice_settings`
--
ALTER TABLE `voice_settings`
  ADD CONSTRAINT `fk_voice_settings_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `voice_settings_old_backup`
--
ALTER TABLE `voice_settings_old_backup`
  ADD CONSTRAINT `voice_settings_old_backup_ibfk_1` FOREIGN KEY (`voice_id`) REFERENCES `voices` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
