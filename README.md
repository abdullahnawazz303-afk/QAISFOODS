# Lentil Factory Operations & Financial Credit Management System (LFO-FCMS)

## Purpose
The Lentil Factory Operations & Financial Credit Management System (LFO-FCMS) is a comprehensive, centralized software solution designed to digitize, formalize, and optimize the end-to-end operations of a lentil manufacturing and processing factory. The primary goal is to replace manual processes, reduce errors, improve transparency, and provide real-time visibility into the factory's inventory, sales, and financial activities.

## Project Needs
A lentil factory operates with numerous moving parts: raw material procurement, processing, packaging, complex financial tracking, and relationship management with both vendors and customers. Managing these aspects manually or through disconnected tools leads to inefficiencies, data discrepancies, and poor financial control.

This software addresses these needs by providing a unified ERP (Enterprise Resource Planning) platform tailored specifically to the lentil production industry. It requires a robust frontend for user interaction (dashboard/portals) and a secure, scalable backend (Supabase) to handle data storage, authentication, and real-time syncing.

## Core Functionalities

### 1. Inventory & Production Management
*   **Raw Material Tracking:** Managing the procurement and stock levels of unprocessed lentils.
*   **Processing & Packaging:** Tracking the transformation of raw materials into finished products.
*   **Waste Management:** Monitoring and optimizing the waste or by-products generated during processing.

### 2. Financial & Credit Management (FCMS)
*   **Cash Flow (Rokar):** Daily cash book tracking for in/out transactions.
*   **Bank & Cheques Management:** Logging bank deposits, withdrawals, and tracking the status of post-dated or cleared cheques.
*   **Vendor Payables:** Tracking amounts owed to suppliers for raw materials and services.
*   **General Ledgers:** Detailed, segregated ledgers for individual vendors and customers to track credits, debits, and running balances.

### 3. Sales & Order Management
*   **Sales Tracking:** Recording B2B and wholesale transactions.
*   **Advance Bookings:** Managing pre-orders and advance payments from clients.
*   **Online Orders:** Processing orders placed through web portals or digital channels.

### 4. CRM & Portals
*   **Customer & Vendor Profiles:** Centralized database of all trading partners.
*   **Customer Portal:** A dedicated, restricted-access area where designated customers can view their ledgers, outstanding balances, and order history.
*   **Role-Based Access Control:** Distinct dashboard views based on user roles (e.g., Administrator, Staff, Customer).

### 5. Reporting & Analytics
*   **Dashboard:** Real-time metrics and KPIs summarizing factory performance, outstanding debts, and inventory levels.
*   **Comprehensive Reports:** Generation of data summaries for auditing and strategic decision-making.

## Technology Stack
*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn-ui, Zustand (State Management), React Query.
*   **Backend:** Supabase (PostgreSQL, Authentication, Row Level Security).
