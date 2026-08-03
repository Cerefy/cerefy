import { db, withTenantContext } from '../db';
import { projects } from '../db/schema';
import { eq } from 'drizzle-orm';

export const getAllProjects = async (tenantId: string) => {
  return await withTenantContext(tenantId, async (tx) => {
    // Because of RLS, this will only return projects for the current tenantId context
    const results = await tx.select().from(projects);
    return results;
  });
};

export const createProject = async (tenantId: string, projectData: any) => {
  return await withTenantContext(tenantId, async (tx) => {
    const [newProject] = await tx.insert(projects).values({
      ...projectData,
      tenantId,
    }).returning();
    return newProject;
  });
};

export const updateProject = async (tenantId: string, projectId: string, projectData: any) => {
  return await withTenantContext(tenantId, async (tx) => {
    const [updated] = await tx.update(projects)
      .set(projectData)
      .where(eq(projects.id, projectId))
      .returning();
    return updated;
  });
};
