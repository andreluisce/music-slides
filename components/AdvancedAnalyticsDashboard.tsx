import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Database, 
  Zap,
  Users,
  Activity,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

// Chart components (you'll need to install recharts: npm install recharts)
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  date?: string;
  successful?: number;
  failed?: number;
  duration?: number;
  count?: number;
}

interface AdvancedMetrics {
  totalSearches: number;
  totalLyricsRequests: number;
  averageResponseTime: number;
  successRate: number;
  cacheHitRate: number;
  activeDevices: number;
  libraryGrowth: number;
  dailyActivity: ChartData[];
  performanceTrends: ChartData[];
  sourceDistribution: ChartData[];
  errorAnalysis: ChartData[];
  userEngagement: ChartData[];
  systemHealth: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
}

export function AdvancedAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Simulate loading advanced metrics
      // In real implementation, you'd call your analytics APIs
      const mockMetrics: AdvancedMetrics = {
        totalSearches: 1847,
        totalLyricsRequests: 1234,
        averageResponseTime: 2.3,
        successRate: 94.5,
        cacheHitRate: 78.2,
        activeDevices: 3,
        libraryGrowth: 12.5,
        dailyActivity: generateDailyActivity(),
        performanceTrends: generatePerformanceTrends(),
        sourceDistribution: generateSourceDistribution(),
        errorAnalysis: generateErrorAnalysis(),
        userEngagement: generateUserEngagement(),
        systemHealth: {
          cpu: 45,
          memory: 67,
          storage: 23,
          network: 89
        }
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyActivity = (): ChartData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      value: Math.floor(Math.random() * 200) + 50,
      successful: Math.floor(Math.random() * 150) + 40,
      failed: Math.floor(Math.random() * 20) + 5
    }));
  };

  const generatePerformanceTrends = (): ChartData[] => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    return hours.map(hour => ({
      name: hour,
      duration: (Math.random() * 3) + 1,
      value: Math.floor(Math.random() * 100) + 20
    }));
  };

  const generateSourceDistribution = (): ChartData[] => {
    return [
      { name: 'FireCrawl + Gemini', value: 67, count: 834 },
      { name: 'Playwright MCP', value: 23, count: 287 },
      { name: 'Cache', value: 8, count: 98 },
      { name: 'Manual', value: 2, count: 24 }
    ];
  };

  const generateErrorAnalysis = (): ChartData[] => {
    return [
      { name: 'Network Timeout', value: 12, count: 45 },
      { name: 'Parse Error', value: 8, count: 23 },
      { name: 'Not Found', value: 15, count: 67 },
      { name: 'Rate Limited', value: 3, count: 8 },
      { name: 'Other', value: 5, count: 12 }
    ];
  };

  const generateUserEngagement = (): ChartData[] => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    return dates.map(date => ({
      name: date,
      value: Math.floor(Math.random() * 50) + 20,
      date
    }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading && !metrics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading advanced analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-1" />
            Auto Refresh
          </Button>
          <Button onClick={loadMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSearches.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span className="text-green-600">+{metrics?.libraryGrowth}%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.successRate}%</div>
            <div className="text-xs text-muted-foreground">
              {metrics?.totalLyricsRequests} total requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageResponseTime}s</div>
            <div className="text-xs text-muted-foreground">
              Cache hit rate: {metrics?.cacheHitRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeDevices}</div>
            <div className="text-xs text-muted-foreground">
              Cross-device sync enabled
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>Search requests by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics?.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successful" stackId="a" fill="#10b981" name="Successful" />
                    <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Active sessions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics?.userEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>Average response time by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics?.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Avg Response Time (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
                <CardDescription>Requests by source type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics?.sourceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics?.sourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Detailed breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.sourceDistribution.map((source, index) => (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{source.count} requests</div>
                        <div className="text-xs text-muted-foreground">{source.value}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>Distribution of error types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics?.errorAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {metrics?.errorAnalysis.map((error, index) => (
                    <div key={error.name} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{error.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {error.count} occurrences
                        </div>
                      </div>
                      <Badge variant="outline">
                        {error.value}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system resource usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'CPU Usage', value: metrics?.systemHealth.cpu || 0, color: 'bg-blue-500' },
                    { label: 'Memory Usage', value: metrics?.systemHealth.memory || 0, color: 'bg-green-500' },
                    { label: 'Storage Usage', value: metrics?.systemHealth.storage || 0, color: 'bg-yellow-500' },
                    { label: 'Network Usage', value: metrics?.systemHealth.network || 0, color: 'bg-purple-500' }
                  ].map(({ label, value, color }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>Cache performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Hit Rate</span>
                    <Badge variant="default">{metrics?.cacheHitRate}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Requests</span>
                    <span>{metrics?.totalSearches.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hits</span>
                    <span className="text-green-600">
                      {Math.round((metrics?.totalSearches || 0) * (metrics?.cacheHitRate || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Misses</span>
                    <span className="text-red-600">
                      {Math.round((metrics?.totalSearches || 0) * (1 - (metrics?.cacheHitRate || 0) / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}