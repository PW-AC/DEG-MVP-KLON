import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Users, 
  FileText, 
  Building2, 
  FolderOpen, 
  TrendingUp, 
  AlertCircle, 
  AlertTriangle,
  Info,
  Calendar,
  Euro,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import config from '../config';

const Dashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const statsResponse = await fetch(`${config.API_BASE_URL}/dashboard/statistics`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData);
      }

      // Fetch alerts
      const alertsResponse = await fetch(`${config.API_BASE_URL}/dashboard/alerts`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Fehler",
        description: "Dashboard-Daten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aktiv':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'gekündigt':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ruhend':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'storniert':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Willkommen zurück! Hier ist Ihre Übersicht.
        </p>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.alerts.map((alert, index) => (
            <Alert key={index} className={
              alert.type === 'critical' ? 'border-red-500' :
              alert.type === 'warning' ? 'border-yellow-500' :
              'border-blue-500'
            }>
              <div className="flex items-start gap-2">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <AlertTitle>{alert.message}</AlertTitle>
                  <AlertDescription>
                    Kategorie: {alert.category.replace('_', ' ')}
                  </AlertDescription>
                </div>
                <Badge variant={
                  alert.type === 'critical' ? 'destructive' :
                  alert.type === 'warning' ? 'outline' :
                  'secondary'
                }>
                  {alert.count}
                </Badge>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunden</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.overview.total_customers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Gesamt im System
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Verträge</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.overview.active_contracts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              von {statistics?.overview.total_contracts || 0} gesamt
            </p>
            <Progress 
              value={(statistics?.overview.active_contracts / statistics?.overview.total_contracts) * 100 || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jahresprämie (Brutto)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics?.overview.total_premium_brutto)}
            </div>
            <p className="text-xs text-muted-foreground">
              Netto: {formatCurrency(statistics?.overview.total_premium_netto)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auslaufende Verträge</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.expiring_contracts.total_expiring || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              in den nächsten 90 Tagen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="contracts">Verträge</TabsTrigger>
          <TabsTrigger value="expiring">Auslaufende Verträge</TabsTrigger>
          <TabsTrigger value="activities">Aktivitäten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contract Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Vertragsstatus</CardTitle>
                <CardDescription>Verteilung nach Status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics?.contract_status_distribution.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.count}</Badge>
                        <Progress 
                          value={(item.count / statistics.overview.total_contracts) * 100 || 0}
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contracts by Sparte */}
            <Card>
              <CardHeader>
                <CardTitle>Verträge nach Sparte</CardTitle>
                <CardDescription>Produktverteilung</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics?.contracts_by_sparte.slice(0, 5).map((item) => (
                    <div key={item.sparte} className="flex items-center justify-between">
                      <span className="text-sm">{item.sparte || 'Unbekannt'}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                  {statistics?.contracts_by_sparte.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{statistics.contracts_by_sparte.length - 5} weitere
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monatlicher Trend</CardTitle>
              <CardDescription>Neue Verträge der letzten 6 Monate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics?.monthly_trend.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.contracts}</Badge>
                      <Progress 
                        value={(item.contracts / Math.max(...statistics.monthly_trend.map(m => m.contracts))) * 100 || 0}
                        className="w-32 h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vertragsübersicht</CardTitle>
              <CardDescription>Detaillierte Vertragsstatistiken</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Versicherungsunternehmen</p>
                  <p className="text-2xl font-bold">{statistics?.overview.total_vus || 0}</p>
                  <p className="text-xs text-muted-foreground">Partner-VUs</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Dokumente</p>
                  <p className="text-2xl font-bold">{statistics?.overview.total_documents || 0}</p>
                  <p className="text-xs text-muted-foreground">Gespeichert</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Durchschnittsprämie</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      statistics?.overview.active_contracts > 0 
                        ? statistics.overview.total_premium_brutto / statistics.overview.active_contracts 
                        : 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Pro Vertrag</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <div className="grid gap-4">
            {/* Next 30 days */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Nächste 30 Tage
                </CardTitle>
                <CardDescription>
                  {statistics?.expiring_contracts.next_30_days.length || 0} Verträge laufen aus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics?.expiring_contracts.next_30_days.slice(0, 5).map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                      <div>
                        <p className="font-medium">{contract.vertragsnummer}</p>
                        <p className="text-sm text-muted-foreground">{contract.gesellschaft}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {contract.days_remaining} Tage
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(contract.ablauf)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next 60 days */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  31-60 Tage
                </CardTitle>
                <CardDescription>
                  {statistics?.expiring_contracts.next_60_days.length || 0} Verträge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics?.expiring_contracts.next_60_days.slice(0, 3).map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                      <div>
                        <p className="font-medium">{contract.vertragsnummer}</p>
                        <p className="text-sm text-muted-foreground">{contract.gesellschaft}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {contract.days_remaining} Tage
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(contract.ablauf)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next 90 days */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  61-90 Tage
                </CardTitle>
                <CardDescription>
                  {statistics?.expiring_contracts.next_90_days.length || 0} Verträge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics?.expiring_contracts.next_90_days.slice(0, 3).map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                      <div>
                        <p className="font-medium">{contract.vertragsnummer}</p>
                        <p className="text-sm text-muted-foreground">{contract.gesellschaft}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {contract.days_remaining} Tage
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(contract.ablauf)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Letzte Aktivitäten
              </CardTitle>
              <CardDescription>Neue Kunden und Verträge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics?.recent_activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="mt-1">
                      {activity.type === 'customer' ? (
                        <Users className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.type === 'customer' 
                          ? `Neuer Kunde: ${activity.name}`
                          : `Neuer Vertrag: ${activity.vertragsnummer}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp 
                          ? new Date(activity.timestamp).toLocaleString('de-DE')
                          : 'Zeitpunkt unbekannt'
                        }
                      </p>
                    </div>
                    <Badge variant="outline">
                      {activity.action === 'created' ? 'Neu' : activity.action}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={fetchDashboardData} variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" />
          Aktualisieren
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;