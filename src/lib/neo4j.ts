import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

export const getNeo4jDriver = () => {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'cerefy_neo4j' : '');

    if (!password) {
      throw new Error('NEO4J_PASSWORD is required to initialize the Neo4j driver');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
};

export async function closeNeo4j() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
