import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

export const getNeo4jDriver = () => {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'cerefy_neo4j';
    
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
};

export async function closeNeo4j() {
  if (driver) {
    await driver.close();
  }
}
