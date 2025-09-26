import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Shield, 
  Users, 
  Mail,
  Phone,
  Smartphone,
  Slack,
  Webhook,
  Key,
  Database,
  Server,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Copy
} from 'lucide-react';

const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [showApiKey, setShowApiKey] = useState(false);

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'escalation', label: 'Escalation Policies', icon: AlertTriangle },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
    { id: 'users', label: 'Users & Teams', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Settings }
  ];

  // Mock data
  const notificationChannels = [
    { 
      id: 1, 
      name: 'Email Notifications', 
      type: 'email', 
      enabled: true, 
      config: { address: 'alerts@company.com' },
      icon: Mail
    },
    { 
      id: 2, 
      name: 'SMS Alerts', 
      type: 'sms', 
      enabled: true, 
      config: { number: '+1 (555) 123-4567' },
      icon: Phone
    },
    { 
      id: 3, 
      name: 'Slack Integration', 
      type: 'slack', 
      enabled: true, 
      config: { channel: '#alerts' },
      icon: Slack
    },
    { 
      id: 4, 
      name: 'Push Notifications', 
      type: 'push', 
      enabled: false, 
      config: {},
      icon: Smartphone
    }
  ];

  const escalationPolicies = [
    {
      id: 1,
      name: 'Critical Infrastructure',
      description: 'For critical infrastructure alerts',
      steps: [
        { level: 1, duration: 5, action: 'Primary on-call', contacts: ['sarah.chen@company.com'] },
        { level: 2, duration: 10, action: 'Secondary on-call', contacts: ['mike.rodriguez@company.com'] },
        { level: 3, duration: 15, action: 'Team lead', contacts: ['team-lead@company.com'] },
        { level: 4, duration: 30, action: 'Engineering manager', contacts: ['eng-manager@company.com'] }
      ]
    },
    {
      id: 2,
      name: 'Application Issues',
      description: 'For application and service alerts',
      steps: [
        { level: 1, duration: 10, action: 'App team on-call', contacts: ['app-oncall@company.com'] },
        { level: 2, duration: 20, action: 'Senior developer', contacts: ['senior-dev@company.com'] },
        { level: 3, duration: 30, action: 'Team lead', contacts: ['app-lead@company.com'] }
      ]
    }
  ];

  const integrations = [
    { 
      name: 'Prometheus', 
      type: 'monitoring', 
      status: 'connected', 
      description: 'Metrics and monitoring data',
      lastSync: '2 minutes ago'
    },
    { 
      name: 'Grafana', 
      type: 'visualization', 
      status: 'connected', 
      description: 'Dashboard and alerting',
      lastSync: '5 minutes ago'
    },
    { 
      name: 'Datadog', 
      type: 'monitoring', 
      status: 'disconnected', 
      description: 'APM and infrastructure monitoring',
      lastSync: 'Never'
    },
    { 
      name: 'PagerDuty', 
      type: 'alerting', 
      status: 'connected', 
      description: 'Incident management',
      lastSync: '1 minute ago'
    }
  ];

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-surface-900">Notification Channels</h3>
          <p className="text-surface-600 text-sm">Configure how and where alerts are sent</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Channel</span>
        </button>
      </div>

      <div className="grid gap-4">
        {notificationChannels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div key={channel.id} className="bg-white border border-surface-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-surface-100 rounded-lg">
                    <Icon className="w-5 h-5 text-surface-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-surface-900">{channel.name}</h4>
                    <p className="text-sm text-surface-600">
                      {channel.config.address || channel.config.number || channel.config.channel || 'Not configured'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={channel.enabled} 
                      className="sr-only peer"
                      onChange={() => {}}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                  <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-surface-200 rounded-xl p-6">
        <h4 className="font-medium text-surface-900 mb-4">Notification Preferences</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-surface-900">Critical Alerts</div>
              <div className="text-sm text-surface-600">Immediate notification for critical issues</div>
            </div>
            <select className="border border-surface-300 rounded-lg px-3 py-2 text-sm">
              <option>All channels</option>
              <option>Email + SMS only</option>
              <option>SMS only</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-surface-900">Warning Alerts</div>
              <div className="text-sm text-surface-600">Notifications for warning-level issues</div>
            </div>
            <select className="border border-surface-300 rounded-lg px-3 py-2 text-sm">
              <option>Email + Slack</option>
              <option>Email only</option>
              <option>Slack only</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-surface-900">Info Alerts</div>
              <div className="text-sm text-surface-600">Notifications for informational messages</div>
            </div>
            <select className="border border-surface-300 rounded-lg px-3 py-2 text-sm">
              <option>Slack only</option>
              <option>Email only</option>
              <option>Disabled</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEscalationTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-surface-900">Escalation Policies</h3>
          <p className="text-surface-600 text-sm">Define how alerts escalate when not acknowledged</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Policy</span>
        </button>
      </div>

      <div className="space-y-4">
        {escalationPolicies.map((policy) => (
          <div key={policy.id} className="bg-white border border-surface-200 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-surface-900">{policy.name}</h4>
                <p className="text-sm text-surface-600">{policy.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                  <Copy className="w-4 h-4 text-surface-400" />
                </button>
                <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-surface-400" />
                </button>
                <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {policy.steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-surface-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium text-sm">
                    {step.level}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900">{step.action}</div>
                    <div className="text-sm text-surface-600">After {step.duration} minutes</div>
                  </div>
                  <div className="text-sm text-surface-600">
                    {step.contacts.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-surface-900">Integrations</h3>
          <p className="text-surface-600 text-sm">Connect external services and tools</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Integration</span>
        </button>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration, index) => (
          <div key={index} className="bg-white border border-surface-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-surface-100 rounded-lg">
                  <Server className="w-5 h-5 text-surface-600" />
                </div>
                <div>
                  <h4 className="font-medium text-surface-900">{integration.name}</h4>
                  <p className="text-sm text-surface-600">{integration.description}</p>
                  <p className="text-xs text-surface-500 mt-1">Last sync: {integration.lastSync}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  integration.status === 'connected' 
                    ? 'bg-success-100 text-success-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {integration.status}
                </span>
                <button className="px-4 py-2 border border-surface-300 text-surface-700 rounded-lg text-sm hover:bg-surface-50 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-surface-200 rounded-xl p-6">
        <h4 className="font-medium text-surface-900 mb-4 flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span>API Configuration</span>
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">API Key</label>
            <div className="flex items-center space-x-2">
              <input 
                type={showApiKey ? 'text' : 'password'}
                value="ak_live_1234567890abcdef"
                readOnly
                className="flex-1 border border-surface-300 rounded-lg px-3 py-2 text-sm bg-surface-50"
              />
              <button 
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">Webhook URL</label>
            <input 
              type="text"
              value="https://alerts.company.com/webhook/incoming"
              className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-surface-900">System Configuration</h3>
        <p className="text-surface-600 text-sm">General system settings and preferences</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white border border-surface-200 rounded-xl p-6">
          <h4 className="font-medium text-surface-900 mb-4">Alert Retention</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-surface-900">Resolved Alerts</div>
                <div className="text-sm text-surface-600">How long to keep resolved alerts</div>
              </div>
              <select className="border border-surface-300 rounded-lg px-3 py-2 text-sm">
                <option>30 days</option>
                <option>60 days</option>
                <option>90 days</option>
                <option>1 year</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-surface-900">Active Alerts</div>
                <div className="text-sm text-surface-600">Auto-resolve stale alerts after</div>
              </div>
              <select className="border border-surface-300 rounded-lg px-3 py-2 text-sm">
                <option>7 days</option>
                <option>14 days</option>
                <option>30 days</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-surface-200 rounded-xl p-6">
          <h4 className="font-medium text-surface-900 mb-4">Time Zone & Formatting</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-900 mb-2">Default Time Zone</label>
              <select className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                <option>UTC</option>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Asia/Tokyo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-900 mb-2">Date Format</label>
              <select className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-surface-200 rounded-xl p-6">
          <h4 className="font-medium text-surface-900 mb-4">System Health</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-surface-900">Database Connection</span>
              </div>
              <span className="text-success-600 text-sm font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-surface-900">Message Queue</span>
              </div>
              <span className="text-success-600 text-sm font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-surface-900">Storage Usage</span>
              </div>
              <span className="text-yellow-600 text-sm font-medium">85% Used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Settings</h1>
          <p className="text-surface-600 mt-1">Configure alerts, notifications, and system preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="border border-surface-300 text-surface-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'escalation' && renderEscalationTab()}
        {activeTab === 'integrations' && renderIntegrationsTab()}
        {activeTab === 'system' && renderSystemTab()}
        {(activeTab === 'users' || activeTab === 'security') && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-lg font-medium text-surface-900 mb-2">Coming Soon</h3>
            <p className="text-surface-600">This section is under development and will be available soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
