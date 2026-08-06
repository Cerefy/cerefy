import React from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Sparkles, Layout } from "lucide-react";

const stitchScreens = [
  "agent_orchestration_swarm_coordination_layer",
  "ai_agent_marketplace_neural_node_repository",
  "ai_intelligence_chat_multi_agent_collaboration",
  "company_memory_semantic_intelligence_substrate",
  "customization_center_organization_white_labeling",
  "dashboard_builder_custom_intelligence_layouts",
  "executive_command_center_global_situation_room",
  "executive_council_ceo_strategic_command",
  "executive_council_cfo_financial_intelligence",
  "executive_council_coo_operations_command",
  "executive_council_cto_infrastructure_command",
  "Cerefy_ai_agents_autonomous_intelligence",
  "Cerefy_ai_agents_autonomous_workforce_directory",
  "Cerefy_blog_neural_motion_edition",
  "Cerefy_careers_neural_motion_edition",
  "Cerefy_company_memory_semantic_intelligence_hub",
  "Cerefy_customers_success_quantifiable_impact",
  "Cerefy_documentation_developer_resources",
  "Cerefy_documentation_neural_motion_edition",
  "Cerefy_enterprise_solutions_departmental_intelligence",
  "Cerefy_homepage_enterprise_ai_os_1",
  "Cerefy_homepage_enterprise_ai_os_2",
  "Cerefy_homepage_neural_motion_edition",
  "Cerefy_homepage_neural_motion_edition_v2",
  "Cerefy_industry_verticals_sector_specific_ai",
  "Cerefy_intelligence_core_neural_kernel_v4.2",
  "Cerefy_platform_neural_motion_edition",
  "Cerefy_platform_overview_architecture_scale",
  "Cerefy_pricing_neural_motion_edition",
  "Cerefy_pricing_scalable_intelligence_tiers",
  "Cerefy_resources_intelligence_library",
  "Cerefy_security_compliance_enterprise_trust",
  "Cerefy_security_neural_motion_edition",
  "Cerefy_technologies_initiate_demo",
  "Cerefy_technologies_join_the_revolution",
  "Cerefy_technologies_the_mission",
  "integrations_hub_enterprise_connectivity",
  "mission_intelligence_strategic_execution_brain",
  "mission_orchestration_strategic_goal_tracking",
  "permission_management_enterprise_governance_access_control",
  "security_center_enterprise_trust_governance",
  "shader_1",
  "shader_2",
  "shader_3",
  "shader_4",
  "three.js",
  "trust_governance_immutable_audit_logs",
  "workflow_automation_neural_node_editor",
];

export function StitchGalleryPage() {
  return (
    <div className="min-h-screen bg-eye-bg text-eye-text px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-eye-surface border border-eye-border text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-display font-bold text-eye-white tracking-tight">
            Cerefy Stitch Design Systems & Exact Screens
          </h1>
        </div>
        <p className="text-sm text-eye-text mb-8">
          Explore all 48+ exact high-fidelity Stitch screens & enterprise UI modules integrated
          directly into the platform.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stitchScreens.map((screen) => {
            const title = screen
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            const url = `/stitch/${screen}/code.html`;
            const previewUrl = `/stitch/${screen}/screen.png`;

            return (
              <div
                key={screen}
                className="bg-eye-surface border border-eye-border rounded-xl p-5 hover:border-primary/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-eye-bg text-primary border border-eye-border">
                      Stitch Screen
                    </span>
                    <Layout className="w-4 h-4 text-eye-text/50 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-display font-medium text-eye-white mb-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-eye-text/70 font-mono mb-4 truncate">{screen}</p>
                </div>

                <div className="pt-4 border-t border-eye-border flex items-center justify-between">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                  >
                    View Exact HTML <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-eye-text hover:text-eye-white transition-colors"
                  >
                    Preview PNG
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default StitchGalleryPage;
