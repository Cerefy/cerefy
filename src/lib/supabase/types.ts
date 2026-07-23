export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      org_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      finance_invoices: {
        Row: {
          id: string;
          organization_id: string;
          invoice_number: string;
          customer_name: string;
          amount: number;
          status: string;
          due_date: string;
          issued_date: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          invoice_number: string;
          customer_name: string;
          amount: number;
          status?: string;
          due_date: string;
          issued_date?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          invoice_number?: string;
          customer_name?: string;
          amount?: number;
          status?: string;
          due_date?: string;
          issued_date?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finance_invoices_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      finance_budgets: {
        Row: {
          id: string;
          organization_id: string;
          department: string;
          category: string;
          allocated: number;
          spent: number;
          period: string;
          fiscal_year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          department: string;
          category: string;
          allocated: number;
          spent?: number;
          period: string;
          fiscal_year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          department?: string;
          category?: string;
          allocated?: number;
          spent?: number;
          period?: string;
          fiscal_year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finance_budgets_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      finance_transactions: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          category: string;
          amount: number;
          description: string | null;
          transaction_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          category: string;
          amount: number;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: string;
          category?: string;
          amount?: number;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finance_transactions_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_customers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          status: string;
          lifetime_value: number;
          last_contacted: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: string;
          lifetime_value?: number;
          last_contacted?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: string;
          lifetime_value?: number;
          last_contacted?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_customers_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_leads: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          source: string | null;
          status: string;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_leads_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_deals: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          value: number;
          stage: string;
          probability: number;
          close_date: string | null;
          customer_id: string | null;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          value: number;
          stage?: string;
          probability?: number;
          close_date?: string | null;
          customer_id?: string | null;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          value?: number;
          stage?: string;
          probability?: number;
          close_date?: string | null;
          customer_id?: string | null;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_deals_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_deals_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "crm_customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_deals_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_activities: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          subject: string;
          description: string | null;
          related_to: string | null;
          related_id: string | null;
          performed_by: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          subject: string;
          description?: string | null;
          related_to?: string | null;
          related_id?: string | null;
          performed_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: string;
          subject?: string;
          description?: string | null;
          related_to?: string | null;
          related_id?: string | null;
          performed_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_activities_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_performed_by_fkey";
            columns: ["performed_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_orders: {
        Row: {
          id: string;
          organization_id: string;
          order_number: string;
          customer_id: string | null;
          total: number;
          status: string;
          order_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          order_number: string;
          customer_id?: string | null;
          total: number;
          status?: string;
          order_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          order_number?: string;
          customer_id?: string | null;
          total?: number;
          status?: string;
          order_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_orders_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "crm_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_products: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          sku: string;
          price: number;
          cost: number | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          sku: string;
          price: number;
          cost?: number | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          sku?: string;
          price?: number;
          cost?: number | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_products_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_employees: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          position: string;
          department_id: string | null;
          salary: number;
          hire_date: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          position: string;
          department_id?: string | null;
          salary: number;
          hire_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          position?: string;
          department_id?: string | null;
          salary?: number;
          hire_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_employees_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_employees_department_id_fkey";
            columns: ["department_id"];
            referencedRelation: "hr_departments";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_departments: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          head_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          head_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          head_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_departments_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_departments_head_id_fkey";
            columns: ["head_id"];
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_payroll: {
        Row: {
          id: string;
          organization_id: string;
          employee_id: string;
          salary: number;
          bonuses: number;
          deductions: number;
          pay_period_start: string;
          pay_period_end: string;
          status: string;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          employee_id: string;
          salary: number;
          bonuses?: number;
          deductions?: number;
          pay_period_start: string;
          pay_period_end: string;
          status?: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          employee_id?: string;
          salary?: number;
          bonuses?: number;
          deductions?: number;
          pay_period_start?: string;
          pay_period_end?: string;
          status?: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_payroll_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_payroll_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      projects_projects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          status: string;
          priority: string;
          start_date: string | null;
          end_date: string | null;
          owner_id: string | null;
          budget: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          status?: string;
          priority?: string;
          start_date?: string | null;
          end_date?: string | null;
          owner_id?: string | null;
          budget?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          start_date?: string | null;
          end_date?: string | null;
          owner_id?: string | null;
          budget?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_projects_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_projects_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects_tasks: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          assignee_id: string | null;
          due_date: string | null;
          estimated_hours: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_tasks_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_tasks_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_warehouses: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          location: string | null;
          capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          location?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          location?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_warehouses_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_suppliers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_suppliers_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_products: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          sku: string;
          category: string | null;
          unit_price: number;
          quantity: number;
          reorder_level: number;
          warehouse_id: string | null;
          supplier_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          sku: string;
          category?: string | null;
          unit_price: number;
          quantity?: number;
          reorder_level?: number;
          warehouse_id?: string | null;
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          sku?: string;
          category?: string | null;
          unit_price?: number;
          quantity?: number;
          reorder_level?: number;
          warehouse_id?: string | null;
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_products_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_products_warehouse_id_fkey";
            columns: ["warehouse_id"];
            referencedRelation: "inventory_warehouses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_products_supplier_id_fkey";
            columns: ["supplier_id"];
            referencedRelation: "inventory_suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          file_url: string | null;
          file_type: string | null;
          size_bytes: number | null;
          tags: string[] | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          file_url?: string | null;
          file_type?: string | null;
          size_bytes?: number | null;
          tags?: string[] | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          file_url?: string | null;
          file_type?: string | null;
          size_bytes?: number | null;
          tags?: string[] | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          title: string;
          message: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboards: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          config: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          config?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          config?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dashboards_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboards_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      data_sources: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: string;
          config: Json;
          enabled: boolean;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type: string;
          config?: Json;
          enabled?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          type?: string;
          config?: Json;
          enabled?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "data_sources_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      imported_datasets: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          original_filename: string | null;
          columns: Json;
          rows: Json;
          row_count: number;
          status: string;
          mapped_table: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          original_filename?: string | null;
          columns?: Json;
          rows?: Json;
          row_count?: number;
          status?: string;
          mapped_table?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          original_filename?: string | null;
          columns?: Json;
          rows?: Json;
          row_count?: number;
          status?: string;
          mapped_table?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "imported_datasets_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      import_mappings: {
        Row: {
          id: string;
          organization_id: string;
          dataset_id: string | null;
          name: string;
          source_columns: Json;
          target_table: string;
          column_mapping: Json;
          transform_rules: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          dataset_id?: string | null;
          name: string;
          source_columns?: Json;
          target_table: string;
          column_mapping?: Json;
          transform_rules?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          dataset_id?: string | null;
          name?: string;
          source_columns?: Json;
          target_table?: string;
          column_mapping?: Json;
          transform_rules?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_mappings_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_mappings_dataset_id_fkey";
            columns: ["dataset_id"];
            referencedRelation: "imported_datasets";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          is_default: boolean;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          is_default?: boolean;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          is_default?: boolean;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_configs: {
        Row: {
          id: string;
          workspace_id: string;
          agent_role: string;
          display_name: string;
          description: string | null;
          is_enabled: boolean;
          model: string | null;
          temperature: number | null;
          max_tokens: number | null;
          config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          agent_role: string;
          display_name: string;
          description?: string | null;
          is_enabled?: boolean;
          model?: string | null;
          temperature?: number | null;
          max_tokens?: number | null;
          config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          agent_role?: string;
          display_name?: string;
          description?: string | null;
          is_enabled?: boolean;
          model?: string | null;
          temperature?: number | null;
          max_tokens?: number | null;
          config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_executions: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          session_id: string | null;
          agent_role: string | null;
          input_text: string | null;
          output_text: string | null;
          status: string;
          duration_ms: number | null;
          steps: Json | null;
          error: string | null;
          tokens_used: number | null;
          cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          session_id?: string | null;
          agent_role?: string | null;
          input_text?: string | null;
          output_text?: string | null;
          status?: string;
          duration_ms?: number | null;
          steps?: Json | null;
          error?: string | null;
          tokens_used?: number | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          session_id?: string | null;
          agent_role?: string | null;
          input_text?: string | null;
          output_text?: string | null;
          status?: string;
          duration_ms?: number | null;
          steps?: Json | null;
          error?: string | null;
          tokens_used?: number | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      company_memory: {
        Row: {
          id: string;
          organization_id: string;
          key: string;
          value: string;
          category: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          key: string;
          value: string;
          category?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          key?: string;
          value?: string;
          category?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          organization_id: string;
          workspace_id: string | null;
          title: string;
          description: string | null;
          status: string;
          priority: string | null;
          assigned_agents: string[] | null;
          result: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          workspace_id?: string | null;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string | null;
          assigned_agents?: string[] | null;
          result?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          workspace_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string | null;
          assigned_agents?: string[] | null;
          result?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          currency: string;
          max_users: number;
          max_agents: number;
          max_tasks_per_month: number;
          features: Json | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          currency?: string;
          max_users?: number;
          max_agents?: number;
          max_tasks_per_month?: number;
          features?: Json | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          currency?: string;
          max_users?: number;
          max_agents?: number;
          max_tasks_per_month?: number;
          features?: Json | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_id: string;
          status: string;
          billing_interval: string;
          current_period_start: string;
          current_period_end: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan_id: string;
          status?: string;
          billing_interval?: string;
          current_period_start?: string;
          current_period_end?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan_id?: string;
          status?: string;
          billing_interval?: string;
          current_period_start?: string;
          current_period_end?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_invoices: {
        Row: {
          id: string;
          subscription_id: string;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          period_start: string | null;
          period_end: string | null;
          paid_at: string | null;
          invoice_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          amount: number;
          currency?: string;
          status?: string;
          description?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          invoice_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          description?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          invoice_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_organization: {
        Args: { p_slug: string; p_name: string };
        Returns: Database["public"]["Tables"]["organizations"]["Row"][];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
