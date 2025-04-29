/**
 * Help documentation utilities and constants for Datagage
 * This module provides centralized help content for the application
 */

// Documentation sections organized by feature area
export const DOCUMENTATION = {
  // ETL Process Documentation
  etl: {
    title: 'ETL Process Documentation',
    overview: 'ETL (Extract, Transform, Load) is the process of moving data from your source systems into Datagage for analysis.',
    sections: [
      {
        title: 'Connection Process',
        content: `
          <p>When you connect a data source to Datagage, the following steps occur:</p>
          <ol>
            <li><strong>Source Configuration</strong> - You provide connection details for your data source</li>
            <li><strong>Validation</strong> - Datagage tests the connection to ensure it can access your data</li>
            <li><strong>Schema Discovery</strong> - The system analyzes your data structure</li>
            <li><strong>Initial Sync</strong> - Your data is extracted and loaded into the system</li>
          </ol>
          <p>After the initial setup, data will be synchronized according to your schedule settings.</p>
        `
      },
      {
        title: 'Status Monitoring',
        content: `
          <p>You can monitor ETL processes in several ways:</p>
          <ul>
            <li><strong>Dashboard Widget</strong> - Quick overview of current ETL status</li>
            <li><strong>ETL Monitor</strong> - Detailed view of all ETL jobs with filtering</li>
            <li><strong>Source Details</strong> - Job history for a specific data source</li>
          </ul>
          <p>The system tracks important metrics including job duration, success rate, and data volume.</p>
        `
      },
      {
        title: 'Troubleshooting',
        content: `
          <p>If you encounter issues with your ETL processes:</p>
          <ol>
            <li>Check the status of the specific job in the ETL Monitor</li>
            <li>View detailed error messages in the job details</li>
            <li>Verify your source connection settings</li>
            <li>Ensure your credentials are still valid</li>
            <li>Check if your data source is accessible from our network</li>
          </ol>
          <p>For database connections, also verify that the user has appropriate permissions to read the required tables.</p>
        `
      }
    ]
  },
  
  // Data Sources Documentation
  dataSources: {
    title: 'Data Sources Documentation',
    overview: 'Datagage supports various types of data sources including relational databases, spreadsheets, and files.',
    sections: [
      {
        title: 'Supported Source Types',
        content: `
          <p>Datagage currently supports the following data sources:</p>
          <ul>
            <li><strong>MySQL</strong> - Versions 5.7 and above</li>
            <li><strong>PostgreSQL</strong> - Versions 9.6 and above</li>
            <li><strong>Google Sheets</strong> - Requires service account access</li>
            <li><strong>CSV Files</strong> - Upload directly or via SFTP</li>
          </ul>
          <p>Each source type has specific configuration requirements.</p>
        `
      },
      {
        title: 'Connection Requirements',
        content: `
          <p>To ensure successful connections:</p>
          <ul>
            <li><strong>Database Users</strong> - Need at least READ permissions on tables</li>
            <li><strong>Network Access</strong> - Your database must be accessible (whitelist our IPs)</li>
            <li><strong>CSV Files</strong> - Should have consistent column structure</li>
            <li><strong>Google Sheets</strong> - Share with service account email</li>
          </ul>
          <p>For sensitive data, we recommend using SSL/TLS encryption for all connections.</p>
        `
      },
      {
        title: 'Best Practices',
        content: `
          <p>For optimal performance and reliability:</p>
          <ul>
            <li>Create dedicated read-only database users for Datagage</li>
            <li>Use connection pooling for database sources</li>
            <li>Include primary keys in all tables for efficient incremental updates</li>
            <li>Maintain consistent data formats, especially in CSV files</li>
            <li>Schedule syncs during off-peak hours</li>
          </ul>
        `
      }
    ]
  },
  
  // Analytics and Visualization
  analytics: {
    title: 'Analytics & Visualization Documentation',
    overview: 'Datagage provides powerful analytics capabilities to help you derive insights from your data.',
    sections: [
      {
        title: 'Available Visualizations',
        content: `
          <p>Datagage offers several visualization types:</p>
          <ul>
            <li><strong>Time Series Charts</strong> - For tracking metrics over time</li>
            <li><strong>Bar/Column Charts</strong> - For comparing categories</li>
            <li><strong>Pie/Donut Charts</strong> - For showing composition</li>
            <li><strong>Tables</strong> - For detailed data exploration</li>
            <li><strong>Custom Dashboards</strong> - Combine multiple visualizations</li>
          </ul>
          <p>Each visualization can be customized using the controls in the respective panels.</p>
        `
      },
      {
        title: 'Data Flow Visualization',
        content: `
          <p>The Data Flow Visualization tool helps you explore your data with these features:</p>
          <ul>
            <li><strong>Time Range Selection</strong> - Focus on specific periods</li>
            <li><strong>Source Filtering</strong> - View data from specific sources</li>
            <li><strong>Category Selection</strong> - Focus on specific data categories</li>
            <li><strong>Auto-Refresh</strong> - Keeps visualizations updated</li>
          </ul>
          <p>You can save your visualization settings for quick access later.</p>
        `
      },
      {
        title: 'Exporting and Sharing',
        content: `
          <p>You can share your insights in various ways:</p>
          <ul>
            <li><strong>Export as CSV</strong> - Raw data for further analysis</li>
            <li><strong>Export as Image</strong> - PNG or SVG formats</li>
            <li><strong>Scheduled Reports</strong> - Automated email delivery</li>
            <li><strong>Embedded Links</strong> - For sharing dashboards</li>
          </ul>
          <p>Reports can be scheduled to run automatically and delivered to stakeholders.</p>
        `
      }
    ]
  }
};

