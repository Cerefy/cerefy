export interface ConnectorConfig {
  id: string;
  name: string;
  type:
    | 'DYNAMICS_365'
    | 'SAP_S4HANA'
    | 'ORACLE_FUSION'
    | 'SALESFORCE'
    | 'SERVICENOW'
    | 'JIRA'
    | 'AZURE_DEVOPS'
    | 'SHAREPOINT'
    | 'TEAMS'
    | 'SLACK'
    | 'GITHUB'
    | 'GOOGLE_DRIVE'
    | 'CONFLUENCE';
  baseUrl?: string;
  apiKey?: string;
  oauthToken?: string;
  enabled: boolean;
}

export interface SyncResult {
  connectorType: string;
  recordsIngested: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errors?: string[];
  timestamp: string;
}

export interface IEnterpriseConnector {
  config: ConnectorConfig;
  testConnection(): Promise<boolean>;
  syncData(projectId: string): Promise<SyncResult>;
}
