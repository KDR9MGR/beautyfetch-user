import React, { useState, useEffect, useCallback } from 'react';
import { logger, LogLevel, LogEntry } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Trash2, RefreshCw } from 'lucide-react';

interface LogViewerProps {
  maxLogs?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const LogViewer: React.FC<LogViewerProps> = ({ 
  maxLogs = 100, 
  autoRefresh = true, 
  refreshInterval = 2000 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>(LogLevel.DEBUG);

  const refreshLogs = useCallback(() => {
    setLogs(logger.getRecentLogs(maxLogs));
  }, [maxLogs]);

  useEffect(() => {
    refreshLogs();
    
    if (autoRefresh) {
      const interval = setInterval(refreshLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [maxLogs, autoRefresh, refreshInterval, refreshLogs]);

  const filteredLogs = logs.filter(log => {
    const levelMatch = log.level >= selectedLevel;
    const categoryMatch = selectedCategory === 'all' || log.category === selectedCategory;
    return levelMatch && categoryMatch;
  });

  const categories = ['all', ...Array.from(new Set(logs.map(log => log.category)))];

  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'secondary';
      case LogLevel.INFO: return 'default';
      case LogLevel.WARN: return 'outline';
      case LogLevel.ERROR: return 'destructive';
      default: return 'default';
    }
  };

  const getLevelName = (level: LogLevel) => {
    return ['DEBUG', 'INFO', 'WARN', 'ERROR'][level];
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const exportLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beautyfetch-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logger.clearLogs();
    refreshLogs();
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Application Logs</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Recent Logs</TabsTrigger>
            <TabsTrigger value="auth">Auth Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors Only</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="flex gap-2">
                <label className="text-sm font-medium">Category:</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <label className="text-sm font-medium">Min Level:</label>
                <select 
                  value={selectedLevel} 
                  onChange={(e) => setSelectedLevel(Number(e.target.value) as LogLevel)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={LogLevel.DEBUG}>DEBUG</option>
                  <option value={LogLevel.INFO}>INFO</option>
                  <option value={LogLevel.WARN}>WARN</option>
                  <option value={LogLevel.ERROR}>ERROR</option>
                </select>
              </div>
            </div>
            
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No logs found</p>
                ) : (
                  filteredLogs.reverse().map((log, index) => (
                    <div key={index} className="border-b pb-2 last:border-b-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelBadgeVariant(log.level)}>
                          {getLevelName(log.level)}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.userId && (
                          <span className="text-xs text-muted-foreground">
                            User: {log.userId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            View Data
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                      {log.error && (
                        <details className="mt-1">
                          <summary className="text-xs text-red-600 cursor-pointer">
                            View Error
                          </summary>
                          <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-x-auto">
                            {log.error.stack || log.error.message}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="auth">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {logger.getLogsByCategory('AUTH', 50).reverse().map((log, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getLevelBadgeVariant(log.level)}>
                        {getLevelName(log.level)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.data && (
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="errors">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {logs.filter(log => log.level === LogLevel.ERROR).reverse().map((log, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive">ERROR</Badge>
                      <Badge variant="outline">{log.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-red-600">{log.message}</p>
                    {log.error && (
                      <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-x-auto">
                        {log.error.stack || log.error.message}
                      </pre>
                    )}
                    {log.data && (
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LogViewer;