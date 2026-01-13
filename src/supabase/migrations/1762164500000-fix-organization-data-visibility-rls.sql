/*
# Fix Data Visibility and Team Management Security

This migration addresses critical data visibility issues for organizations and corrects a significant security flaw in team management permissions.

## 1. Problem
- **Data Visibility**: Organization dashboards were not displaying services, bookings, or team members due to overly restrictive or conflicting RLS policies preventing successful joins.
- **Security Flaw**: The previous version of this migration introduced a policy that incorrectly granted ALL team members full administrative permissions over the `team_members` table, allowing any member to add, update, or delete other members in their organization.

## 2. Solution
This migration consolidates and corrects `SELECT` policies for data visibility and replaces the flawed team management policy with a more secure, role-based approach.

### Policy Changes:
1.  **On `team_members` table (Security Fix)**:
    *   The single, overly permissive `FOR ALL` policy is removed.
    *   **New `SELECT` Policy**: A policy is established to allow all members of an organization to view their colleagues.
    *   **New `INSERT`/`UPDATE`/`DELETE` Policies**: Management permissions (adding, updating, or removing members) are now restricted to users who are either the organization owner (role: `organization`) or have a `manager` role within the `team_members` table.

2.  **On `profiles` table (Data Visibility Fix)**:
    *   Existing policies are streamlined to allow viewing profiles of colleagues and customers (from bookings or rentals), which is necessary for the dashboard to display related user information correctly.

## 3. Security Impact
- The critical security vulnerability that allowed any team member to manage the team is **resolved**.
- Permissions now follow the principle of least privilege: team members can view, while only designated managers and owners can administrate.
- The necessary read access for dashboard features is granted without exposing unrelated data.
*/

-- Step 1: Securely re-implement policies for the `team_members` table.
-- Drop all potentially conflicting old policies first to ensure a clean slate.
DROP POLICY IF EXISTS "Org members can view their team" ON public.team_members;
DROP POLICY IF EXISTS "Org managers can manage their team" ON public.team_members;
DROP POLICY IF EXISTS "Org members can fully manage their team" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their colleagues" ON public.team_members;
DROP POLICY IF EXISTS "Admins and managers can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view colleagues" ON public.team_members;
DROP POLICY IF EXISTS "Admins and managers can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins and managers can modify team members" ON public.team_members;


-- Policy 1: Any authenticated user who is part of an organization can SEE the members of that organization.
CREATE POLICY "Team members can view colleagues" ON public.team_members
    FOR SELECT
    USING (organization_id = get_user_organization_id(auth.uid()));

-- Policy 2: Org owners or managers can ADD new members to their own organization.
CREATE POLICY "Admins and managers can add team members" ON public.team_members
    FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id(auth.uid())
        AND (
            get_user_role(auth.uid()) = 'organization'
            OR
            EXISTS (
                SELECT 1 FROM public.team_members
                WHERE user_id = auth.uid()
                  AND role = 'manager'
                  AND organization_id = get_user_organization_id(auth.uid())
            )
        )
    );

-- Policy 3: Org owners or managers can UPDATE or DELETE members from their own organization.
CREATE POLICY "Admins and managers can modify team members" ON public.team_members
    FOR UPDATE, DELETE
    USING (
        organization_id = get_user_organization_id(auth.uid())
        AND (
            get_user_role(auth.uid()) = 'organization'
            OR
            EXISTS (
                SELECT 1 FROM public.team_members
                WHERE user_id = auth.uid()
                  AND role = 'manager'
                  AND organization_id = get_user_organization_id(auth.uid())
            )
        )
    );


-- Step 2: Clean up and fix policies on the `profiles` table for data visibility.
-- Drop potentially conflicting old policies first.
DROP POLICY IF EXISTS "Team members can view colleague profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view profiles of their colleagues" ON public.profiles;
DROP POLICY IF EXISTS "Orgs can view colleague profiles" ON public.profiles;

-- Policy to view profiles of colleagues within the same organization.
CREATE POLICY "Orgs can view colleague profiles" ON public.profiles
    FOR SELECT
    USING (
        profiles.organization_id IS NOT NULL AND
        profiles.organization_id = get_user_organization_id(auth.uid())
    );

-- Policy to view profiles of customers (from bookings or rentals).
DROP POLICY IF EXISTS "Orgs can view profiles of their customers (bookings)" ON public.profiles;
DROP POLICY IF EXISTS "Orgs can view profiles of their customers (rentals)" ON public.profiles;
DROP POLICY IF EXISTS "Orgs can view customer profiles" ON public.profiles;

CREATE POLICY "Orgs can view customer profiles" ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.service_bookings sb
            WHERE sb.parent_id = profiles.id AND sb.org_id = get_user_organization_id(auth.uid())
        )
        OR
        EXISTS (
            SELECT 1 FROM public.equipment_rentals er
            JOIN public.equipment e ON er.equipment_id = e.id
            WHERE er.parent_id = profiles.id AND e.organization_id = get_user_organization_id(auth.uid())
        )
    );