// Contextual help tooltips by component/feature
export const HELP_TOOLTIPS = {
  etlMonitor: {
    title: 'ETL Process Monitor',
    description: 'This component shows the status of all ETL jobs in the system.',
    tooltips: {
      refreshButton: 'Refresh ETL job data',
      statusChips: 'Overview of ETL job counts by status',
      jobTable: 'Detailed list of ETL jobs with status information',
      viewDetails: 'View complete details for this ETL job',
      duration: 'Total time taken for this ETL job to complete'
    }
  },
  
  dataFlowVisualization: {
    title: 'Data Flow Visualization',
    description: 'Interactive tool for exploring your data through visualizations.',
    tooltips: {
      filterButton: 'Show/hide data filters',
      refreshButton: 'Refresh the current visualization',
      timeRangeFilter: 'Select the time period for your data',
      sourceFilter: 'Filter data by specific source',
      categoryFilter: 'Filter by data category',
      applyFilters: 'Apply the selected filters to update visualization'
    }
  },
  
  sourceConfig: {
    title: 'Data Source Configuration',
    description: 'Configure connections to your data sources.',
    tooltips: {
      sourceName: 'A descriptive name to identify this data source',
      testConnection: 'Test the connection with the provided details',
      host: 'Database server hostname or IP address',
      port: 'Database server port number',
      database: 'Name of the database to connect to',
      username: 'Database user with read permissions',
      password: 'Password for the database user',
      ssl: 'Enable SSL/TLS encrypted connection',
      schema: 'Database schema name (default: public)'
    }
  }
};

// Feature discovery steps for guided tours
export const FEATURE_TOURS = {
  newUserTour: [
    {
      element: '#dashboard',
      title: 'Welcome to Datagage',
      description: 'This is your main dashboard where you can monitor all activity in the system.',
      position: 'right'
    },
    {
      element: '#quick-actions',
      title: 'Quick Actions',
      description: 'Use these shortcuts to quickly access common tasks.',
      position: 'bottom'
    },
    {
      element: '#etl-status-widget',
      title: 'ETL Status',
      description: 'Monitor the health and progress of your data syncs.',
      position: 'left'
    },
    {
      element: '#data-sources-link',
      title: 'Data Sources',
      description: 'Connect and manage your data sources here.',
      position: 'right'
    },
    {
      element: '#analytics-link',
      title: 'Analytics',
      description: 'Access powerful analytics and visualizations.',
      position: 'right'
    }
  ],
  
  etlMonitorTour: [
    {
      element: '#etl-stats',
      title: 'ETL Statistics',
      description: 'Overview of ETL job statistics across your system.',
      position: 'bottom'
    },
    {
      element: '#etl-jobs-table',
      title: 'Jobs Table',
      description: 'Detailed list of all ETL jobs with status information.',
      position: 'top'
    },
    {
      element: '#etl-actions',
      title: 'Job Actions',
      description: 'View details or trigger actions for specific jobs.',
      position: 'left'
    }
  ]
};

// Help article structure for search indexing
export const HELP_SEARCH_INDEX = [
  { id: 'etl-overview', category: 'etl', title: 'ETL Process Overview', keywords: 'etl, extract, transform, load, sync, process, pipeline', ref: 'etl' },
  { id: 'etl-status', category: 'etl', title: 'Monitoring ETL Status', keywords: 'etl, status, monitor, jobs, progress, failed, completed', ref: 'etl.sections[1]' },
  { id: 'etl-troubleshooting', category: 'etl', title: 'Troubleshooting ETL Issues', keywords: 'etl, error, troubleshoot, fix, failed, issues', ref: 'etl.sections[2]' },
  { id: 'source-types', category: 'sources', title: 'Supported Data Sources', keywords: 'sources, mysql, postgres, csv, google sheets', ref: 'dataSources.sections[0]' },
  { id: 'source-connection', category: 'sources', title: 'Connection Requirements', keywords: 'connection, requirements, access, permissions, network', ref: 'dataSources.sections[1]' },
  { id: 'source-best-practices', category: 'sources', title: 'Data Source Best Practices', keywords: 'best practices, optimization, performance, security', ref: 'dataSources.sections[2]' },
  { id: 'visualization-types', category: 'analytics', title: 'Available Visualizations', keywords: 'charts, graphs, visualization, dashboard, reports', ref: 'analytics.sections[0]' },
  { id: 'data-flow', category: 'analytics', title: 'Data Flow Visualization', keywords: 'data flow, visualization, filter, time range, sources', ref: 'analytics.sections[1]' },
  { id: 'export-share', category: 'analytics', title: 'Exporting and Sharing', keywords: 'export, share, pdf, csv, email, schedule', ref: 'analytics.sections[2]' }
];
