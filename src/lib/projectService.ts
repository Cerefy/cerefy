import admin from 'firebase-admin';

// Initialize lazily
let db: admin.firestore.Firestore | null = null;

const getDb = () => {
  if (!db) {
    db = admin.firestore();
  }
  return db;
};

export const getAllProjects = async (tenantId: string) => {
  const snapshot = await getDb()
    .collection('projects')
    .where('tenantId', '==', tenantId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createProject = async (tenantId: string, projectData: any) => {
  const docRef = await getDb().collection('projects').add({
    ...projectData,
    tenantId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: docRef.id, ...projectData, tenantId };
};

export const updateProject = async (projectId: string, projectData: any) => {
  await getDb().collection('projects').doc(projectId).update(projectData);
  return { id: projectId, ...projectData };
};
